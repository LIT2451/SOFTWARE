package models

import "time"

type Device struct {
	ID           string    `json:"id"`
	HardwareUUID string    `json:"hardware_uuid"`
	OwnerID      string    `json:"owner_id"`
	Name         string    `json:"name"`
	Hostname     string    `json:"hostname"`
	OSType       string    `json:"os_type"`
	OSName       string    `json:"os_name"`
	OSVersion    string    `json:"os_version"`
	CPUModel     string    `json:"cpu_model"`
	CPUCores     int       `json:"cpu_cores"`
	CPUThreads   int       `json:"cpu_threads"`
	RAMTotal     int64     `json:"ram_total"`
	DiskTotal    int64     `json:"disk_total"`
	IPAddress    string    `json:"ip_address"`
	SecretKey    string    `json:"-"`
	WorkspaceID  string    `json:"workspace_id"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DeviceMetric struct {
	ID         int64     `json:"id"`
	DeviceID   string    `json:"device_id"`
	CPUUsage   float64   `json:"cpu_usage"`
	RAMUsage   float64   `json:"ram_usage"`
	DiskUsage  float64   `json:"disk_usage"`
	NetworkRX  int64     `json:"network_rx"`
	NetworkTX  int64     `json:"network_tx"`
	RecordedAt time.Time `json:"recorded_at"`
}
