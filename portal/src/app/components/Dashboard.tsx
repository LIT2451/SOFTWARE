"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "./Toast";

interface Device {
  id: string;
  hardware_uuid: string;
  name: string;
  hostname: string;
  os_type: string;
  os_name: string;
  os_version: string;
  cpu_model: string;
  cpu_cores: number;
  cpu_threads: number;
  ram_total: number;
  disk_total: number;
  ip_address: string;
  status: string;
  updated_at: string;
}

interface Metric {
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  network_rx: number;
  network_tx: number;
  recorded_at: string;
}

interface Task {
  id: string;
  command_type: string;
  payload: string;
  status: string;
  result: string | null;
  created_at: string;
}

interface DashboardProps {
  token: string;
  username: string;
  role: string;
  onLogout: () => void;
}

export default function Dashboard({ token, username, role, onLogout }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"specs" | "metrics" | "control" | "tasks">("specs");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Dialog states for control commands
  const [dockerAction, setDockerAction] = useState("logs");
  const [dockerContainer, setDockerContainer] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM devices LIMIT 5;");
  const [sqlDriver, setSqlDriver] = useState("postgres");
  const [sqlConnStr, setSqlConnStr] = useState("host=127.0.0.1 port=5432 user=software_user password=litsoftware2026 dbname=software sslmode=disable");

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceDetails();
      const interval = setInterval(fetchDeviceDetails, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/v1/portal/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.devices) {
        setDevices(data.devices);
        if (!selectedDevice && data.devices.length > 0) {
          setSelectedDevice(data.devices[0]);
        } else if (selectedDevice) {
          // Update selected device info
          const updated = data.devices.find((d: Device) => d.id === selectedDevice.id);
          if (updated) setSelectedDevice(updated);
        }
      }
    } catch (err) {
      console.error("Loi lay danh sach thiet bi", err);
    }
  };

  const fetchDeviceDetails = async () => {
    if (!selectedDevice) return;
    try {
      // Fetch metrics
      const mRes = await fetch(`/api/v1/portal/devices/${selectedDevice.id}/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mData = await mRes.json();
      if (mRes.ok && mData.metrics) {
        setMetrics(mData.metrics);
      }

      // Fetch tasks
      const tRes = await fetch(`/api/v1/portal/devices/${selectedDevice.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tData = await tRes.json();
      if (tRes.ok && tData.tasks) {
        setTasks(tData.tasks);
      }
    } catch (err) {
      console.error("Loi chi tiet thiet bi", err);
    }
  };

  const dispatchCommand = async (type: string, payload: string) => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/portal/devices/${selectedDevice.id}/tasks/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command_type: type, payload }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Đã đẩy lệnh điều khiển xuống thiết bị thành công!", "success");
        fetchDeviceDetails();
      } else {
        showToast(data.error?.message || "Đẩy lệnh thất bại", "error");
      }
    } catch (err) {
      showToast("Không thể gửi lệnh điều khiển", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <header style={{
        padding: "15px 30px",
        backgroundColor: "#111119",
        borderBottom: "1px solid #222235",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#e56a4a",
            boxShadow: "0 0 10px #e56a4a"
          }} />
          <h1 style={{ fontSize: "18px", margin: 0, color: "#ffffff" }}>LIT SOFTWARE WARD</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", color: "#f8fafc" }}>{username}</div>
            <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase" }}>{role}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "6px 12px",
              backgroundColor: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              cursor: "pointer",
              fontFamily: "Oswald, sans-serif",
              fontSize: "12px",
              letterSpacing: "0.05em"
            }}
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar - Device list */}
        <aside style={{
          width: "320px",
          backgroundColor: "#0d0d12",
          borderRight: "1px solid #222235",
          padding: "20px"
        }}>
          <h2 style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>Danh sách thiết bị</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {devices.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#4b5563", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                Chưa có thiết bị kết nối...
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  style={{
                    padding: "15px",
                    backgroundColor: selectedDevice?.id === dev.id ? "#161622" : "#111119",
                    border: `1px solid ${selectedDevice?.id === dev.id ? "#7c3aed" : "#222235"}`,
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  {/* Status Indicator */}
                  <div style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: dev.status === "online" ? "#10b981" : "#ef4444",
                    boxShadow: `0 0 8px ${dev.status === "online" ? "#10b981" : "#ef4444"}`
                  }} />

                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f8fafc", marginBottom: "5px", paddingRight: "15px" }}>
                    {dev.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "JetBrains Mono, monospace" }}>
                    IP: {dev.ip_address}
                  </div>
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "5px" }}>
                    OS: {dev.os_name}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Dashboard Area */}
        <main style={{ flex: 1, backgroundColor: "#0b0b0f", padding: "30px", display: "flex", flexDirection: "column", gap: "30px" }}>
          {selectedDevice ? (
            <>
              {/* Header Device */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "5px" }}>{selectedDevice.name}</h2>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>UUID: {selectedDevice.hardware_uuid}</p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 16px",
                  backgroundColor: selectedDevice.status === "online" ? "#0f2f22" : "#3b1e1e",
                  border: `1px solid ${selectedDevice.status === "online" ? "#10b981" : "#ef4444"}`,
                  fontSize: "12px",
                  color: "#ffffff",
                  textTransform: "uppercase"
                }}>
                  Trạng thái: {selectedDevice.status}
                </div>
              </div>

              {/* TABS */}
              <div style={{ display: "flex", borderBottom: "1px solid #222235" }}>
                {(["specs", "metrics", "control", "tasks"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: activeTab === tab ? "2px solid #e56a4a" : "none",
                      color: activeTab === tab ? "#e56a4a" : "#6b7280",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontFamily: "Oswald, sans-serif",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase"
                    }}
                  >
                    {tab === "specs" && "CẤU HÌNH VẬT LÝ"}
                    {tab === "metrics" && "HIỆU NĂNG THỜI GIAN THỰC"}
                    {tab === "control" && "ĐIỀU KHIỂN & DỊCH VỤ"}
                    {tab === "tasks" && "LỊCH SỬ CÔNG VIỆC"}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div style={{ flex: 1 }}>
                {activeTab === "specs" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px"
                  }}>
                    <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                      <h3 style={{ fontSize: "14px", color: "#e56a4a", marginBottom: "15px" }}>Thông tin hệ thống</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Hostname:</span><span>{selectedDevice.hostname}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>OS Type:</span><span>{selectedDevice.os_type}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>OS Name:</span><span>{selectedDevice.os_name}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Compiler:</span><span>{selectedDevice.os_version}</span></div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                      <h3 style={{ fontSize: "14px", color: "#7c3aed", marginBottom: "15px" }}>Vi xử lý (CPU)</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <span style={{ color: "#6b7280" }}>Model:</span>
                          <span style={{ fontSize: "12px", wordBreak: "break-word" }}>{selectedDevice.cpu_model || "Đang lấy dữ liệu..."}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}><span style={{ color: "#6b7280" }}>Số nhân vật lý:</span><span>{selectedDevice.cpu_cores} nhân</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Số luồng xử lý:</span><span>{selectedDevice.cpu_threads} luồng</span></div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                      <h3 style={{ fontSize: "14px", color: "#0d9488", marginBottom: "15px" }}>Bộ nhớ & Lưu trữ</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Tổng bộ nhớ RAM:</span><span>{formatBytes(selectedDevice.ram_total)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Dung lượng ổ đĩa:</span><span>{formatBytes(selectedDevice.disk_total)}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    {metrics.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "#4b5563", fontStyle: "italic", fontSize: "13px" }}>
                        Chưa nhận được gói tin dữ liệu hiệu năng nào...
                      </div>
                    ) : (
                      <>
                        {/* Summary Metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                          <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>Tải CPU</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#e56a4a", marginTop: "5px" }}>
                              {metrics[metrics.length - 1].cpu_usage.toFixed(1)}%
                            </div>
                          </div>
                          <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>Tiêu thụ RAM</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed", marginTop: "5px" }}>
                              {metrics[metrics.length - 1].ram_usage.toFixed(1)}%
                            </div>
                          </div>
                          <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>Dung lượng Disk</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#0d9488", marginTop: "5px" }}>
                              {metrics[metrics.length - 1].disk_usage.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Network metrics */}
                        <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                          <h3 style={{ fontSize: "14px", color: "#ffffff", marginBottom: "15px" }}>Lưu lượng mạng Delta (Tốc độ truyền nhận)</h3>
                          <div style={{ display: "flex", gap: "40px" }}>
                            <div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>BĂNG THÔNG NHẬN (RX)</div>
                              <div style={{ fontSize: "18px", color: "#10b981", fontWeight: "bold", marginTop: "5px" }}>
                                {formatBytes(metrics[metrics.length - 1].network_rx)}/s
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>BĂNG THÔNG GỬI (TX)</div>
                              <div style={{ fontSize: "18px", color: "#3b82f6", fontWeight: "bold", marginTop: "5px" }}>
                                {formatBytes(metrics[metrics.length - 1].network_tx)}/s
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "control" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {/* Docker operations */}
                    <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "25px" }}>
                      <h3 style={{ fontSize: "14px", color: "#e56a4a", marginBottom: "20px" }}>Quản trị Docker Container</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>THAO TÁC</label>
                          <select
                            value={dockerAction}
                            onChange={(e) => setDockerAction(e.target.value)}
                            style={{
                              padding: "10px",
                              backgroundColor: "#08080c",
                              border: "1px solid #222235",
                              color: "#ffffff",
                              fontFamily: "JetBrains Mono, monospace"
                            }}
                          >
                            <option value="logs">Đọc logs (200 dòng + Data Masking)</option>
                            <option value="start">Khởi chạy (Start)</option>
                            <option value="stop">Dừng lại (Stop)</option>
                            <option value="restart">Khởi động lại (Restart)</option>
                          </select>
                        </div>

                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>TÊN CONTAINER HOẶC ID</label>
                          <input
                            type="text"
                            placeholder="vd: pg-openclaw"
                            value={dockerContainer}
                            onChange={(e) => setDockerContainer(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px",
                              backgroundColor: "#08080c",
                              border: "1px solid #222235",
                              color: "#ffffff",
                              fontFamily: "JetBrains Mono, monospace",
                              outline: "none"
                            }}
                          />
                        </div>

                        <button
                          onClick={() => dispatchCommand("DOCKER_OP", JSON.stringify({ action: dockerAction, container_id: dockerContainer }))}
                          disabled={loading || !dockerContainer}
                          style={{
                            padding: "11px 24px",
                            backgroundColor: "#7c3aed",
                            color: "#ffffff",
                            border: "none",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Gửi lệnh Docker
                        </button>
                      </div>
                    </div>

                    {/* SQL Operations */}
                    <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "25px" }}>
                      <h3 style={{ fontSize: "14px", color: "#7c3aed", marginBottom: "20px" }}>Truy vấn SQL Cục bộ (Chỉ SELECT)</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", gap: "20px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>DRIVE</label>
                            <select
                              value={sqlDriver}
                              onChange={(e) => setSqlDriver(e.target.value)}
                              style={{
                                padding: "10px",
                                backgroundColor: "#08080c",
                                border: "1px solid #222235",
                                color: "#ffffff",
                                fontFamily: "JetBrains Mono, monospace"
                              }}
                            >
                              <option value="postgres">PostgreSQL</option>
                              <option value="mysql">MySQL</option>
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>CONNECTION STRING</label>
                            <input
                              type="text"
                              value={sqlConnStr}
                              onChange={(e) => setSqlConnStr(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px",
                                backgroundColor: "#08080c",
                                border: "1px solid #222235",
                                color: "#ffffff",
                                fontFamily: "JetBrains Mono, monospace",
                                outline: "none"
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>CÂU LỆNH SQL QUERY</label>
                          <textarea
                            rows={3}
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "12px",
                              backgroundColor: "#08080c",
                              border: "1px solid #222235",
                              color: "#ffffff",
                              fontFamily: "JetBrains Mono, monospace",
                              outline: "none",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => dispatchCommand("SQL_QUERY", JSON.stringify({ driver: sqlDriver, conn_str: sqlConnStr, sql: sqlQuery }))}
                            disabled={loading || !sqlQuery}
                            style={{
                              padding: "11px 24px",
                              backgroundColor: "#7c3aed",
                              color: "#ffffff",
                              border: "none",
                              fontFamily: "Oswald, sans-serif",
                              letterSpacing: "0.05em",
                              cursor: "pointer",
                              textTransform: "uppercase"
                            }}
                          >
                            Thực thi truy vấn
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* System maintenance */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                        <h3 style={{ fontSize: "14px", color: "#0d9488", marginBottom: "10px" }}>Bảo trì Redis Cache</h3>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>Dọn dẹp và xóa sạch cache toàn bộ Database của Redis cục bộ (`FLUSHDB`).</p>
                        <button
                          onClick={() => dispatchCommand("REDIS_FLUSH", "")}
                          disabled={loading}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#0d9488",
                            color: "#ffffff",
                            border: "none",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Dọn sạch Cache Redis
                        </button>
                      </div>

                      <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                        <h3 style={{ fontSize: "14px", color: "#e56a4a", marginBottom: "10px" }}>Reboot hệ thống</h3>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>Kích hoạt khởi động lại vật lý máy chủ từ xa thông qua Agent cục bộ.</p>
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc chắn muốn khởi động lại máy chủ từ xa?")) {
                              dispatchCommand("REBOOT", JSON.stringify({ delay: 0 }));
                            }
                          }}
                          disabled={loading}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#e56a4a",
                            color: "#ffffff",
                            border: "none",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Reboot thiết bị
                        </button>
                      </div>

                      <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "20px" }}>
                        <h3 style={{ fontSize: "14px", color: "#ef4444", marginBottom: "10px" }}>Uninstall Agent</h3>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>Vô hiệu hóa service, xóa sạch các tệp thực thi, khóa và tự hủy Agent.</p>
                        <button
                          onClick={() => {
                            if (confirm("CẢNH BÁO: Hành động này sẽ gỡ cài đặt sạch sẽ và tự hủy Agent trên thiết bị từ xa. Tiếp tục?")) {
                              dispatchCommand("UNINSTALL", "");
                            }
                          }}
                          disabled={loading}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Gỡ cài đặt Agent
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div style={{ backgroundColor: "#111119", border: "1px solid #222235", padding: "25px" }}>
                    <h3 style={{ fontSize: "14px", color: "#ffffff", marginBottom: "20px" }}>Lịch sử công việc điều khiển</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #222235", textAlign: "left" }}>
                            <th style={{ padding: "12px", color: "#6b7280" }}>MÃ TASK</th>
                            <th style={{ padding: "12px", color: "#6b7280" }}>LOẠI LỆNH</th>
                            <th style={{ padding: "12px", color: "#6b7280" }}>TRẠNG THÁI</th>
                            <th style={{ padding: "12px", color: "#6b7280" }}>PHẢN HỒI KẾT QUẢ / THÔNG BÁO LỖI</th>
                            <th style={{ padding: "12px", color: "#6b7280" }}>THỜI GIAN KHỞI TẠO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#4b5563", fontStyle: "italic" }}>
                                Chưa có lịch sử tác vụ nào được thực hiện...
                              </td>
                            </tr>
                          ) : (
                            tasks.map((task) => (
                              <tr key={task.id} style={{ borderBottom: "1px solid #161622" }}>
                                <td style={{ padding: "12px", fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}>{task.id.substring(0, 8)}...</td>
                                <td style={{ padding: "12px" }}>
                                  <span style={{
                                    padding: "3px 8px",
                                    backgroundColor: "#161622",
                                    border: "1px solid #222235",
                                    fontSize: "11px"
                                  }}>{task.command_type}</span>
                                </td>
                                <td style={{ padding: "12px" }}>
                                  <span style={{
                                    color: task.status === "completed" ? "#10b981" : task.status === "failed" ? "#ef4444" : "#eab308"
                                  }}>{task.status.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: "12px", maxWidth: "300px", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11px" }}>
                                  {task.result || "-"}
                                </td>
                                <td style={{ padding: "12px", color: "#6b7280", fontSize: "11px" }}>
                                  {new Date(task.created_at).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "#6b7280" }}>
                Vui lòng kết nối thiết bị hoặc chọn thiết bị cần giám sát.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
