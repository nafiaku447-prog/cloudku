package v1

import (
	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterAuthRoutes sets up authentication routes
//
// PUBLIC ENDPOINTS (no authentication required):
//   - POST /auth/register     - Email/password registration
//   - POST /auth/login        - Email/password login
//   - POST /auth/google       - Google OAuth initiation
//   - POST /auth/google/callback - Google OAuth callback
//   - POST /auth/github       - GitHub OAuth login
//
// PROTECTED ENDPOINTS (requires valid JWT):
//   - GET    /auth/me         - Get current authenticated user
//   - DELETE /auth/me         - Delete current user account
func RegisterAuthRoutes(rg *gin.RouterGroup, ctrl *controllers.AuthController) {
	auth := rg.Group("/auth")
	{
		// ==========================================
		// PUBLIC AUTH ROUTES
		// These endpoints are accessible without authentication
		// Rate limiting is recommended for production
		// ==========================================
		auth.POST("/register", ctrl.Register)
		auth.POST("/login", ctrl.Login)
		auth.POST("/google", ctrl.GoogleAuth)
		auth.POST("/google/callback", ctrl.GoogleAuthCallback)
		auth.POST("/github", ctrl.GithubAuth)

		// ==========================================
		// PROTECTED AUTH ROUTES
		// All routes below require valid JWT token
		// ==========================================
		protected := auth.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/me", ctrl.GetMe)
			protected.DELETE("/me", ctrl.DeleteAccount)
		}
	}
}
