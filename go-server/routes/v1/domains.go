package v1

import (
	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterDomainRoutes sets up domain management routes
//
// # All routes require authentication
//
// ENDPOINTS:
//   - GET    /domains           - Get all domains for user
//   - GET    /domains/:id       - Get domain details
//   - POST   /domains           - Create new domain
//   - PUT    /domains/:id       - Update domain
//   - DELETE /domains/:id       - Delete domain
//   - POST   /domains/:id/verify - Verify domain DNS
//
// DNS Records (nested under domain):
//   - GET    /domains/:id/dns           - Get DNS records
//   - POST   /domains/:id/dns           - Create DNS record
//   - DELETE /domains/:id/dns/:recordId - Delete DNS record
func RegisterDomainRoutes(rg *gin.RouterGroup, ctrl *controllers.DomainController) {
	domains := rg.Group("/domains")
	domains.Use(middleware.AuthMiddleware())
	{
		// CRUD Operations
		domains.GET("", ctrl.GetDomains)
		domains.GET("/:id", ctrl.GetDomain)
		domains.POST("", ctrl.CreateDomain)
		domains.PUT("/:id", ctrl.UpdateDomain)
		domains.DELETE("/:id", ctrl.DeleteDomain)

		// Domain Verification
		domains.POST("/:id/verify", ctrl.VerifyDomain)

		// DNS Records (nested under domain for RESTful design)
		domains.GET("/:id/dns", ctrl.GetDNSRecords)
		domains.POST("/:id/dns", ctrl.CreateDNSRecord)
		domains.DELETE("/:id/dns/:recordId", ctrl.DeleteDNSRecord)
	}
}
