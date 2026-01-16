package dto

import (
	"errors"
	"time"
)

// ============================================================================
// REQUEST DTOs
// ============================================================================

// CreateDatabaseRequest represents create database request
type CreateDatabaseRequest struct {
	DatabaseName     string `json:"databaseName" binding:"required"`
	DatabaseUser     string `json:"databaseUser" binding:"required"`
	DatabasePassword string `json:"databasePassword" binding:"required"`
	DatabaseType     string `json:"databaseType" binding:"required"`
	Charset          string `json:"charset"`
	Collation        string `json:"collation"`
}

// ChangePasswordRequest represents change password request
type ChangePasswordRequest struct {
	NewPassword string `json:"newPassword" binding:"required"`
}

// ExecuteQueryRequest represents SQL query execution request
type ExecuteQueryRequest struct {
	Query    string `json:"query" binding:"required"`
	Password string `json:"password"` // Optional if stored on server
}

// ============================================================================
// ENTITY / RESPONSE DTOs
// ============================================================================

// UserDatabase represents a user's database
type UserDatabase struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	DatabaseName string    `json:"database_name"`
	DatabaseUser string    `json:"database_user"`
	DatabaseType string    `json:"database_type"`
	Charset      string    `json:"charset"`
	Collation    string    `json:"collation"`
	SizeMB       float64   `json:"size_mb"`
	CreatedAt    time.Time `json:"created_at"`
}

// DatabaseStats represents aggregated database statistics
type DatabaseStats struct {
	TotalDatabases int     `json:"totalDatabases"`
	MySQLCount     int     `json:"mysqlCount"`
	PostgresCount  int     `json:"postgresCount"`
	TotalSizeMB    float64 `json:"totalSizeMB"`
}

// DatabaseListResult represents result of listing databases
type DatabaseListResult struct {
	Databases []UserDatabase
	Stats     DatabaseStats
	Error     error
}

// DatabaseResult represents result of database operation
type DatabaseResult struct {
	Database *UserDatabase
	Error    error
}

// QueryResult represents result of SQL query execution
type QueryResult struct {
	Columns []string        `json:"columns"`
	Rows    [][]interface{} `json:"rows"`
	Message string          `json:"message"`
	Error   error           `json:"-"`
}

// ============================================================================
// SQL SECURITY ERRORS
// ============================================================================

var (
	ErrEmptyQuery       = errors.New("query cannot be empty")
	ErrQueryTooLong     = errors.New("query exceeds maximum length")
	ErrMultiStatement   = errors.New("multi-statement queries not allowed")
	ErrForbiddenCommand = errors.New("this command is not allowed")
	ErrMissingWhere     = errors.New("UPDATE/DELETE requires WHERE clause")
	ErrLimitTooLarge    = errors.New("LIMIT exceeds maximum allowed")
	ErrCrossDatabase    = errors.New("cross-database access not allowed")
	ErrHexLiteral       = errors.New("hex literals not allowed")
)

// ============================================================================
// DATABASE SERVICE ERRORS
// ============================================================================

var (
	ErrDatabaseNotFound = errors.New("database not found")
	ErrNotOwner         = errors.New("you do not own this database")
	ErrCreateFailed     = errors.New("failed to create database")
	ErrDeleteFailed     = errors.New("failed to delete database")
)

// ============================================================================
// SCHEMA DTOs
// ============================================================================

type ColumnSchema struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type TableSchema struct {
	Name    string         `json:"name"`
	Columns []ColumnSchema `json:"columns"`
}

type DatabaseSchema struct {
	Tables []TableSchema `json:"tables"`
}
