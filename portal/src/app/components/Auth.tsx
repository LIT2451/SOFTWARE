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
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || (isRegister && !email)) {
      showToast("Vui lòng điền đầy đủ các thông tin yêu cầu", "error");
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
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
        showToast(data.error?.message || "Đăng nhập thất bại. Kiểm tra lại thông tin", "error");
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
      padding: "20px",
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
        padding: "50px 35px",
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
          marginBottom: "35px",
          textTransform: "uppercase",
          letterSpacing: "0.15em"
        }}>
          {isRegister ? "Đăng ký tài khoản" : "Cổng xác thực dịch vụ"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s"
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div style={{
          marginTop: "30px",
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
