package models

import "time"

type Task struct {
	ID          string    `json:"id"`
	DeviceID    string    `json:"device_id"`
	CommandType string    `json:"command_type"`
	Payload     string    `json:"payload"`
	Signature   string    `json:"signature"`
	Status      string    `json:"status"`
	Result      *string   `json:"result"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
