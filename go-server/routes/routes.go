package routes

import (
	"net/http"
	"strings"
	"time"

	v1 "cloudku-server/routes/v1"

	"github.com/gin-gonic/gin"
)

// API Version Constants
const (
	CurrentAPIVersion = "v1"
	APIVersionPrefix  = "/api"
)

// APIVersion represents version information for API discovery
type APIVersion struct {
	Version    string `json:"version"`
	Status     string `json:"status"`
	Deprecated bool   `json:"deprecated"`
	BasePath   string `json:"base_path"`
}

// SetupRoutes configures all API routes with versioning
//
// Route Structure:
//
//	/health        - Health check (version agnostic)
//	/api           - API info
//	/api/versions  - List available API versions
//	/api/v1/*      - V1 API endpoints
//
// Future versions can be added without breaking existing clients:
//
//	/api/v2/*      - V2 API endpoints (when needed)
func SetupRoutes(r *gin.Engine) {
	// ==========================================
	// VERSION-AGNOSTIC ENDPOINTS
	// ==========================================

	// Health check - always accessible
	r.GET("/health", healthHandler)

	// API discovery endpoints
	r.GET("/api", apiInfoHandler)
	r.GET("/api/versions", apiVersionsHandler)

	// ==========================================
	// VERSIONED API ROUTES
	// ==========================================
	api := r.Group(APIVersionPrefix)
	{
		// V1 Routes - Current stable version
		v1.RegisterRoutes(api.Group("/v1"))

		// Future versions can be added here without breaking v1:
		// v2.RegisterRoutes(api.Group("/v2"))
	}

	// ==========================================
	// ERROR HANDLERS
	// ==========================================
	// ==========================================
	// STATIC FILES (FRONTEND)
	// ==========================================
	// Serve static files from dist directory
	// Note: "../dist" assumes the server is run from the go-server directory
	r.Static("/assets", "../dist/assets")
	r.StaticFile("/favicon.ico", "../dist/favicon.ico")

	// ==========================================
	// ERROR HANDLERS / SPA CATCH-ALL
	// ==========================================
	// Handle 404s and SPA routing
	r.NoRoute(func(c *gin.Context) {
		// If the request path starts with /api, return a JSON 404 (API usage)
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			notFoundHandler(c)
			return
		}

		// Otherwise, serve index.html to let React Router handle the route (SPA usage)
		// This allows refreshing pages like /dashboard, /settings, etc.
		c.File("../dist/index.html")
	})
}

// healthHandler returns server health status
func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     "CloudKu API is running (Go Server)",
		"timestamp":   time.Now().Format(time.RFC3339),
		"api_version": CurrentAPIVersion,
	})
}

// apiInfoHandler returns API information
func apiInfoHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"message":         "CloudKu API",
		"current_version": CurrentAPIVersion,
		"documentation":   "/api/versions",
		"endpoints": gin.H{
			"v1": "/api/v1",
		},
	})
}

// apiVersionsHandler returns available API versions for discovery
func apiVersionsHandler(c *gin.Context) {
	versions := []APIVersion{
		{
			Version:    "v1",
			Status:     "stable",
			Deprecated: false,
			BasePath:   "/api/v1",
		},
		// Future versions example:
		// {
		//     Version:    "v2",
		//     Status:     "beta",
		//     Deprecated: false,
		//     BasePath:   "/api/v2",
		// },
	}

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"current_version": CurrentAPIVersion,
		"versions":        versions,
	})
}

// notFoundHandler handles 404 errors with helpful message
func notFoundHandler(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Endpoint not found",
		"hint":    "Check /api/versions for available API versions and endpoints",
	})
}
