package middleware

import (
	"cloudku-server/config"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := config.AppConfig.FrontendURL

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, HEAD, PATCH, OPTIONS, GET, PUT, DELETE")
		c.Header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")

		// SECURITY: Add headers to prevent common attacks (OWASP best practices)
		c.Header("X-Content-Type-Options", "nosniff") // Prevent MIME sniffing
		c.Header("X-Frame-Options", "DENY")           // Prevent clickjacking
		c.Header("X-XSS-Protection", "1; mode=block") // Enable browser XSS filter
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
