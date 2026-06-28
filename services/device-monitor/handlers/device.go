package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/models"
	"github.com/gin-gonic/gin"
)

// Enroll (Dang ky thiet bi tu Agent)
func EnrollDevice(c *gin.Context) {
	var input struct {
		HardwareUUID string `json:"hardware_uuid" binding:"required"`
		Name         string `json:"name" binding:"required"`
		Hostname     string `json:"hostname" binding:"required"`
		OSType       string `json:"os_type" binding:"required"`
		OSName       string `json:"os_name" binding:"required"`
		OSVersion    string `json:"os_version"`
		CPUModel     string `json:"cpu_model" binding:"required"`
		CPUCores     int    `json:"cpu_cores" binding:"required"`
		CPUThreads   int    `json:"cpu_threads" binding:"required"`
		RAMTotal     int64  `json:"ram_total" binding:"required"`
		DiskTotal    int64  `json:"disk_total" binding:"required"`
		IPAddress    string `json:"ip_address"`
		WorkspaceID  string `json:"workspace_id" binding:"required"`
		SecretKey    string `json:"secret_key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu dang ky thiet bi khong hop le"}})
		return
	}

	// Vi chung ta chua co giao dien chon owner cho cong dong o buoc enroll nay
	// Mac dinh neu khong tim thay owner truoc do, ta lay ID cua user dau tien (admin) lam owner.
	var ownerID string
	err := db.DB.QueryRow(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "He thong chua co tai khoan quan tri"}})
		return
	}

	query := `
		INSERT INTO devices (
			hardware_uuid, owner_id, name, hostname, os_type, os_name, os_version, 
			cpu_model, cpu_cores, cpu_threads, ram_total, disk_total, ip_address, 
			secret_key, workspace_id, status, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'online', CURRENT_TIMESTAMP)
		ON CONFLICT (hardware_uuid) DO UPDATE SET
			name = EXCLUDED.name,
			hostname = EXCLUDED.hostname,
			os_version = EXCLUDED.os_version,
			cpu_model = EXCLUDED.cpu_model,
			cpu_cores = EXCLUDED.cpu_cores,
			cpu_threads = EXCLUDED.cpu_threads,
			ram_total = EXCLUDED.ram_total,
			disk_total = EXCLUDED.disk_total,
			ip_address = EXCLUDED.ip_address,
			status = 'online',
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, owner_id, name, status, created_at, updated_at
	`

	var device models.Device
	err = db.DB.QueryRow(
		query,
		input.HardwareUUID, ownerID, input.Name, input.Hostname, input.OSType, input.OSName, input.OSVersion,
		input.CPUModel, input.CPUCores, input.CPUThreads, input.RAMTotal, input.DiskTotal, input.IPAddress,
		input.SecretKey, input.WorkspaceID,
	).Scan(&device.ID, &device.OwnerID, &device.Name, &device.Status, &device.CreatedAt, &device.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi dang ky thiet bi: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"device": device})
}

// Report (Gui metrics dinh ky tu Agent)
func ReportMetrics(c *gin.Context) {
	var input struct {
		DeviceID  string  `json:"device_id" binding:"required"`
		CPUUsage  float64 `json:"cpu_usage"`
		RAMUsage  float64 `json:"ram_usage"`
		DiskUsage float64 `json:"disk_usage"`
		NetworkRX int64   `json:"network_rx"`
		NetworkTX int64   `json:"network_tx"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu metrics khong hop le"}})
		return
	}

	secretKey := c.GetHeader("X-Agent-Secret")

	// 1. Kiem tra tinh hop le cua Device va SecretKey
	var dbSecretKey string
	var currentStatus string
	err := db.DB.QueryRow(`SELECT secret_key, status FROM devices WHERE id = $1`, input.DeviceID).Scan(&dbSecretKey, &currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			// Neu khong tim thay bang ID, thu tim theo hardware_uuid (trong truong hop fallback)
			err = db.DB.QueryRow(`SELECT id, secret_key, status FROM devices WHERE hardware_uuid = $1`, input.DeviceID).Scan(&input.DeviceID, &dbSecretKey, &currentStatus)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Thiet bi chua duoc enroll"}})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi kiem tra thiet bi"}})
			return
		}
	}

	if dbSecretKey != secretKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Khoa thiet bi khong hop le"}})
		return
	}

	// 2. Ghi nhan metrics vao database
	_, err = db.DB.Exec(
		`INSERT INTO device_metrics (device_id, cpu_usage, ram_usage, disk_usage, network_rx, network_tx) VALUES ($1, $2, $3, $4, $5, $6)`,
		input.DeviceID, input.CPUUsage, input.RAMUsage, input.DiskUsage, input.NetworkRX, input.NetworkTX,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi ghi nhan metrics: " + err.Error()}})
		return
	}

	// 3. Cap nhat trang thai thiet bi ve online va update thoi gian tuong tac
	_, err = db.DB.Exec(
		`UPDATE devices SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		input.DeviceID,
	)
	if err != nil {
		log.Printf("Khong the cap nhat status thiet bi %s: %v", input.DeviceID, err)
	}

	c.JSON(http.StatusOK, gin.H{"status": "recorded"})
}

// Status (Cap nhat trang thai chu dong nhu sleeping/offline tu Agent)
func UpdateStatus(c *gin.Context) {
	var input struct {
		DeviceID string `json:"device_id" binding:"required"`
		Status   string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu trang thai khong hop le"}})
		return
	}

	secretKey := c.GetHeader("X-Agent-Secret")

	var dbSecretKey string
	err := db.DB.QueryRow(`SELECT secret_key FROM devices WHERE id = $1`, input.DeviceID).Scan(&dbSecretKey)
	if err != nil {
		if err == sql.ErrNoRows {
			err = db.DB.QueryRow(`SELECT id, secret_key FROM devices WHERE hardware_uuid = $1`, input.DeviceID).Scan(&input.DeviceID, &dbSecretKey)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Thiet bi chua duoc dang ky"}})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi kiem tra thiet bi"}})
			return
		}
	}

	if dbSecretKey != secretKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Khoa thiet bi khong hop le"}})
		return
	}

	// Cap nhat trang thai chi dinh tu Agent
	_, err = db.DB.Exec(
		`UPDATE devices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
		input.Status, input.DeviceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi cap nhat trang thai: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": input.Status})
}
