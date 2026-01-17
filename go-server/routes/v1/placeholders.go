package v1

import (
	"net/http"

	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterPlaceholderRoutes sets up placeholder routes for features
// that are planned but not yet fully implemented
//
// # All routes require authentication
//
// PLACEHOLDER GROUPS:
//   - /hosting         - Website hosting management
//   - /websites        - Website CRUD operations
//   - /emails          - Email account management
//   - /invoices        - Billing invoices
//   - /tickets         - Support tickets
//   - /payment-methods - Payment method management
func RegisterPlaceholderRoutes(rg *gin.RouterGroup) {
	// ==========================================
	// HOSTING ROUTES
	// ==========================================
	hosting := rg.Group("/hosting")
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
	// WEBSITES ROUTES
	// ==========================================
	websites := rg.Group("/websites")
	websites.Use(middleware.AuthMiddleware())
	{
		websites.GET("", placeholderList)
		websites.POST("", placeholderCreate("Website"))
	}

	// ==========================================
	// EMAILS ROUTES
	// ==========================================
	emails := rg.Group("/emails")
	emails.Use(middleware.AuthMiddleware())
	{
		emails.GET("", placeholderList)
		emails.POST("", placeholderCreate("Email"))
	}

	// ==========================================
	// INVOICES ROUTES
	// ==========================================
	invoices := rg.Group("/invoices")
	invoices.Use(middleware.AuthMiddleware())
	{
		invoices.GET("", placeholderList)
	}

	// ==========================================
	// TICKETS ROUTES
	// ==========================================
	tickets := rg.Group("/tickets")
	tickets.Use(middleware.AuthMiddleware())
	{
		tickets.GET("", placeholderList)
		tickets.POST("", placeholderCreate("Ticket"))
	}

	// ==========================================
	// PAYMENT METHODS ROUTES
	// ==========================================
	paymentMethods := rg.Group("/payment-methods")
	paymentMethods.Use(middleware.AuthMiddleware())
	{
		paymentMethods.GET("", placeholderList)
	}
}

// placeholderList returns empty list for placeholder routes
func placeholderList(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    []interface{}{},
	})
}

// placeholderCreate returns success message for placeholder create operations
func placeholderCreate(resource string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    nil,
			"message": resource + " created",
		})
	}
}
