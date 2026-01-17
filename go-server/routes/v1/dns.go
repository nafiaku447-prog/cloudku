package v1

import (
	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterDNSRoutes sets up DNS management routes
//
// # All routes require authentication
//
// ENDPOINTS:
//   - GET  /dns/stats                      - Get DNS statistics
//   - GET  /dns/powerdns/status            - Get PowerDNS server status
//   - POST /dns/powerdns/reload            - Reload PowerDNS configuration
//   - GET  /dns/:domainId/records          - Get PowerDNS records for domain
//   - GET  /dns/:domainId/export           - Export zone file
//   - POST /dns/:domainId/increment-serial - Increment SOA serial number
func RegisterDNSRoutes(rg *gin.RouterGroup, ctrl *controllers.DNSController) {
	dns := rg.Group("/dns")
	dns.Use(middleware.AuthMiddleware())
	{
		// Stats & Status
		dns.GET("/stats", ctrl.GetDNSStats)
		dns.GET("/powerdns/status", ctrl.GetPowerDNSStatus)

		// PowerDNS Management
		dns.POST("/powerdns/reload", ctrl.ReloadPowerDNS)

		// Domain-specific DNS Operations
		dns.GET("/:domainId/records", ctrl.GetPowerDNSRecords)
		dns.GET("/:domainId/export", ctrl.ExportZone)
		dns.POST("/:domainId/increment-serial", ctrl.IncrementSOASerial)
	}
}
