package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"cloudku-server/config"

	_ "github.com/go-sql-driver/mysql"
)

// MySQLAdminDB is the global connection to the MySQL server (as admin)
var MySQLAdminDB *sql.DB

// ConnectMySQLAdmin establishes connection to MySQL server with admin privileges
func ConnectMySQLAdmin() error {
	cfg := config.AppConfig

	// DSN format: user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	// We connect without a DB name initially to allow creating databases
	connString := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.MySQLAdminUser,
		cfg.MySQLAdminPassword,
		cfg.MySQLHost,
		cfg.MySQLPort,
	)

	log.Printf("🔗 Connecting to MySQL Admin: %s@%s:%s", cfg.MySQLAdminUser, cfg.MySQLHost, cfg.MySQLPort)

	var err error
	MySQLAdminDB, err = sql.Open("mysql", connString)
	if err != nil {
		return fmt.Errorf("unable to open mysql connection: %w", err)
	}

	// Set pool configuration
	MySQLAdminDB.SetMaxOpenConns(10)
	MySQLAdminDB.SetMaxIdleConns(5)
	MySQLAdminDB.SetConnMaxLifetime(time.Hour)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := MySQLAdminDB.PingContext(ctx); err != nil {
		return fmt.Errorf("unable to ping mysql server: %w", err)
	}

	log.Println("✅ Connected to MySQL Server (Admin)")
	return nil
}

// CloseMySQL closes the MySQL connection
func CloseMySQL() {
	if MySQLAdminDB != nil {
		MySQLAdminDB.Close()
		log.Println("MySQL Admin connection closed")
	}
}
