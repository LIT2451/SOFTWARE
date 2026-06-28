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
      showToast("Vui lòng nhập đầy đủ thông tin", "error");
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
        showToast(data.error?.message || "Đã xảy ra lỗi hệ thống", "error");
        setLoading(false);
        return;
      }

      if (isRegister) {
        showToast("Đăng ký tài khoản thành công! Hãy đăng nhập", "success");
        setIsRegister(false);
        setPassword("");
      } else {
        showToast("Đăng nhập thành công!", "success");
        onLoginSuccess(data.token, data.user.username, data.user.role);
      }
    } catch (err) {
      showToast("Không thể kết nối đến máy chủ", "error");
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
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#111119",
        border: "1px solid #222235",
        padding: "40px 30px",
        position: "relative",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)"
      }}>
        {/* Border line accent top */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          backgroundImage: "linear-gradient(90deg, #7c3aed, #e56a4a, #0d9488)"
        }} />

        <h1 style={{
          fontSize: "24px",
          textAlign: "center",
          marginBottom: "10px",
          color: "#ffffff"
        }}>
          LIT SOFTWARE
        </h1>
        <p style={{
          fontSize: "12px",
          textAlign: "center",
          color: "#6b7280",
          marginBottom: "30px",
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }}>
          {isRegister ? "ĐĂNG KÝ TÀI KHOẢN MỚI" : "HỆ THỐNG XÁC THỰC TRUY CẬP"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: "#9ca3af",
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
                padding: "10px 14px",
                backgroundColor: "#08080c",
                border: "1px solid #222235",
                borderRadius: "0",
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
                color: "#9ca3af",
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
                  padding: "10px 14px",
                  backgroundColor: "#08080c",
                  border: "1px solid #222235",
                  borderRadius: "0",
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
              color: "#9ca3af",
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
                padding: "10px 14px",
                backgroundColor: "#08080c",
                border: "1px solid #222235",
                borderRadius: "0",
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
              padding: "12px",
              backgroundColor: "#e56a4a",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}
          >
            {loading ? "ĐANG XỬ LÝ..." : isRegister ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div style={{
          marginTop: "25px",
          textAlign: "center",
          fontSize: "12px",
          color: "#9ca3af"
        }}>
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản đăng ký?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "#7c3aed",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isRegister ? "Đăng nhập tại đây" : "Đăng ký tại đây"}
          </span>
        </div>
      </div>
    </div>
  );
}
