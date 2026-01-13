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

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
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
🚀 CloudKu API Server (Golang) - 100%% Complete
%s
📡 Server running on: http://localhost:%s
🗄️  Database: Connected to PostgreSQL
🌍 Environment: %s
🔗 CORS enabled for: %s
%s

📋 Available API Endpoints:

🔐 AUTH:
  POST   /api/auth/register     - Email/password register
  POST   /api/auth/login        - Email/password login
  POST   /api/auth/google       - Google OAuth login
  POST   /api/auth/github       - GitHub OAuth login
  GET    /api/auth/me           - Get current user

📁 FILES:
  GET    /api/files/list        - List files
  GET    /api/files/stats       - Get storage stats
  POST   /api/files/upload      - Upload file
  GET    /api/files/download    - Download file
  DELETE /api/files/delete      - Delete file/folder
  POST   /api/files/folder      - Create folder
  GET    /api/files/read        - Read file content
  PUT    /api/files/update      - Update file content
  PUT    /api/files/rename      - Rename file/folder
  POST   /api/files/copy        - Copy files
  POST   /api/files/move        - Move files
  POST   /api/files/extract     - Extract ZIP
  POST   /api/files/compress    - Compress to ZIP
  POST   /api/files/git-clone   - Clone Git repository
  PUT    /api/files/permissions - Change permissions

🌐 DOMAINS:
  GET    /api/domains           - Get all domains
  GET    /api/domains/:id       - Get domain details
  POST   /api/domains           - Create domain
  PUT    /api/domains/:id       - Update domain
  DELETE /api/domains/:id       - Delete domain
  POST   /api/domains/:id/verify - Verify domain DNS

📝 DNS:
  GET    /api/domains/:id/dns           - Get DNS records
  POST   /api/domains/:id/dns           - Create DNS record
  DELETE /api/domains/:id/dns/:recordId - Delete DNS record
  GET    /api/dns/stats                 - DNS statistics
  GET    /api/dns/:domainId/export      - Export zone file

🔒 SSL:
  GET    /api/ssl/stats              - SSL statistics
  GET    /api/ssl/expiring           - Expiring certificates
  POST   /api/ssl/:domainId/enable   - Enable SSL
  POST   /api/ssl/:domainId/disable  - Disable SSL
  POST   /api/ssl/:domainId/renew    - Renew SSL
  GET    /api/ssl/:domainId/info     - Get SSL info

🗄️ DATABASES:
  GET    /api/databases              - Get all databases
  GET    /api/databases/stats        - Database statistics
  POST   /api/databases              - Create database
  DELETE /api/databases/:id          - Delete database
  PUT    /api/databases/:id/password - Change password

%s
`, line, line, cfg.Port, cfg.Environment, cfg.FrontendURL, line, line)

	fmt.Print(banner)
}
