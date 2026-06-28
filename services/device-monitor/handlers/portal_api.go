package handlers

import (
	"database/sql"
	"net/http"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/models"
	"github.com/gin-gonic/gin"
)

// GetDevices (Portal lay danh sach thiet bi)
// - Admin thay tat ca
// - User thuong chi thay thiet bi cua minh (owner_id = userID)
func GetDevices(c *gin.Context) {
	// Lay user_id va role tu JWT context (duoc set tu Auth Middleware)
	userID, exists1 := c.Get("userID")
	role, exists2 := c.Get("role")

	if !exists1 || !exists2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Yeu cau xac thuc nguoi dung"}})
		return
	}

	var rows *sql.Rows
	var err error

	if role == "admin" {
		rows, err = db.DB.Query(`SELECT id, hardware_uuid, owner_id, name, hostname, os_type, os_name, os_version, cpu_model, cpu_cores, cpu_threads, ram_total, disk_total, ip_address, status, created_at, updated_at FROM devices ORDER BY updated_at DESC`)
	} else {
		rows, err = db.DB.Query(`SELECT id, hardware_uuid, owner_id, name, hostname, os_type, os_name, os_version, cpu_model, cpu_cores, cpu_threads, ram_total, disk_total, ip_address, status, created_at, updated_at FROM devices WHERE owner_id = $1 ORDER BY updated_at DESC`, userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi truy van thiet bi: " + err.Error()}})
		return
	}
	defer rows.Close()

	devices := []models.Device{}
	for rows.Next() {
		var d models.Device
		err = rows.Scan(
			&d.ID, &d.HardwareUUID, &d.OwnerID, &d.Name, &d.Hostname, &d.OSType, &d.OSName, &d.OSVersion,
			&d.CPUModel, &d.CPUCores, &d.CPUThreads, &d.RAMTotal, &d.DiskTotal, &d.IPAddress, &d.Status,
			&d.CreatedAt, &d.UpdatedAt,
		)
		if err == nil {
			devices = append(devices, d)
		}
	}

	c.JSON(http.StatusOK, gin.H{"devices": devices})
}

// GetDeviceMetrics (Lay du lieu bieu do hieu nang cua thiet bi trong 1 gio qua)
func GetDeviceMetrics(c *gin.Context) {
	deviceID := c.Param("id")
	userID, exists1 := c.Get("userID")
	role, exists2 := c.Get("role")

	if !exists1 || !exists2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Yeu cau xac thuc nguoi dung"}})
		return
	}

	// Kiem tra quyen so huu thiet bi
	if role != "admin" {
		var ownerID string
		err := db.DB.QueryRow(`SELECT owner_id FROM devices WHERE id = $1`, deviceID).Scan(&ownerID)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Thiet bi khong ton tai"}})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi kiem tra thiet bi"}})
			return
		}
		if ownerID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Ban khong co quyen truy cap thiet bi nay"}})
			return
		}
	}

	// Lay metrics trong 1 tieng qua (gioi han 100 diem du lieu de ve bieu do)
	rows, err := db.DB.Query(
		`SELECT id, device_id, cpu_usage, ram_usage, disk_usage, network_rx, network_tx, recorded_at 
		 FROM device_metrics 
		 WHERE device_id = $1 AND recorded_at >= NOW() - INTERVAL '1 hour' 
		 ORDER BY recorded_at ASC LIMIT 100`, 
		deviceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi truy van metrics: " + err.Error()}})
		return
	}
	defer rows.Close()

	metrics := []models.DeviceMetric{}
	for rows.Next() {
		var m models.DeviceMetric
		err = rows.Scan(&m.ID, &m.DeviceID, &m.CPUUsage, &m.RAMUsage, &m.DiskUsage, &m.NetworkRX, &m.NetworkTX, &m.RecordedAt)
		if err == nil {
			metrics = append(metrics, m)
		}
	}

	c.JSON(http.StatusOK, gin.H{"metrics": metrics})
}

// GetTasksHistory (Lay lich su task va ket qua cua thiet bi)
func GetTasksHistory(c *gin.Context) {
	deviceID := c.Param("id")
	userID, exists1 := c.Get("userID")
	role, exists2 := c.Get("role")

	if !exists1 || !exists2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Yeu cau xac thuc nguoi dung"}})
		return
	}

	// Kiem tra quyen so huu thiet bi
	if role != "admin" {
		var ownerID string
		err := db.DB.QueryRow(`SELECT owner_id FROM devices WHERE id = $1`, deviceID).Scan(&ownerID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Loi xac thuc quyen truy cap"}})
			return
		}
		if ownerID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Khong co quyen xem lich su thiet bi nay"}})
			return
		}
	}

	rows, err := db.DB.Query(
		`SELECT id, device_id, command_type, payload, signature, status, result, created_at, updated_at 
		 FROM tasks 
		 WHERE device_id = $1 
		 ORDER BY created_at DESC LIMIT 50`, 
		deviceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi truy van tasks: " + err.Error()}})
		return
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var t models.Task
		err = rows.Scan(&t.ID, &t.DeviceID, &t.CommandType, &t.Payload, &t.Signature, &t.Status, &t.Result, &t.CreatedAt, &t.UpdatedAt)
		if err == nil {
			tasks = append(tasks, t)
		}
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}
