package routes

import (
	"net/http"
	"time"

	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine) {
	// Initialize controllers
	authController := controllers.NewAuthController()
	fileController := controllers.NewFileController()
	domainController := controllers.NewDomainController()
	dnsController := controllers.NewDNSController()
	sslController := controllers.NewSSLController()
	databaseController := controllers.NewDatabaseController()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"message":   "CloudKu API is running (Go Server)",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API group
	api := r.Group("/api")
	{
		// ==========================================
		// AUTH ROUTES (public)
		// ==========================================
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
			auth.POST("/google", authController.GoogleAuth)
			auth.POST("/google/callback", authController.GoogleAuthCallback)
			auth.POST("/github", authController.GithubAuth)

			// Protected auth routes
			auth.GET("/me", middleware.AuthMiddleware(), authController.GetMe)
			auth.DELETE("/me", middleware.AuthMiddleware(), authController.DeleteAccount)
		}

		// ==========================================
		// FILE ROUTES (protected)
		// ==========================================
		files := api.Group("/files")
		files.Use(middleware.AuthMiddleware())
		{
			files.GET("/list", fileController.ListFiles)
			files.GET("/stats", fileController.GetStats)
			files.POST("/upload", fileController.UploadFile)
			files.GET("/download", fileController.DownloadFile)
			files.DELETE("/delete", fileController.DeleteFile)
			files.POST("/folder", fileController.CreateFolder)
			files.GET("/read", fileController.ReadFile)
			files.PUT("/update", fileController.UpdateFile)
			files.PUT("/rename", fileController.RenameFile)
			files.POST("/copy", fileController.CopyFiles)
			files.POST("/move", fileController.MoveFiles)
			files.POST("/extract", fileController.ExtractZip)
			files.POST("/compress", fileController.CompressFiles)
			files.POST("/git-clone", fileController.GitClone)
			files.PUT("/permissions", fileController.ChangePermissions)
		}

		// ==========================================
		// DOMAIN ROUTES (protected)
		// ==========================================
		domains := api.Group("/domains")
		domains.Use(middleware.AuthMiddleware())
		{
			domains.GET("", domainController.GetDomains)
			domains.GET("/:id", domainController.GetDomain)
			domains.POST("", domainController.CreateDomain)
			domains.PUT("/:id", domainController.UpdateDomain)
			domains.DELETE("/:id", domainController.DeleteDomain)
			domains.POST("/:id/verify", domainController.VerifyDomain)

			// DNS Records for domains - use :id consistently
			domains.GET("/:id/dns", domainController.GetDNSRecords)
			domains.POST("/:id/dns", domainController.CreateDNSRecord)
			domains.DELETE("/:id/dns/:recordId", domainController.DeleteDNSRecord)
		}

		// ==========================================
		// DNS ROUTES (protected)
		// ==========================================
		dns := api.Group("/dns")
		dns.Use(middleware.AuthMiddleware())
		{
			dns.GET("/stats", dnsController.GetDNSStats)
			dns.GET("/powerdns/status", dnsController.GetPowerDNSStatus)
			dns.POST("/powerdns/reload", dnsController.ReloadPowerDNS)
			dns.GET("/:domainId/records", dnsController.GetPowerDNSRecords)
			dns.GET("/:domainId/export", dnsController.ExportZone)
			dns.POST("/:domainId/increment-serial", dnsController.IncrementSOASerial)
		}

		// ==========================================
		// SSL ROUTES (protected)
		// ==========================================
		ssl := api.Group("/ssl")
		ssl.Use(middleware.AuthMiddleware())
		{
			ssl.GET("/stats", sslController.GetSSLStats)
			ssl.GET("/expiring", sslController.GetExpiringCertificates)
			ssl.POST("/:domainId/enable", sslController.EnableSSL)
			ssl.POST("/:domainId/disable", sslController.DisableSSL)
			ssl.POST("/:domainId/renew", sslController.RenewSSL)
			ssl.GET("", func(c *gin.Context) {
				// Return empty list or implement real listing if available
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
			ssl.GET("/:domainId/info", sslController.GetSSLInfo)
		}

		// ==========================================
		// DATABASE ROUTES (protected)
		// ==========================================
		databases := api.Group("/databases")
		databases.Use(middleware.AuthMiddleware())
		{
			databases.GET("", databaseController.GetDatabases)
			databases.GET("/stats", databaseController.GetStats)
			databases.POST("", databaseController.CreateDatabase)
			databases.DELETE("/:id", databaseController.DeleteDatabase)
			databases.PUT("/:id/password", databaseController.ChangePassword)
			databases.PUT("/:id/size", databaseController.UpdateSize)
			databases.POST("/:id/query", databaseController.ExecuteQuery) // SQL Console
		}

		// ==========================================
		// HOSTING ROUTES (placeholder)
		// ==========================================
		hosting := api.Group("/hosting")
		hosting.Use(middleware.AuthMiddleware())
		{
			hosting.GET("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Hosting routes available",
					"features": []string{
						"Website management",
						"PHP version selection",
						"Resource monitoring",
					},
				})
			})
		}

		// ==========================================
		// WEBSITES ROUTES (placeholder)
		// ==========================================
		websites := api.Group("/websites")
		websites.Use(middleware.AuthMiddleware())
		{
			websites.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
			websites.POST("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": nil, "message": "Website created"})
			})
		}

		// ==========================================
		// EMAILS ROUTES (placeholder)
		// ==========================================
		emails := api.Group("/emails")
		emails.Use(middleware.AuthMiddleware())
		{
			emails.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
			emails.POST("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": nil, "message": "Email created"})
			})
		}

		// ==========================================
		// INVOICES ROUTES (placeholder)
		// ==========================================
		invoices := api.Group("/invoices")
		invoices.Use(middleware.AuthMiddleware())
		{
			invoices.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
		}

		// ==========================================
		// TICKETS ROUTES (placeholder)
		// ==========================================
		tickets := api.Group("/tickets")
		tickets.Use(middleware.AuthMiddleware())
		{
			tickets.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
			tickets.POST("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": nil, "message": "Ticket created"})
			})
		}

		// ==========================================
		// PAYMENT METHODS ROUTES (placeholder)
		// ==========================================
		paymentMethods := api.Group("/payment-methods")
		paymentMethods.Use(middleware.AuthMiddleware())
		{
			paymentMethods.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
			})
		}
	}

	// 404 handler
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Endpoint not found",
		})
	})
}
