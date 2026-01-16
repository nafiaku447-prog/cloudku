package services

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"cloudku-server/database"
	"cloudku-server/dto"
)

// MySQLService handles MySQL specific operations
type MySQLService struct {
	db       *sql.DB
	userPool sync.Map // map[string]*sql.DB (key: dbUser)
}

// NewMySQLService creates a new MySQL service instance
func NewMySQLService() *MySQLService {
	return &MySQLService{
		db: database.MySQLAdminDB,
	}
}

// ValidateIdentifier checks if name is safe (alphanumeric + underscores only)
var identifierRegex = regexp.MustCompile("^[a-zA-Z0-9_]+$")

func (s *MySQLService) ValidateIdentifier(name string) bool {
	return identifierRegex.MatchString(name)
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

	// Invalidate pool connection if exists
	if val, ok := s.userPool.Load(dbUser); ok {
		if conn, ok := val.(*sql.DB); ok {
			conn.Close()
		}
		s.userPool.Delete(dbUser)
	}

	// Best effort cleanup
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf("DROP DATABASE IF EXISTS `%s`", dbName)); err != nil {
		return fmt.Errorf("failed to drop database: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, fmt.Sprintf("DROP USER IF EXISTS '%s'@'%%'", dbUser)); err != nil {
		return fmt.Errorf("failed to drop user: %w", err)
	}

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

	// Invalidate pool connection because password changed
	if val, ok := s.userPool.Load(dbUser); ok {
		if conn, ok := val.(*sql.DB); ok {
			conn.Close()
		}
		s.userPool.Delete(dbUser)
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

// GetPooledConnection retrieves or creates a persistent connection for a user
func (s *MySQLService) GetPooledConnection(ctx context.Context, dbName, dbUser, dbPassword string) (*sql.DB, error) {
	// 1. Check if connection exists in pool
	if val, ok := s.userPool.Load(dbUser); ok {
		// OPTIMIZATION: Skip Ping to save network round-trip.
		// sql.DB handles connection polling internally.
		return val.(*sql.DB), nil
	}

	// 2. Create new connection
	connString := fmt.Sprintf("%s:%s@tcp(localhost:3306)/%s?charset=utf8mb4&parseTime=True&multiStatements=true",
		dbUser, s.escapePassword(dbPassword), dbName)

	userDB, err := sql.Open("mysql", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set connection limits (Important for pooling)
	userDB.SetMaxOpenConns(5) // Allow up to 5 concurrent queries per user
	userDB.SetMaxIdleConns(2)
	userDB.SetConnMaxLifetime(5 * time.Minute) // Keep alive longer

	// Test connection
	if err := userDB.PingContext(ctx); err != nil {
		userDB.Close()
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	// 3. Store in pool
	s.userPool.Store(dbUser, userDB)
	return userDB, nil
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

	// Use Pooled Connection!
	userDB, err := s.GetPooledConnection(ctx, dbName, dbUser, dbPassword)
	if err != nil {
		return nil, err
	}
	// DO NOT defer userDB.Close() here! We want to keep it alive in the pool.

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
		// OPTIMIZATION: Pre-allocate slice
		resultRows := make([][]interface{}, 0, 50)
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

// GetSchema retrieves the database schema (tables and columns)
func (s *MySQLService) GetSchema(ctx context.Context, dbName, dbUser, dbPassword string) (*dto.DatabaseSchema, error) {
	// Use Pooled Connection!
	userDB, err := s.GetPooledConnection(ctx, dbName, dbUser, dbPassword)
	if err != nil {
		return nil, err
	}
	// Note: We don't close pooled connection here

	// Get Tables
	rows, err := userDB.QueryContext(ctx, "SHOW TABLES")
	if err != nil {
		return nil, fmt.Errorf("failed to get tables: %w", err)
	}
	defer rows.Close()

	var tables []dto.TableSchema
	var tableNames []string

	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			continue
		}
		tableNames = append(tableNames, tableName)
	}
	rows.Close() // Close early to reuse connection for column queries

	// Get Columns for each table
	for _, tableName := range tableNames {
		// Use simple DESCRIBE query as it's standard MySQL
		// Querying information_schema is better for bulk, but this is simpler for per-user DBs
		colsRows, err := userDB.QueryContext(ctx, fmt.Sprintf("DESCRIBE `%s`", tableName))
		if err != nil {
			continue // Skip table if error
		}

		var columns []dto.ColumnSchema
		for colsRows.Next() {
			var field, typ, null, key, def, extra sql.NullString
			// mysql 5.7/8.0 DESCRIBE returns 6 columns: Field, Type, Null, Key, Default, Extra
			if err := colsRows.Scan(&field, &typ, &null, &key, &def, &extra); err != nil {
				continue
			}
			columns = append(columns, dto.ColumnSchema{
				Name: field.String,
				Type: typ.String,
			})
		}
		colsRows.Close()

		tables = append(tables, dto.TableSchema{
			Name:    tableName,
			Columns: columns,
		})
	}

	return &dto.DatabaseSchema{Tables: tables}, nil
}
