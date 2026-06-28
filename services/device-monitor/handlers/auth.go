package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "lit-software-key-2026"))

func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required,min=4,max=50"`
		Password string `json:"password" binding:"required,min=6"`
		Email    string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu dau vao khong hop le"}})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi ma hoa mat khau"}})
		return
	}

	query := `INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, role, created_at, updated_at`
	var user models.User
	user.Username = input.Username
	user.Email = input.Email

	err = db.DB.QueryRow(query, input.Username, string(hashedPassword), input.Email).
		Scan(&user.ID, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": gin.H{"code": "USER_EXISTS", "message": "Ten dang nhap hoac email da ton tai"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi he thong khi dang ky"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": user})
}

func Login(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu dang nhap khong hop le"}})
		return
	}

	var user models.User
	query := `SELECT id, username, password_hash, role, email, created_at, updated_at FROM users WHERE username = $1`
	err := db.DB.QueryRow(query, input.Username).
		Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Email, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Ten dang nhap hoac mat khau khong dung"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi he thong khi dang nhap"}})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Ten dang nhap hoac mat khau khong dung"}})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi tao ma thong bao"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
