package services

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"

	"cloudku-server/database"
)

// MySQLService handles MySQL specific operations
type MySQLService struct {
	db *sql.DB
}

// NewMySQLService creates a new MySQL service instance
func NewMySQLService() *MySQLService {
	return &MySQLService{
		db: database.MySQLAdminDB,
	}
}

// ValidateIdentifier checks if name is safe (alphanumeric + underscores only)
func (s *MySQLService) ValidateIdentifier(name string) bool {
	match, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", name)
	return match
}

// CreateDatabase creates a new database and user with privileges
func (s *MySQLService) CreateDatabase(ctx context.Context, dbName, dbUser, dbPassword string) error {
	if s.db == nil {
		return fmt.Errorf("MySQL connection not available")
	}

	// SECURITY: Strict validation to prevent SQL injection in identifiers
	if !s.ValidateIdentifier(dbName) || !s.ValidateIdentifier(dbUser) {
		return fmt.Errorf("invalid database or user name")
	}

	// SECURITY: Validate password doesn't contain null bytes or other dangerous characters
	if err := s.validatePassword(dbPassword); err != nil {
		return fmt.Errorf("invalid password: %w", err)
	}

	// 1. Create Database
	// Note: DDL statements don't support placeholders for identifiers
	_, err := s.db.ExecContext(ctx, fmt.Sprintf("CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName))
	if err != nil {
		return fmt.Errorf("create database failed: %w", err)
	}

	// 2. Create User
	// SECURITY: Escape single quotes in password to prevent SQL injection
	// MySQL DDL doesn't support prepared statements for IDENTIFIED BY clause
	escapedPassword := s.escapePassword(dbPassword)
	_, err = s.db.ExecContext(ctx, fmt.Sprintf("CREATE USER '%s'@'%%' IDENTIFIED BY '%s'", dbUser, escapedPassword))
	if err != nil {
		// Rollback DB creation
		s.db.ExecContext(ctx, fmt.Sprintf("DROP DATABASE IF EXISTS `%s`", dbName))
		return fmt.Errorf("create user failed: %w", err)
	}

	// 3. Grant Privileges
	_, err = s.db.ExecContext(ctx, fmt.Sprintf("GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'%%'", dbName, dbUser))
	if err != nil {
		// Rollback everything
		s.RevokeAccess(ctx, dbName, dbUser)
		return fmt.Errorf("grant privileges failed: %w", err)
	}

	// 4. Flush
	_, err = s.db.ExecContext(ctx, "FLUSH PRIVILEGES")
	return err
}

// SECURITY: escapePassword escapes single quotes in passwords for MySQL string literals
// This prevents SQL injection when password is used in DDL statements
// MySQL uses ” (two single quotes) to represent a literal single quote inside a string
func (s *MySQLService) escapePassword(password string) string {
	return strings.ReplaceAll(password, "'", "''")
}

// SECURITY: validatePassword checks for dangerous characters in password
func (s *MySQLService) validatePassword(password string) error {
	// Reject null bytes which could truncate the password
	if strings.ContainsRune(password, '\x00') {
		return fmt.Errorf("password contains invalid characters")
	}
	// Minimum length check (6 chars for dev flexibility, production should use stronger)
	if len(password) < 6 {
		return fmt.Errorf("password must be at least 6 characters")
	}
	return nil
}

// DeleteDatabase removes database and associated user
func (s *MySQLService) DeleteDatabase(ctx context.Context, dbName, dbUser string) error {
	if s.db == nil {
		return fmt.Errorf("MySQL connection not available")
	}

	if !s.ValidateIdentifier(dbName) || !s.ValidateIdentifier(dbUser) {
		return fmt.Errorf("invalid identifier")
	}

	// Best effort cleanup
	s.db.ExecContext(ctx, fmt.Sprintf("DROP DATABASE IF EXISTS `%s`", dbName))
	s.db.ExecContext(ctx, fmt.Sprintf("DROP USER IF EXISTS '%s'@'%%'", dbUser))
	s.db.ExecContext(ctx, "FLUSH PRIVILEGES")

	return nil
}

// RevokeAccess removes DB and User (Rollback helper)
func (s *MySQLService) RevokeAccess(ctx context.Context, dbName, dbUser string) {
	if s.ValidateIdentifier(dbUser) {
		s.db.ExecContext(ctx, fmt.Sprintf("DROP USER IF EXISTS '%s'@'%%'", dbUser))
	}
	if s.ValidateIdentifier(dbName) {
		s.db.ExecContext(ctx, fmt.Sprintf("DROP DATABASE IF EXISTS `%s`", dbName))
	}
}

// UpdatePassword changes the user password
func (s *MySQLService) UpdatePassword(ctx context.Context, dbUser, newPassword string) error {
	if !s.ValidateIdentifier(dbUser) {
		return fmt.Errorf("invalid username")
	}

	// SECURITY: Validate password before using
	if err := s.validatePassword(newPassword); err != nil {
		return fmt.Errorf("invalid password: %w", err)
	}

	// SECURITY: Escape password to prevent SQL injection
	escapedPassword := s.escapePassword(newPassword)
	_, err := s.db.ExecContext(ctx, fmt.Sprintf("ALTER USER '%s'@'%%' IDENTIFIED BY '%s'", dbUser, escapedPassword))
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	s.db.ExecContext(ctx, "FLUSH PRIVILEGES")
	return nil
}

// QueryResult represents the result of a SQL query
type QueryResult struct {
	Columns []string        `json:"columns"`
	Rows    [][]interface{} `json:"rows"`
	Message string          `json:"message"`
}

// SECURITY: List of forbidden SQL commands for user databases
var forbiddenCommands = []string{
	"DROP DATABASE", "CREATE DATABASE", "GRANT", "REVOKE",
	"CREATE USER", "DROP USER", "ALTER USER", "FLUSH",
}

// ExecuteQuery executes a SQL query on a specific user database
// SECURITY: This connects to the user's database with their credentials
func (s *MySQLService) ExecuteQuery(ctx context.Context, dbName, dbUser, dbPassword, query string) (*QueryResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("MySQL connection not available")
	}

	// SECURITY: Validate identifiers
	if !s.ValidateIdentifier(dbName) || !s.ValidateIdentifier(dbUser) {
		return nil, fmt.Errorf("invalid database or user name")
	}

	// SECURITY: Check for forbidden commands
	upperQuery := strings.ToUpper(query)
	for _, cmd := range forbiddenCommands {
		if strings.Contains(upperQuery, cmd) {
			return nil, fmt.Errorf("command not allowed: %s", cmd)
		}
	}

	// Connect to the specific user database
	connString := fmt.Sprintf("%s:%s@tcp(localhost:3306)/%s?charset=utf8mb4&parseTime=True",
		dbUser, s.escapePassword(dbPassword), dbName)

	userDB, err := sql.Open("mysql", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer userDB.Close()

	// Set connection limits
	userDB.SetMaxOpenConns(1)
	userDB.SetConnMaxLifetime(30 * time.Second)

	// Test connection
	if err := userDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	// Check if it's a SELECT-like query (returns rows) or an action query
	trimmedQuery := strings.TrimSpace(upperQuery)
	isSelectQuery := strings.HasPrefix(trimmedQuery, "SELECT") ||
		strings.HasPrefix(trimmedQuery, "SHOW") ||
		strings.HasPrefix(trimmedQuery, "DESCRIBE") ||
		strings.HasPrefix(trimmedQuery, "EXPLAIN")

	if isSelectQuery {
		// Execute SELECT query
		rows, err := userDB.QueryContext(ctx, query)
		if err != nil {
			return nil, fmt.Errorf("query error: %w", err)
		}
		defer rows.Close()

		// Get column names
		columns, err := rows.Columns()
		if err != nil {
			return nil, fmt.Errorf("failed to get columns: %w", err)
		}

		// Fetch all rows
		var resultRows [][]interface{}
		for rows.Next() {
			// Create slice for row values
			values := make([]interface{}, len(columns))
			valuePtrs := make([]interface{}, len(columns))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				continue
			}

			// Convert byte arrays to strings for JSON
			row := make([]interface{}, len(columns))
			for i, v := range values {
				if b, ok := v.([]byte); ok {
					row[i] = string(b)
				} else {
					row[i] = v
				}
			}
			resultRows = append(resultRows, row)
		}

		return &QueryResult{
			Columns: columns,
			Rows:    resultRows,
			Message: fmt.Sprintf("%d rows returned", len(resultRows)),
		}, nil
	} else {
		// Execute action query (INSERT, UPDATE, DELETE, etc.)
		result, err := userDB.ExecContext(ctx, query)
		if err != nil {
			return nil, fmt.Errorf("query error: %w", err)
		}

		affected, _ := result.RowsAffected()
		return &QueryResult{
			Columns: []string{"Result"},
			Rows:    [][]interface{}{{"Query executed successfully"}},
			Message: fmt.Sprintf("%d rows affected", affected),
		}, nil
	}
}
