package services

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"

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

	// strict validation to prevent injection
	if !s.ValidateIdentifier(dbName) || !s.ValidateIdentifier(dbUser) {
		return fmt.Errorf("invalid database or user name")
	}

	// 1. Create Database
	// Note: DDL statements don't support placeholders for identifiers
	_, err := s.db.ExecContext(ctx, fmt.Sprintf("CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName))
	if err != nil {
		return fmt.Errorf("create database failed: %w", err)
	}

	// 2. Create User
	// Using % host for remote access enabled default
	_, err = s.db.ExecContext(ctx, fmt.Sprintf("CREATE USER '%s'@'%%' IDENTIFIED BY '%s'", dbUser, dbPassword))
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

	_, err := s.db.ExecContext(ctx, fmt.Sprintf("ALTER USER '%s'@'%%' IDENTIFIED BY '%s'", dbUser, newPassword))
	if err != nil {
		return err
	}

	s.db.ExecContext(ctx, "FLUSH PRIVILEGES")
	return nil
}
