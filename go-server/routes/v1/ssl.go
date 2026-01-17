package v1

import (
	"net/http"

	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterSSLRoutes sets up SSL certificate management routes
//
// # All routes require authentication
//
// ENDPOINTS:
//   - GET  /ssl                    - List all SSL certificates
//   - GET  /ssl/stats              - Get SSL statistics
//   - GET  /ssl/expiring           - Get expiring certificates
//   - POST /ssl/:domainId/enable   - Enable SSL for domain
//   - POST /ssl/:domainId/disable  - Disable SSL for domain
//   - POST /ssl/:domainId/renew    - Renew SSL certificate
//   - GET  /ssl/:domainId/info     - Get SSL certificate info
func RegisterSSLRoutes(rg *gin.RouterGroup, ctrl *controllers.SSLController) {
	ssl := rg.Group("/ssl")
	ssl.Use(middleware.AuthMiddleware())
	{
		// List & Stats
		ssl.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
		})
		ssl.GET("/stats", ctrl.GetSSLStats)
		ssl.GET("/expiring", ctrl.GetExpiringCertificates)

		// Domain-specific SSL Operations
		ssl.POST("/:domainId/enable", ctrl.EnableSSL)
		ssl.POST("/:domainId/disable", ctrl.DisableSSL)
		ssl.POST("/:domainId/renew", ctrl.RenewSSL)
		ssl.GET("/:domainId/info", ctrl.GetSSLInfo)
	}
}
