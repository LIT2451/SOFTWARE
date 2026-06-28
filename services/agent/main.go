package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	psutilnet "github.com/shirou/gopsutil/v3/net"
	"gopkg.in/yaml.v3"
)

type Config struct {
	ServerURL         string `yaml:"server_url"`
	WorkspaceID       string `yaml:"workspace_id"`
	SecretKey         string `yaml:"secret_key"`
	HeartbeatInterval int    `yaml:"heartbeat_interval"`
}

type MetricPayload struct {
	DeviceID  string  `json:"device_id"`
	CPUUsage  float64 `json:"cpu_usage"`
	RAMUsage  float64 `json:"ram_usage"`
	DiskUsage float64 `json:"disk_usage"`
	NetworkRX int64   `json:"network_rx"`
	NetworkTX int64   `json:"network_tx"`
}

var (
	config      Config
	deviceID    string
	lastNetInfo psutilnet.IOCountersStat
)

func main() {
	log.Println("Khoi dong LIT-Agent...")

	// 1. Doc file cau hinh
	loadConfig()

	// 2. Lay hardware UUID lam dinh danh duy nhat
	hwUUID := getHardwareUUID()
	log.Printf("Hardware UUID thiet bi: %s", hwUUID)

	// 3. Dang ky thiet bi (Enrollment) neu chua dang ky
	enrollDevice(hwUUID)

	// 4. Bat dau vong lap gui metrics thoi gian thuc
	stopChan := make(chan bool)
	go startMetricsReporting(stopChan)

	// 5. Lang nghe cac tin hieu tat may/sleep de thong bao cho Server
	setupSignalHandler(stopChan)
}

func loadConfig() {
	file, err := os.Open("config.yaml")
	if err != nil {
		// Neu chua co file, khoi tao mac dinh de chay thu
		config = Config{
			ServerURL:         "http://127.0.0.1:28080",
			WorkspaceID:       "00000000-0000-0000-0000-000000000000",
			SecretKey:         "default_agent_secret_key_2026",
			HeartbeatInterval: 5,
		}
		data, _ := yaml.Marshal(&config)
		_ = os.WriteFile("config.yaml", data, 0644)
		log.Println("Da tao file config.yaml mac dinh. Vui long cau hinh lai neu can.")
		return
	}
	defer file.Close()

	decoder := yaml.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		log.Fatalf("Loi doc file config.yaml: %v", err)
	}
}

func getHardwareUUID() string {
	var uuid string
	switch runtime.GOOS {
	case "windows":
		cmd := exec.Command("wmic", "csproduct", "get", "uuid")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			if len(lines) > 1 {
				uuid = strings.TrimSpace(lines[1])
			}
		}
	case "linux":
		// Doc product_uuid neu co quyen root
		data, err := os.ReadFile("/sys/class/dmi/id/product_uuid")
		if err == nil {
			uuid = strings.TrimSpace(string(data))
		} else {
			// fallback neu khong co quyen doc dmi
			data, err = os.ReadFile("/etc/machine-id")
			if err == nil {
				uuid = strings.TrimSpace(string(data))
			}
		}
	case "darwin":
		cmd := exec.Command("sh", "-c", "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID")
		output, err := cmd.Output()
		if err == nil {
			parts := strings.Split(string(output), "=")
			if len(parts) > 1 {
				uuid = strings.Trim(strings.TrimSpace(parts[1]), "\"")
			}
		}
	}

	if uuid == "" {
		// Fallback neu khong the lay duoc UUID phan cung
		uuid = "UNKNOWN-" + runtime.GOOS + "-" + getLocalIP()
	}
	return uuid
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "127.0.0.1"
	}
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "127.0.0.1"
}

func enrollDevice(hwUUID string) {
	hostname, _ := os.Hostname()
	cpuModel := "Unknown CPU"
	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		cpuModel = cpuInfo[0].ModelName
	}
	cores, _ := cpu.Counts(false)
	threads, _ := cpu.Counts(true)
	vmem, _ := mem.VirtualMemory()
	dusage, _ := disk.Usage("/")

	enrollPayload := map[string]interface{}{
		"hardware_uuid": hwUUID,
		"name":          hostname + "-" + runtime.GOOS,
		"hostname":      hostname,
		"os_type":       runtime.GOOS,
		"os_name":       runtime.GOOS + " " + runtime.GOARCH,
		"os_version":    runtime.Compiler,
		"cpu_model":     cpuModel,
		"cpu_cores":     cores,
		"cpu_threads":   threads,
		"ram_total":     vmem.Total,
		"disk_total":    dusage.Total,
		"ip_address":    getLocalIP(),
		"workspace_id":  config.WorkspaceID,
		"secret_key":    config.SecretKey,
	}

	payloadBytes, _ := json.Marshal(enrollPayload)

	// Gui API dang ky thiet bi len server
	resp, err := http.Post(
		config.ServerURL+"/api/v1/agent/enroll",
		"application/json",
		bytes.NewBuffer(payloadBytes),
	)

	if err != nil {
		log.Printf("Khong the ket noi den Server de enroll: %v. Se thu lai sau.", err)
		deviceID = hwUUID // Fallback dung tam UUID lam deviceID
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		var result map[string]interface{}
		_ = json.Unmarshal(body, &result)
		if device, ok := result["device"].(map[string]interface{}); ok {
			if idStr, ok := device["id"].(string); ok {
				deviceID = idStr
				log.Printf("Dang ky thiet bi thanh cong. Device ID he thong cap: %s", deviceID)
				return
			}
		}
	}
	deviceID = hwUUID
	log.Printf("Server tu choi hoac tra ve loi. Phane hoi: %s", string(body))
}

func startMetricsReporting(stopChan chan bool) {
	ticker := time.NewTicker(time.Duration(config.HeartbeatInterval) * time.Second)
	defer ticker.Stop()

	// Lay thong so mang ban dau de tinh toan Delta
	netIO, err := psutilnet.IOCounters(false)
	if err == nil && len(netIO) > 0 {
		lastNetInfo = netIO[0]
	}

	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			sendMetrics()
		}
	}
}

func sendMetrics() {
	percent, _ := cpu.Percent(0, false)
	cpuUsage := 0.0
	if len(percent) > 0 {
		cpuUsage = percent[0]
	}

	vmem, _ := mem.VirtualMemory()
	ramUsage := 0.0
	if vmem != nil {
		ramUsage = vmem.UsedPercent
	}

	dusage, _ := disk.Usage("/")
	diskUsage := 0.0
	if dusage != nil {
		diskUsage = dusage.UsedPercent
	}

	// Tinh toan toc do mang Delta
	var rxBytes, txBytes int64
	netIO, err := psutilnet.IOCounters(false)
	if err == nil && len(netIO) > 0 {
		rxBytes = int64(netIO[0].BytesRecv) - int64(lastNetInfo.BytesRecv)
		txBytes = int64(netIO[0].BytesSent) - int64(lastNetInfo.BytesSent)
		lastNetInfo = netIO[0]
	}

	// Buộc gia tri khong duoc am
	if rxBytes < 0 {
		rxBytes = 0
	}
	if txBytes < 0 {
		txBytes = 0
	}

	payload := MetricPayload{
		DeviceID:  deviceID,
		CPUUsage:  cpuUsage,
		RAMUsage:  ramUsage,
		DiskUsage: diskUsage,
		NetworkRX: rxBytes,
		NetworkTX: txBytes,
	}

	payloadBytes, _ := json.Marshal(payload)
	req, err := http.NewRequest(
		"POST",
		config.ServerURL+"/api/v1/agent/report",
		bytes.NewBuffer(payloadBytes),
	)
	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Secret", config.SecretKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Loi gui thong so ve server: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Server phan hoi loi metrics: %s", string(body))
	}
}

func setupSignalHandler(stopChan chan bool) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	log.Printf("Nhan tin hieu tat may: %v. Dang gui thong bao de dong bang...", sig)

	// Gui trang thai sleeping/offline len server
	payload := map[string]interface{}{
		"device_id": deviceID,
		"status":    "offline", // Thong bao thiet bi dung hoat dong chu dong
	}
	payloadBytes, _ := json.Marshal(payload)
	
	req, _ := http.NewRequest(
		"POST",
		config.ServerURL+"/api/v1/agent/status",
		bytes.NewBuffer(payloadBytes),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Secret", config.SecretKey)

	// Gui yeu cau nhanh va bo qua thoi gian phan hoi
	client := &http.Client{Timeout: 2 * time.Second}
	_, _ = client.Do(req)

	close(stopChan)
	log.Println("Agent dung hoat dong an toan.")
	os.Exit(0)
}
