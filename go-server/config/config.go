package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string

	// JWT
	JWTSecret    string
	JWTExpiresIn string

	// Frontend
	FrontendURL string

	// MySQL Admin Config
	MySQLHost          string
	MySQLPort          string
	MySQLAdminUser     string
	MySQLAdminPassword string

	// OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string
	GithubClientID     string
	GithubClientSecret string
}

// AppConfig is the global configuration instance
var AppConfig *Config

// Load loads configuration from environment variables
func Load() *Config {
	envLoaded := false

	// Get current working directory
	cwd, _ := os.Getwd()

	// Load .env file
	envPath := filepath.Join(cwd, ".env")

	// Check if file exists first
	if _, err := os.Stat(envPath); err == nil {
		if err := godotenv.Load(envPath); err == nil {
			log.Printf("✅ Loaded environment from: %s", envPath)
			envLoaded = true
		}
	}

	if !envLoaded {
		log.Println("⚠️ No .env file found, using system environment variables")
	}

	AppConfig = &Config{
		// Server
		Port:        getEnv("PORT", "3001"),
		Environment: getEnv("NODE_ENV", "development"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", ""),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBName:      getEnv("DB_NAME", "hostmodern"),

		// JWT
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-this"),
		JWTExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),

		// Frontend
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),

		// MySQL Admin Config
		MySQLHost:          getEnv("MYSQL_HOST", "localhost"),
		MySQLPort:          getEnv("MYSQL_PORT", "3306"),
		MySQLAdminUser:     getEnv("MYSQL_ADMIN_USER", "root"),
		MySQLAdminPassword: getEnv("MYSQL_ADMIN_PASSWORD", ""),

		// OAuth
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURI:  getEnv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback"),
		GithubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GithubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
	}

	return AppConfig
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
