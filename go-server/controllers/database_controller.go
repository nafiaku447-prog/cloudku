package controllers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"cloudku-server/dto"
	"cloudku-server/middleware"
	"cloudku-server/services"

	"github.com/gin-gonic/gin"
)

// DatabaseController handles database management endpoints
// This is a thin controller - it only handles HTTP concerns
type DatabaseController struct {
	service *services.DatabaseService
}

// NewDatabaseController creates a new database controller
func NewDatabaseController() *DatabaseController {
	return &DatabaseController{
		service: services.NewDatabaseService(),
	}
}

// GetDatabases returns all databases for the user
func (dc *DatabaseController) GetDatabases(c *gin.Context) {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	result := dc.service.GetDatabases(ctx, userID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch databases",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"databases": result.Databases,
		"stats": gin.H{
			"totalDatabases": result.Stats.TotalDatabases,
			"mysqlCount":     result.Stats.MySQLCount,
			"postgresCount":  result.Stats.PostgresCount,
			"totalSizeMB":    result.Stats.TotalSizeMB,
		},
	})
}

// CreateDatabase creates a new database
func (dc *DatabaseController) CreateDatabase(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req dto.CreateDatabaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Missing required fields",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	result := dc.service.CreateDatabase(ctx, userID, req)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create database",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":  true,
		"message":  "Database created successfully",
		"database": result.Database,
	})
}

// DeleteDatabase deletes a database
func (dc *DatabaseController) DeleteDatabase(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	if err := dc.service.DeleteDatabase(ctx, userID, id); err != nil {
		status := http.StatusInternalServerError
		message := "Failed to delete database"

		if err == dto.ErrDatabaseNotFound {
			status = http.StatusNotFound
			message = "Database not found"
		}

		c.JSON(status, gin.H{
			"success": false,
			"message": message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Database deleted successfully",
	})
}

// ChangePassword changes database user password
func (dc *DatabaseController) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "New password is required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := dc.service.ChangePassword(ctx, userID, id, req.NewPassword); err != nil {
		status := http.StatusInternalServerError
		message := "Failed to change password on server"

		if err == dto.ErrDatabaseNotFound {
			status = http.StatusNotFound
			message = "Database not found"
		}

		c.JSON(status, gin.H{
			"success": false,
			"message": message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// UpdateSize updates database size
func (dc *DatabaseController) UpdateSize(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	sizeMB, err := dc.service.UpdateSize(ctx, userID, id)
	if err != nil {
		if err == dto.ErrDatabaseNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Database not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update size",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"sizeMB":  sizeMB,
	})
}

// GetStats returns database statistics
func (dc *DatabaseController) GetStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	stats, err := dc.service.GetStats(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get stats",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": gin.H{
			"totalDatabases": stats.TotalDatabases,
			"mysqlCount":     stats.MySQLCount,
			"postgresCount":  stats.PostgresCount,
			"totalSizeMB":    stats.TotalSizeMB,
		},
	})
}

// ExecuteQuery executes a SQL query on user's database
func (dc *DatabaseController) ExecuteQuery(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	var req dto.ExecuteQueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Query is required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	result := dc.service.ExecuteQuery(ctx, userID, id, req.Query, req.Password)
	if result.Error != nil {
		status := http.StatusBadRequest

		if result.Error == dto.ErrDatabaseNotFound {
			status = http.StatusNotFound
		}

		c.JSON(status, gin.H{
			"success": false,
			"message": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"columns": result.Columns,
		"rows":    result.Rows,
		"message": result.Message,
	})
}

// GetSchema returns the database schema
func (dc *DatabaseController) GetSchema(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid database ID",
		})
		return
	}

	// Password might be passed via query param or header (optional)
	// Ideally should be in body but for GET request query param is standard for simple auth
	password := c.Query("password")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	schema := dc.service.GetDatabaseSchema(ctx, userID, id, password)
	if schema == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch schema",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"schema":  schema,
	})
}
