package models

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"time"

	"cloudku-server/database"
)

// Domain represents a domain in the system
type Domain struct {
	ID              int            `json:"id"`
	UserID          int            `json:"user_id"`
	DomainName      string         `json:"domain_name"`
	DocumentRoot    string         `json:"document_root"`
	Status          string         `json:"status"`
	SSLEnabled      bool           `json:"ssl_enabled"`
	SSLProvider     sql.NullString `json:"ssl_provider"`
	SSLExpiresAt    sql.NullTime   `json:"ssl_expires_at"`
	AutoRenewSSL    bool           `json:"auto_renew_ssl"`
	VerifiedAt      sql.NullTime   `json:"verified_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DNSRecordsCount int            `json:"dns_records_count"`
	AliasesCount    int            `json:"aliases_count"`
}

// DomainResponse is the API response structure
type DomainResponse struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	DomainName      string     `json:"domain_name"`
	DocumentRoot    string     `json:"document_root"`
	Status          string     `json:"status"`
	SSLEnabled      bool       `json:"ssl_enabled"`
	SSLProvider     *string    `json:"ssl_provider"`
	SSLExpiresAt    *time.Time `json:"ssl_expires_at"`
	AutoRenewSSL    bool       `json:"auto_renew_ssl"`
	VerifiedAt      *time.Time `json:"verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	DNSRecordsCount int        `json:"dns_records_count"`
	AliasesCount    int        `json:"aliases_count"`
}

// ToResponse converts Domain to DomainResponse
func (d *Domain) ToResponse() DomainResponse {
	var sslProvider *string
	var sslExpiresAt *time.Time
	var verifiedAt *time.Time

	if d.SSLProvider.Valid {
		sslProvider = &d.SSLProvider.String
	}
	if d.SSLExpiresAt.Valid {
		sslExpiresAt = &d.SSLExpiresAt.Time
	}
	if d.VerifiedAt.Valid {
		verifiedAt = &d.VerifiedAt.Time
	}

	return DomainResponse{
		ID:              d.ID,
		UserID:          d.UserID,
		DomainName:      d.DomainName,
		DocumentRoot:    d.DocumentRoot,
		Status:          d.Status,
		SSLEnabled:      d.SSLEnabled,
		SSLProvider:     sslProvider,
		SSLExpiresAt:    sslExpiresAt,
		AutoRenewSSL:    d.AutoRenewSSL,
		VerifiedAt:      verifiedAt,
		CreatedAt:       d.CreatedAt,
		DNSRecordsCount: d.DNSRecordsCount,
		AliasesCount:    d.AliasesCount,
	}
}

// GetDomainsByUserID gets all domains for a user
func GetDomainsByUserID(ctx context.Context, userID int) ([]Domain, error) {
	query := `
		SELECT id, user_id, domain_name, document_root, status, ssl_enabled,
		       ssl_provider, ssl_expires_at, auto_renew_ssl, verified_at, created_at, updated_at
		FROM domains
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var domains []Domain
	for rows.Next() {
		var d Domain
		err := rows.Scan(
			&d.ID, &d.UserID, &d.DomainName, &d.DocumentRoot, &d.Status,
			&d.SSLEnabled, &d.SSLProvider, &d.SSLExpiresAt, &d.AutoRenewSSL,
			&d.VerifiedAt, &d.CreatedAt, &d.UpdatedAt,
		)
		if err != nil {
			// SECURITY: Log scan errors for debugging, don't silently ignore
			log.Printf("WARN: Failed to scan domain row: %v", err)
			continue
		}

		// Get DNS records count
		countQuery := `SELECT COUNT(*) FROM dns_records WHERE domain_id = $1`
		database.DB.QueryRow(ctx, countQuery, d.ID).Scan(&d.DNSRecordsCount)

		domains = append(domains, d)
	}

	return domains, nil
}

// GetDomainByID gets a domain by ID for a user
func GetDomainByID(ctx context.Context, id, userID int) (*Domain, error) {
	query := `
		SELECT id, user_id, domain_name, document_root, status, ssl_enabled,
		       ssl_provider, ssl_expires_at, auto_renew_ssl, verified_at, created_at, updated_at
		FROM domains
		WHERE id = $1 AND user_id = $2
	`

	var d Domain
	err := database.DB.QueryRow(ctx, query, id, userID).Scan(
		&d.ID, &d.UserID, &d.DomainName, &d.DocumentRoot, &d.Status,
		&d.SSLEnabled, &d.SSLProvider, &d.SSLExpiresAt, &d.AutoRenewSSL,
		&d.VerifiedAt, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &d, nil
}

// CreateDomain creates a new domain
func CreateDomain(ctx context.Context, userID int, domainName, documentRoot string) (*Domain, error) {
	query := `
		INSERT INTO domains (user_id, domain_name, document_root, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, domain_name, document_root, status, ssl_enabled, 
		          ssl_provider, ssl_expires_at, auto_renew_ssl, verified_at, created_at, updated_at
	`

	var d Domain
	err := database.DB.QueryRow(ctx, query, userID, domainName, documentRoot, "pending").Scan(
		&d.ID, &d.UserID, &d.DomainName, &d.DocumentRoot, &d.Status,
		&d.SSLEnabled, &d.SSLProvider, &d.SSLExpiresAt, &d.AutoRenewSSL,
		&d.VerifiedAt, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &d, nil
}

// SECURITY: Whitelist of allowed update columns to prevent SQL injection (OWASP A03:2021)
// Only these columns can be updated via the API - prevents attacker from injecting arbitrary SQL
var allowedDomainUpdateColumns = map[string]bool{
	"document_root":  true,
	"status":         true,
	"ssl_enabled":    true,
	"ssl_provider":   true,
	"ssl_expires_at": true,
	"auto_renew_ssl": true,
	"verified_at":    true,
}

// UpdateDomain updates a domain with validated columns only
func UpdateDomain(ctx context.Context, id, userID int, updates map[string]interface{}) (*Domain, error) {
	// SECURITY: Validate all keys are in allowlist before building query
	for key := range updates {
		if !allowedDomainUpdateColumns[key] {
			return nil, fmt.Errorf("invalid update column: %s", key)
		}
	}

	if len(updates) == 0 {
		return nil, fmt.Errorf("no valid updates provided")
	}

	// Build dynamic update query with validated columns
	// SECURITY: Using strconv.Itoa for proper parameter numbering (was using unsafe rune conversion)
	setClauses := ""
	args := []interface{}{}
	argCount := 1

	for key, value := range updates {
		if setClauses != "" {
			setClauses += ", "
		}
		setClauses += key + " = $" + strconv.Itoa(argCount)
		args = append(args, value)
		argCount++
	}

	// Add updated_at timestamp
	setClauses += ", updated_at = NOW()"

	args = append(args, id, userID)
	query := `
		UPDATE domains SET ` + setClauses + `
		WHERE id = $` + strconv.Itoa(argCount) + ` AND user_id = $` + strconv.Itoa(argCount+1) + `
		RETURNING id, user_id, domain_name, document_root, status, ssl_enabled,
		          ssl_provider, ssl_expires_at, auto_renew_ssl, verified_at, created_at, updated_at
	`

	var d Domain
	err := database.DB.QueryRow(ctx, query, args...).Scan(
		&d.ID, &d.UserID, &d.DomainName, &d.DocumentRoot, &d.Status,
		&d.SSLEnabled, &d.SSLProvider, &d.SSLExpiresAt, &d.AutoRenewSSL,
		&d.VerifiedAt, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update domain: %w", err)
	}

	return &d, nil
}

// DeleteDomain deletes a domain
func DeleteDomain(ctx context.Context, id, userID int) (string, error) {
	query := `DELETE FROM domains WHERE id = $1 AND user_id = $2 RETURNING domain_name`
	var domainName string
	err := database.DB.QueryRow(ctx, query, id, userID).Scan(&domainName)
	return domainName, err
}

// DomainExists checks if a domain name already exists
func DomainExists(ctx context.Context, domainName string) (bool, error) {
	query := `SELECT COUNT(*) FROM domains WHERE domain_name = $1`
	var count int
	err := database.DB.QueryRow(ctx, query, domainName).Scan(&count)
	return count > 0, err
}
