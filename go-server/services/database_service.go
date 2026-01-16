package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"cloudku-server/dto"
	"cloudku-server/repository"
)

// ============================================================================
// QUERY VALIDATION CONSTANTS
// ============================================================================

const (
	MaxQueryLength     = 10000
	MaxSelectLimit     = 5000
	DefaultSelectLimit = 1000
	MaxUpdateDelete    = 500
)

// Forbidden patterns (regex word-boundary safe)
var forbiddenPatterns = []*regexp.Regexp{
	// Database-level
	regexp.MustCompile(`(?i)\bDROP\s+DATABASE\b`),
	regexp.MustCompile(`(?i)\bCREATE\s+DATABASE\b`),
	regexp.MustCompile(`(?i)\bUSE\s+\w+`),

	// User/Privilege
	regexp.MustCompile(`(?i)\bGRANT\b`),
	regexp.MustCompile(`(?i)\bREVOKE\b`),
	regexp.MustCompile(`(?i)\bCREATE\s+USER\b`),
	regexp.MustCompile(`(?i)\bDROP\s+USER\b`),
	regexp.MustCompile(`(?i)\bALTER\s+USER\b`),

	// Server admin
	regexp.MustCompile(`(?i)\bFLUSH\b`),
	regexp.MustCompile(`(?i)\bSET\s+GLOBAL\b`),
	regexp.MustCompile(`(?i)\bSET\s+SESSION\b`),
	regexp.MustCompile(`(?i)\bLOAD\s+DATA\b`),
	regexp.MustCompile(`(?i)\bINTO\s+(OUTFILE|DUMPFILE)\b`),

	// Dangerous table ops
	regexp.MustCompile(`(?i)\bTRUNCATE\b`),
	regexp.MustCompile(`(?i)\bRENAME\s+TABLE\b`),

	// Stored programs
	regexp.MustCompile(`(?i)\bCREATE\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b`),
	regexp.MustCompile(`(?i)\bDROP\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b`),
	regexp.MustCompile(`(?i)\bALTER\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b`),
	regexp.MustCompile(`(?i)\bCALL\s+\w+`),

	// Table locking
	regexp.MustCompile(`(?i)\bLOCK\s+TABLES?\b`),
	regexp.MustCompile(`(?i)\bUNLOCK\s+TABLES?\b`),
	regexp.MustCompile(`(?i)\bHANDLER\b`),

	// System schemas
	regexp.MustCompile(`(?i)\bINFORMATION_SCHEMA\b`),
	regexp.MustCompile(`(?i)\bMYSQL\s*\.`),
	regexp.MustCompile(`(?i)\bPERFORMANCE_SCHEMA\b`),
	regexp.MustCompile(`(?i)\bSYS\s*\.`),
}

var (
	commentLine  = regexp.MustCompile(`--.*$`)
	commentBlock = regexp.MustCompile(`/\*.*?\*/`)
	hexLiteral   = regexp.MustCompile(`0x[0-9A-Fa-f]+`)
	limitClause  = regexp.MustCompile(`(?i)\bLIMIT\s+(\d+)`)
	whereClause  = regexp.MustCompile(`(?i)\bWHERE\b`)
	selectQuery  = regexp.MustCompile(`(?i)^\s*SELECT\b`)
	updateQuery  = regexp.MustCompile(`(?i)^\s*UPDATE\b`)
	deleteQuery  = regexp.MustCompile(`(?i)^\s*DELETE\b`)
)

// ============================================================================
// DATABASE SERVICE
// ============================================================================

// DatabaseService handles database business logic
type DatabaseService struct {
	repo         *repository.DatabaseRepository
	mysqlService *MySQLService
}

// NewDatabaseService creates a new database service
func NewDatabaseService() *DatabaseService {
	return &DatabaseService{
		repo:         repository.NewDatabaseRepository(),
		mysqlService: NewMySQLService(),
	}
}

// ============================================================================
// PREFIX GENERATION
// ============================================================================

// GenerateUserPrefix creates a unique prefix for a user (ck + 6 random hex chars)
func GenerateUserPrefix() string {
	bytes := make([]byte, 3)
	rand.Read(bytes)
	return "ck" + hex.EncodeToString(bytes)
}

// GetOrCreatePrefix retrieves or generates a user's database prefix
func (s *DatabaseService) GetOrCreatePrefix(ctx context.Context, userID int) (string, error) {
	prefix, err := s.repo.GetUserPrefix(ctx, userID)
	if err != nil {
		return "", err
	}

	if prefix == "" {
		prefix = GenerateUserPrefix()
		if err := s.repo.SetUserPrefix(ctx, userID, prefix); err != nil {
			log.Printf("WARN: Failed to save prefix for user %d: %v", userID, err)
		}
	}

	return prefix, nil
}

// FormatDBName creates full database name with prefix
func FormatDBName(prefix, name string) string {
	// Sanitize: only alphanumeric and underscore
	safe := regexp.MustCompile(`[^a-zA-Z0-9_]`).ReplaceAllString(name, "")
	return fmt.Sprintf("%s_%s", prefix, safe)
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// GetDatabases returns all databases for a user with stats
func (s *DatabaseService) GetDatabases(ctx context.Context, userID int) *dto.DatabaseListResult {
	databases, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		log.Printf("ERROR: DatabaseService.GetDatabases - %v", err)
		return &dto.DatabaseListResult{Error: err}
	}

	// Calculate stats
	stats := dto.DatabaseStats{}
	for _, db := range databases {
		stats.TotalDatabases++
		stats.TotalSizeMB += db.SizeMB
		if db.DatabaseType == "mysql" {
			stats.MySQLCount++
		} else {
			stats.PostgresCount++
		}
	}

	return &dto.DatabaseListResult{
		Databases: databases,
		Stats:     stats,
	}
}

// CreateDatabase creates a new database with rollback on failure
func (s *DatabaseService) CreateDatabase(ctx context.Context, userID int, req dto.CreateDatabaseRequest) *dto.DatabaseResult {
	// Get or create user prefix
	prefix, err := s.GetOrCreatePrefix(ctx, userID)
	if err != nil {
		log.Printf("ERROR: Failed to get prefix: %v", err)
		return &dto.DatabaseResult{Error: dto.ErrCreateFailed}
	}

	// Format names with prefix
	dbName := FormatDBName(prefix, req.DatabaseName)
	dbUser := FormatDBName(prefix, req.DatabaseUser)

	// Default charset/collation
	charset := req.Charset
	collation := req.Collation
	if charset == "" {
		if req.DatabaseType == "mysql" {
			charset = "utf8mb4"
			collation = "utf8mb4_unicode_ci"
		} else {
			charset = "UTF8"
			collation = "en_US.UTF-8"
		}
	}

	// Create in MySQL server
	if req.DatabaseType == "mysql" {
		if err := s.mysqlService.CreateDatabase(ctx, dbName, dbUser, req.DatabasePassword); err != nil {
			log.Printf("ERROR: Failed to create MySQL database: %v", err)
			return &dto.DatabaseResult{Error: dto.ErrCreateFailed}
		}
	}

	// Store metadata in Postgres
	db, err := s.repo.Create(ctx, userID, dbName, dbUser, req.DatabasePassword, req.DatabaseType, charset, collation)
	if err != nil {
		// Rollback MySQL database creation
		if req.DatabaseType == "mysql" {
			s.mysqlService.RevokeAccess(ctx, dbName, dbUser)
		}
		log.Printf("ERROR: Failed to store database metadata: %v", err)
		return &dto.DatabaseResult{Error: dto.ErrCreateFailed}
	}

	return &dto.DatabaseResult{Database: db}
}

// DeleteDatabase deletes a database with ownership verification
func (s *DatabaseService) DeleteDatabase(ctx context.Context, userID, id int) error {
	// Get database credentials
	dbName, dbUser, dbType, _, err := s.repo.GetDBCredentials(ctx, id, userID)
	if err != nil {
		return dto.ErrDatabaseNotFound
	}

	// Delete from MySQL server
	if dbType == "mysql" {
		if err := s.mysqlService.DeleteDatabase(ctx, dbName, dbUser); err != nil {
			log.Printf("ERROR: Failed to delete MySQL database %s: %v", dbName, err)
			return fmt.Errorf("failed to delete database from server: %w", err)
		}
	}

	// Delete metadata
	if err := s.repo.Delete(ctx, id, userID); err != nil {
		log.Printf("ERROR: Failed to delete database record: %v", err)
		return dto.ErrDeleteFailed
	}

	return nil
}

// ChangePassword changes database user password
func (s *DatabaseService) ChangePassword(ctx context.Context, userID, id int, newPassword string) error {
	// Get database credentials
	_, dbUser, dbType, _, err := s.repo.GetDBCredentials(ctx, id, userID)
	if err != nil {
		return dto.ErrDatabaseNotFound
	}

	// Update password in MySQL
	if dbType == "mysql" {
		if err := s.mysqlService.UpdatePassword(ctx, dbUser, newPassword); err != nil {
			return err
		}
	}

	// Update stored password in Postgres
	if err := s.repo.UpdatePassword(ctx, id, userID, newPassword); err != nil {
		log.Printf("ERROR: Failed to update stored password: %v", err)
		// We don't return error here because MySQL update was successful
	}

	return nil
}

// UpdateSize updates database size (simulated for now)
func (s *DatabaseService) UpdateSize(ctx context.Context, userID, id int) (float64, error) {
	// Verify ownership
	exists, err := s.repo.Exists(ctx, id, userID)
	if err != nil || !exists {
		return 0, dto.ErrDatabaseNotFound
	}

	// In production, query actual size from MySQL
	sizeMB := 10.5

	if err := s.repo.UpdateSize(ctx, id, userID, sizeMB); err != nil {
		return 0, err
	}

	return sizeMB, nil
}

// GetStats returns database statistics
func (s *DatabaseService) GetStats(ctx context.Context, userID int) (*dto.DatabaseStats, error) {
	return s.repo.GetStats(ctx, userID)
}

// ============================================================================
// QUERY EXECUTION (cPanel-Level Security)
// ============================================================================

// ExecuteQuery executes a SQL query with security validation
func (s *DatabaseService) ExecuteQuery(ctx context.Context, userID, id int, query, password string) *dto.QueryResult {
	// Get database credentials AND stored password
	dbName, dbUser, dbType, storedPass, err := s.repo.GetDBCredentials(ctx, id, userID)
	if err != nil {
		return &dto.QueryResult{Error: dto.ErrDatabaseNotFound}
	}

	// Use stored password if provided password is empty
	finalPassword := password
	if finalPassword == "" {
		finalPassword = storedPass
	}

	if finalPassword == "" {
		return &dto.QueryResult{Error: fmt.Errorf("password is required")}
	}

	// Only MySQL supported
	if dbType != "mysql" {
		return &dto.QueryResult{Error: fmt.Errorf("only MySQL databases support SQL console")}
	}

	// Validate and sanitize query
	sanitizedQuery, err := ValidateQuery(query, dbName)
	if err != nil {
		return &dto.QueryResult{Error: err}
	}

	// Execute query
	result, err := s.mysqlService.ExecuteQuery(ctx, dbName, dbUser, finalPassword, sanitizedQuery)
	if err != nil {
		log.Printf("WARN: SQL query failed for db %s: %v", dbName, err)
		return &dto.QueryResult{Error: err}
	}

	return &dto.QueryResult{
		Columns: result.Columns,
		Rows:    result.Rows,
		Message: result.Message,
	}
}

// ValidateQuery validates and sanitizes SQL for cPanel-level security
func ValidateQuery(query string, allowedDB string) (string, error) {
	// 1. Length check
	if len(query) > MaxQueryLength {
		return "", dto.ErrQueryTooLong
	}

	// 2. Strip comments
	query = commentLine.ReplaceAllString(query, "")
	query = commentBlock.ReplaceAllString(query, "")
	query = strings.TrimSpace(query)

	if query == "" {
		return "", dto.ErrEmptyQuery
	}

	// 3. Block multi-statement (REMOVED as requested)
	// trimmed := strings.TrimSuffix(query, ";")
	// if strings.Contains(trimmed, ";") {
	// 	return "", dto.ErrMultiStatement
	// }
	// query = trimmed

	// 4. Block hex literals
	if hexLiteral.MatchString(query) {
		return "", dto.ErrHexLiteral
	}

	// 5. Block forbidden patterns (System Schemas & Dangerous Ops)
	for _, p := range forbiddenPatterns {
		if p.MatchString(query) {
			return "", dto.ErrForbiddenCommand
		}
	}

	// 6. Cross-Database Check
	// We REMOVED the aggressive "word.word" regex because it flags valid "table.column" queries.
	// Security is guaranteed by:
	// - ForbiddenPatterns blocks system schemas (mysql, information_schema, etc)
	// - MySQL User Privileges (GRANT) prevents access to other tenant databases.
	// This is standard cPanel/phpMyAdmin behavior.

	// 7. UPDATE/DELETE: require WHERE + LIMIT
	if updateQuery.MatchString(query) || deleteQuery.MatchString(query) {
		if !whereClause.MatchString(query) {
			return "", dto.ErrMissingWhere
		}
		if !limitClause.MatchString(query) {
			query = query + fmt.Sprintf(" LIMIT %d", MaxUpdateDelete)
		} else {
			if m := limitClause.FindStringSubmatch(query); m != nil {
				if l, _ := strconv.Atoi(m[1]); l > MaxUpdateDelete {
					return "", dto.ErrLimitTooLarge
				}
			}
		}
	}

	// 8. SELECT: auto-add/cap LIMIT
	if selectQuery.MatchString(query) {
		if m := limitClause.FindStringSubmatch(query); m != nil {
			if l, _ := strconv.Atoi(m[1]); l > MaxSelectLimit {
				return "", dto.ErrLimitTooLarge
			}
		} else {
			query = query + fmt.Sprintf(" LIMIT %d", DefaultSelectLimit)
		}
	}

	return query, nil
}

// GetDatabaseSchema retrieves the schema for a specific database
func (s *DatabaseService) GetDatabaseSchema(ctx context.Context, userID, id int, password string) *dto.DatabaseSchema {
	// Get database credentials AND stored password
	dbName, dbUser, dbType, storedPass, err := s.repo.GetDBCredentials(ctx, id, userID)
	if err != nil {
		return nil
	}

	// Use stored password if provided password is empty
	finalPassword := password
	if finalPassword == "" {
		finalPassword = storedPass
	}

	if finalPassword == "" {
		return nil
	}

	// Only MySQL supported
	if dbType != "mysql" {
		return nil
	}

	// Fetch schema
	schema, err := s.mysqlService.GetSchema(ctx, dbName, dbUser, finalPassword)
	if err != nil {
		log.Printf("WARN: Failed to get schema for db %s: %v", dbName, err)
		return nil
	}

	return schema
}
