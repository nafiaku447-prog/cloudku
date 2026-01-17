package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"cloudku-server/config"
	"cloudku-server/database"
	"cloudku-server/middleware"
	"cloudku-server/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Connect to MySQL Admin
	if err := database.ConnectMySQLAdmin(); err != nil {
		log.Printf("⚠️ Failed to connect to MySQL Admin: %v", err)
		// We don't fatal here because the server can still run with just Postgres
	}
	defer database.CloseMySQL()

	// Initialize schema
	if err := database.InitSchema(); err != nil {
		log.Fatalf("❌ Failed to initialize database schema: %v", err)
	}

	// Create Gin router
	r := gin.New()

	// Add middlewares
	r.Use(gin.Recovery())
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.CORSMiddleware())

	// Setup routes
	routes.SetupRoutes(r)

	// Create HTTP server with security hardening
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second, // SECURITY: Close idle connections
		ReadHeaderTimeout: 10 * time.Second,  // SECURITY: Prevent Slowloris attacks
		MaxHeaderBytes:    1 << 20,           // SECURITY: 1MB max header size
	}

	// Start server in goroutine
	go func() {
		printBanner(cfg)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("\n🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server gracefully stopped")
}

func printBanner(cfg *config.Config) {
	line := strings.Repeat("=", 65)

	banner := fmt.Sprintf(`
%s
🚀 CloudKu API Server (Golang) - v1.0.0
%s
📡 Server running on: http://localhost:%s
🗄️  Database: Connected to PostgreSQL
🌍 Environment: %s
🔗 CORS enabled for: %s
📦 API Version: v1 (stable)
%s

📋 Available API Endpoints:

🔍 DISCOVERY:
  GET    /health             - Server health check
  GET    /api                - API info
  GET    /api/versions       - List API versions

🔐 AUTH (/api/v1/auth):
  POST   /register           - Email/password register [PUBLIC]
  POST   /login              - Email/password login [PUBLIC]
  POST   /google             - Google OAuth login [PUBLIC]
  POST   /github             - GitHub OAuth login [PUBLIC]
  GET    /me                 - Get current user [PROTECTED]
  DELETE /me                 - Delete account [PROTECTED]

📁 FILES (/api/v1/files) [ALL PROTECTED]:
  GET    /list               - List files
  GET    /stats              - Get storage stats
  POST   /upload             - Upload file
  GET    /download           - Download file
  DELETE /delete             - Delete file/folder
  POST   /folder             - Create folder
  GET    /read               - Read file content
  PUT    /update             - Update file content
  PUT    /rename             - Rename file/folder
  POST   /copy               - Copy files
  POST   /move               - Move files
  POST   /extract            - Extract ZIP
  POST   /compress           - Compress to ZIP
  POST   /git-clone          - Clone Git repository
  PUT    /permissions        - Change permissions

🌐 DOMAINS (/api/v1/domains) [ALL PROTECTED]:
  GET    /                   - Get all domains
  GET    /:id                - Get domain details
  POST   /                   - Create domain
  PUT    /:id                - Update domain
  DELETE /:id                - Delete domain
  POST   /:id/verify         - Verify domain DNS
  GET    /:id/dns            - Get DNS records
  POST   /:id/dns            - Create DNS record
  DELETE /:id/dns/:recordId  - Delete DNS record

📝 DNS (/api/v1/dns) [ALL PROTECTED]:
  GET    /stats              - DNS statistics
  GET    /powerdns/status    - PowerDNS status
  POST   /powerdns/reload    - Reload PowerDNS
  GET    /:domainId/records  - Get PowerDNS records
  GET    /:domainId/export   - Export zone file

🔒 SSL (/api/v1/ssl) [ALL PROTECTED]:
  GET    /stats              - SSL statistics
  GET    /expiring           - Expiring certificates
  POST   /:domainId/enable   - Enable SSL
  POST   /:domainId/disable  - Disable SSL
  POST   /:domainId/renew    - Renew SSL
  GET    /:domainId/info     - Get SSL info

🗄️ DATABASES (/api/v1/databases) [ALL PROTECTED]:
  GET    /                   - Get all databases
  GET    /stats              - Database statistics
  POST   /                   - Create database
  DELETE /:id                - Delete database
  PUT    /:id/password       - Change password
  GET    /:id/schema         - Get schema (SQL Terminal)
  POST   /:id/query          - Execute query (SQL Terminal)

%s
`, line, line, cfg.Port, cfg.Environment, cfg.FrontendURL, line, line)

	fmt.Print(banner)
}
