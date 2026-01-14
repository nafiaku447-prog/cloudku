package middleware

import (
	"net/http"
	"strconv"

	"cloudku-server/models"
	"cloudku-server/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT token and sets user info in context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		tokenString := utils.ExtractTokenFromHeader(authHeader)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				// SECURITY: Don't expose detailed error info (was exposing err.Error())
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// SECURITY: Use request context for proper timeout/cancellation propagation
		// Was using context.Background() which ignores request timeouts
		user, err := models.FindUserByID(c.Request.Context(), claims.UserID)
		if err != nil {
			// SECURITY: Generic error message to prevent user enumeration attacks
			// Was: fmt.Sprintf("User not found (ID: %d): %v", claims.UserID, err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token",
			})
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "User account is deactivated",
			})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", user.ID)
		c.Set("userEmail", user.Email)
		c.Set("user", user)

		c.Next()
	}
}

// GetUserID gets the user ID from context
func GetUserID(c *gin.Context) int {
	userID, exists := c.Get("userID")
	if !exists {
		return 0
	}
	return userID.(int)
}

// GetUserIDString gets the user ID as string from context
func GetUserIDString(c *gin.Context) string {
	return strconv.Itoa(GetUserID(c))
}

// GetUser gets the user from context
func GetUser(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	return user.(*models.User)
}
