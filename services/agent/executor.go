package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type DockerContainerInfo struct {
	ID      string `json:"id"`
	Names   string `json:"names"`
	Image   string `json:"image"`
	Status  string `json:"status"`
	State   string `json:"state"`
	CPU     string `json:"cpu"`
	Memory  string `json:"memory"`
}

// ExecuteLocalCommand chay cac lenh thong qua dac ta kieu Whitelist cuc bo
func ExecuteLocalCommand(cmdType, payload string) (string, error) {
	switch cmdType {
	case "REBOOT":
		return handleReboot(payload)
	case "UNINSTALL":
		return handleUninstall()
	case "DOCKER_OP":
		return handleDockerOp(payload)
	case "SQL_QUERY":
		return handleSQLQuery(payload)
	case "REDIS_FLUSH":
		return handleRedisFlush()
	default:
		return "", fmt.Errorf("loai lenh khong duoc ho tro: %s", cmdType)
	}
}

func handleReboot(payload string) (string, error) {
	log.Println("Nhan lenh khoi dong lai thiet bi...")
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("shutdown.exe", "/r", "/f", "/t", "0")
	} else {
		cmd = exec.Command("reboot")
	}

	err := cmd.Start()
	if err != nil {
		return "", fmt.Errorf("khong the bat dau khoi dong lai: %v", err)
	}
	return "Da kich hoat khoi dong lai thiet bi", nil
}

func handleUninstall() (string, error) {
	log.Println("Nhan lenh go cai dat sạch Agent...")
	// Tao file script tu xoa neu la Windows, chay luon neu la Linux/macOS
	go func() {
		time.Sleep(2 * time.Second)
		if runtime.GOOS == "windows" {
			batContent := fmt.Sprintf(`@echo off
timeout /t 2 /nobreak > NUL
sc.exe stop lit-agent
sc.exe delete lit-agent
del /f /q lit-agent.exe
del /f /q config.yaml
del /f /q rsa_public.pem
del /f /q uninstall.bat
`)
			_ = os.WriteFile("uninstall.bat", []byte(batContent), 0644)
			_ = exec.Command("cmd.exe", "/c", "start", "uninstall.bat").Start()
		} else {
			// Linux/macOS
			_ = exec.Command("systemctl", "stop", "lit-agent").Start()
			_ = exec.Command("systemctl", "disable", "lit-agent").Start()
			_ = os.Remove("/etc/systemd/system/lit-agent.service")
			_ = exec.Command("systemctl", "daemon-reload").Start()
			
			// Tu xoa tep
			_ = os.Remove("lit-agent")
			_ = os.Remove("config.yaml")
			_ = os.Remove("rsa_public.pem")
		}
		os.Exit(0)
	}()
	return "Agent dang tien hanh go cai dat sạch và tu huy", nil
}

func handleDockerOp(payload string) (string, error) {
	// Goi docker CLI thong qua runtime vi chung ta chi dung quyen thong thuong, an toan hon Docker SDK
	var input struct {
		Action      string `json:"action"` // 'start', 'stop', 'restart', 'logs'
		ContainerID string `json:"container_id"`
	}
	
	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		return "", fmt.Errorf("payload docker khong hop le: %v", err)
	}

	if input.Action == "logs" {
		cmd := exec.Command("docker", "logs", "--tail", "200", input.ContainerID)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return "", fmt.Errorf("loi lay logs container: %v", err)
		}
		// Data Masking - Che thong tin nhay cam truoc khi tra ve
		maskedLogs := maskSensitiveData(string(output))
		return maskedLogs, nil
	}

	// Thao tac start, stop, restart
	if input.Action != "start" && input.Action != "stop" && input.Action != "restart" {
		return "", fmt.Errorf("thao tac docker khong duoc ho tro: %s", input.Action)
	}

	cmd := exec.Command("docker", input.Action, input.ContainerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("loi thao tac docker %s: %s (%v)", input.Action, string(output), err)
	}

	return fmt.Sprintf("Thao tac %s container %s thanh cong", input.Action, input.ContainerID), nil
}

func handleSQLQuery(payload string) (string, error) {
	var input struct {
		Driver   string `json:"driver"` // 'postgres', 'mysql'
		ConnStr  string `json:"conn_str"`
		SQLQuery string `json:"sql"`
	}

	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		return "", fmt.Errorf("payload sql khong hop le: %v", err)
	}

	// Kiem tra chuoi SQL co chua tu khoa cap cao doc hai khong
	sqlUpper := strings.ToUpper(input.SQLQuery)
	if strings.Contains(sqlUpper, "COPY ") && strings.Contains(sqlUpper, "FROM PROGRAM") {
		return "", fmt.Errorf("lenh copy tu chuong trinh bi cam de bao ve an toan he thong")
	}

	// Mac dinh chi cho phep SELECT cho tai khoan thuong
	if !strings.HasPrefix(strings.TrimSpace(sqlUpper), "SELECT") {
		return "", fmt.Errorf("chi cho phep thuc thi truy van SELECT")
	}

	// Open ket noi voi Query Timeout 5 giay
	dbConn, err := sql.Open(input.Driver, input.ConnStr)
	if err != nil {
		return "", fmt.Errorf("khong the ket noi database: %v", err)
	}
	defer dbConn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := dbConn.QueryContext(ctx, input.SQLQuery)
	if err != nil {
		return "", fmt.Errorf("loi thuc thi truy van: %v", err)
	}
	defer rows.Close()

	cols, _ := rows.Columns()
	var results []map[string]interface{}
	rowCount := 0

	for rows.Next() {
		if rowCount >= 100 { // Gioi han toi da 100 dong ket qua
			break
		}
		columns := make([]interface{}, len(cols))
		columnPointers := make([]interface{}, len(cols))
		for i := range columns {
			columnPointers[i] = &columns[i]
		}

		if err := rows.Scan(columnPointers...); err != nil {
			return "", err
		}

		m := make(map[string]interface{})
		for i, colName := range cols {
			val := columnPointers[i].(*interface{})
			m[colName] = *val
		}
		results = append(results, m)
		rowCount++
	}

	resBytes, _ := json.Marshal(results)
	return string(resBytes), nil
}

func handleRedisFlush() (string, error) {
	// Thuc thi cli redis goi flushdb
	cmd := exec.Command("redis-cli", "FLUSHDB")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("loi thuc thi flush redis: %s (%v)", string(output), err)
	}
	return "Redis cache da duoc don sạch: " + strings.TrimSpace(string(output)), nil
}

func maskSensitiveData(logs string) string {
	result := logs
	// mask cac tu nhay cam co ban
	result = strings.ReplaceAll(result, "password", "******")
	result = strings.ReplaceAll(result, "secret", "******")
	result = strings.ReplaceAll(result, "api_key", "******")
	return result
}
