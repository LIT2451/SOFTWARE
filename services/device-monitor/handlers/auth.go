package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "lit-software-key-2026"))

// Regex check username: only alphanumeric and underscores, 4-20 chars
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{4,20}$`)

func validatePasswordStrength(password string) error {
	if len(password) < 6 {
		return fmt.Errorf("Mật khẩu phải chứa ít nhất 6 ký tự")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		case char >= '!' && char <= '~':
			hasSpecial = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return fmt.Errorf("Mật khẩu phải chứa cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt")
	}
	return nil
}

func logLoginAttempt(userID *string, username, ip, ua, status, reason string) {
	query := `INSERT INTO login_logs (user_id, username, ip_address, user_agent, status, reason) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := db.DB.Exec(query, userID, username, ip, ua, status, reason)
	if err != nil {
		fmt.Printf("Lỗi ghi nhận lịch sử đăng nhập: %v\n", err)
	}
}

func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Dữ liệu đầu vào không hợp lệ"}})
		return
	}

	// Clean username
	input.Username = strings.TrimSpace(input.Username)
	if !usernameRegex.MatchString(input.Username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_USERNAME", "message": "Tên đăng nhập chỉ gồm chữ cái, số và dấu gạch dưới, dài từ 4-20 ký tự"}})
		return
	}

	// Validate Password
	if err := validatePasswordStrength(input.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "WEAK_PASSWORD", "message": err.Error()}})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi mã hóa mật khẩu"}})
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
			c.JSON(http.StatusConflict, gin.H{"error": gin.H{"code": "USER_EXISTS", "message": "Tên đăng nhập hoặc email đã tồn tại"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi hệ thống khi đăng ký"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": user})
}

func Login(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Dữ liệu đăng nhập không hợp lệ"}})
		return
	}

	var user models.User
	var passwordHash sql.NullString
	query := `SELECT id, username, password_hash, role, email, created_at, updated_at FROM users WHERE username = $1`
	err := db.DB.QueryRow(query, input.Username).
		Scan(&user.ID, &user.Username, &passwordHash, &user.Role, &user.Email, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			logLoginAttempt(nil, input.Username, ip, ua, "failed_username", "Không tìm thấy tên đăng nhập")
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Tên đăng nhập hoặc mật khẩu không đúng"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi hệ thống khi đăng nhập"}})
		return
	}

	if !passwordHash.Valid {
		logLoginAttempt(&user.ID, input.Username, ip, ua, "failed_password", "Tài khoản liên kết OAuth chưa thiết lập mật khẩu")
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Tài khoản này được đăng ký bằng OAuth, vui lòng đăng nhập qua Google hoặc GitHub"}})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(passwordHash.String), []byte(input.Password))
	if err != nil {
		logLoginAttempt(&user.ID, input.Username, ip, ua, "failed_password", "Sai mật khẩu")
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Tên đăng nhập hoặc mật khẩu không đúng"}})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi tạo mã thông báo"}})
		return
	}

	logLoginAttempt(&user.ID, input.Username, ip, ua, "success", "Đăng nhập thành công bằng mật khẩu")

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}

// OAuthLogin handles registration and login via third-party OAuth providers
func OAuthLogin(c *gin.Context) {
	var input struct {
		Provider string `json:"provider" binding:"required"`
		Token    string `json:"token" binding:"required"`
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Dữ liệu OAuth không hợp lệ"}})
		return
	}

	if input.Provider != "google" && input.Provider != "github" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_PROVIDER", "message": "Nhà cung cấp OAuth không được hỗ trợ"}})
		return
	}

	var oauthID string
	var email string
	var name string

	// Verify OAuth token with third-party servers
	if input.Provider == "google" {
		req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Không thể kết nối đến máy chủ Google OAuth"}})
			return
		}
		req.Header.Set("Authorization", "Bearer "+input.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "OAUTH_FAILED", "message": "Mã xác thực Google không hợp lệ hoặc đã hết hạn"}})
			return
		}
		defer resp.Body.Close()

		var googleUser struct {
			Sub   string `json:"sub"`
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi đọc dữ liệu người dùng Google"}})
			return
		}

		oauthID = googleUser.Sub
		email = googleUser.Email
		name = googleUser.Name
	} else if input.Provider == "github" {
		req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Không thể kết nối đến máy chủ GitHub OAuth"}})
			return
		}
		req.Header.Set("Authorization", "Bearer "+input.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "OAUTH_FAILED", "message": "Mã xác thực GitHub không hợp lệ hoặc đã hết hạn"}})
			return
		}
		defer resp.Body.Close()

		var githubUser struct {
			ID    int64  `json:"id"`
			Login string `json:"login"`
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi đọc dữ liệu người dùng GitHub"}})
			return
		}

		oauthID = fmt.Sprintf("%d", githubUser.ID)
		email = githubUser.Email
		if email == "" {
			email = fmt.Sprintf("%s@github.oauth.lit", githubUser.Login)
		}
		name = githubUser.Name
		if name == "" {
			name = githubUser.Login
		}
	}

	var user models.User
	// Check if user already exists with this OAuth provider
	query := `SELECT id, username, role, email, oauth_provider, oauth_id, created_at, updated_at FROM users WHERE oauth_provider = $1 AND oauth_id = $2`
	err := db.DB.QueryRow(query, input.Provider, oauthID).
		Scan(&user.ID, &user.Username, &user.Role, &user.Email, &user.OAuthProvider, &user.OAuthID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			// User does not exist, auto-register
			// Generate clean username from name/login
			cleanUsername := regexp.MustCompile(`[^a-zA-Z0-9_]`).ReplaceAllString(name, "")
			if len(cleanUsername) < 4 {
				cleanUsername = fmt.Sprintf("user_%s_%s", input.Provider, oauthID[:4])
			}
			if len(cleanUsername) > 20 {
				cleanUsername = cleanUsername[:20]
			}

			// Handle username collision
			var exists bool
			checkQuery := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`
			_ = db.DB.QueryRow(checkQuery, cleanUsername).Scan(&exists)
			if exists {
				cleanUsername = fmt.Sprintf("%s_%s", cleanUsername[:15], oauthID[:4])
			}

			insertQuery := `INSERT INTO users (username, email, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4) RETURNING id, role, created_at, updated_at`
			err = db.DB.QueryRow(insertQuery, cleanUsername, email, input.Provider, oauthID).
				Scan(&user.ID, &user.Role, &user.CreatedAt, &user.UpdatedAt)
			if err != nil {
				logLoginAttempt(nil, cleanUsername, ip, ua, "oauth_failed", "Lỗi tạo tài khoản mới qua OAuth")
				c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi tạo người dùng mới từ OAuth"}})
				return
			}
			user.Username = cleanUsername
			user.Email = email
			user.OAuthProvider = input.Provider
			user.OAuthID = oauthID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi truy vấn cơ sở dữ liệu"}})
			return
		}
	}

	// Issue token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Lỗi tạo mã thông báo"}})
		return
	}

	logLoginAttempt(&user.ID, user.Username, ip, ua, "success", "Đăng nhập thành công bằng OAuth: "+input.Provider)

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
