import React, { useEffect, useState, useRef } from "react";
import { useToast } from "./ToastProvider";
import { User, Calendar, Mail, Key, ShieldCheck, Check, Camera, X, Copy, QrCode, CreditCard, Receipt, Send, Eye, EyeOff } from "lucide-react";

interface UserProfileProps {
  token: string;
}

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  status: string;
  avatar_url: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_alert_cpu_threshold?: number;
  telegram_alert_ram_threshold?: number;
  telegram_alert_disk_threshold?: number;
  created_at: string;
  security_status?: string;
  package_name?: string;
  max_devices?: number;
  end_date?: string | null;
}

interface Package {
  id: number;
  name: string;
  price: number;
  max_devices: number;
  description: string;
}

export default function UserProfile({ token }: UserProfileProps) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [showBotToken, setShowBotToken] = useState(false);
  const [showChatId, setShowChatId] = useState(false);
  
  // Alert Threshold fields (Defaults are 90)
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [ramThreshold, setRamThreshold] = useState(90);
  const [diskThreshold, setDiskThreshold] = useState(90);

  // Theme State
  const [theme, setTheme] = useState("cyan");

  // Nạp chủ đề đã lưu khi component vừa khởi tạo
  useEffect(() => {
    const savedTheme = localStorage.getItem("vpsward_theme") || "cyan";
    setTheme(savedTheme);
    
    const handleGlobalThemeChange = () => {
      setTheme(localStorage.getItem("vpsward_theme") || "cyan");
    };
    window.addEventListener("vpsward_theme_changed", handleGlobalThemeChange);
    return () => {
      window.removeEventListener("vpsward_theme_changed", handleGlobalThemeChange);
    };
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("vpsward_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new Event("vpsward_theme_changed"));
    showToast("Đã thay đổi chủ đề giao diện thành công", "success");
  };

  // Billing & Packages States
  const [activeTab, setActiveTab] = useState<"info" | "billing">("info");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    momo_phone: string;
    momo_name: string;
    amount: number;
    content: string;
    package_name: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    showToast(`Đã sao chép ${type}!`, "success");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch(`${getApiBase()}/api/packages`, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async (pkgId: number) => {
    try {
      const res = await fetch(`${getApiBase()}/api/payments/momo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ package_id: pkgId })
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentDetails(data);
        setPaymentModalOpen(true);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Không thể khởi tạo thanh toán", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "billing") {
      fetchPackages();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/profile`, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEmail(data.email || "");
        setTelegramBotToken(data.telegram_bot_token || "");
        setTelegramChatId(data.telegram_chat_id || "");
        setCpuThreshold(data.telegram_alert_cpu_threshold !== undefined ? data.telegram_alert_cpu_threshold : 90);
        setRamThreshold(data.telegram_alert_ram_threshold !== undefined ? data.telegram_alert_ram_threshold : 90);
        setDiskThreshold(data.telegram_alert_disk_threshold !== undefined ? data.telegram_alert_disk_threshold : 90);
      } else {
        showToast("Không thể tải thông tin cá nhân", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast("Mật khẩu mới nhập lại không khớp", "error");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`${getApiBase()}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          email,
          current_password: currentPassword,
          new_password: newPassword,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          telegram_alert_cpu_threshold: Number(cpuThreshold),
          telegram_alert_ram_threshold: Number(ramThreshold),
          telegram_alert_disk_threshold: Number(diskThreshold)
        })
      });

      if (res.ok) {
        showToast("Cập nhật thông tin thành công!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchProfile();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Cập nhật thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi máy chủ", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ảnh đại diện không được vượt quá 2MB", "error");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(`${getApiBase()}/api/profile/avatar`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: formData
      });

      if (res.ok) {
        showToast("Cập nhật ảnh đại diện thành công!", "success");
        fetchProfile();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Lỗi tải ảnh đại diện lên", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối khi tải ảnh", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
        Đang tải thông tin cá nhân...
      </div>
    );
  }

  // Lấy chữ cái đầu tiên của username làm avatar mặc định
  const getInitial = () => {
    if (!profile?.username) return "U";
    return profile.username.charAt(0).toUpperCase();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1, width: "100%", maxWidth: "720px", margin: "0 auto" }}>
      {/* Profile Header Block (No border - iOS Style) */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "12px 4px", flexWrap: "wrap" }}>
        
        {/* Clickable Avatar with iOS Glass style */}
        <div 
          onClick={handleAvatarClick}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            position: "relative",
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: profile?.avatar_url 
              ? `url(${getApiBase()}${profile.avatar_url}) center/cover no-repeat`
              : "linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)"
          }}
        >
          {!profile?.avatar_url && (
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
              {getInitial()}
            </span>
          )}
          
          {/* Hover state overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            opacity: uploadingAvatar ? 1 : 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s ease"
          }}
          className="avatarHoverOverlay"
          >
            {uploadingAvatar ? (
              <span style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>Tải lên...</span>
            ) : (
              <Camera size={20} color="#fff" />
            )}
          </div>
          <style>{`
            div:hover > .avatarHoverOverlay {
              opacity: 1 !important;
            }
          `}</style>
        </div>

        {/* Input file ẩn */}
        <input 
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
        />

        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#fff", wordBreak: "break-all" }}>
            {profile?.username || "Tài khoản"}
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.45)", margin: "4px 0 0 0", lineHeight: "1.4" }}>
            Quản trị viên VPS-WARD · Chọn ảnh để thay đổi
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px", width: "100%" }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{
            background: activeTab === "info" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            border: activeTab === "info" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid transparent",
            borderRadius: "10px",
            padding: "8px 16px",
            color: activeTab === "info" ? "#fff" : "rgba(255, 255, 255, 0.6)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          style={{
            background: activeTab === "billing" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            border: activeTab === "billing" ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid transparent",
            borderRadius: "10px",
            padding: "8px 16px",
            color: activeTab === "billing" ? "#fff" : "rgba(255, 255, 255, 0.6)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Gói dịch vụ & Thanh toán
        </button>
      </div>

      {activeTab === "info" && (
        <>
          {/* Metadata Cards (Horizontal Rows - Clean style) */}
          {profile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "14px", overflow: "hidden", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(18, 18, 22, 0.2)", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <User size={16} color="rgba(255, 255, 255, 0.45)" />
                  <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.75)" }}>Tên tài khoản</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#fff", wordBreak: "break-all", textAlign: "right" }}>{profile.username}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(18, 18, 22, 0.2)", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Calendar size={16} color="rgba(255, 255, 255, 0.45)" />
                  <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.75)" }}>Ngày tham gia</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#fff", textAlign: "right" }}>
                  {new Date(profile.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(18, 18, 22, 0.2)", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheck size={16} color="rgba(255, 255, 255, 0.45)" />
                  <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.75)" }}>Trạng thái bảo mật</span>
                </div>
                {profile.security_status === "weak" ? (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#f87171", display: "flex", alignItems: "center", gap: "4px", textAlign: "right" }}>
                    <X size={14}  /> Bảo mật yếu
                  </span>
                ) : profile.security_status === "medium" ? (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px", textAlign: "right" }}>
                    <Check size={14}  /> Bảo mật trung bình
                  </span>
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#34d399", display: "flex", alignItems: "center", gap: "4px", textAlign: "right" }}>
                    <Check size={14}  /> Đang bảo vệ
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main Settings Form (Clean Inputs & No Box Borders) */}
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            
            {/* Email Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Mail size={16} color="#38bdf8" />
                <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Địa chỉ Email</label>
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  fontSize: "16px", // Safari zoom fix
                  color: "#fff",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            {/* Telegram Configuration Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Send size={16} color="#38bdf8" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Tích hợp Telegram Alert
                </span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }} className="telegramGrid">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Telegram Bot Token</label>
                  <div style={{ position: "relative", width: "100%", display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ 
                      position: "relative", 
                      flex: 1, 
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <input 
                        type="text" 
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        placeholder="Ví dụ: 123456:ABC..."
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          padding: "14px 42px 14px 16px",
                          fontSize: "16px",
                          color: "#fff",
                          outline: "none",
                          fontFamily: "monospace",
                          transition: "filter 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease, letter-spacing 0.4s ease",
                          filter: showBotToken ? "blur(0)" : "blur(6px)",
                          opacity: showBotToken ? 1 : 0.35,
                          letterSpacing: showBotToken ? "normal" : "2px",
                          userSelect: showBotToken ? "text" : "none",
                          pointerEvents: showBotToken ? "auto" : "none"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "4px",
                          zIndex: 2,
                          pointerEvents: "auto"
                        }}
                        title={showBotToken ? "Ẩn Token" : "Xem Token"}
                      >
                        {showBotToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (telegramBotToken) {
                          navigator.clipboard.writeText(telegramBotToken);
                          showToast("Đã sao chép Telegram Bot Token vào bộ nhớ tạm", "success");
                        }
                      }}
                      disabled={!telegramBotToken}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "rgba(255, 255, 255, 0.7)",
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                      className="tokenCopyBtn"
                      title="Sao chép Token"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Telegram Chat ID</label>
                  <div style={{ position: "relative", width: "100%", display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ 
                      position: "relative", 
                      flex: 1, 
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <input 
                        type="text" 
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="Ví dụ: 987654321"
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          padding: "14px 42px 14px 16px",
                          fontSize: "16px",
                          color: "#fff",
                          outline: "none",
                          fontFamily: "monospace",
                          transition: "filter 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease, letter-spacing 0.4s ease",
                          filter: showChatId ? "blur(0)" : "blur(6px)",
                          opacity: showChatId ? 1 : 0.35,
                          letterSpacing: showChatId ? "normal" : "2px",
                          userSelect: showChatId ? "text" : "none",
                          pointerEvents: showChatId ? "auto" : "none"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowChatId(!showChatId)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "4px",
                          zIndex: 2,
                          pointerEvents: "auto"
                        }}
                        title={showChatId ? "Ẩn Chat ID" : "Xem Chat ID"}
                      >
                        {showChatId ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (telegramChatId) {
                          navigator.clipboard.writeText(telegramChatId);
                          showToast("Đã sao chép Telegram Chat ID vào bộ nhớ tạm", "success");
                        }
                      }}
                      disabled={!telegramChatId}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "rgba(255, 255, 255, 0.7)",
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                      className="tokenCopyBtn"
                      title="Sao chép Chat ID"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.35)", fontStyle: "italic", marginTop: "-4px" }}>
                * Nhận tin nhắn cảnh báo tức thời khi chỉ số CPU, RAM hoặc ổ đĩa của bất kỳ VPS nào vượt quá ngưỡng cấu hình bên dưới.
              </span>

              {/* Resource Alert Threshold Config (Sliders in glassmorphism panel) */}
              <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "20px",
                marginTop: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ngưỡng cảnh báo tài nguyên (%)
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }} className="thresholdsGrid">
                  {/* CPU Alert Threshold */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>CPU Usage</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                        {cpuThreshold}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={cpuThreshold} 
                      onChange={(e) => setCpuThreshold(Number(e.target.value))}
                      style={{
                        WebkitAppearance: "none",
                        width: "100%",
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "3px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                      className="slider"
                    />
                  </div>

                  {/* RAM Alert Threshold */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>RAM Usage</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                        {ramThreshold}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={ramThreshold} 
                      onChange={(e) => setRamThreshold(Number(e.target.value))}
                      style={{
                        WebkitAppearance: "none",
                        width: "100%",
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "3px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                      className="slider"
                    />
                  </div>

                  {/* Disk Alert Threshold */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>Ổ đĩa (Disk)</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                        {diskThreshold}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={diskThreshold} 
                      onChange={(e) => setDiskThreshold(Number(e.target.value))}
                      style={{
                        WebkitAppearance: "none",
                        width: "100%",
                        height: "6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "3px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                      className="slider"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Key size={16} color="#38bdf8" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Cập nhật Mật khẩu bảo mật
                </span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại để lưu"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    fontSize: "16px", // Safari zoom fix
                    color: "#fff",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }} className="passGrid">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      fontSize: "16px", // Safari zoom fix
                      color: "#fff",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      fontSize: "16px", // Safari zoom fix
                      color: "#fff",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cấu hình Giao diện & Chủ đề */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", width: "100%" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", margin: 0 }}>Giao diện và Chủ đề</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginTop: "8px" }}>
                {[
                  { id: "cyan", label: "Hermes Teal", color: "#38bdf8" },
                  { id: "violet", label: "LIT Violet", color: "#8b5cf6" },
                  { id: "midnight", label: "Midnight", color: "#6366f1" },
                  { id: "emerald", label: "Emerald", color: "#10b981" },
                  { id: "ember", label: "Ember", color: "#f97316" },
                  { id: "mono", label: "Mono", color: "#a1a1aa" },
                  { id: "cyberpunk", label: "Cyberpunk", color: "#00ff88" },
                  { id: "rose", label: "Rosé", color: "#f9a8d4" },
                  { id: "nous-blue", label: "Light Mode", color: "#0053fd" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id)}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${theme === t.id ? t.color : "rgba(255, 255, 255, 0.08)"}`,
                      color: theme === t.id ? t.color : "rgba(255, 255, 255, 0.7)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                      justifyContent: "flex-start"
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", background: t.color, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", width: "100%" }}>
              <button 
                type="submit" 
                disabled={updating}
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                  border: "none",
                  borderRadius: 0,
                  padding: "14px 32px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(56, 189, 248, 0.2)",
                  transition: "opacity 0.2s",
                  width: "100%",
                  maxWidth: "200px"
                }}
                className="submitProfileBtn"
              >
                {updating ? "Đang cập nhật..." : "Lưu thay đổi"}
              </button>
            </div>
            <style>{`
              @media (max-width: 480px) {
                .passGrid, .telegramGrid {
                  grid-template-columns: 1fr !important;
                }
                .thresholdsGrid {
                  grid-template-columns: 1fr !important;
                  gap: 16px !important;
                }
                .submitProfileBtn {
                  max-width: 100% !important;
                }
              }
            `}</style>
          </form>
        </>
      )}

      {activeTab === "billing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
          {/* Gói cước Hiện tại */}
          <div style={{
            background: "rgba(56, 189, 248, 0.04)",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8"
              }}>
                <CreditCard size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.45)" }}>Gói dịch vụ hiện tại</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                  {profile?.package_name === "Free" ? "Gói Miễn Phí (Free)" : profile?.package_name}
                </span>
              </div>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "12px",
              marginTop: "4px"
            }} className="subStatsGrid">
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>Hạn mức thiết bị</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{profile?.max_devices} thiết bị</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>Hạn sử dụng</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                  {profile?.end_date ? new Date(profile.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                </span>
              </div>
            </div>
          </div>

          {/* Danh sách Gói nâng cấp */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", width: "100%" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>Nâng cấp hạn mức giám sát</h3>
            
            {loadingPackages ? (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.4)" }}>Đang tải gói dịch vụ...</div>
            ) : packages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.4)" }}>Không có gói cước nâng cấp nào được mở.</div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                width: "100%"
              }} className="packagesGrid">
                {packages.map((pkg) => (
                  <div key={pkg.id} style={{
                    background: "rgba(15, 15, 20, 0.45)",
                    backdropFilter: "blur(25px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    transition: "transform 0.2s, border-color 0.2s"
                  }}
                  className="packageCard"
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{pkg.name}</span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8" }}>
                        {pkg.price.toLocaleString("vi-VN")}đ<span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.45)" }}> / 30 ngày</span>
                      </span>
                      <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                        {pkg.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Hạn mức:</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>Tối đa {pkg.max_devices} thiết bị</span>
                      </div>

                      <button 
                        onClick={() => handlePurchase(pkg.id)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(56, 189, 248, 0.15)"
                        }}
                      >
                        Nâng cấp ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && paymentDetails && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "rgba(10, 10, 14, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 0,
            width: "100%",
            maxWidth: "460px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
            position: "relative"
          }}>
            <button 
              onClick={() => { setPaymentModalOpen(false); setPaymentDetails(null); }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255, 255, 255, 0.4)",
                padding: "4px"
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <QrCode size={24} color="#ec4899" />
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Thanh toán qua MoMo / VietQR</h3>
            </div>

            <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.4" }}>
              Vui lòng mở ứng dụng MoMo hoặc ứng dụng Ngân hàng để quét mã QR chuyển tiền, hoặc chuyển khoản theo thông tin chi tiết dưới đây:
            </p>

            {/* QR Code */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              background: "#fff", 
              padding: "12px", 
              borderRadius: "16px",
              width: "200px",
              height: "200px",
              margin: "8px auto"
            }}>
              <img 
                src={`https://img.vietqr.io/image/970403-${paymentDetails.momo_phone}-compact2.png?amount=${paymentDetails.amount}&addInfo=${encodeURIComponent(paymentDetails.content)}&accountName=${encodeURIComponent(paymentDetails.momo_name)}`}
                alt="QR Code thanh toán"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Transfer info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", overflow: "hidden", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255, 255, 255, 0.02)" }}>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Số điện thoại MoMo</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#fff" }}>
                  {paymentDetails.momo_phone}
                  <button onClick={() => handleCopy(paymentDetails.momo_phone, "Số điện thoại MoMo")} style={{ background: "none", border: "none", cursor: "pointer", color: "#38bdf8", padding: 0 }}>
                    {copiedText === "Số điện thoại MoMo" ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255, 255, 255, 0.02)" }}>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Chủ tài khoản</span>
                <span style={{ fontWeight: 600, color: "#fff" }}>{paymentDetails.momo_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255, 255, 255, 0.02)" }}>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Số tiền</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#34d399" }}>
                  {paymentDetails.amount.toLocaleString("vi-VN")}đ
                  <button onClick={() => handleCopy(paymentDetails.amount.toString(), "Số tiền")} style={{ background: "none", border: "none", cursor: "pointer", color: "#38bdf8", padding: 0 }}>
                    {copiedText === "Số tiền" ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255, 255, 255, 0.02)" }}>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Nội dung ghi chú</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#fbbf24", fontFamily: "monospace" }}>
                  {paymentDetails.content}
                  <button onClick={() => handleCopy(paymentDetails.content, "Nội dung ghi chú")} style={{ background: "none", border: "none", cursor: "pointer", color: "#38bdf8", padding: 0 }}>
                    {copiedText === "Nội dung ghi chú" ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", background: "rgba(251, 191, 36, 0.04)", border: "1px solid rgba(251, 191, 36, 0.15)", borderRadius: 0, padding: "10px 12px", fontSize: "11.5px", color: "#fbbf24", lineHeight: "1.4" }}>
              * Vui lòng giữ đúng nội dung ghi chú ở trên khi chuyển khoản để hệ thống đối chiếu chính xác. Gói cước sẽ được kích hoạt ngay sau khi Admin duyệt giao dịch.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <button 
                onClick={() => { setPaymentModalOpen(false); setPaymentDetails(null); }}
                style={{
                  padding: "10px 24px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 0,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Tôi đã chuyển tiền xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
