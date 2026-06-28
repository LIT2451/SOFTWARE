package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

type TaskPayload struct {
	ID          string `json:"id"`
	DeviceID    string `json:"device_id"`
	CommandType string `json:"command_type"`
	Payload     string `json:"payload"`
	Signature   string `json:"signature"`
}

func startTasksFetcher(stopChan chan bool) {
	// Quet va lay nhiem vu tu Server moi 3 giay (tuong duong Long Polling)
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			fetchAndExecuteTasks()
		}
	}
}

func fetchAndExecuteTasks() {
	url := config.ServerURL + "/api/v1/agent/tasks/fetch?device_id=" + deviceID
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return
	}

	req.Header.Set("X-Agent-Secret", config.SecretKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	var result struct {
		Tasks []TaskPayload `json:"tasks"`
	}

	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &result); err != nil {
		return
	}

	for _, task := range result.Tasks {
		log.Printf("Nhan task moi tu Server: ID=%s, Type=%s", task.ID, task.CommandType)
		
		// 1. Kiem tra chu ky so RSA
		err := VerifySignature(task.Payload, task.Signature)
		if err != nil {
			log.Printf("Xac thuc RSA that bai: %v. Tu choi chay task.", err)
			reportTaskResult(task.ID, "failed", err.Error())
			continue
		}

		log.Printf("Chu ky RSA hop le. Bat dau thuc thi task...")
		
		// 2. Chay lenh cục bo
		output, err := ExecuteLocalCommand(task.CommandType, task.Payload)
		if err != nil {
			log.Printf("Thuc thi task that bai: %v", err)
			reportTaskResult(task.ID, "failed", err.Error())
		} else {
			log.Printf("Thuc thi task thanh cong")
			reportTaskResult(task.ID, "completed", output)
		}
	}
}

func reportTaskResult(taskID, status, result string) {
	url := config.ServerURL + "/api/v1/agent/tasks/report"
	payload := map[string]interface{}{
		"task_id":   taskID,
		"device_id": deviceID,
		"status":    status,
		"result":    result,
	}

	payloadBytes, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Secret", config.SecretKey)

	resp, err := http.DefaultClient.Do(req)
	if err == nil {
		_ = resp.Body.Close()
	}
}
