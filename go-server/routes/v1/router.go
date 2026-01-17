package v1

import (
	"cloudku-server/controllers"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes sets up all V1 API routes
// This is the main entry point for V1 versioned API
func RegisterRoutes(rg *gin.RouterGroup) {
	// Initialize all controllers once for better performance
	authController := controllers.NewAuthController()
	fileController := controllers.NewFileController()
	domainController := controllers.NewDomainController()
	dnsController := controllers.NewDNSController()
	sslController := controllers.NewSSLController()
	databaseController := controllers.NewDatabaseController()

	// Register route groups - order matters for readability
	RegisterAuthRoutes(rg, authController)
	RegisterFileRoutes(rg, fileController)
	RegisterDomainRoutes(rg, domainController)
	RegisterDNSRoutes(rg, dnsController)
	RegisterSSLRoutes(rg, sslController)
	RegisterDatabaseRoutes(rg, databaseController)
	RegisterPlaceholderRoutes(rg)
}
