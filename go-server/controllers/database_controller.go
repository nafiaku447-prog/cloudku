package controllers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"cloudku-server/database"
	"cloudku-server/middleware"
	"cloudku-server/services"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

// DatabaseController handles database management endpoints
type DatabaseController struct{}

// NewDatabaseController creates a new database controller
func NewDatabaseController() *DatabaseController {
	return &DatabaseController{}
}

// UserDatabase represents a user's database
type UserDatabase struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	DatabaseName string    `json:"database_name"`
	DatabaseUser string    `json:"database_user"`
	DatabaseType string    `json:"database_type"`
	Charset      string    `json:"charset"`
	Collation    string    `json:"collation"`
	SizeMB       float64   `json:"size_mb"`
	CreatedAt    time.Time `json:"created_at"`
}

// GetDatabases returns all databases for the user
func (dc *DatabaseController) GetDatabases(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ctx := context.Background()

	query := `
		SELECT id, user_id, database_name, database_user, database_type, 
		       charset, "collation", size_mb, created_at
		FROM user_databases
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(ctx, query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch databases",
		})
		return
	}
	defer rows.Close()

	var databases []UserDatabase
	for rows.Next() {
		var db UserDatabase
		if err := rows.Scan(&db.ID, &db.UserID, &db.DatabaseName, &db.DatabaseUser,
			&db.DatabaseType, &db.Charset, &db.Collation, &db.SizeMB, &db.CreatedAt); err != nil {
			continue
		}
		databases = append(databases, db)
	}

	// Get stats
	var totalDatabases, mysqlCount, postgresCount int
	var totalSize float64

	for _, db := range databases {
		totalDatabases++
		totalSize += db.SizeMB
		if db.DatabaseType == "mysql" {
			mysqlCount++
		} else {
			postgresCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"databases": databases,
		"stats": gin.H{
			"totalDatabases": totalDatabases,
			"mysqlCount":     mysqlCount,
			"postgresCount":  postgresCount,
			"totalSizeMB":    totalSize,
		},
	})
}

// CreateDatabaseRequest represents create database request
type CreateDatabaseRequest struct {
	DatabaseName     string `json:"databaseName" binding:"required"`
	DatabaseUser     string `json:"databaseUser" binding:"required"`
	DatabasePassword string `json:"databasePassword" binding:"required"`
	DatabaseType     string `json:"databaseType" binding:"required"`
	Charset          string `json:"charset"`
	Collation        string `json:"collation"`
}

// CreateDatabase creates a new database
func (dc *DatabaseController) CreateDatabase(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateDatabaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Missing required fields",
		})
		return
	}

	ctx := context.Background()

	// Default charset and collation
	charset := req.Charset
	collation := req.Collation
	if charset == "" {
		if req.DatabaseType == "mysql" {
			charset = "utf8mb4"
			collation = "utf8mb4_unicode_ci"
		} else {
			// PostgreSQL placeholder
			charset = "UTF8"
			collation = "en_US.UTF-8"
		}
	}

	// 1. Create in MySQL Server (if type is mysql)
	if req.DatabaseType == "mysql" {
		mysqlService := services.NewMySQLService()
		if err := mysqlService.CreateDatabase(ctx, req.DatabaseName, req.DatabaseUser, req.DatabasePassword); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create MySQL database",
				"error":   err.Error(),
			})
			return
		}
	}

	// 2. Store metadata in Postgres
	query := `
		INSERT INTO user_databases (user_id, database_name, database_user, database_type, charset, "collation")
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, database_name, database_user, database_type, charset, "collation", size_mb, created_at
	`

	var db UserDatabase
	err := database.DB.QueryRow(ctx, query, userID, req.DatabaseName, req.DatabaseUser,
		req.DatabaseType, charset, collation).Scan(
		&db.ID, &db.UserID, &db.DatabaseName, &db.DatabaseUser,
		&db.DatabaseType, &db.Charset, &db.Collation, &db.SizeMB, &db.CreatedAt,
	)
	if err != nil {
		// If metadata storage fails, we should probably rollback MySQL changes,
		// but for now logging/error is enough for MVP.
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to track database",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":  true,
		"message":  "Database created successfully",
		"database": db,
	})
}

// DeleteDatabase deletes a database
func (dc *DatabaseController) DeleteDatabase(c *gin.Context) {
	userID := middleware.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	ctx := context.Background()

	// 1. Get database details to delete from MySQL
	var dbName, dbUser, dbType string
	err = database.DB.QueryRow(ctx, "SELECT database_name, database_user, database_type FROM user_databases WHERE id = $1 AND user_id = $2", id, userID).Scan(&dbName, &dbUser, &dbType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Database not found",
		})
		return
	}

	// 2. Delete from MySQL
	if dbType == "mysql" {
		mysqlService := services.NewMySQLService()
		// Best effort, ignore errors for now or log them
		_ = mysqlService.DeleteDatabase(ctx, dbName, dbUser)
	}

	// 3. Delete metadata
	query := `DELETE FROM user_databases WHERE id = $1 AND user_id = $2`
	_, err = database.DB.Exec(ctx, query, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete database record",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Database deleted successfully",
	})
}

// ChangePasswordRequest represents change password request
type ChangePasswordRequest struct {
	NewPassword string `json:"newPassword" binding:"required"`
}

// ChangePassword changes database user password
func (dc *DatabaseController) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "New password is required",
		})
		return
	}

	ctx := context.Background()

	// Verify ownership and get details
	var dbName, dbUser, dbType string
	query := `SELECT database_name, database_user, database_type FROM user_databases WHERE id = $1 AND user_id = $2`
	err = database.DB.QueryRow(ctx, query, id, userID).Scan(&dbName, &dbUser, &dbType)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Database not found",
		})
		return
	}

	// Execute actual password change on MySQL
	if dbType == "mysql" {
		mysqlService := services.NewMySQLService()
		if err := mysqlService.UpdatePassword(ctx, dbUser, req.NewPassword); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to change password on server",
				"error":   err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// UpdateSize updates database size
func (dc *DatabaseController) UpdateSize(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	ctx := context.Background()

	// In production, this would query actual database size
	// For now, we return a simulated size
	sizeMB := 10.5 // Simulated size

	query := `UPDATE user_databases SET size_mb = $1 WHERE id = $2`
	database.DB.Exec(ctx, query, sizeMB, id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"sizeMB":  sizeMB,
	})
}

// GetStats returns database statistics
func (dc *DatabaseController) GetStats(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ctx := context.Background()

	var totalDatabases, mysqlCount, postgresCount int
	var totalSize float64

	query := `SELECT COUNT(*) FROM user_databases WHERE user_id = $1`
	database.DB.QueryRow(ctx, query, userID).Scan(&totalDatabases)

	query = `SELECT COUNT(*) FROM user_databases WHERE user_id = $1 AND database_type = 'mysql'`
	database.DB.QueryRow(ctx, query, userID).Scan(&mysqlCount)

	query = `SELECT COUNT(*) FROM user_databases WHERE user_id = $1 AND database_type = 'postgresql'`
	database.DB.QueryRow(ctx, query, userID).Scan(&postgresCount)

	query = `SELECT COALESCE(SUM(size_mb), 0) FROM user_databases WHERE user_id = $1`
	database.DB.QueryRow(ctx, query, userID).Scan(&totalSize)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": gin.H{
			"totalDatabases": totalDatabases,
			"mysqlCount":     mysqlCount,
			"postgresCount":  postgresCount,
			"totalSizeMB":    totalSize,
		},
	})
}
