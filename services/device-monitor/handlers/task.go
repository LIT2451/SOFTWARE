package handlers

import (
	"net/http"

	"github.com/LIT2451/SOFTWARE/services/device-monitor/db"
	"github.com/LIT2451/SOFTWARE/services/device-monitor/models"
	"github.com/gin-gonic/gin"
)

// DispatchTask (Admin hoac owner tao task)
func DispatchTask(c *gin.Context) {
	var input struct {
		CommandType string `json:"command_type" binding:"required"`
		Payload     string `json:"payload"` // Noi dung cau lenh
	}

	deviceID := c.Param("id")
	userID, exists1 := c.Get("userID")
	role, exists2 := c.Get("role")

	if !exists1 || !exists2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Yeu cau xac thuc nguoi dung"}})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu task khong hop le"}})
		return
	}

	// Kiem tra quyen so huu thiet bi truoc khi cho phep gui lenh
	if role != "admin" {
		var ownerID string
		err := db.DB.QueryRow(`SELECT owner_id FROM devices WHERE id = $1`, deviceID).Scan(&ownerID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Thiet bi khong ton tai"}})
			return
		}
		if ownerID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN", "message": "Ban khong co quyen dieu khien thiet bi nay"}})
			return
		}
	}

	// 1. Ky so du lieu payload de bao ve an toan
	signature, err := SignData(input.Payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi ky so lenh dieu khien"}})
		return
	}

	// 2. Ghi nhan task vao database
	query := `
		INSERT INTO tasks (device_id, command_type, payload, signature, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id, device_id, command_type, payload, signature, status, created_at, updated_at
	`
	var task models.Task
	err = db.DB.QueryRow(query, deviceID, input.CommandType, input.Payload, signature).
		Scan(&task.ID, &task.DeviceID, &task.CommandType, &task.Payload, &task.Signature, &task.Status, &task.CreatedAt, &task.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi tao task moi: " + err.Error()}})
		return
	}

	// Ghi nhan vao audit_logs de luu vet cac hanh dong dieu khien tu nguoi dung/admin
	_, _ = db.DB.Exec(
		`INSERT INTO audit_logs (user_id, device_id, action_type, target_name, ip_address) VALUES ($1, $2, $3, $4, $5)`,
		userID, deviceID, "PORTAL_TASK_DISPATCH", task.ID, c.ClientIP(),
	)

	c.JSON(http.StatusCreated, gin.H{"task": task})
}

// FetchTasks (Agent keo danh sach task pending ve)
func FetchTasks(c *gin.Context) {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Thieu thong tin device_id"}})
		return
	}

	secretKey := c.GetHeader("X-Agent-Secret")

	// Kiem tra secret_key thiet bi
	var dbSecret string
	err := db.DB.QueryRow(`SELECT secret_key FROM devices WHERE id = $1`, deviceID).Scan(&dbSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Thiet bi khong hop le"}})
		return
	}
	if dbSecret != secretKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Khoa thiet bi khong khop"}})
		return
	}

	// Lay tat ca task dang pending
	rows, err := db.DB.Query(`SELECT id, device_id, command_type, payload, signature, status, created_at, updated_at FROM tasks WHERE device_id = $1 AND status = 'pending'`, deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi truy van task: " + err.Error()}})
		return
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		err = rows.Scan(&t.ID, &t.DeviceID, &t.CommandType, &t.Payload, &t.Signature, &t.Status, &t.CreatedAt, &t.UpdatedAt)
		if err == nil {
			tasks = append(tasks, t)
		}
	}

	// Cap nhat trang thai cac task vua lay sang 'sent'
	if len(tasks) > 0 {
		for _, t := range tasks {
			_, _ = db.DB.Exec(`UPDATE tasks SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, t.ID)
		}
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// ReportTaskResult (Agent bao cao ket qua thuc thi ve)
func ReportTaskResult(c *gin.Context) {
	var input struct {
		TaskID   string `json:"task_id" binding:"required"`
		DeviceID string `json:"device_id" binding:"required"`
		Status   string `json:"status" binding:"required"` // 'completed' hoac 'failed'
		Result   string `json:"result"`                   // Log ket qua thuc thi hoac loi
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_INPUT", "message": "Du lieu bao cao task khong hop le"}})
		return
	}

	secretKey := c.GetHeader("X-Agent-Secret")

	// Kiem tra secret key cua thiet bi
	var dbSecret string
	err := db.DB.QueryRow(`SELECT secret_key FROM devices WHERE id = $1`, input.DeviceID).Scan(&dbSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Thiet bi khong hop le"}})
		return
	}
	if dbSecret != secretKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "Khoa thiet bi khong hop le"}})
		return
	}

	// Cap nhat ket qua chay thuc te vao database
	_, err = db.DB.Exec(
		`UPDATE tasks SET status = $1, result = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND device_id = $4`,
		input.Status, input.Result, input.TaskID, input.DeviceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SERVER_ERROR", "message": "Loi cap nhat ket qua task: " + err.Error()}})
		return
	}

	// Ghi nhan vao audit_logs de luu vet cac hanh dong dieu khien
	var userID string
	_ = db.DB.QueryRow(`SELECT owner_id FROM devices WHERE id = $1`, input.DeviceID).Scan(&userID)

	_, _ = db.DB.Exec(
		`INSERT INTO audit_logs (user_id, device_id, action_type, target_name, ip_address) VALUES ($1, $2, $3, $4, $5)`,
		userID, input.DeviceID, "AGENT_TASK_"+input.Status, input.TaskID, c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{"status": "recorded"})
}
