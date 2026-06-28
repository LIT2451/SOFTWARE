import React, { useState } from "react";
import { 
  Terminal, 
  ShieldCheck, 
  Download,
  Copy,
  Check
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

export default function InstallGuide() {
  const [activeTab, setActiveTab] = useState<"linux" | "windows" | "macos">("linux");
  const [copiedText, setCopiedText] = useState(false);

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const linuxCommand = `curl -sSL ${getApiBase()}/install-agent.sh | TOKEN="MÃ_TOKEN_BẠN_ĐÃ_SAO_CHÉP" bash`;
  const macCommand = `curl -sSL ${getApiBase()}/install-agent-mac.sh | TOKEN="MÃ_TOKEN_BẠN_ĐÃ_SAO_CHÉP" bash`;
  const winCommand = `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; iex ((New-Object System.Net.WebClient).DownloadString('${getApiBase()}/install-agent.ps1')); install-vpsward -Token "MÃ_TOKEN_BẠN_ĐÃ_SAO_CHÉP"`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "800px", margin: "0 auto", padding: "12px 4px" }}>
      {/* Introduction */}
      <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
        Hệ thống giám sát VPS-WARD hỗ trợ theo dõi chỉ số tài nguyên thời gian thực đa nền tảng (**Linux, Windows, macOS**).
        Vui lòng chọn hệ điều hành của thiết bị bạn muốn cài đặt:
      </p>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        background: "rgba(255, 255, 255, 0.03)", 
        borderRadius: "12px", 
        padding: "4px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        gap: "4px"
      }}>
        <button
          onClick={() => setActiveTab("linux")}
          style={{
            flex: 1,
            background: activeTab === "linux" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            border: "none",
            borderRadius: "8px",
            color: activeTab === "linux" ? "#fff" : "rgba(255, 255, 255, 0.5)",
            padding: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s"
          }}
        >
          <LinuxLogo size={16} /> Linux
        </button>
        <button
          onClick={() => setActiveTab("windows")}
          style={{
            flex: 1,
            background: activeTab === "windows" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            border: "none",
            borderRadius: "8px",
            color: activeTab === "windows" ? "#fff" : "rgba(255, 255, 255, 0.5)",
            padding: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s"
          }}
        >
          <WindowsLogo size={16} /> Windows
        </button>
        <button
          onClick={() => setActiveTab("macos")}
          style={{
            flex: 1,
            background: activeTab === "macos" ? "rgba(255, 255, 255, 0.08)" : "transparent",
            border: "none",
            borderRadius: "8px",
            color: activeTab === "macos" ? "#fff" : "rgba(255, 255, 255, 0.5)",
            padding: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s"
          }}
        >
          <AppleLogo size={16} /> macOS
        </button>
      </div>

      {/* Guide Content based on active tab */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Step 1 & 2 are global */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              fontSize: "14px",
              fontWeight: 700
            }}>
              1
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#fff" }}>
              Khởi tạo thiết bị trên trang quản trị
            </h3>
          </div>
          <div style={{ 
            padding: "16px", 
            background: "rgba(255, 255, 255, 0.02)", 
            border: "1px solid rgba(255, 255, 255, 0.05)", 
            borderRadius: "16px",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: "1.6"
          }}>
            Vào trang chủ, chọn nút <strong style={{ color: "#fff" }}>"Thêm"</strong> tại danh sách thiết bị. 
            Nhập tên gợi nhớ và chọn đúng hệ điều hành tương ứng (<strong style={{ color: "#fff" }}>{activeTab === "linux" ? "Linux" : activeTab === "windows" ? "Windows" : "macOS"}</strong>). 
            Hệ thống sẽ sinh ra một mã <strong style={{ color: "#38bdf8" }}>Agent Token</strong>. Hãy sao chép mã này.
          </div>
        </div>

        {/* Step 3 - OS Specific */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              fontSize: "14px",
              fontWeight: 700
            }}>
              2
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#fff" }}>
              Tiến hành cài đặt chương trình giám sát
            </h3>
          </div>

          <div style={{ 
            padding: "16px", 
            background: "rgba(255, 255, 255, 0.02)", 
            border: "1px solid rgba(255, 255, 255, 0.05)", 
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {activeTab === "linux" && (
              <>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.5" }}>
                  Mở Terminal kết nối SSH vào VPS Linux của bạn với quyền <strong>root</strong> và chạy lệnh cài đặt tự động:
                </p>
                <div style={{ position: "relative" }}>
                  <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "14px 45px 14px 14px",
                    fontFamily: "monospace",
                    fontSize: "12.5px",
                    color: "#38bdf8",
                    wordBreak: "break-all",
                    whiteSpace: "normal"
                  }}>
                    {linuxCommand}
                  </div>
                  <button 
                    onClick={() => handleCopy(linuxCommand)}
                    style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
                    title="Sao chép"
                  >
                    {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>
                  * Hỗ trợ tất cả các distro phổ biến: Ubuntu, Debian, CentOS, AlmaLinux, RockyLinux.
                </span>
              </>
            )}

            {activeTab === "windows" && (
              <>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.5" }}>
                  Mở <strong>PowerShell</strong> dưới quyền Quản trị viên (<strong>Run as Administrator</strong>) và chạy lệnh sau:
                </p>
                <div style={{ position: "relative" }}>
                  <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "14px 45px 14px 14px",
                    fontFamily: "monospace",
                    fontSize: "12.5px",
                    color: "#38bdf8",
                    wordBreak: "break-all",
                    whiteSpace: "normal"
                  }}>
                    {winCommand}
                  </div>
                  <button 
                    onClick={() => handleCopy(winCommand)}
                    style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
                    title="Sao chép"
                  >
                    {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>
                  * Script sẽ tự động tải file Agent exe, cấu hình Windows Service chạy ngầm và mở cổng Firewall tương ứng.
                </span>
              </>
            )}

            {activeTab === "macos" && (
              <>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.5" }}>
                  Mở ứng dụng <strong>Terminal</strong> trên macOS của bạn và chạy lệnh cài đặt tự động (Cần nhập mật khẩu sudo khi được hỏi):
                </p>
                <div style={{ position: "relative" }}>
                  <div style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "14px 45px 14px 14px",
                    fontFamily: "monospace",
                    fontSize: "12.5px",
                    color: "#38bdf8",
                    wordBreak: "break-all",
                    whiteSpace: "normal"
                  }}>
                    {macCommand}
                  </div>
                  <button 
                    onClick={() => handleCopy(macCommand)}
                    style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
                    title="Sao chép"
                  >
                    {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>
                  * Tự động đăng ký dịch vụ chạy ngầm LaunchAgent của macOS để đảm bảo kết nối liên tục khi reboot máy.
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Verify state */}
      <div style={{ 
        marginTop: "10px",
        padding: "16px", 
        background: "rgba(52, 211, 153, 0.04)", 
        border: "1px solid rgba(52, 211, 153, 0.15)", 
        borderRadius: "16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px"
      }}>
        <ShieldCheck size={20} color="#34d399" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#34d399" }}>Kiểm tra trạng thái kết nối</span>
          <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.5" }}>
            Ngay sau khi chương trình Agent chạy thành công trên máy tính/VPS, trạng thái thiết bị tương ứng trên Sidebar sẽ lập tức đổi sang màu xanh lá cây và toàn bộ dữ liệu CPU/RAM/Disk sẽ được truyền tải trực tiếp mượt mà mỗi 2 giây.
          </p>
        </div>
      </div>

      {/* Uninstall instructions */}
      <div style={{ 
        marginTop: "10px",
        padding: "16px", 
        background: "rgba(248, 113, 113, 0.04)", 
        border: "1px solid rgba(248, 113, 113, 0.15)", 
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Terminal size={20} color="#f87171" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#f87171" }}>Hướng dẫn gỡ cài đặt Agent (Uninstall)</span>
        </div>
        <p style={{ fontSize: "12.5px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: "1.5" }}>
          Nếu không muốn tiếp tục giám sát thiết bị này, bạn có thể gỡ bỏ hoàn toàn Agent bằng cách chạy lệnh dưới đây tương ứng với hệ điều hành:
        </p>
        
        {activeTab === "linux" && (
          <div style={{ position: "relative", marginTop: "4px" }}>
            <div style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "14px 45px 14px 14px",
              fontFamily: "monospace",
              fontSize: "12.5px",
              color: "#f87171",
              wordBreak: "break-all",
              whiteSpace: "normal"
            }}>
              {`curl -sSL ${getApiBase()}/uninstall-agent.sh | bash`}
            </div>
            <button 
              onClick={() => handleCopy(`curl -sSL ${getApiBase()}/uninstall-agent.sh | bash`)}
              style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
              title="Sao chép"
            >
              {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </button>
          </div>
        )}

        {activeTab === "windows" && (
          <div style={{ position: "relative", marginTop: "4px" }}>
            <div style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "14px 45px 14px 14px",
              fontFamily: "monospace",
              fontSize: "12.5px",
              color: "#f87171",
              wordBreak: "break-all",
              whiteSpace: "normal"
            }}>
              {`Unregister-ScheduledTask -TaskName "VPSWARD-Agent" -Confirm:$false; Stop-Process -Name "vpsward-agent" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:ProgramFiles\\VPS-WARD" -Recurse -Force`}
            </div>
            <button 
              onClick={() => handleCopy(`Unregister-ScheduledTask -TaskName "VPSWARD-Agent" -Confirm:$false; Stop-Process -Name "vpsward-agent" -Force -ErrorAction SilentlyContinue; Remove-Item -Path "$env:ProgramFiles\\VPS-WARD" -Recurse -Force`)}
              style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
              title="Sao chép"
            >
              {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </button>
          </div>
        )}

        {activeTab === "macos" && (
          <div style={{ position: "relative", marginTop: "4px" }}>
            <div style={{
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "14px 45px 14px 14px",
              fontFamily: "monospace",
              fontSize: "12.5px",
              color: "#f87171",
              wordBreak: "break-all",
              whiteSpace: "normal"
            }}>
              {`curl -sSL ${getApiBase()}/uninstall-agent-mac.sh | bash`}
            </div>
            <button 
              onClick={() => handleCopy(`curl -sSL ${getApiBase()}/uninstall-agent-mac.sh | bash`)}
              style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
              title="Sao chép"
            >
              {copiedText ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
