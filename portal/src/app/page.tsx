"use client";

import { useEffect, useState, useRef } from "react";
import {
  Monitor,
  Cpu,
  HardDrive,
  User,
  ChevronRight,
  LogOut,
  Plus,
  Menu,
  X,
  Smartphone,
  Clock,
  Globe,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Settings,
  BookOpen,
  ArrowLeft,
  Receipt,
  Pencil,
  Palette
} from "lucide-react";

// Inline brand logo SVGs for Windows, Apple, and Linux to prevent dependency conflicts
const WindowsLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.95 1.95L24 0v11.55H10.95V1.95zM10.95 12.45H24v11.55l-13.05-1.95v-9.6z"/>
  </svg>
);

const AppleLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z"/>
  </svg>
);

const LinuxLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M12 2c-3.3 0-6 2.7-6 6v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V8c0-3.3-2.7-6-6-6zm-1.5 5c-.8 0-1.5-.7-1.5-1.5S9.7 4 10.5 4s1.5.7 1.5 1.5S11.3 7 10.5 7zm3 0c-.8 0-1.5-.7-1.5-1.5S12.7 4 13.5 4s1.5.7 1.5 1.5S14.3 7 13.5 7zm-5 7c-2.2 0-4 1.8-4 4v1c0 .6.4 1 1 1h13c.6 0 1-.4 1-1v-1c0-2.2-1.8-4-4-4H8.5z"/>
  </svg>
);
import styles from "./page.module.css";
import Auth from "./components/Auth";
import { useToast } from "./components/ToastProvider";
import AdminDashboardPanel from "./components/AdminDashboardModal";
import UserProfile from "./components/UserProfile";
import InstallGuide from "./components/InstallGuide";

// Định nghĩa cấu trúc dữ liệu
interface DiskMetric {
  path: string;
  total_size: number;
  used_size: number;
}

interface PortMetric {
  port: number;
  proto: string;
  ip: string;
  process: string;
  pid: number;
}

interface ServiceMetric {
  name: string;
  description: string;
  load_state: string;
  active_state: string;
}

interface DockerMetric {
  container_id: string;
  name: string;
  image: string;
  status: string;
  cpu_usage: number;
  ram_used: number;
  ports_mapping: string;
}

interface NginxHostMetric {
  domain: string;
  port: number;
  proxy_pass: string;
  root_path: string;
  ssl_active: boolean;
  ssl_expire_at: string | null;
}

interface Device {
  id: string;
  user_id: string;
  name: string;
  os: string;
  cpu_model?: string;
  ip_address: string;
  status: string;
  cpu_usage: number;
  ram_total: number;
  ram_used: number;
  uptime: number;
  last_seen: string;
  agent_token?: string;
  disks: DiskMetric[];
  ports?: PortMetric[];
  services?: ServiceMetric[];
  dockers?: DockerMetric[];
  nginx?: NginxHostMetric[];
}

// Component vẽ biểu đồ lịch sử mini bằng SVG
const SparklineChart = ({ data, color, min = 0, max = 100 }: { data: number[], color: string, min?: number, max?: number }) => {
  if (!data || data.length === 0) return null;
  
  const width = 500;
  const height = 80;
  const padding = 5;
  
  // Ánh xạ điểm dữ liệu sang tọa độ SVG
  const points = data.map((val, idx) => {
    const divisor = data.length > 1 ? data.length - 1 : 1;
    const x = padding + (idx / divisor) * (width - 2 * padding);
    const y = height - padding - ((val - min) / (max - min)) * (height - 2 * padding);
    return { x, y };
  });
  
  // Chuỗi đường dẫn vẽ nét (path)
  const pathD = points.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");
  
  // Đường dẫn khép kín để tô màu gradient
  const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : "";
  
  // Tạo id gradient duy nhất
  const gradientId = `spark-grad-${color.replace("#", "")}`;
  
  return (
    <div style={{ marginTop: "14px", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "80px", display: "block" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        
        {/* Đường tham chiếu trục giữa và đáy */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
        <line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="rgba(255, 255, 255, 0.08)" />
        
        {/* Vùng phủ màu gradient */}
        {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}
        
        {/* Đường line chính */}
        {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        
        {/* Điểm tròn đánh dấu dữ liệu mới nhất */}
        {points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} />
        )}
      </svg>
    </div>
  );
};

export default function Home() {
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Phân quyền Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<"users" | "packages" | "payments" | "devices">("users");

  // Tab chi tiết thiết bị (Cổng mạng, Dịch vụ, Docker, Nginx, Terminal)
  const [activeDetailTab, setActiveDetailTab] = useState<"ports" | "services" | "docker" | "nginx" | "terminal">("ports");

  // Trang cá nhân (UserProfile)
  const [showProfile, setShowProfile] = useState(false);
  
  // Trang hướng dẫn cài đặt (InstallGuide)
  const [showGuide, setShowGuide] = useState(false);

  // Định nghĩa icon hệ điều hành sinh động
  const getOSIcon = (osName: string, size: number = 14) => {
    const name = (osName || "").toLowerCase();
    if (name.includes("windows")) {
      return <WindowsLogo size={size} style={{ color: "#0078d4", verticalAlign: "middle" }} />;
    } else if (name.includes("darwin") || name.includes("mac") || name.includes("apple")) {
      return <AppleLogo size={size} style={{ color: "#ffffff", verticalAlign: "middle" }} />;
    }
    return <Terminal size={size} style={{ color: "var(--accent-cyan)", verticalAlign: "middle" }} />;
  };

  // Cuộn lên đầu trang khi thay đổi view chính hoặc tab chi tiết để đảm bảo luôn hiển thị từ đầu
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 30);
    return () => clearTimeout(timer);
  }, [showAdminPanel, showProfile, showGuide, selectedDevice?.id, activeDetailTab]);

  // Nạp chủ đề đã lưu khi tải trang
  const [activeTheme, setActiveTheme] = useState("cyan");
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  const [activeFont, setActiveFont] = useState("jetbrains-mono");

  const fontChoices = [
    { id: "jetbrains-mono", label: "JetBrains Mono", category: "Mono", stack: "'JetBrains Mono', monospace", fontUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" },
    { id: "ibm-plex-mono", label: "IBM Plex Mono", category: "Mono", stack: "'IBM Plex Mono', monospace", fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap" },
    { id: "inter", label: "Inter", category: "Sans", stack: "'Inter', sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    { id: "ibm-plex-sans", label: "IBM Plex Sans", category: "Sans", stack: "'IBM Plex Sans', sans-serif", fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" },
    { id: "spectral", label: "Spectral", category: "Serif", stack: "'Spectral', serif", fontUrl: "https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;700&display=swap" },
    { id: "ibm-plex-serif", label: "IBM Plex Serif", category: "Serif", stack: "'IBM Plex Serif', serif", fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;700&display=swap" }
  ];

  const applyFontInPage = (fontId: string) => {
    const choice = fontChoices.find(f => f.id === fontId) || fontChoices[0];
    setActiveFont(fontId);
    localStorage.setItem("vpsward_font", fontId);
    
    if (choice.fontUrl && typeof document !== "undefined") {
      let link = document.querySelector(`link[href="${choice.fontUrl}"]`);
      if (!link) {
        const newLink = document.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = choice.fontUrl;
        document.head.appendChild(newLink);
      }
    }
    
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--theme-font-sans", choice.stack);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("vpsward_theme") || "cyan";
    setActiveTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedFont = localStorage.getItem("vpsward_font") || "jetbrains-mono";
    applyFontInPage(savedFont);

    const handleGlobalThemeChange = () => {
      setActiveTheme(localStorage.getItem("vpsward_theme") || "cyan");
    };
    window.addEventListener("vpsward_theme_changed", handleGlobalThemeChange);
    return () => {
      window.removeEventListener("vpsward_theme_changed", handleGlobalThemeChange);
    };
  }, []);

  const handleThemeChangeInPage = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem("vpsward_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new Event("vpsward_theme_changed"));
    showToast("Đã thay đổi chủ đề giao diện thành công", "success");
  };

  // Toggle Drawer Sidebar cho Mobile
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  // Trạng thái modal thêm thiết bị mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceOS, setNewDeviceOS] = useState("linux");
  const [newTokenResult, setNewTokenResult] = useState<{ id: string; token: string } | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<Record<string, { cpu: number[]; ram: number[]; timestamps: string[] }>>({});
  
  // Trạng thái copy & hiển thị token bảo mật của thiết bị
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [revealToken, setRevealToken] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Đã sao chép ${label}`, "success");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleTokenReveal = (deviceId: string) => {
    setRevealToken(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  // Trạng thái Web Terminal
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [terminalLoading, setTerminalLoading] = useState<boolean>(false);
  const [currentCmdId, setCurrentCmdId] = useState<string | null>(null);
  const [terminalCommand, setTerminalCommand] = useState<string>("");
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Trạng thái đổi tên thiết bị
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  const handleRenameSubmit = async () => {
    if (!selectedDevice || !editingName.trim()) return;
    try {
      const res = await fetch(`${getApiBase()}/api/devices/${selectedDevice.id}/rename`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingName.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể đổi tên thiết bị");
      }
      const data = await res.json();
      showToast(data.message || "Đổi tên thiết bị thành công", "success");
      
      // Cập nhật lại danh sách thiết bị
      setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, name: data.name } : d));
      // Cập nhật lại thiết bị đang chọn
      setSelectedDevice(prev => prev ? { ...prev, name: data.name } : null);
      setIsEditingName(false);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Phân trang các bảng chi tiết của thiết bị
  const ITEMS_PER_PAGE = 15;
  const [portsPage, setPortsPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [dockerPage, setDockerPage] = useState(1);
  const [nginxPage, setNginxPage] = useState(1);

  // Reset phân trang khi đổi thiết bị hoặc chuyển tab
  useEffect(() => {
    setPortsPage(1);
    setServicesPage(1);
    setDockerPage(1);
    setNginxPage(1);
  }, [selectedDevice?.id, activeDetailTab]);

  const renderPagination = (currentPage: number, totalItems: number, itemsPerPage: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pages = [];
    const range = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        pages.push(i);
      } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
        pages.push(-1);
      }
    }

    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trên tổng số {totalItems}
        </span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              background: currentPage === 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 0,
              padding: "5px 10px",
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
              fontSize: "12px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Trước
          </button>
          {pages.map((p, idx) => {
            if (p === -1) {
              return <span key={idx} style={{ color: "var(--text-muted)", alignSelf: "center", padding: "0 2px" }}>...</span>;
            }
            return (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                style={{
                  background: currentPage === p ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  border: "1px solid",
                  borderColor: currentPage === p ? "rgba(56, 189, 248, 0.3)" : "rgba(255,255,255,0.06)",
                  borderRadius: 0,
                  padding: "5px 10px",
                  minWidth: "28px",
                  color: currentPage === p ? "#38bdf8" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: currentPage === p ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {p}
              </button>
            );
          })}
          <button 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              background: currentPage === totalPages ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 0,
              padding: "5px 10px",
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              fontSize: "12px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  const sendTerminalCommand = (customCmd?: string) => {
    const commandToSend = customCmd !== undefined ? customCmd : terminalCommand;
    if (!commandToSend.trim()) return;
    if (!selectedDevice) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast("Kết nối WebSocket chưa sẵn sàng hoặc đã đóng", "error");
      return;
    }

    const cmdId = Math.random().toString(36).substring(7);
    setCurrentCmdId(cmdId);
    setTerminalLoading(true);
    if (customCmd === undefined) {
      setTerminalCommand("");
    }

    setTerminalOutput((prev) => prev + `root@${selectedDevice.name}:~$ ${commandToSend}\n`);

    wsRef.current.send(JSON.stringify({
      action: "terminal_cmd",
      device_id: selectedDevice.id,
      command: commandToSend,
      cmd_id: cmdId
    }));
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Dữ liệu đã phân trang cho các bảng chi tiết
  const paginatedPorts = selectedDevice?.ports 
    ? selectedDevice.ports.slice((portsPage - 1) * ITEMS_PER_PAGE, portsPage * ITEMS_PER_PAGE) 
    : [];
  const paginatedServices = selectedDevice?.services 
    ? selectedDevice.services.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE) 
    : [];
  const paginatedDockers = selectedDevice?.dockers 
    ? selectedDevice.dockers.slice((dockerPage - 1) * ITEMS_PER_PAGE, dockerPage * ITEMS_PER_PAGE) 
    : [];
  const paginatedNginx = selectedDevice?.nginx 
    ? selectedDevice.nginx.slice((nginxPage - 1) * ITEMS_PER_PAGE, nginxPage * ITEMS_PER_PAGE) 
    : [];

  // Khởi động lịch sử thông số của thiết bị khi chọn xem chi tiết
  useEffect(() => {
    if (selectedDevice) {
      const ramPercent = selectedDevice.ram_total ? Math.round((selectedDevice.ram_used / selectedDevice.ram_total) * 100) : 0;
      setMetricsHistory((prev) => {
        if (prev[selectedDevice.id]) return prev;
        
        // Tạo sẵn 15 điểm dữ liệu để biểu đồ hiển thị mượt mà ngay lập tức
        const cpu = Array(15).fill(selectedDevice.cpu_usage);
        const ram = Array(15).fill(ramPercent);
        const now = new Date();
        const timestamps = Array(15).fill(0).map((_, idx) => {
          const d = new Date(now.getTime() - (15 - idx) * 5000);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });
        
        return {
          ...prev,
          [selectedDevice.id]: { cpu, ram, timestamps }
        };
      });
    }
  }, [selectedDevice?.id]);

  const wsRef = useRef<WebSocket | null>(null);
  const selectedDeviceRef = useRef<Device | null>(null);

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // 1. Kiểm tra trạng thái đăng nhập đã lưu trong Local Storage
  useEffect(() => {
    const savedToken = localStorage.getItem("vpsward_token");
    const savedUserId = localStorage.getItem("vpsward_user_id");
    const savedUsername = localStorage.getItem("vpsward_username");

    if (savedToken && savedUserId && savedUsername) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUsername(savedUsername);

      // Giải mã kiểm tra role Admin
      try {
        const payloadBase64 = savedToken.split(".")[1];
        const payload = JSON.parse(atob(payloadBase64));
        if (payload.roles && payload.roles.includes("super_admin")) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    }
  }, []);

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
  };

  // 1.1 Lấy Avatar khi khởi chạy hoặc khi cập nhật profile thành công
  useEffect(() => {
    if (!token) return;
    async function fetchUserAvatar() {
      try {
        const res = await fetch(`${getApiBase()}/api/profile`, {
          headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          } else {
            setAvatarUrl(null);
          }
        }
      } catch (e) {
        console.error("Lỗi lấy avatar:", e);
      }
    }
    fetchUserAvatar();
  }, [token, showProfile]);

  // 2. Lấy danh sách thiết bị khi có token và userId
  useEffect(() => {
    if (!token || !userId) return;

    async function fetchDevices() {
      setLoading(true);
      try {
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const apiBase = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
        
        const res = await fetch(`${apiBase}/api/devices`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setDevices(data || []);
          setSelectedDevice(null);
        } else if (res.status === 401) {
          // Token hết hạn hoặc không hợp lệ -> Đăng xuất
          handleLogout();
        }
      } catch (err) {
        console.error("Không thể lấy danh sách thiết bị:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
  }, [token, userId]);

  // 3. Thiết lập WebSocket Realtime Stream
  useEffect(() => {
    if (!userId || !token) return;

    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const wsProto = host === "localhost" || host === "127.0.0.1" ? "ws" : "wss";
    const wsUrl = host === "localhost" || host === "127.0.0.1"
      ? `ws://localhost:8080/user/ws?token=${token}`
      : `wss://${host}/user/ws?token=${token}`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      console.log("WebSocket connected");
    };

    socket.onclose = () => {
      setWsConnected(false);
      console.log("WebSocket disconnected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.action === "terminal_output") {
          setTerminalOutput((prev) => prev + payload.output);
          if (payload.eof) {
            setTerminalLoading(false);
            setCurrentCmdId(null);
          }
          return;
        }

        if (payload.device_id) {
          setDevices((prevDevices) => {
            const updated = prevDevices.map((dev) => {
              if (dev.id === payload.device_id) {
                const updatedDev = {
                  ...dev,
                  status: "online",
                  os: payload.os || dev.os,
                  cpu_model: payload.cpu_model || dev.cpu_model,
                  cpu_usage: payload.cpu_usage,
                  ram_total: payload.ram_total,
                  ram_used: payload.ram_used,
                  uptime: payload.uptime,
                  last_seen: new Date().toISOString(),
                };
                
                // Cập nhật phân vùng đĩa thực tế từ agent gửi lên
                if (payload.disks && payload.disks.length > 0) {
                  updatedDev.disks = payload.disks;
                }

                // Cập nhật danh sách cổng mạng đang mở từ agent gửi lên
                if (payload.ports && payload.ports.length > 0) {
                  updatedDev.ports = payload.ports;
                }

                // Cập nhật dịch vụ hệ thống từ agent gửi lên
                if (payload.services && payload.services.length > 0) {
                  updatedDev.services = payload.services;
                }

                // Cập nhật container Docker từ agent gửi lên
                if (payload.dockers && payload.dockers.length > 0) {
                  updatedDev.dockers = payload.dockers;
                }

                // Cập nhật cấu hình Nginx từ agent gửi lên
                if (payload.nginx && payload.nginx.length > 0) {
                  updatedDev.nginx = payload.nginx;
                }
                
                // Đồng bộ thiết bị đang active được chọn xem chi tiết
                if (selectedDeviceRef.current && selectedDeviceRef.current.id === dev.id) {
                  setSelectedDevice(updatedDev);
                }
                return updatedDev;
              }
              return dev;
            });
            return updated;
          });

          // Cập nhật lịch sử thông số của thiết bị
          const cpuVal = payload.cpu_usage;
          const ramVal = payload.ram_total ? Math.round((payload.ram_used / payload.ram_total) * 100) : 0;
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          setMetricsHistory((prev) => {
            const devHist = prev[payload.device_id] || { cpu: [], ram: [], timestamps: [] };
            const newCpu = [...devHist.cpu, cpuVal].slice(-30);
            const newRam = [...devHist.ram, ramVal].slice(-30);
            const newTimes = [...devHist.timestamps, timeStr].slice(-30);
            return {
              ...prev,
              [payload.device_id]: { cpu: newCpu, ram: newRam, timestamps: newTimes }
            };
          });
        }
      } catch (err) {
        console.error("Lỗi phân tích WebSocket JSON stream:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [userId, token]);

  // Xử lý thêm thiết bị mới
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewTokenResult(null);

    if (!newDeviceName.trim()) {
      showToast("Tên thiết bị không được để trống", "error");
      return;
    }

    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const apiBase = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;

    try {
      const res = await fetch(`${apiBase}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDeviceName,
          os: newDeviceOS
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo thiết bị");
      }

      setNewTokenResult({
        id: data.device_id,
        token: data.agent_token
      });
      showToast("Tạo thiết bị mới thành công!", "success");

      // Reload danh sách thiết bị
      const devRes = await fetch(`${apiBase}/api/devices`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData || []);
      }

      setNewDeviceName("");
    } catch (err: any) {
      showToast(err.message || "Tác vụ tạo thiết bị thất bại", "error");
    }
  };

  function handleLogout() {
    localStorage.removeItem("vpsward_token");
    localStorage.removeItem("vpsward_user_id");
    localStorage.removeItem("vpsward_username");
    
    // Đóng kết nối websocket nếu có
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
    }

    // Thiết lập lại toàn bộ các state của React về mặc định
    setToken(null);
    setUserId(null);
    setUsername(null);
    setIsAdmin(false);
    setDevices([]);
    setSelectedDevice(null);
    setShowAdminPanel(false);
    setShowProfile(false);
    setShowGuide(false);
    setShowMobileNav(false);

    showToast("Đã đăng xuất tài khoản", "info");
    
    // Buộc trình duyệt tải lại trang (hard reload) để dọn dẹp sạch sẽ bộ nhớ đệm (React state & cache)
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  }

  const formatGB = (bytes: number) => {
    if (!bytes) return "0 GB";
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getRamPercent = (used: number, total: number) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  const getDiskPercent = (used: number, total: number) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0 giờ";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} ngày ${h} giờ`;
    if (h > 0) return `${h} giờ ${m} phút`;
    return `${m} phút`;
  };

  const handleAuthSuccess = (newToken: string, newUserId: string, newUsername: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setUsername(newUsername);

    // Giải mã kiểm tra role Admin khi vừa login thành công
    try {
      const payloadBase64 = newToken.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      if (payload.roles && payload.roles.includes("super_admin")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  };

  // Màn hình Đăng ký/Đăng nhập nếu chưa có token hoạt động (Không hiển thị header & footer)
  if (!token) {
    return (
      <div className={styles.pageWrapper} style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Auth onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Phân quyền: Nếu KHÔNG phải Admin thì KHÔNG hiển thị phần Banner Nâng cấp PayOS (Vì người dùng thường không quản lý/sửa cấu hình được)
  // Thay vào đó người dùng thường chỉ xem được thiết bị của họ.
  // Lưu ý: Banner này chỉ dành cho Admin quản trị hoặc người dùng nâng cấp gói. 
  // Để phân biệt rõ ràng: Admin có nút "Admin Panel", User thường có nút "Nâng cấp gói" nhưng không vào được quản trị.

    const isHomeActive = !selectedDevice && !showProfile && !showGuide && !showAdminPanel;
  const isUsersActive = showAdminPanel && adminTab === "users";
  const isPaymentsActive = showAdminPanel && adminTab === "payments";
  const isPackagesActive = showAdminPanel && adminTab === "packages";
  const isDevicesActive = showAdminPanel && adminTab === "devices";
  const isProfileActive = showProfile;
  const isGuideActive = showGuide;

  return (
    <div className={styles.appLayout}>
      {/* Sidebar trượt di động hoặc cố định trên Desktop */}
      {showMobileNav && (
        <div className={styles.drawerOverlay} onClick={() => setShowMobileNav(false)}></div>
      )}
      <aside className={`${styles.sidebar} ${showMobileNav ? styles.sidebarOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <div 
            className={styles.logoArea} 
            style={{ cursor: "pointer" }} 
            onClick={() => {
              setShowMobileNav(false);
              setShowAdminPanel(false);
              setShowProfile(false);
              setShowGuide(false);
              setSelectedDevice(null);
            }}
          >
            <img src="/fire_logo.png" alt="Logo" className={styles.logoImg} />
            <h2 className={styles.logoText} style={{ margin: 0 }}>VPS-WARD</h2>
          </div>
          <button className={styles.drawerCloseBtn} onClick={() => setShowMobileNav(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* Các tính năng Quản Trị đặt trực tiếp trên Sidebar */}
          {isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <span className={styles.sidebarTitle} style={{ fontSize: "11px", paddingLeft: "12px", marginBottom: "4px" }}>
                Quản lý
              </span>
              <button 
                className={`${styles.drawerNavLink} ${isUsersActive ? styles.drawerNavLinkActive : ""}`}
                onClick={() => {
                  setShowMobileNav(false);
                  setAdminTab("users");
                  setShowProfile(false);
                  setShowGuide(false);
                  setShowAdminPanel(true);
                }}
              >
                <Settings size={16} /> Tài khoản
              </button>
              <button 
                className={`${styles.drawerNavLink} ${isPaymentsActive ? styles.drawerNavLinkActive : ""}`}
                onClick={() => {
                  setShowMobileNav(false);
                  setAdminTab("payments");
                  setShowProfile(false);
                  setShowGuide(false);
                  setShowAdminPanel(true);
                }}
              >
                <Terminal size={16} /> Lịch sử PayOS
              </button>
              <button 
                className={`${styles.drawerNavLink} ${isPackagesActive ? styles.drawerNavLinkActive : ""}`}
                onClick={() => {
                  setShowMobileNav(false);
                  setAdminTab("packages");
                  setShowProfile(false);
                  setShowGuide(false);
                  setShowAdminPanel(true);
                }}
              >
                <Receipt size={16} /> Gói dịch vụ
              </button>
              <button 
                className={`${styles.drawerNavLink} ${isDevicesActive ? styles.drawerNavLinkActive : ""}`}
                onClick={() => {
                  setShowMobileNav(false);
                  setAdminTab("devices");
                  setShowProfile(false);
                  setShowGuide(false);
                  setShowAdminPanel(true);
                }}
              >
                <Smartphone size={16} /> Thiết bị hệ thống
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={styles.drawerNav} style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <span className={styles.sidebarTitle} style={{ fontSize: "11px", paddingLeft: "12px", marginBottom: "4px" }}>
              Cá nhân
            </span>
            <button 
              className={`${styles.drawerNavLink} ${isHomeActive ? styles.drawerNavLinkActive : ""}`}
              onClick={() => {
                setShowMobileNav(false);
                setShowAdminPanel(false);
                setShowProfile(false);
                setShowGuide(false);
                setSelectedDevice(null);
              }}
            >
              <Globe size={16} /> Trang chủ
            </button>
            <button 
              className={`${styles.drawerNavLink} ${isProfileActive ? styles.drawerNavLinkActive : ""}`}
              onClick={() => {
                setShowMobileNav(false);
                setShowAdminPanel(false);
                setShowGuide(false);
                setShowProfile(true);
              }}
            >
              <User size={16} /> Thông tin tài khoản
            </button>
            <button 
              className={`${styles.drawerNavLink} ${isGuideActive ? styles.drawerNavLinkActive : ""}`}
              onClick={() => { 
                setShowMobileNav(false);
                setShowAdminPanel(false);
                setShowProfile(false);
                setShowGuide(true);
              }}
            >
              <BookOpen size={16} /> Hướng dẫn cài đặt
            </button>
          </nav>

          {/* Bottom Section: Avatar + Tài khoản và Nút Đăng xuất ở dưới cùng */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "24px", flexShrink: 0 }}>
            {/* Theme Switcher Button (Hermes Style Drawer Toggle) */}
            <div>
              <button 
                type="button"
                className={styles.drawerNavLink}
                onClick={() => {
                  setShowThemeDrawer(true);
                  setShowMobileNav(false); // Đóng ngay mobile sidebar
                }}
                style={{ cursor: "pointer" }}
              >
                <Palette size={16} /> 
                <span>Giao diện: {[
                  { id: "cyan", name: "Hermes Teal" },
                  { id: "violet", name: "LIT Violet" },
                  { id: "midnight", name: "Midnight" },
                  { id: "emerald", name: "Emerald" },
                  { id: "ember", name: "Ember" },
                  { id: "mono", name: "Mono" },
                  { id: "cyberpunk", name: "Cyberpunk" },
                  { id: "rose", name: "Rosé" },
                  { id: "nous-blue", name: "Light Mode" }
                ].find((t) => t.id === activeTheme)?.name || "Mặc định"}</span>
              </button>
            </div>

            {/* Thông tin tài khoản */}
            <div className={styles.drawerUserInfo} style={{ marginBottom: 0 }}>
              {/* Avatar vuông góc chuẩn Hermes */}
              <div 
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: 0,
                  flexShrink: 0,
                  background: avatarUrl 
                    ? `url(${getApiBase()}${avatarUrl}) center/cover no-repeat`
                    : "linear-gradient(135deg, var(--accent-cyan) 0%, rgba(0,0,0,0.6) 100%)",
                  border: "1.5px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fff"
                }}
              >
                {!avatarUrl && (username ? username.charAt(0).toUpperCase() : "U")}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                <div className={styles.drawerUserRow}>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "#fff", display: "block" }} className="truncate">{username}</span>
                </div>
                <div className={styles.drawerUserRow}>
                  <span className={`${styles.dot} ${wsConnected ? styles.dotOnline : styles.dotOffline}`} style={{ width: "6px", height: "6px" }}></span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {wsConnected ? "Trực tuyến" : "Mất kết nối"}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút Đăng xuất */}
            <button 
              className={styles.drawerLogoutBtn} 
              onClick={() => {
                setShowMobileNav(false);
                handleLogout();
              }}
            >
              <LogOut size={16} style={{ marginRight: "6px" }} />
              Đăng xuất tài khoản
            </button>

            {/* Version Info */}
            <div style={{ textAlign: "center", marginTop: "2px", fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              v1.0.0
            </div>
          </div>
        </div>
      </aside>

      {/* Vùng hiển thị nội dung chính */}
      <div className={styles.mainArea}>
        {/* Header đặt ngoài container chính để hỗ trợ bám dính toàn màn hình (sticky full-width) */}
        <header className={styles.header}>
          <div className={styles.headerContent} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Logo chỉ hiển thị trên di động trong header */}
            <div className={`${styles.logoArea} ${styles.logoAreaMobile}`} style={{ cursor: "pointer" }} onClick={() => {
              setShowAdminPanel(false);
              setShowProfile(false);
              setShowGuide(false);
              setSelectedDevice(null);
            }}>
              <img 
                src="/fire_logo.png" 
                alt="Logo" 
                className={styles.logoImg} 
              />
              <h1 className={styles.logoText}>VPS-WARD</h1>
            </div>
            
            {/* Nút Toggle Hamburger cho Mobile hiển thị bên phải */}
            <button 
              className={styles.hamburgerBtn} 
              onClick={() => setShowMobileNav(true)}
              title="Menu"
            >
              <Menu size={22} />
            </button>

            <div className={styles.headerActionsDesktop}>
              <span className={`${styles.statusIndicator} ${styles.userBadge}`}>
                <span className={`${styles.dot} ${wsConnected ? styles.dotOnline : styles.dotOffline}`}></span>
                {wsConnected ? "Realtime Live" : "Disconnected"}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className={styles.container}>
        {/* Main Grid */}
        <div className={styles.dashboardGrid}>
          {/* Modal thêm thiết bị */}
          {showAddModal && (
            <div className={`${styles.modalOverlay} modalOverlay`}>
              <div className={styles.modalCard}>
                <h3 className={styles.modalTitle}>Thêm Thiết Bị Giám Sát Mới</h3>
                
                {!newTokenResult ? (
                  <form onSubmit={handleCreateDevice} style={{ display: "flex", gap: "14px", flexDirection: "column" }}>
                    <div className={styles.modalInputGroup}>
                      <label className={styles.modalLabel}>Tên máy chủ / VPS</label>
                      <input 
                        type="text" 
                        className={styles.modalInput}
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        placeholder="ví dụ: VPS Hanoi, Windows Home..."
                        required
                      />
                    </div>
                    
                    <div className={styles.modalInputGroup}>
                      <label className={styles.modalLabel}>Hệ điều hành</label>
                      <select 
                        className={styles.modalInput}
                        value={newDeviceOS}
                        onChange={(e) => setNewDeviceOS(e.target.value)}
                      >
                        <option value="linux">Linux (Ubuntu/CentOS/Debian)</option>
                        <option value="windows">Windows</option>
                        <option value="darwin">macOS (Darwin)</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                      <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Hủy</button>
                      <button type="submit" className={styles.confirmBtn}>Xác nhận tạo</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <p style={{ fontSize: "13px", color: "var(--accent-green)", margin: 0, fontWeight: 600 }}>
                      Thiết bị đã được khởi tạo thành công trên hệ thống!
                    </p>
                    
                    <div className={styles.tokenBox}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Security Agent Token (Copy để cấu hình Collector)
                      </span>
                      <code className={styles.tokenCode}>{newTokenResult.token}</code>
                      <span style={{ fontSize: "12px", color: "var(--accent-red)", marginTop: "4px" }}>
                        * Lưu ý: Token chỉ hiển thị 1 lần duy nhất này, vui lòng sao lưu cẩn thận.
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                      <button className={styles.confirmBtn} onClick={() => { setShowAddModal(false); setNewTokenResult(null); }}>
                        Hoàn thành
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HIỂN THỊ CÁC TAB ADMIN THAY THẾ CHO CHI TIẾT THIẾT BỊ NẾU ĐƯỢC CHỌN TỪ SIDEBAR */}
          {showAdminPanel ? (
            <div className={styles.glassPanel} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }}></span>
                  <h2 className={styles.sidebarTitle} style={{ margin: 0, fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Settings size={18} /> {adminTab === "users" ? "Quản lý tài khoản" : adminTab === "packages" ? "Quản lý gói cước" : adminTab === "payments" ? "Lịch sử giao dịch" : "Quản lý thiết bị"}
                  </h2>
                </div>
                <button className={styles.backBtn} onClick={() => { setShowAdminPanel(false); setShowProfile(false); setShowGuide(false); }}>
                  <ArrowLeft size={14} style={{ marginRight: "6px" }} /> Quay lại trang chủ
                </button>
              </div>

              <AdminDashboardPanel
                token={token}
                activeTab={adminTab as any}
              />
            </div>
          ) : showProfile ? (
            <div className={styles.glassPanel} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                  <h2 className={styles.sidebarTitle} style={{ margin: 0, fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "6px" }}>
                    <User size={18} /> Thông tin cá nhân
                  </h2>
                </div>
                <button className={styles.backBtn} onClick={() => { setShowAdminPanel(false); setShowProfile(false); setShowGuide(false); }}>
                  <ArrowLeft size={14} style={{ marginRight: "6px" }} /> Quay lại trang chủ
                </button>
              </div>

              {token && <UserProfile token={token} />}
            </div>
          ) : showGuide ? (
            <div className={styles.glassPanel} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308" }}></span>
                  <h2 className={styles.sidebarTitle} style={{ margin: 0, fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "6px" }}>
                    <BookOpen size={18} /> Hướng dẫn cài đặt Agent
                  </h2>
                </div>
                <button className={styles.backBtn} onClick={() => { setShowAdminPanel(false); setShowProfile(false); setShowGuide(false); }}>
                  <ArrowLeft size={14} style={{ marginRight: "6px" }} /> Quay lại trang chủ
                </button>
              </div>
              
              <InstallGuide />
            </div>
          ) : selectedDevice ? (
            // Chi tiết thiết bị
            <div className={styles.detailsContainer}>
              {/* Thanh tiêu đề và nút quay lại */}
              <div className={styles.detailHeaderBar}>
                <button className={styles.backBtn} onClick={() => setSelectedDevice(null)}>
                  <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Quay lại danh sách
                </button>
                <div className={styles.detailHeaderTitle}>
                  <span className={`${styles.dot} ${selectedDevice.status === "online" ? styles.dotOnline : styles.dotOffline}`}></span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: selectedDevice.status === "online" ? "var(--accent-green)" : "var(--text-muted)" }}>
                    {selectedDevice.status === "online" ? "Đang trực tuyến" : "Mất kết nối"}
                  </span>
                </div>
              </div>

              {/* Device Overview Card */}
              <div className={`${styles.glassPanel} ${styles.overviewGrid}`}>
                <div className={styles.overviewItem}>
                  <span className={styles.overviewLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Smartphone size={13} style={{ opacity: 0.8 }} /> Tên Thiết Bị
                  </span>
                  {isEditingName ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <input 
                        type="text" 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(56,189,248,0.5)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          color: "#fff",
                          fontSize: "14px",
                          outline: "none",
                          width: "140px"
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                      />
                      <button 
                        onClick={handleRenameSubmit} 
                        style={{ 
                          background: "rgba(52, 211, 153, 0.15)", 
                          border: "1px solid rgba(52, 211, 153, 0.3)", 
                          borderRadius: "6px", 
                          padding: "5px 10px", 
                          color: "var(--accent-green)", 
                          fontSize: "12px", 
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        Lưu
                      </button>
                      <button 
                        onClick={() => setIsEditingName(false)} 
                        style={{ 
                          background: "rgba(255,255,255,0.05)", 
                          border: "1px solid rgba(255,255,255,0.1)", 
                          borderRadius: "6px", 
                          padding: "5px 10px", 
                          color: "var(--text-secondary)", 
                          fontSize: "12px", 
                          cursor: "pointer" 
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className={styles.overviewValue}>{selectedDevice.name}</span>
                      <button 
                        onClick={() => { setIsEditingName(true); setEditingName(selectedDevice.name); }}
                        style={{ 
                          background: "rgba(255,255,255,0.04)", 
                          border: "1px solid rgba(255,255,255,0.06)", 
                          color: "rgba(255,255,255,0.5)", 
                          cursor: "pointer", 
                          display: "inline-flex", 
                          padding: "4px", 
                          borderRadius: "6px",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = "var(--accent-cyan)";
                          e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.3)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        }}
                        title="Đổi tên thiết bị"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <span className={styles.overviewSubValue}>ID: {selectedDevice.id.slice(0, 8)}...</span>
                </div>
                <div className={styles.overviewItem}>
                  <span className={styles.overviewLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} style={{ opacity: 0.8 }} /> Trạng Thái Hoạt Động
                  </span>
                  <span className={styles.overviewValue} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getOSIcon(selectedDevice.os, 16)} {selectedDevice.os}
                  </span>
                  <span className={styles.overviewSubValue}>Uptime: {formatUptime(selectedDevice.uptime)}</span>
                </div>
                <div className={styles.overviewItem}>
                  <span className={styles.overviewLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Globe size={13} style={{ opacity: 0.8 }} /> Địa chỉ IP & Mạng
                  </span>
                  <span className={styles.overviewValue}>{selectedDevice.ip_address || "127.0.0.1"}</span>
                  <span className={styles.overviewSubValue}>Ping / Agent live</span>
                </div>
              </div>

              {/* Agent Security Token Card */}
              <div className={`${styles.glassPanel}`} style={{ marginTop: "16px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className={styles.overviewLabel} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor" style={{ opacity: 0.8 }}>
                    <path d="M224,96a64,64,0,0,0-101.44-52.6l-88,88a16,16,0,0,0-4.56,11.31V184a16,16,0,0,0,16,16h24v24a8,8,0,0,0,8,8h24a8,8,0,0,0,8-8V208h16a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l5.42-5.43A63.81,63.81,0,0,0,224,96ZM208,96a48,48,0,0,1-81.88,34l-5.78,5.78a8,8,0,0,0-2.34,5.66v16H102a8,8,0,0,0-8,8v16H78a8,8,0,0,0-8,8v16H48V172.69L133,87.75A8,8,0,0,0,131,76a48,48,0,0,1,77,20ZM188,76a12,12,0,1,1-12,12A12,12,0,0,1,188,76Z"/>
                  </svg> Mã Token Bảo Mật Thiết Bị (Security Agent Token)
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                    <div className={styles.secretTokenContainer}>
                      <span className={`${styles.secretTokenText} ${revealToken[selectedDevice.id] ? styles.revealed : styles.masked}`}>
                        {selectedDevice.agent_token || "Chưa có token"}
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleTokenReveal(selectedDevice.id)}
                      className={styles.tokenActionBtn}
                      title={revealToken[selectedDevice.id] ? "Ẩn Token" : "Xem Token"}
                    >
                      {revealToken[selectedDevice.id] ? (
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M228.32,154.52l12.51,12.52a8,8,0,0,1-11.31,11.31l-18.73-18.72a114.73,114.73,0,0,1-29.17,16.58l4.49,17.94a8,8,0,0,1-15.52,3.88l-4.57-18.25a127,127,0,0,1-55.1,0l-4.57,18.25a8,8,0,0,1-7.76,6.06,8.23,8.23,0,0,1-1.94-.24,8,8,0,0,1-5.82-9.7l4.49-17.94a114.73,114.73,0,0,1-29.17-16.58L50.48,178.35a8,8,0,0,1-11.31-11.31l12.51-12.52C34.34,138.83,27,124.69,26.69,124.08a8,8,0,0,1,0-6.16c.15-.3,3.7-7.79,12-16.89L22.8,92.8a8,8,0,0,1,11.31-11.31L233.9,223.75A8,8,0,0,1,228.32,154.52ZM128,88a40.08,40.08,0,0,1,38.6,30.34l-58.94-58.94A39.73,39.73,0,0,1,128,88ZM43.46,121c9,13.22,34.09,39,84.54,39a111,111,0,0,0,27.18-3.41L138.3,139.7A24,24,0,0,1,116.3,117.7L82,83.41a100.86,100.86,0,0,0-38.54,37.59ZM233.1,117.92c-.15-.3-3.7-7.79-12-16.89a117.81,117.81,0,0,0-58.84-36.27l4.49-17.94a8,8,0,0,0-15.52-3.88l-4.49,17.94a112.52,112.52,0,0,0-33.16,10.66l-12.2-12.2A8,8,0,1,0,90,90l122.8,122.8a8,8,0,0,0,11.31-11.31l-14.79-14.79a114.73,114.73,0,0,0,29.17-16.58C232.74,159.22,233,158.45,233.1,117.92Zm-61.4,14L150.08,110.3A24,24,0,0,1,171.7,131.92Z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M247.31,124.76c-.35-.79-8.82-19.74-27.95-38.87C196.48,63,164.53,52,128,52S59.52,63,36.64,85.89C17.51,105,9,124,8.69,124.76a8,8,0,0,0,0,6.48c.35.79,8.82,19.74,27.95,38.87C59.52,193,91.47,204,128,204s68.48-11,91.36-33.89c19.13-19.13,27.6-38.08,27.95-38.87A8,8,0,0,0,247.31,124.76ZM128,188c-29.21,0-55.85-9.17-74.87-25.86a117.84,117.84,0,0,1-23.77-28C48.06,117.81,75.4,103,128,103s79.94,14.81,98.64,31.14a117.84,117.84,0,0,1-23.77,28C183.85,178.83,157.21,188,128,188Zm0-100a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Z"/>
                        </svg>
                      )}
                    </button>
                    <button 
                      onClick={() => handleCopy(selectedDevice.agent_token || "", "Mã Token")}
                      className={styles.tokenActionBtn}
                      title="Sao chép Token"
                      disabled={!selectedDevice.agent_token}
                    >
                      {copiedText === "Mã Token" ? (
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" style={{ color: "var(--accent-green)" }}>
                          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.31,0l-56-56a8,8,0,0,1,11.31-11.31L100,192.69,218.34,74.34a8,8,0,0,1,11.31,11.31Z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M216,40H88a16,16,0,0,0-16,16V72H56A16,16,0,0,0,40,88V216a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V200h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM184,216H56V88H184V216Zm32-32H200V88a16,16,0,0,0-16-16H88V56H216V184Z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.35)", fontStyle: "italic" }}>
                    * Sử dụng mã token này để cấu hình khi cài đặt Collector trên VPS.
                  </span>
                </div>
              </div>

              {/* CPU & RAM Grid */}
              <div className={styles.metricsGrid}>
                {/* CPU usage */}
                <div className={`${styles.glassPanel} ${styles.metricCard}`}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricTitle}>Sử dụng CPU</span>
                    <Cpu size={18} color="var(--accent-cyan)" />
                  </div>
                  <span className={styles.metricValue}>{selectedDevice.cpu_usage.toFixed(1)}%</span>
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={`${styles.progressBar} ${styles.bgCyan}`} 
                      style={{ width: `${selectedDevice.cpu_usage}%` }}
                    ></div>
                  </div>
                  <SparklineChart 
                    data={metricsHistory[selectedDevice.id]?.cpu || []} 
                    color="#38bdf8" 
                  />
                  {selectedDevice.cpu_model && (
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }} title={selectedDevice.cpu_model}>
                      {selectedDevice.cpu_model}
                    </div>
                  )}
                </div>

                {/* RAM usage */}
                <div className={`${styles.glassPanel} ${styles.metricCard}`}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricTitle}>Sử dụng RAM</span>
                    <Monitor size={18} color="var(--accent-green)" />
                  </div>
                  <span className={styles.metricValue}>
                    {getRamPercent(selectedDevice.ram_used, selectedDevice.ram_total)}%
                  </span>
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={`${styles.progressBar} ${styles.bgGreen}`} 
                      style={{ width: `${getRamPercent(selectedDevice.ram_used, selectedDevice.ram_total)}%` }}
                    ></div>
                  </div>
                  <span className={styles.overviewSubValue} style={{ marginTop: "-4px" }}>
                    Đã dùng {formatGB(selectedDevice.ram_used)} trên {formatGB(selectedDevice.ram_total)}
                  </span>
                  <SparklineChart 
                    data={metricsHistory[selectedDevice.id]?.ram || []} 
                    color="#4ade80" 
                  />
                </div>
              </div>

              {/* Disks list */}
              <div className={`${styles.glassPanel} ${styles.disksSection}`}>
                <h3 className={styles.sectionTitle}>Các Phân Vùng Ổ Đĩa Thực Tế</h3>
                {selectedDevice.disks && selectedDevice.disks.length > 0 ? (
                  <div className={styles.diskMenu}>
                    {selectedDevice.disks.map((disk, idx) => {
                      const diskPercent = getDiskPercent(disk.used_size, disk.total_size);
                      const isHighUsage = diskPercent > 85;
                      return (
                        <div key={idx} className={styles.diskItem}>
                          <div className={styles.diskMeta}>
                            <span className={styles.diskPath}>
                              <HardDrive size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                              {disk.path}
                            </span>
                            <span className={styles.diskUsageText}>
                              {diskPercent}% ({formatGB(disk.used_size)} / {formatGB(disk.total_size)})
                            </span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={`${styles.progressBar} ${isHighUsage ? styles.bgRed : styles.bgCyan}`} 
                              style={{ width: `${diskPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    Không tìm thấy phân vùng đĩa nào hoặc đang chờ nhận dữ liệu từ Agent...
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className={styles.tabsHeader}>
                <button
                  className={`${styles.tabBtn} ${activeDetailTab === "ports" ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveDetailTab("ports")}
                >
                  Cổng Kết Nối ({selectedDevice.ports?.length || 0})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeDetailTab === "services" ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveDetailTab("services")}
                >
                  Dịch Vụ ({selectedDevice.services?.length || 0})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeDetailTab === "docker" ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveDetailTab("docker")}
                >
                  Docker Containers ({selectedDevice.dockers?.length || 0})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeDetailTab === "nginx" ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveDetailTab("nginx")}
                >
                  Nginx Virtual Hosts ({selectedDevice.nginx?.length || 0})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeDetailTab === "terminal" ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveDetailTab("terminal")}
                >
                  Web Terminal
                </button>
              </div>

              {/* Tab Contents */}
              <div className={styles.tabContentPanel}>
                {activeDetailTab === "ports" && (
                  <div className={`${styles.glassPanel} ${styles.portsSection}`}>
                    <h3 className={styles.sectionTitle}>Các Cổng Mạng Đang Mở (Menuening Ports)</h3>
                    {selectedDevice.ports && selectedDevice.ports.length > 0 ? (
                      <div className={styles.portsTableContainer}>
                        <table className={styles.portsTable}>
                          <thead>
                            <tr>
                              <th>Cổng</th>
                              <th>Giao thức</th>
                              <th>Địa chỉ nghe (Bind)</th>
                              <th>Tiến trình</th>
                              <th>PID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPorts.map((port, idx) => (
                              <tr key={idx}>
                                <td data-label="Cổng">
                                  <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                                    {port.port}
                                  </span>
                                </td>
                                <td data-label="Giao thức">
                                  <span className={`${styles.portBadge} ${port.proto === "TCP" ? styles.portBadgeTcp : styles.portBadgeUdp}`}>
                                    {port.proto}
                                  </span>
                                </td>
                                <td data-label="Địa chỉ nghe" style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>
                                  {port.ip}
                                </td>
                                <td data-label="Tiến trình">
                                  <span className={styles.portProcess}>
                                    {port.process}
                                  </span>
                                </td>
                                <td data-label="PID">
                                  <span className={styles.portPid}>
                                    {port.pid > 0 ? port.pid : "-"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {renderPagination(portsPage, selectedDevice.ports.length, ITEMS_PER_PAGE, setPortsPage)}
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Không tìm thấy cổng mạng đang mở nào hoặc đang chờ nhận dữ liệu từ Agent...
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "services" && (
                  <div className={`${styles.glassPanel} ${styles.portsSection}`}>
                    <h3 className={styles.sectionTitle}>Trạng Thái Dịch Vụ Hệ Thống (Systemd Services)</h3>
                    {selectedDevice.services && selectedDevice.services.length > 0 ? (
                      <div className={styles.portsTableContainer}>
                        <table className={styles.portsTable}>
                          <thead>
                            <tr>
                              <th>Tên dịch vụ</th>
                              <th>Mô tả</th>
                              <th>Trạng thái nạp</th>
                              <th>Trạng thái chạy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedServices.map((svc, idx) => (
                              <tr key={idx}>
                                <td data-label="Tên dịch vụ">
                                  <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                                    {svc.name}
                                  </span>
                                </td>
                                <td data-label="Mô tả" style={{ color: "var(--text-secondary)" }}>
                                  {svc.description || "-"}
                                </td>
                                <td data-label="Trạng thái nạp">
                                  <span className={`${styles.portBadge} ${styles.portBadgeUdp}`} style={{ opacity: 0.85 }}>
                                    {svc.load_state}
                                  </span>
                                </td>
                                <td data-label="Trạng thái chạy">
                                  <span className={`${styles.portBadge} ${svc.active_state === "active" ? styles.portBadgeTcp : styles.portBadgeError}`}>
                                    {svc.active_state}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {renderPagination(servicesPage, selectedDevice.services.length, ITEMS_PER_PAGE, setServicesPage)}
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Không tìm thấy dịch vụ hệ thống nào hoặc đang chờ nhận dữ liệu từ Agent...
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "docker" && (
                  <div className={`${styles.glassPanel} ${styles.portsSection}`}>
                    <h3 className={styles.sectionTitle}>Các Container Docker Đang Chạy (Docker Containers)</h3>
                    {selectedDevice.dockers && selectedDevice.dockers.length > 0 ? (
                      <div className={styles.portsTableContainer}>
                        <table className={styles.portsTable}>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Tên container</th>
                              <th>Hình ảnh (Image)</th>
                              <th>Trạng thái</th>
                              <th>CPU / RAM</th>
                              <th>Cổng map (Ports)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedDockers.map((dk, idx) => (
                              <tr key={idx}>
                                <td data-label="ID" style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-muted)" }}>
                                  {dk.container_id}
                                </td>
                                <td data-label="Tên container">
                                  <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                                    {dk.name}
                                  </span>
                                </td>
                                <td data-label="Hình ảnh" style={{ fontSize: "12px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                                  {dk.image}
                                </td>
                                <td data-label="Trạng thái">
                                  <span className={`${styles.portBadge} ${dk.status.startsWith("Up") || dk.status.includes("active") || dk.status.includes("running") ? styles.portBadgeTcp : styles.portBadgeUdp}`}>
                                    {dk.status}
                                  </span>
                                </td>
                                <td data-label="CPU / RAM" style={{ fontWeight: 500 }}>
                                  <span style={{ color: "var(--accent-cyan)" }}>{dk.cpu_usage.toFixed(1)}%</span>
                                  <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
                                  <span>
                                    {dk.ram_used > 0 ? `${(dk.ram_used / 1024 / 1024).toFixed(1)} MB` : "0 MB"}
                                  </span>
                                </td>
                                <td data-label="Cổng map" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                  {dk.ports_mapping || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {renderPagination(dockerPage, selectedDevice.dockers.length, ITEMS_PER_PAGE, setDockerPage)}
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Không có container Docker nào hoặc Docker đang không chạy trên thiết bị này...
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "nginx" && (
                  <div className={`${styles.glassPanel} ${styles.portsSection}`}>
                    <h3 className={styles.sectionTitle}>Các Domain Ảo Nginx (Virtual Hosts)</h3>
                    {selectedDevice.nginx && selectedDevice.nginx.length > 0 ? (
                      <div className={styles.portsTableContainer}>
                        <table className={styles.portsTable}>
                          <thead>
                            <tr>
                              <th>Tên miền (Domain)</th>
                              <th>Cổng nghe</th>
                              <th>Chuyển tiếp (Proxy Pass / Root)</th>
                              <th>Chứng chỉ SSL</th>
                              <th>Hạn SSL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedNginx.map((ng, idx) => {
                              let isExpired = false;
                              let expireDateStr = "-";
                              if (ng.ssl_expire_at) {
                                const exp = new Date(ng.ssl_expire_at);
                                isExpired = exp.getTime() < Date.now();
                                expireDateStr = exp.toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                });
                              }
                              return (
                                <tr key={idx}>
                                  <td data-label="Tên miền">
                                    <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                                      {ng.domain}
                                    </span>
                                  </td>
                                  <td data-label="Cổng nghe">
                                    <span className={styles.portPid}>
                                      {ng.port}
                                    </span>
                                  </td>
                                  <td data-label="Chuyển tiếp" style={{ fontSize: "12px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                                    {ng.proxy_pass ? (
                                      <span style={{ color: "var(--accent-pink)" }}>proxy ➔ {ng.proxy_pass}</span>
                                    ) : ng.root_path ? (
                                      <span>root ➔ {ng.root_path}</span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td data-label="Chứng chỉ SSL">
                                    {ng.ssl_active ? (
                                      <span className={`${styles.portBadge} ${styles.portBadgeTcp}`}>
                                        HTTPS (Active)
                                      </span>
                                    ) : (
                                      <span className={`${styles.portBadge} ${styles.portBadgeUdp}`} style={{ opacity: 0.7 }}>
                                        HTTP Only
                                      </span>
                                    )}
                                  </td>
                                  <td data-label="Hạn SSL">
                                    {ng.ssl_expire_at ? (
                                      <span className={`${styles.portBadge} ${isExpired ? styles.portBadgeError : styles.portBadgeTcp}`}>
                                        {expireDateStr}
                                      </span>
                                    ) : (
                                      <span style={{ color: "var(--text-muted)" }}>-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {renderPagination(nginxPage, selectedDevice.nginx.length, ITEMS_PER_PAGE, setNginxPage)}
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Không phát hiện cấu hình Nginx Virtual Host nào hoạt động...
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "terminal" && (
                  <div className={`${styles.glassPanel} ${styles.portsSection}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                      <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Web Terminal Điều Khiển Từ Xa</h3>
                      <button 
                        onClick={() => setTerminalOutput("")}
                        className={styles.tokenActionBtn}
                        style={{ width: "auto", height: "auto", padding: "6px 12px", fontSize: "12px", color: "var(--accent-pink)" }}
                        title="Xóa lịch sử lệnh trên màn hình console"
                      >
                        Xóa Màn Hình (Clear)
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center" }}>Lệnh nhanh:</span>
                      {[
                        { label: "Cấu hình OS", cmd: "uname -a" },
                        { label: "Dung lượng đĩa", cmd: "df -h" },
                        { label: "Bộ nhớ RAM", cmd: "free -m" },
                        { label: "Hoạt động VPS", cmd: "uptime" },
                        { label: "Mạng đang mở", cmd: "ss -tulpn" },
                        { label: "Docker container", cmd: "docker ps -a" },
                        { label: "CPU & RAM Docker", cmd: "docker stats --no-stream" },
                        { label: "Dịch vụ SSH", cmd: "systemctl status ssh" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendTerminalCommand(item.cmd)}
                          disabled={terminalLoading}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            color: "rgba(255, 255, 255, 0.7)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            if (!terminalLoading) {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                            }
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className={styles.terminalConsole} ref={terminalEndRef}>
                      <div className={styles.terminalIntro}>
                        === VPS-WARD REMOTE TERMINAL CONNECTED SUCCESSFULLY ===<br />
                        Nền tảng: {selectedDevice.os || "Linux"}<br />
                        Bấm chạy lệnh nhanh hoặc gõ lệnh trực tiếp tại dấu nhắc lệnh bên dưới.<br />
                        Lưu ý: Hỗ trợ các lệnh không tương tác (non-interactive).
                      </div>
                      <pre className={styles.terminalOutputPre}>{terminalOutput}</pre>
                      {terminalLoading && (
                        <div className={styles.terminalLoadingIndicator}>
                          <span className={styles.terminalSpinner}></span> Đang thực thi tiến trình trên VPS...
                        </div>
                      )}
                    </div>

                    <div className={styles.terminalInputContainer}>
                      <span className={styles.terminalPrompt}>
                        <span className={styles.terminalPromptUser}>root@{selectedDevice.name}:</span>
                        <span>~$</span>
                      </span>
                      <input
                        type="text"
                        value={terminalCommand}
                        onChange={(e) => setTerminalCommand(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            sendTerminalCommand();
                          }
                        }}
                        placeholder={terminalLoading ? "Vui lòng chờ lệnh trước hoàn thành..." : "Nhập lệnh shell (ví dụ: ls -la, ping -c 4 google.com)..."}
                        disabled={terminalLoading}
                        className={styles.terminalInput}
                      />
                      <button
                        onClick={() => sendTerminalCommand()}
                        disabled={terminalLoading || !terminalCommand.trim()}
                        className={styles.terminalSendBtn}
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Danh sách thiết bị dạng thẻ (Cards Grid)
            <div className={styles.devicesGridContainer}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h2 className={styles.sidebarTitle} style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                  <Smartphone size={20} /> Danh sách thiết bị
                </h2>
                <button className={styles.addBtnLarge} onClick={() => { setShowAddModal(true); setNewTokenResult(null); }}>
                  <Plus size={14} style={{ marginRight: "6px" }} /> Thêm thiết bị
                </button>
              </div>

              {loading ? (
                <div className={styles.glassPanel} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Đang tải danh sách thiết bị...
                </div>
              ) : devices.length > 0 ? (
                <div className={styles.devicesCardGrid}>
                  {devices.map((device) => {
                    const isOnline = device.status === "online";
                    const ramPercent = device.ram_total ? Math.round((device.ram_used / device.ram_total) * 100) : 0;
                    return (
                      <div 
                        key={device.id} 
                        className={styles.deviceOverviewCard}
                        onClick={() => {
                          setSelectedDevice(device);
                          setShowAdminPanel(false);
                          setShowProfile(false);
                          setShowGuide(false);
                        }}
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            <span className={styles.cardDeviceName}>{device.name}</span>
                            <span className={styles.cardDeviceMeta} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {getOSIcon(device.os, 14)} <span>{device.os}</span> · <Globe size={13} style={{ opacity: 0.8 }} /> {device.ip_address || "127.0.0.1"}
                            </span>
                          </div>
                          <div className={styles.cardStatusBadge}>
                            <span className={`${styles.dot} ${isOnline ? styles.dotOnline : styles.dotOffline}`}></span>
                            <span className={isOnline ? styles.statusOnlineText : styles.statusOfflineText}>
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                        
                        {isOnline ? (
                          <div className={styles.cardMetrics}>
                            <div className={styles.cardMetricItem}>
                              <span className={styles.cardMetricLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Cpu size={12} color="var(--accent-cyan)" /> CPU
                              </span>
                              <span className={styles.cardMetricVal}>{device.cpu_usage.toFixed(1)}%</span>
                            </div>
                            <div className={styles.cardMetricItem}>
                              <span className={styles.cardMetricLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Monitor size={12} color="var(--accent-green)" /> RAM
                              </span>
                              <span className={styles.cardMetricVal}>{ramPercent}%</span>
                            </div>
                            <div className={styles.cardMetricItem}>
                              <span className={styles.cardMetricLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={12} style={{ opacity: 0.8 }} /> Uptime
                              </span>
                              <span className={styles.cardMetricVal} style={{ fontSize: "11px", fontWeight: "normal" }}>
                                {formatUptime(device.uptime)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.cardOfflineContent}>
                            Mất kết nối với thiết bị. Vui lòng kiểm tra lại dịch vụ Agent.
                          </div>
                        )}
                        
                        <div className={styles.cardFooter}>
                          <span>Xem chi tiết hiệu năng</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`${styles.glassPanel} ${styles.emptyContainerLarge}`} style={{ padding: "60px 40px", textAlign: "center" }}>
                  <AlertTriangle size={48} className={styles.emptyIconLarge} style={{ color: "var(--text-muted)", marginBottom: "16px", margin: "0 auto" }} />
                  <div className={styles.emptyTextLarge} style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", marginLeft: "auto", marginRight: "auto" }}>
                    Chưa có thiết bị nào được cấu hình giám sát trên tài khoản của anh.
                  </div>
                  <button className={styles.addBtnLarge} style={{ margin: "0 auto" }} onClick={() => { setShowAddModal(true); setNewTokenResult(null); }}>
                    Tạo thiết bị đầu tiên
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <img src="/fire_logo.png" alt="Logo" className={styles.footerLogo} />
            <span>VPS-WARD</span>
          </div>
          <p className={styles.footerDesc}>
            Hệ thống giám sát và quản lý trạng thái máy chủ tập trung đa nền tảng.
          </p>
          <div className={styles.footerMeta}>
            <span>© {new Date().getFullYear()} LITSoftware. Tất cả quyền được bảo lưu.</span>
            <div className={styles.footerLinks}>
              <a href="https://litsoftware.io.vn" className={styles.footerLink}>LITSoftware.io.vn</a>
              <span className={styles.footerDivider}>·</span>
              <a href="https://github.com/LIT2451/VPS-WARD" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Theme Selection Bottom Drawer Sheet (Hermes Style) */}
      {showThemeDrawer && (
        <>
          <div 
            className={styles.themeDrawerOverlay} 
            onClick={() => setShowThemeDrawer(false)}
          ></div>
          <div className={styles.themeDrawerSheet}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Palette size={18} color="var(--accent-cyan)" />
                <h3 className={styles.sidebarTitle} style={{ margin: 0, fontSize: "14px", letterSpacing: "0.12em" }}>
                  Chọn chủ đề giao diện
                </h3>
              </div>
              <button 
                onClick={() => setShowThemeDrawer(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {[
                { id: "cyan", name: "Hermes Teal", color: "#38bdf8" },
                { id: "violet", name: "LIT Violet", color: "#8b5cf6" },
                { id: "midnight", name: "Midnight", color: "#6366f1" },
                { id: "emerald", name: "Emerald", color: "#10b981" },
                { id: "ember", name: "Ember", color: "#f97316" },
                { id: "mono", name: "Mono", color: "#a1a1aa" },
                { id: "cyberpunk", name: "Cyberpunk", color: "#00ff88" },
                { id: "rose", name: "Rosé", color: "#f9a8d4" },
                { id: "nous-blue", name: "Light Mode", color: "#0053fd" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    handleThemeChangeInPage(t.id);
                    setShowThemeDrawer(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    border: "1px solid",
                    borderColor: activeTheme === t.id ? "var(--accent-cyan)" : "rgba(255,255,255,0.06)",
                    background: activeTheme === t.id ? "rgba(56, 189, 248, 0.12)" : "rgba(255,255,255,0.02)",
                    color: activeTheme === t.id ? "var(--accent-cyan)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: activeTheme === t.id ? 600 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 0,
                    width: "100%",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ width: "8px", height: "8px", background: t.color, display: "inline-block" }}></span>
                  {t.name}
                </button>
              ))}
            </div>

            {/* Phân mục chọn Phông chữ (Font Selector) */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
              <span className={styles.sidebarTitle} style={{ fontSize: "10px", paddingLeft: "4px", marginBottom: "8px", display: "block" }}>
                Chọn phông chữ
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {fontChoices.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      applyFontInPage(f.id);
                      setShowThemeDrawer(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      border: "1px solid",
                      borderColor: activeFont === f.id ? "var(--accent-cyan)" : "rgba(255,255,255,0.06)",
                      background: activeFont === f.id ? "rgba(56, 189, 248, 0.12)" : "rgba(255,255,255,0.02)",
                      color: activeFont === f.id ? "var(--accent-cyan)" : "var(--text-secondary)",
                      fontFamily: f.stack,
                      fontSize: "12px",
                      fontWeight: activeFont === f.id ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 0,
                      width: "100%",
                      transition: "all 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>{f.category}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
