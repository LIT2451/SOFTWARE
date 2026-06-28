package main

import (
	"log"
	"net/http"
	"os"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/handlers"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load config tu file .env neu co
	_ = godotenv.Load()

	// Khoi tao ket noi Database
	db.InitDB()

	// Cau hinh router
	r := gin.Default()

	// Middleware chong loi CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Dang ky cac API Authentication
	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// API endpoint nhan thong tin tu Agent
		agent := v1.Group("/agent")
		{
			agent.POST("/enroll", handlers.EnrollDevice)
			agent.POST("/report", handlers.ReportMetrics)
			agent.POST("/status", handlers.UpdateStatus)
		}
		
		// Endpoint kiem tra trang thai he thong
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server bat dau lang nghe tai cong %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Khong the khoi chay server: %v", err)
	}
}
