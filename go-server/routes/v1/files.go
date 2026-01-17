package v1

import (
	"cloudku-server/controllers"
	"cloudku-server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterFileRoutes sets up file manager routes
//
// # All routes require authentication - file operations are sensitive
//
// ENDPOINTS:
//   - GET    /files/list        - List files in directory
//   - GET    /files/stats       - Get storage statistics
//   - POST   /files/upload      - Upload file
//   - GET    /files/download    - Download file
//   - DELETE /files/delete      - Delete file/folder
//   - POST   /files/folder      - Create folder
//   - GET    /files/read        - Read file content
//   - PUT    /files/update      - Update file content
//   - PUT    /files/rename      - Rename file/folder
//   - POST   /files/copy        - Copy files
//   - POST   /files/move        - Move files
//   - POST   /files/extract     - Extract ZIP archive
//   - POST   /files/compress    - Compress to ZIP
//   - POST   /files/git-clone   - Clone Git repository
//   - PUT    /files/permissions - Change file permissions
func RegisterFileRoutes(rg *gin.RouterGroup, ctrl *controllers.FileController) {
	files := rg.Group("/files")
	files.Use(middleware.AuthMiddleware())
	{
		// List & Stats
		files.GET("/list", ctrl.ListFiles)
		files.GET("/stats", ctrl.GetStats)

		// CRUD Operations
		files.POST("/upload", ctrl.UploadFile)
		files.GET("/download", ctrl.DownloadFile)
		files.DELETE("/delete", ctrl.DeleteFile)
		files.POST("/folder", ctrl.CreateFolder)

		// Read & Write Operations
		files.GET("/read", ctrl.ReadFile)
		files.PUT("/update", ctrl.UpdateFile)
		files.PUT("/rename", ctrl.RenameFile)

		// Batch Operations
		files.POST("/copy", ctrl.CopyFiles)
		files.POST("/move", ctrl.MoveFiles)

		// Archive Operations
		files.POST("/extract", ctrl.ExtractZip)
		files.POST("/compress", ctrl.CompressFiles)

		// Git Integration
		files.POST("/git-clone", ctrl.GitClone)

		// Permissions Management
		files.PUT("/permissions", ctrl.ChangePermissions)
	}
}
