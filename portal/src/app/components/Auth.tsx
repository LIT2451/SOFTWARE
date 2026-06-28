"use client";

import React, { useState } from "react";
import { useToast } from "./Toast";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const handleOAuthLogin = async (provider: string) => {
    showToast(`Đang kết nối để xác thực bằng tài khoản ${provider === "google" ? "Google" : "GitHub"}...`, "info");
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <User size={12} />
              Tên đăng nhập
            </label>
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#94a3b8",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                <Mail size={12} />
                Địa chỉ Email
              </label>
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <Lock size={12} />
              Mật khẩu
            </label>
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
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none"
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

        {/* Google & GitHub OAuth Buttons with SVG Logo */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.2s"
            }}
          >
            {/* Google SVG Logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.2s"
            }}
          >
            {/* GitHub SVG Logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
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
