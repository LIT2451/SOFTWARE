"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";

interface AuthProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle show/hide password
  const { showToast } = useToast();

  const handleOAuthLogin = async (provider: string) => {
    showToast(`Đang kết nối để xác thực bằng tài khoản ${provider === "google" ? "Google" : "GitHub"}...`, "info");
    
    // Giả lập nhận mã OAuth Token từ cửa sổ xác thực của nhà cung cấp
    // Ở môi trường triển khai thực tế, đoạn này sẽ mở Popup OAuth URL
    const mockToken = "mock_" + provider + "_oauth_token_2026";

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token: mockToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error?.message || `Xác thực qua ${provider} thất bại`, "error");
        setLoading(false);
        return;
      }

      showToast(`Đăng nhập thành công bằng ${provider === "google" ? "Google" : "GitHub"}`, "success");
      onLoginSuccess(data.token, data.user.username, data.user.role);
    } catch (err) {
      showToast(`Lỗi kết nối dịch vụ xác thực ${provider}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || (isRegister && !email)) {
      showToast("Vui lòng điền đầy đủ các thông tin yêu cầu", "error");
      return;
    }

    setLoading(true);
    const endpoint = "/api/v1/auth/" + (isRegister ? "register" : "login");
    const body = isRegister 
      ? { username, password, email }
      : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error?.message || "Xác thực thất bại. Vui lòng kiểm tra lại", "error");
        setLoading(false);
        return;
      }

      if (isRegister) {
        showToast("Đăng ký thành công. Mời bạn tiến hành đăng nhập", "success");
        setIsRegister(false);
        setPassword("");
      } else {
        showToast("Xác thực thành công", "success");
        onLoginSuccess(data.token, data.user.username, data.user.role);
      }
    } catch (err) {
      showToast("Lỗi kết nối đến dịch vụ xác thực", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "16px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative Blur Orbs */}
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
        top: "20%",
        left: "15%",
        filter: "blur(40px)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(229, 106, 74, 0.12) 0%, transparent 70%)",
        bottom: "15%",
        right: "10%",
        filter: "blur(50px)",
        zIndex: 0
      }} />

      {/* Glassmorphic Login Card */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))",
        backdropFilter: "blur(24px) saturate(180%) contrast(1.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "40px 30px",
        position: "relative",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        zIndex: 1
      }}>
        {/* Glow indicator line at top of card */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "30px",
          right: "30px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.4), rgba(229, 106, 74, 0.4), transparent)"
        }} />

        <h1 style={{
          fontSize: "26px",
          textAlign: "center",
          marginBottom: "10px",
          color: "#ffffff",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)"
        }}>
          LIT SOFTWARE
        </h1>
        <p style={{
          fontSize: "11px",
          textAlign: "center",
          color: "#94a3b8",
          marginBottom: "30px",
          textTransform: "uppercase",
          letterSpacing: "0.15em"
        }}>
          {isRegister ? "Đăng ký tài khoản" : "Cổng xác thực dịch vụ"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontFamily: "JetBrains Mono, monospace",
                outline: "none"
              }}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                color: "#94a3b8",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontFamily: "JetBrains Mono, monospace",
                  outline: "none"
                }}
                required
              />
            </div>
          )}

          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 46px 12px 16px",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontFamily: "JetBrains Mono, monospace",
                  outline: "none"
                }}
                required
              />
              {/* Show/Hide password switch */}
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "11px",
                  userSelect: "none",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  letterSpacing: "0.05em"
                }}
              >
                {showPassword ? "Ẩn" : "Xem"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
              transition: "transform 0.1s ease-in-out, opacity 0.2s"
            }}
          >
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        {/* Divider line for OAuth */}
        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "24px 0 16px 0",
          color: "#475569",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <span style={{ padding: "0 10px" }}>Hoặc đăng nhập bằng</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Google & GitHub OAuth Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
            style={{
              padding: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "11px",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
          >
            Google
          </button>
          <button
            onClick={() => handleOAuthLogin("github")}
            disabled={loading}
            style={{
              padding: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "11px",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
          >
            GitHub
          </button>
        </div>

        <div style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "12px",
          color: "#94a3b8"
        }}>
          {isRegister ? "Đã có tài khoản hệ thống?" : "Chưa có tài khoản truy cập?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "#a855f7",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
          </span>
        </div>
      </div>
    </div>
  );
}
