package models

import (
	"context"
	"database/sql"
	"log"
	"time"

	"cloudku-server/database"
)

// DNSRecord represents a DNS record
type DNSRecord struct {
	ID         int           `json:"id"`
	DomainID   int           `json:"domain_id"`
	RecordType string        `json:"record_type"`
	Name       string        `json:"name"`
	Value      string        `json:"value"`
	TTL        int           `json:"ttl"`
	Priority   sql.NullInt32 `json:"priority"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

// DNSRecordResponse is the API response structure
type DNSRecordResponse struct {
	ID         int       `json:"id"`
	DomainID   int       `json:"domain_id"`
	RecordType string    `json:"record_type"`
	Name       string    `json:"name"`
	Value      string    `json:"value"`
	TTL        int       `json:"ttl"`
	Priority   *int      `json:"priority"`
	CreatedAt  time.Time `json:"created_at"`
}

// ToResponse converts DNSRecord to DNSRecordResponse
func (r *DNSRecord) ToResponse() DNSRecordResponse {
	var priority *int
	if r.Priority.Valid {
		p := int(r.Priority.Int32)
		priority = &p
	}

	return DNSRecordResponse{
		ID:         r.ID,
		DomainID:   r.DomainID,
		RecordType: r.RecordType,
		Name:       r.Name,
		Value:      r.Value,
		TTL:        r.TTL,
		Priority:   priority,
		CreatedAt:  r.CreatedAt,
	}
}

// GetDNSRecordsByDomainID gets all DNS records for a domain
func GetDNSRecordsByDomainID(ctx context.Context, domainID int) ([]DNSRecord, error) {
	query := `
		SELECT id, domain_id, record_type, name, value, ttl, priority, created_at, updated_at
		FROM dns_records
		WHERE domain_id = $1
		ORDER BY record_type, name
	`

	rows, err := database.DB.Query(ctx, query, domainID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []DNSRecord
	for rows.Next() {
		var r DNSRecord
		err := rows.Scan(
			&r.ID, &r.DomainID, &r.RecordType, &r.Name, &r.Value,
			&r.TTL, &r.Priority, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			// SECURITY: Log scan errors for debugging, don't silently ignore
			log.Printf("WARN: Failed to scan DNS record row: %v", err)
			continue
		}
		records = append(records, r)
	}

	return records, nil
}

// CreateDNSRecord creates a new DNS record
func CreateDNSRecord(ctx context.Context, domainID int, recordType, name, value string, ttl int, priority *int) (*DNSRecord, error) {
	query := `
		INSERT INTO dns_records (domain_id, record_type, name, value, ttl, priority)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, domain_id, record_type, name, value, ttl, priority, created_at, updated_at
	`

	var r DNSRecord
	err := database.DB.QueryRow(ctx, query, domainID, recordType, name, value, ttl, priority).Scan(
		&r.ID, &r.DomainID, &r.RecordType, &r.Name, &r.Value,
		&r.TTL, &r.Priority, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &r, nil
}

// DeleteDNSRecord deletes a DNS record
func DeleteDNSRecord(ctx context.Context, recordID, domainID int) error {
	query := `DELETE FROM dns_records WHERE id = $1 AND domain_id = $2`
	result, err := database.DB.Exec(ctx, query, recordID, domainID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// CreateDefaultDNSRecords creates default DNS records for a new domain
func CreateDefaultDNSRecords(ctx context.Context, domainID int, domainName, serverIP string) error {
	defaultRecords := []struct {
		Type     string
		Name     string
		Value    string
		Priority *int
	}{
		{"A", "@", serverIP, nil},
		{"A", "www", serverIP, nil},
		{"CNAME", "ftp", domainName, nil},
		{"MX", "@", "mail." + domainName, intPtr(10)},
	}

	for _, record := range defaultRecords {
		query := `
			INSERT INTO dns_records (domain_id, record_type, name, value, priority)
			VALUES ($1, $2, $3, $4, $5)
		`
		_, err := database.DB.Exec(ctx, query, domainID, record.Type, record.Name, record.Value, record.Priority)
		if err != nil {
			return err
		}
	}

	return nil
}

func intPtr(i int) *int {
	return &i
}
