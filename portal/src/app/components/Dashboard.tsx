"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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

// 9Router Vibe Accents
const accentColors = [
  { name: "Cam Đất", value: "#e56a4a", rgb: "229, 106, 74" },
  { name: "Tím Neon", value: "#a855f7", rgb: "168, 85, 247" },
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

  // Mobile menu responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar Ref to detect click out
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Theme state (dark or light)
  const [theme, setTheme] = useState("dark");

  // Grid dropdown open state (like 9Router grid_view)
  const [gridDropdownOpen, setGridDropdownOpen] = useState(false);

  // Dynamic Accent Theme state (Default to 9Router Orange)
  const [accent, setAccent] = useState(accentColors[0]);

  // Dialog states for control commands
  const [dockerAction, setDockerAction] = useState("logs");
  const [dockerContainer, setDockerContainer] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM devices LIMIT 5;");
  const [sqlDriver, setSqlDriver] = useState("postgres");
  const [sqlConnStr, setSqlConnStr] = useState("host=127.0.0.1 port=5432 user=software_user password=litsoftware2026 dbname=software sslmode=disable");

  const changeAccent = (colorObj: typeof accentColors[0]) => {
    setAccent(colorObj);
    localStorage.setItem("lit-portal-accent", colorObj.value);
    showToast(`Đã thay đổi giao diện màu nhấn sang ${colorObj.name}`, "info");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("lit-portal-theme", nextTheme);
    
    const rootEl = document.documentElement;
    if (nextTheme === "light") {
      rootEl.classList.add("light");
    } else {
      rootEl.classList.remove("light");
    }
    showToast(`Đã chuyển sang giao diện ${nextTheme === "light" ? "Sáng" : "Tối"}`, "info");
  };

  const fetchDevices = useCallback(async () => {
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
        }
      }
    } catch (err) {
      console.error("Loi lay danh sach thiet bi", err);
    }
  }, [token, onLogout, selectedDevice]);

  const fetchDeviceDetails = useCallback(async () => {
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
  }, [token, selectedDevice]);

  useEffect(() => {
    const savedAccentValue = localStorage.getItem("lit-portal-accent");
    if (savedAccentValue) {
      const found = accentColors.find(c => c.value === savedAccentValue);
      if (found) {
        setTimeout(() => {
          setAccent(found);
        }, 0);
      }
    }

    const savedTheme = localStorage.getItem("lit-portal-theme");
    if (savedTheme) {
      setTimeout(() => {
        setTheme(savedTheme);
        const rootEl = document.documentElement;
        if (savedTheme === "light") {
          rootEl.classList.add("light");
        } else {
          rootEl.classList.remove("light");
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // If sidebar is open and we click outside the sidebar element, close it
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Specifically check if the click target is the mobile toggle button, to let its onClick handle toggling
        const toggleBtn = document.querySelector(".mobile-toggle");
        if (toggleBtn && toggleBtn.contains(event.target as Node)) {
          return;
        }
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setTimeout(() => {
      fetchDevices();
    }, 0);
    const interval = setInterval(fetchDevices, 8000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice) {
      setTimeout(() => {
        fetchDeviceDetails();
      }, 0);
    }
  }, [selectedDevice, fetchDeviceDetails]);

  const dispatchCommand = async (type: string, payload: string) => {
    if (!selectedDevice) return;
    setLoading(true);
    showToast(`Đang gửi tác vụ ${type} tới thiết bị...`, "info");
    try {
      const res = await fetch(`/api/v1/portal/devices/${selectedDevice.id}/tasks/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ command_type: type, payload })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Đã điều phối tác vụ thành công", "success");
        fetchDeviceDetails();
      } else {
        showToast(data.error?.message || "Điều phối tác vụ thất bại", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối khi gửi lệnh điều phối", "error");
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
    <div className="root-layout">
      {/* 9Router Static Grid Background */}
      <div className="landing-grid" />
      
      {/* 9Router Radial Glow Orbs */}
      <div className="radial-glows" />

      {/* 9Router Glow Indicator */}
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
        zIndex: 3
      }} />

      {/* Left Sidebar Glass (Desktop Sidebar) */}
      <aside 
        ref={sidebarRef}
        style={{
          width: "320px",
          backgroundColor: "rgba(38, 38, 38, 0.72)", /* 9Router Original Sidebar bg */
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--color-border-subtle)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          height: "100vh",
          zIndex: 10
        }}
        className={`sidebar-container ${sidebarOpen ? "open" : ""}`}
      >
        {/* macOS Style Traffic Light Window Controls (Three Dots) */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", paddingLeft: "4px" }} className="mac-window-controls">
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ff5f56", border: "1px solid #e0443e" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffbd2e", border: "1px solid #dea123" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27c93f", border: "1px solid #1aab29" }} />
        </div>

        {/* Web Logo & Brand inside Sidebar */}
        <div className="sidebar-brand" style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "15px", paddingLeft: "4px", borderBottom: "1px solid #2a2a2a" }}>
          <img 
            src="/fire_logo.png" 
            alt="LIT-VPS Logo" 
            style={{
              width: "44px",
              height: "44px",
              objectFit: "contain",
              display: "block"
            }} 
          />
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <h1 style={{ fontSize: "19px", margin: 0, color: "var(--color-text-main)", letterSpacing: "0.12em", fontFamily: "Oswald, sans-serif" }}>LIT-VPS</h1>
            <span style={{
              fontSize: "9px",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border-subtle)",
              padding: "2px 6px",
              borderRadius: "6px",
              color: "var(--color-text-muted)",
              fontFamily: "JetBrains Mono"
            }}>v1.0.3</span>
          </div>
        </div>

        <h2 style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "16px", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>dns</span>
          THIẾT BỊ ĐANG GIÁM SÁT
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {devices.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#9ca3af", fontStyle: "italic", textAlign: "center", marginTop: "40px" }}>
              Đang quét tìm thiết bị...
            </div>
          ) : (
            devices.map((dev) => {
              const isSelected = selectedDevice?.id === dev.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => {
                    setSelectedDevice(dev);
                    setSidebarOpen(false); // Close sidebar on mobile select
                  }}
                  style={{
                    padding: "16px",
                    background: isSelected 
                      ? `linear-gradient(135deg, rgba(${accent.rgb}, 0.08), rgba(${accent.rgb}, 0.02))` 
                      : "var(--color-surface)",
                    border: `1.5px solid ${isSelected ? accent.value : "#2a2a2a"}`,
                    borderLeft: isSelected ? `4px solid ${accent.value}` : `1.5px solid #2a2a2a`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.25s ease-out",
                    boxShadow: isSelected ? `0 10px 25px rgba(${accent.rgb}, 0.05)` : "none"
                  }}
                >
                  {/* Status Spot */}
                  <div style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: dev.status === "online" ? "#10b981" : "#ef4444",
                    boxShadow: `0 0 10px ${dev.status === "online" ? "#10b981" : "#ef4444"}`
                  }} />

                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ededed", marginBottom: "6px", paddingRight: "15px" }}>
                    {dev.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "JetBrains Mono", marginBottom: "4px" }}>
                    {dev.ip_address}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    OS: {dev.os_name} {dev.os_version}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Layout (Topbar + Content Area) */}
      <div className="main-viewport">
        {/* Navbar Glass */}
        <header className="topbar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                color: "#ededed",
                cursor: "pointer",
                padding: "4px",
                marginRight: "6px"
              }}
              className="mobile-toggle"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {sidebarOpen ? "close" : "menu"}
              </span>
            </button>
          </div>

          {/* Dynamic Controls (Donate, Theme Mode, Accent Color Selector) */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className="nav-controls">
            
            {/* Donate Button */}
            <a 
              href="https://litsoftware.io.vn" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "rgba(229, 106, 74, 0.08)",
                border: "1px solid rgba(229, 106, 74, 0.25)",
                borderRadius: "8px",
                color: "var(--color-primary)",
                fontFamily: "Oswald, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.05em",
                textDecoration: "none",
                transition: "background-color 0.2s"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--color-primary)" }}>favorite</span>
              DONATE
            </a>

            {/* Theme Switcher Toggle (Sáng/Tối) */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Accent Picker */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="accent-picker-container">
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Màu nhấn:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {accentColors.map((colorObj) => (
                  <button
                    key={colorObj.value}
                    onClick={() => changeAccent(colorObj)}
                    title={colorObj.name}
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: colorObj.value,
                      border: accent.value === colorObj.value ? "2px solid var(--color-text-main)" : "1px solid rgba(0,0,0,0.3)",
                      cursor: "pointer",
                      padding: 0,
                      boxShadow: accent.value === colorObj.value ? `0 0 8px ${colorObj.value}` : "none",
                      transition: "transform 0.1s"
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ textAlign: "right" }} className="user-info">
                <div style={{ fontSize: "13px", color: "var(--color-text-main)", fontFamily: "JetBrains Mono" }}>{username}</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
              </div>
              
              {/* 9Router Grid View Dropdown trigger */}
              <button
                onClick={() => setGridDropdownOpen(!gridDropdownOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>grid_view</span>
              </button>

              {/* 9Router Dropdown Menu */}
              {gridDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "8px",
                    width: "240px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "12px",
                    boxShadow: "rgba(0, 0, 0, 0.25) 0px 25px 50px -12px",
                    zIndex: 50,
                    overflow: "hidden",
                    padding: "4px 0px",
                    animation: "slideIn 0.15s ease-out"
                  }}
                >
                  <button
                    onClick={() => {
                      showToast("LIT-VPS phiên bản v1.0.3 hoạt động bình thường", "success");
                      setGridDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "var(--color-text-main)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-text-muted)" }}>history</span>
                    <span style={{ flex: 1 }}>Change Log</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setGridDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "var(--color-text-main)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-text-muted)" }}>dark_mode</span>
                    <span style={{ flex: 1 }}>Theme</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Xác nhận tắt máy chủ giám sát LIT-VPS?")) {
                        showToast("Đang gửi lệnh Shutdown tới Agent...", "info");
                      }
                      setGridDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ef4444" }}>power_settings_new</span>
                    <span style={{ flex: 1 }}>Shutdown</span>
                  </button>

                  <button
                    onClick={() => {
                      setGridDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ef4444" }}>logout</span>
                    <span style={{ flex: 1 }}>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Details Area */}
        <main className="main-content">
          {selectedDevice ? (
            <>
              {/* Device Header Info Card */}
              <div 
                style={{
                  backgroundColor: "var(--color-surface)", /* Card layout 9Router */
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                }}
                className="device-header-card"
              >
                <div>
                  <h2 style={{ fontSize: "20px", color: "#ededed", margin: "0 0 6px 0", fontFamily: "Oswald, sans-serif" }}>
                    {selectedDevice.name.toUpperCase()}
                  </h2>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, fontFamily: "JetBrains Mono" }}>
                    ID: {selectedDevice.id}
                  </p>
                </div>

                {/* Accent-colored Action Tab Selector */}
                <div 
                  style={{
                    display: "flex",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                  className="tabs-container"
                >
                  {[
                    { id: "specs", name: "CẤU HÌNH VẬT LÝ", icon: <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>dns</span> },
                    { id: "metrics", name: "HIỆU NĂNG", icon: <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>monitoring</span> },
                    { id: "control", name: "ĐIỀU KHIỂN", icon: <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>terminal</span> },
                    { id: "tasks", name: "LỊCH SỬ", icon: <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>history</span> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        padding: "8px 16px",
                        background: activeTab === tab.id ? accent.value : "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: activeTab === tab.id ? "#ffffff" : "#9ca3af",
                        fontSize: "11px",
                        fontFamily: "Oswald, sans-serif",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s"
                      }}
                    >
                      {tab.icon}
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1 }}>
                {activeTab === "specs" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    {/* Specs block 1 */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent.value }}>computer</span>
                        THÔNG TIN HỆ THỐNG
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Tên máy chủ (Hostname):</span>
                          <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{selectedDevice.hostname}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Hệ điều hành:</span>
                          <span style={{ color: "#ededed" }}>{selectedDevice.os_name} ({selectedDevice.os_type})</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Phiên bản OS:</span>
                          <span style={{ color: "#ededed" }}>{selectedDevice.os_version}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Địa chỉ IP mạng:</span>
                          <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{selectedDevice.ip_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Specs block 2 */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent.value }}>memory</span>
                        VI XỬ LÝ (CPU)
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ color: "#9ca3af" }}>Dòng chip xử lý:</span>
                          <span style={{ color: "#ededed", fontSize: "11px", fontFamily: "JetBrains Mono" }}>{selectedDevice.cpu_model}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                          <span style={{ color: "#9ca3af" }}>Số nhân vật lý (Cores):</span>
                          <span style={{ color: "#ededed" }}>{selectedDevice.cpu_cores} nhân</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Số luồng logic (Threads):</span>
                          <span style={{ color: "#ededed" }}>{selectedDevice.cpu_threads} luồng</span>
                        </div>
                      </div>
                    </div>

                    {/* Specs block 3 */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent.value }}>hard_drive</span>
                        BỘ NHỚ & LƯU TRỮ
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Tổng dung lượng RAM:</span>
                          <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{formatBytes(selectedDevice.ram_total)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Bộ nhớ lưu trữ (Disk):</span>
                          <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{formatBytes(selectedDevice.disk_total)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af" }}>Kết nối lần cuối:</span>
                          <span style={{ color: "#ededed" }}>{new Date(selectedDevice.updated_at).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Performance bars */}
                    {metrics.length > 0 ? (
                      (() => {
                        const latest = metrics[metrics.length - 1];
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                            {/* CPU Widget */}
                            <div style={{
                              backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                              border: "1px solid var(--color-border-subtle)",
                              borderRadius: "14px",
                              padding: "20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#9ca3af" }}>Mức sử dụng CPU:</span>
                                <span style={{ color: "#ededed", fontWeight: "bold" }}>{latest.cpu_usage.toFixed(1)}%</span>
                              </div>
                              <div style={{ height: "6px", backgroundColor: "var(--color-bg)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${latest.cpu_usage}%`,
                                  height: "100%",
                                  backgroundColor: accent.value,
                                  boxShadow: `0 0 10px ${accent.value}`,
                                  transition: "width 0.5s ease-out"
                                }} />
                              </div>
                            </div>

                            {/* RAM Widget */}
                            <div style={{
                              backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                              border: "1px solid var(--color-border-subtle)",
                              borderRadius: "14px",
                              padding: "20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#9ca3af" }}>Mức sử dụng RAM:</span>
                                <span style={{ color: "#ededed", fontWeight: "bold" }}>{latest.ram_usage.toFixed(1)}%</span>
                              </div>
                              <div style={{ height: "6px", backgroundColor: "var(--color-bg)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${latest.ram_usage}%`,
                                  height: "100%",
                                  backgroundColor: accent.value,
                                  boxShadow: `0 0 10px ${accent.value}`,
                                  transition: "width 0.5s ease-out"
                                }} />
                              </div>
                            </div>

                            {/* Disk Widget */}
                            <div style={{
                              backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                              border: "1px solid var(--color-border-subtle)",
                              borderRadius: "14px",
                              padding: "20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#9ca3af" }}>Mức sử dụng Dung lượng:</span>
                                <span style={{ color: "#ededed", fontWeight: "bold" }}>{latest.disk_usage.toFixed(1)}%</span>
                              </div>
                              <div style={{ height: "6px", backgroundColor: "var(--color-bg)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${latest.disk_usage}%`,
                                  height: "100%",
                                  backgroundColor: accent.value,
                                  boxShadow: `0 0 10px ${accent.value}`,
                                  transition: "width 0.5s ease-out"
                                }} />
                              </div>
                            </div>

                            {/* Network Widget */}
                            <div style={{
                              backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                              border: "1px solid var(--color-border-subtle)",
                              borderRadius: "14px",
                              padding: "20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              fontSize: "12px"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ededed", marginBottom: "4px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent.value }}>hub</span>
                                BĂNG THÔNG MẠNG (TỨC THỜI)
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#9ca3af" }}>Nhận (Rx):</span>
                                <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{formatBytes(latest.network_rx)}/s</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#9ca3af" }}>Gửi (Tx):</span>
                                <span style={{ color: "#ededed", fontFamily: "JetBrains Mono" }}>{formatBytes(latest.network_tx)}/s</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px", fontSize: "12px" }}>
                        Chưa có dữ liệu hiệu năng báo cáo từ Agent...
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "control" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {/* Docker controller */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", margin: 0 }}>QUẢN LÝ DỊCH VỤ DOCKER CỤC BỘ</h3>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Tên Container</label>
                        <input
                          type="text"
                          placeholder="e.g. pg-openclaw"
                          value={dockerContainer}
                          onChange={(e) => setDockerContainer(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px",
                            backgroundColor: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "10px",
                            color: "#ededed",
                            fontSize: "13px",
                            fontFamily: "JetBrains Mono",
                            outline: "none"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Hành động</label>
                        <select
                          value={dockerAction}
                          onChange={(e) => setDockerAction(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "10px",
                            color: "#ededed",
                            fontSize: "13px",
                            outline: "none"
                          }}
                        >
                          <option value="logs">Xem Logs (50 dòng cuối)</option>
                          <option value="start">Khởi chạy (Start)</option>
                          <option value="stop">Dừng chạy (Stop)</option>
                          <option value="restart">Tải lại (Restart)</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!dockerContainer) {
                            showToast("Vui lòng nhập tên Container", "error");
                            return;
                          }
                          dispatchCommand("DOCKER", `${dockerAction}:${dockerContainer}`);
                        }}
                        disabled={loading}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "var(--color-bg)",
                          border: `1.5px solid rgba(${accent.rgb}, 0.5)`,
                          borderRadius: "10px",
                          color: accent.value,
                          fontSize: "12px",
                          fontFamily: "Oswald, sans-serif",
                          letterSpacing: "0.05em",
                          cursor: "pointer",
                          textTransform: "uppercase"
                        }}
                      >
                        Thực thi lệnh Docker
                      </button>
                    </div>

                    {/* Database controller */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", margin: 0 }}>TRUY VẤN SQL DATABASE CỤC BỘ</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Hệ quản trị DB</label>
                          <select
                            value={sqlDriver}
                            onChange={(e) => setSqlDriver(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px",
                              backgroundColor: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "10px",
                              color: "#ededed",
                              fontSize: "13px",
                              outline: "none"
                            }}
                          >
                            <option value="postgres">PostgreSQL</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Chuỗi kết nối</label>
                          <input
                            type="text"
                            value={sqlConnStr}
                            onChange={(e) => setSqlConnStr(e.target.value)}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px",
                              backgroundColor: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "10px",
                              color: "#ededed",
                              fontSize: "11px",
                              fontFamily: "JetBrains Mono",
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", marginBottom: "6px", textTransform: "uppercase" }}>Câu lệnh SQL</label>
                        <textarea
                          rows={3}
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px",
                            backgroundColor: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "10px",
                            color: "#ededed",
                            fontSize: "12px",
                            fontFamily: "JetBrains Mono",
                            outline: "none",
                            resize: "none"
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const payloadObj = {
                            driver: sqlDriver,
                            connection_string: sqlConnStr,
                            query: sqlQuery
                          };
                          dispatchCommand("SQL", JSON.stringify(payloadObj));
                        }}
                        disabled={loading}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "var(--color-bg)",
                          border: `1.5px solid rgba(${accent.rgb}, 0.5)`,
                          borderRadius: "10px",
                          color: accent.value,
                          fontSize: "12px",
                          fontFamily: "Oswald, sans-serif",
                          letterSpacing: "0.05em",
                          cursor: "pointer",
                          textTransform: "uppercase"
                        }}
                      >
                        Thực thi lệnh SQL
                      </button>
                    </div>

                    {/* System controller */}
                    <div style={{
                      backgroundColor: "var(--color-surface)", /* 9Router Card surface */
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px"
                    }}>
                      <h3 style={{ fontSize: "13px", color: "#ededed", margin: 0 }}>HỆ THỐNG VÀ BẢO TRÌ</h3>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
                        Các tùy chọn khởi động và bảo trì phần cứng mức hệ điều hành (chỉ có Admin mới được thực hiện).
                      </p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc chắn muốn phát lệnh khởi động lại thiết bị từ xa không?")) {
                              dispatchCommand("REBOOT", "");
                            }
                          }}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "10px",
                            backgroundColor: "rgba(229, 106, 74, 0.08)",
                            border: "1.5px solid rgba(229, 106, 74, 0.25)",
                            borderRadius: "10px",
                            color: "#e56a4a",
                            fontFamily: "Oswald, sans-serif",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                            textTransform: "uppercase"
                          }}
                        >
                          Khởi động lại máy
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("CẢNH BÁO: Hành động này sẽ gỡ cài đặt sạch sẽ và tự hủy Agent trên thiết bị từ xa. Tiếp tục?")) {
                              dispatchCommand("UNINSTALL", "");
                            }
                          }}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "10px",
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "10px",
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
                    backgroundColor: "var(--color-surface)", /* 9Router Card surface */ 
                    border: "1px solid var(--color-border-subtle)", 
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }} className="tasks-history-card">
                    <h3 style={{ fontSize: "13px", color: "#ededed", marginBottom: "16px" }}>Lịch sử công việc điều khiển</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #2a2a2a", textAlign: "left" }}>
                            <th style={{ padding: "10px", color: "#9ca3af" }}>MÃ TASK</th>
                            <th style={{ padding: "10px", color: "#9ca3af" }}>LOẠI LỆNH</th>
                            <th style={{ padding: "10px", color: "#9ca3af" }}>TRẠNG THÁI</th>
                            <th style={{ padding: "10px", color: "#9ca3af" }}>PHẢN HỒI KẾT QUẢ / THÔNG BÁO LỖI</th>
                            <th style={{ padding: "10px", color: "#9ca3af" }}>THỜI GIAN KHỞI TẠO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontStyle: "italic" }}>
                                Chưa có lịch sử tác vụ nào được thực hiện...
                              </td>
                            </tr>
                          ) : (
                            tasks.map((task) => (
                              <tr key={task.id} style={{ borderBottom: "1px solid #2a2a2a" }}>
                                <td style={{ padding: "10px", fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}>{task.id.substring(0, 8)}...</td>
                                <td style={{ padding: "10px" }}>
                                  <span style={{
                                    padding: "4px 8px",
                                    backgroundColor: "var(--color-bg)",
                                    border: "1px solid var(--color-border-subtle)",
                                    borderRadius: "6px",
                                    fontSize: "10px"
                                  }}>{task.command_type}</span>
                                </td>
                                <td style={{ padding: "10px" }}>
                                  <span style={{
                                    color: task.status === "completed" ? "#10b981" : task.status === "failed" ? "#ef4444" : "#eab308"
                                  }}>{task.status.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: "10px", maxWidth: "260px", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11px" }}>
                                  {task.result || "-"}
                                </td>
                                <td style={{ padding: "10px", color: "#9ca3af", fontSize: "11px" }}>
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
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                Vui lòng kết nối thiết bị hoặc chọn thiết bị cần giám sát.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
