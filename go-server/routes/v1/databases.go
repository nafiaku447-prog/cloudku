package v1

import (
	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterDatabaseRoutes sets up database management routes
//
// # All routes require authentication - database operations are highly sensitive
//
// ENDPOINTS:
//   - GET    /databases              - Get all databases for user
//   - GET    /databases/stats        - Get database statistics
//   - POST   /databases              - Create new database
//   - DELETE /databases/:id          - Delete database
//   - PUT    /databases/:id/password - Change database password
//   - PUT    /databases/:id/size     - Update database size limit
//   - GET    /databases/:id/schema   - Get database schema (for SQL terminal)
//   - POST   /databases/:id/query    - Execute SQL query (SQL terminal)
func RegisterDatabaseRoutes(rg *gin.RouterGroup, ctrl *controllers.DatabaseController) {
	databases := rg.Group("/databases")
	databases.Use(middleware.AuthMiddleware())
	{
		// List & Stats
		databases.GET("", ctrl.GetDatabases)
		databases.GET("/stats", ctrl.GetStats)

		// CRUD Operations
		databases.POST("", ctrl.CreateDatabase)
		databases.DELETE("/:id", ctrl.DeleteDatabase)

		// Database Management
		databases.PUT("/:id/password", ctrl.ChangePassword)
		databases.PUT("/:id/size", ctrl.UpdateSize)

		// Schema & SQL Query (SQL Terminal feature)
		databases.GET("/:id/schema", ctrl.GetSchema)
		databases.POST("/:id/query", ctrl.ExecuteQuery)
	}
}
