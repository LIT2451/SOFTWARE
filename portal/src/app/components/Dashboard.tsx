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

// Map color choices for dynamic styling
const accentColors = [
  { name: "Tím Neon", value: "#a855f7", rgb: "168, 85, 247" },
  { name: "Cam Đất", value: "#e56a4a", rgb: "229, 106, 74" },
  { name: "Xanh Ngọc", value: "#10b981", rgb: "16, 185, 129" },
  { name: "Xanh Dương", value: "#3b82f6", rgb: "59, 130, 246" }
];

export default function Dashboard({ token, username, role, onLogout }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"specs" | "metrics" | "control" | "tasks">("specs");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Dynamic Accent Theme state
  const [accent, setAccent] = useState(accentColors[0]);

  // Dialog states for control commands
  const [dockerAction, setDockerAction] = useState("logs");
  const [dockerContainer, setDockerContainer] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM devices LIMIT 5;");
  const [sqlDriver, setSqlDriver] = useState("postgres");
  const [sqlConnStr, setSqlConnStr] = useState("host=127.0.0.1 port=5432 user=software_user password=litsoftware2026 dbname=software sslmode=disable");

  useEffect(() => {
    // Load Saved Accent
    const savedAccentValue = localStorage.getItem("lit-portal-accent");
    if (savedAccentValue) {
      const found = accentColors.find(c => c.value === savedAccentValue);
      if (found) setAccent(found);
    }
  }, []);

  const changeAccent = (colorObj: typeof accentColors[0]) => {
    setAccent(colorObj);
    localStorage.setItem("lit-portal-accent", colorObj.value);
    showToast(`Đã thay đổi giao diện màu nhấn sang ${colorObj.name}`, "info");
  };

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
      const mRes = await fetch(`/api/v1/portal/devices/${selectedDevice.id}/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mData = await mRes.json();
      if (mRes.ok && mData.metrics) {
        setMetrics(mData.metrics);
      }

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
        showToast("Đã gửi lệnh RSA xác thực mã hóa xuống thiết bị!", "success");
        fetchDeviceDetails();
      } else {
        showToast(data.error?.message || "Đẩy lệnh thất bại", "error");
      }
    } catch (err) {
      showToast("Không thể kết nối để gửi lệnh điều khiển", "error");
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
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      position: "relative",
      overflowX: "hidden"
    }}>
      {/* Dynamic Background Spotlight based on color accent */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${accent.rgb}, 0.04) 0%, transparent 70%)`,
        top: "-100px",
        right: "-100px",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Navbar Glass */}
      <header style={{
        padding: "18px 40px",
        background: "rgba(17, 17, 25, 0.65)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        position: "sticky",
        top: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: accent.value,
            boxShadow: `0 0 12px ${accent.value}`,
            transition: "background-color 0.3s, box-shadow 0.3s"
          }} />
          <h1 style={{ fontSize: "20px", margin: 0, color: "#ffffff", letterSpacing: "0.12em" }}>LIT SOFTWARE WARD</h1>
        </div>

        {/* Dynamic Accent Color Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Giao diện:</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {accentColors.map((colorObj) => (
                <button
                  key={colorObj.value}
                  onClick={() => changeAccent(colorObj)}
                  title={colorObj.name}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: colorObj.value,
                    border: accent.value === colorObj.value ? "2px solid #ffffff" : "1px solid rgba(0,0,0,0.5)",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: accent.value === colorObj.value ? `0 0 8px ${colorObj.value}` : "none",
                    transition: "transform 0.1s"
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: "#f8fafc", fontFamily: "JetBrains Mono" }}>{username}</div>
              <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "10px",
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "Oswald, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.05em",
                transition: "background-color 0.2s"
              }}
            >
              ĐĂNG XUẤT
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, zIndex: 1 }}>
        {/* Left Sidebar Glass */}
        <aside style={{
          width: "340px",
          background: "rgba(13, 13, 18, 0.4)",
          backdropFilter: "blur(16px) saturate(180%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "30px 24px",
          display: "flex",
          flexDirection: "column"
        }}>
          <h2 style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", letterSpacing: "0.05em" }}>THIẾT BỊ ĐANG GIÁM SÁT</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {devices.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#475569", fontStyle: "italic", textAlign: "center", marginTop: "40px" }}>
                Đang quét tìm thiết bị...
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  style={{
                    padding: "18px",
                    background: selectedDevice?.id === dev.id 
                      ? `linear-gradient(135deg, rgba(${accent.rgb}, 0.08), rgba(${accent.rgb}, 0.02))` 
                      : "rgba(255, 255, 255, 0.02)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${selectedDevice?.id === dev.id ? `rgba(${accent.rgb}, 0.3)` : "rgba(255, 255, 255, 0.05)"}`,
                    borderRadius: "14px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.25s ease-out",
                    boxShadow: selectedDevice?.id === dev.id ? `0 10px 25px rgba(${accent.rgb}, 0.05)` : "none"
                  }}
                >
                  {/* Status Spot */}
                  <div style={{
                    position: "absolute",
                    top: "18px",
                    right: "18px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: dev.status === "online" ? "#10b981" : "#ef4444",
                    boxShadow: `0 0 10px ${dev.status === "online" ? "#10b981" : "#ef4444"}`
                  }} />

                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f8fafc", marginBottom: "6px", paddingRight: "15px" }}>
                    {dev.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>
                    {dev.ip_address}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                    OS: {dev.os_name}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Dashboard Area */}
        <main style={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column", gap: "35px" }}>
          {selectedDevice ? (
            <>
              {/* Header Device card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px",
                padding: "28px 35px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
              }}>
                <div>
                  <h2 style={{ fontSize: "26px", color: "#ffffff", marginBottom: "6px" }}>{selectedDevice.name}</h2>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontFamily: "JetBrains Mono" }}>ID: {selectedDevice.hardware_uuid}</p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  backgroundColor: selectedDevice.status === "online" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${selectedDevice.status === "online" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: selectedDevice.status === "online" ? "#10b981" : "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  boxShadow: `0 0 15px ${selectedDevice.status === "online" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}`
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: selectedDevice.status === "online" ? "#10b981" : "#ef4444"
                  }} />
                  {selectedDevice.status}
                </div>
              </div>

              {/* TABS Navigation Glass */}
              <div style={{ 
                display: "flex", 
                background: "rgba(255, 255, 255, 0.02)", 
                borderRadius: "12px", 
                padding: "4px",
                border: "1px solid rgba(255, 255, 255, 0.04)"
              }}>
                {(["specs", "metrics", "control", "tasks"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      backgroundColor: activeTab === tab ? "rgba(255, 255, 255, 0.06)" : "transparent",
                      border: "none",
                      borderRadius: "10px",
                      color: activeTab === tab ? "#ffffff" : "#64748b",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontFamily: "Oswald, sans-serif",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      transition: "all 0.2s ease-out"
                    }}
                  >
                    {tab === "specs" && "CẤU HÌNH VẬT LÝ"}
                    {tab === "metrics" && "HIỆU NĂNG THỜI GIAN THỰC"}
                    {tab === "control" && "ĐIỀU KHIỂN & DỊCH VỤ"}
                    {tab === "tasks" && "LỊCH SỬ CÔNG VIỆC"}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT Glass */}
              <div style={{ flex: 1 }}>
                {activeTab === "specs" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "24px"
                  }}>
                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                      border: "1px solid rgba(255, 255, 255, 0.06)", 
                      borderRadius: "16px",
                      padding: "25px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}>
                      <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "20px" }}>Thông tin hệ thống</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Hostname:</span><span>{selectedDevice.hostname}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Hệ điều hành:</span><span>{selectedDevice.os_type}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Kiến trúc OS:</span><span>{selectedDevice.os_name}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Trình biên dịch:</span><span>{selectedDevice.os_version}</span></div>
                      </div>
                    </div>

                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                      border: "1px solid rgba(255, 255, 255, 0.06)", 
                      borderRadius: "16px",
                      padding: "25px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}>
                      <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "20px" }}>Vi xử lý (CPU)</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ color: "#64748b" }}>Kiểu vi xử lý:</span>
                          <span style={{ fontSize: "12px", color: "#f8fafc", wordBreak: "break-word" }}>{selectedDevice.cpu_model || "Đang phân tích..."}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Số nhân vật lý:</span><span>{selectedDevice.cpu_cores} Cores</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Số luồng CPU:</span><span>{selectedDevice.cpu_threads} Threads</span></div>
                      </div>
                    </div>

                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                      border: "1px solid rgba(255, 255, 255, 0.06)", 
                      borderRadius: "16px",
                      padding: "25px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}>
                      <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "20px" }}>Bộ nhớ & Lưu trữ</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Tổng bộ nhớ RAM:</span><span>{formatBytes(selectedDevice.ram_total)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Ổ đĩa cứng:</span><span>{formatBytes(selectedDevice.disk_total)}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {metrics.length === 0 ? (
                      <div style={{ 
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "16px",
                        textAlign: "center", 
                        padding: "60px 40px", 
                        color: "#64748b", 
                        fontStyle: "italic", 
                        fontSize: "13px" 
                      }}>
                        Đang đợi các gói tin hiệu năng từ Agent...
                      </div>
                    ) : (
                      <>
                        {/* Summary Metrics cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                          <div style={{ 
                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                            border: "1px solid rgba(255, 255, 255, 0.06)", 
                            borderRadius: "16px",
                            padding: "25px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                          }}>
                            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tải CPU</div>
                            <div style={{ fontSize: "36px", fontWeight: "bold", color: accent.value, marginTop: "8px" }}>
                              {metrics[metrics.length - 1].cpu_usage.toFixed(1)}%
                            </div>
                          </div>
                          <div style={{ 
                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                            border: "1px solid rgba(255, 255, 255, 0.06)", 
                            borderRadius: "16px",
                            padding: "25px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                          }}>
                            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tiêu thụ RAM</div>
                            <div style={{ fontSize: "36px", fontWeight: "bold", color: accent.value, marginTop: "8px" }}>
                              {metrics[metrics.length - 1].ram_usage.toFixed(1)}%
                            </div>
                          </div>
                          <div style={{ 
                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                            border: "1px solid rgba(255, 255, 255, 0.06)", 
                            borderRadius: "16px",
                            padding: "25px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                          }}>
                            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dung lượng Disk</div>
                            <div style={{ fontSize: "36px", fontWeight: "bold", color: accent.value, marginTop: "8px" }}>
                              {metrics[metrics.length - 1].disk_usage.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Network metrics */}
                        <div style={{ 
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                          border: "1px solid rgba(255, 255, 255, 0.06)", 
                          borderRadius: "16px",
                          padding: "25px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                        }}>
                          <h3 style={{ fontSize: "14px", color: "#ffffff", marginBottom: "20px" }}>Lưu lượng mạng Delta (Tốc độ truyền nhận)</h3>
                          <div style={{ display: "flex", gap: "50px" }}>
                            <div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>BĂNG THÔNG NHẬN (RX)</div>
                              <div style={{ fontSize: "20px", color: "#10b981", fontWeight: "bold", marginTop: "6px" }}>
                                {formatBytes(metrics[metrics.length - 1].network_rx)}/s
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>BĂNG THÔNG GỬI (TX)</div>
                              <div style={{ fontSize: "20px", color: "#3b82f6", fontWeight: "bold", marginTop: "6px" }}>
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
                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                      border: "1px solid rgba(255, 255, 255, 0.06)", 
                      borderRadius: "16px",
                      padding: "30px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}>
                      <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "20px" }}>Quản trị Docker Container</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>THAO TÁC</label>
                          <select
                            value={dockerAction}
                            onChange={(e) => setDockerAction(e.target.value)}
                            style={{
                              padding: "11px 14px",
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "8px",
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

                        <div style={{ flex: 1, minWidth: "220px" }}>
                          <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>TÊN CONTAINER HOẶC ID</label>
                          <input
                            type="text"
                            placeholder="vd: pg-openclaw"
                            value={dockerContainer}
                            onChange={(e) => setDockerContainer(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "8px",
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
                            padding: "12px 24px",
                            backgroundColor: accent.value,
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            boxShadow: `0 4px 14px rgba(${accent.rgb}, 0.2)`
                          }}
                        >
                          Gửi lệnh Docker
                        </button>
                      </div>
                    </div>

                    {/* SQL Operations */}
                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                      border: "1px solid rgba(255, 255, 255, 0.06)", 
                      borderRadius: "16px",
                      padding: "30px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}>
                      <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "20px" }}>Truy vấn SQL Cục bộ (Chỉ SELECT)</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "flex", gap: "24px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>DRIVE</label>
                            <select
                              value={sqlDriver}
                              onChange={(e) => setSqlDriver(e.target.value)}
                              style={{
                                padding: "11px 14px",
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontFamily: "JetBrains Mono, monospace"
                              }}
                            >
                              <option value="postgres">PostgreSQL</option>
                              <option value="mysql">MySQL</option>
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>CONNECTION STRING</label>
                            <input
                              type="text"
                              value={sqlConnStr}
                              onChange={(e) => setSqlConnStr(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "11px 14px",
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontFamily: "JetBrains Mono, monospace",
                                outline: "none"
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>CÂU LỆNH SQL QUERY</label>
                          <textarea
                            rows={3}
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "14px",
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "8px",
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
                              padding: "12px 24px",
                              backgroundColor: accent.value,
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              fontFamily: "Oswald, sans-serif",
                              letterSpacing: "0.08em",
                              cursor: "pointer",
                              textTransform: "uppercase",
                              boxShadow: `0 4px 14px rgba(${accent.rgb}, 0.2)`
                            }}
                          >
                            Thực thi truy vấn
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* System maintenance grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                      <div style={{ 
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                        border: "1px solid rgba(255, 255, 255, 0.06)", 
                        borderRadius: "16px",
                        padding: "25px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                      }}>
                        <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "10px" }}>Bảo trì Redis Cache</h3>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Dọn dẹp và xóa sạch cache toàn bộ Database của Redis cục bộ (`FLUSHDB`).</p>
                        <button
                          onClick={() => dispatchCommand("REDIS_FLUSH", "")}
                          disabled={loading}
                          style={{
                            padding: "11px 22px",
                            backgroundColor: "rgba(16, 185, 129, 0.08)",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                            borderRadius: "8px",
                            color: "#10b981",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Dọn sạch Cache Redis
                        </button>
                      </div>

                      <div style={{ 
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                        border: "1px solid rgba(255, 255, 255, 0.06)", 
                        borderRadius: "16px",
                        padding: "25px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                      }}>
                        <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "10px" }}>Reboot hệ thống</h3>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Kích hoạt khởi động lại vật lý máy chủ từ xa thông qua Agent cục bộ.</p>
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc chắn muốn khởi động lại máy chủ từ xa?")) {
                              dispatchCommand("REBOOT", JSON.stringify({ delay: 0 }));
                            }
                          }}
                          disabled={loading}
                          style={{
                            padding: "11px 22px",
                            backgroundColor: "rgba(229, 106, 74, 0.08)",
                            border: "1px solid rgba(229, 106, 74, 0.25)",
                            borderRadius: "8px",
                            color: "#e56a4a",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Reboot thiết bị
                        </button>
                      </div>

                      <div style={{ 
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                        border: "1px solid rgba(255, 255, 255, 0.06)", 
                        borderRadius: "16px",
                        padding: "25px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                      }}>
                        <h3 style={{ fontSize: "14px", color: accent.value, marginBottom: "10px" }}>Uninstall Agent</h3>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Vô hiệu hóa service, xóa sạch các tệp thực thi, khóa và tự hủy Agent.</p>
                        <button
                          onClick={() => {
                            if (confirm("CẢNH BÁO: Hành động này sẽ gỡ cài đặt sạch sẽ và tự hủy Agent trên thiết bị từ xa. Tiếp tục?")) {
                              dispatchCommand("UNINSTALL", "");
                            }
                          }}
                          disabled={loading}
                          style={{
                            padding: "11px 22px",
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "8px",
                            color: "#ef4444",
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
                  <div style={{ 
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))", 
                    border: "1px solid rgba(255, 255, 255, 0.06)", 
                    borderRadius: "16px",
                    padding: "30px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}>
                    <h3 style={{ fontSize: "14px", color: "#ffffff", marginBottom: "20px" }}>Lịch sử công việc điều khiển</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "left" }}>
                            <th style={{ padding: "12px", color: "#64748b" }}>MÃ TASK</th>
                            <th style={{ padding: "12px", color: "#64748b" }}>LOẠI LỆNH</th>
                            <th style={{ padding: "12px", color: "#64748b" }}>TRẠNG THÁI</th>
                            <th style={{ padding: "12px", color: "#64748b" }}>PHẢN HỒI KẾT QUẢ / THÔNG BÁO LỖI</th>
                            <th style={{ padding: "12px", color: "#64748b" }}>THỜI GIAN KHỞI TẠO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                                Chưa có lịch sử tác vụ nào được thực hiện...
                              </td>
                            </tr>
                          ) : (
                            tasks.map((task) => (
                              <tr key={task.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                                <td style={{ padding: "12px", fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}>{task.id.substring(0, 8)}...</td>
                                <td style={{ padding: "12px" }}>
                                  <span style={{
                                    padding: "4px 8px",
                                    backgroundColor: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderRadius: "6px",
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
                                <td style={{ padding: "12px", color: "#64748b", fontSize: "11px" }}>
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
              <div style={{ textAlign: "center", color: "#64748b" }}>
                Vui lòng kết nối thiết bị hoặc chọn thiết bị cần giám sát.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
