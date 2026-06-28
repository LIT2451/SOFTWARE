"use client";

import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("lit_token");
    const savedUsername = localStorage.getItem("lit_username");
    const savedRole = localStorage.getItem("lit_role");

    if (savedToken && savedUsername && savedRole) {
      setToken(savedToken);
      setUsername(savedUsername);
      setRole(savedRole);
    }
    setChecking(false);
  }, []);

  const handleLoginSuccess = (userToken: string, userUsername: string, userRole: string) => {
    localStorage.setItem("lit_token", userToken);
    localStorage.setItem("lit_username", userUsername);
    localStorage.setItem("lit_role", userRole);
    setToken(userToken);
    setUsername(userUsername);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("lit_token");
    localStorage.removeItem("lit_username");
    localStorage.removeItem("lit_role");
    setToken(null);
    setUsername("");
    setRole("");
  };

  if (checking) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0b0b0f",
        color: "#ffffff",
        fontFamily: "JetBrains Mono, monospace"
      }}>
        ĐANG KHỞI CHẠY HỆ THỐNG...
      </div>
    );
  }

  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Dashboard
      token={token}
      username={username}
      role={role}
      onLogout={handleLogout}
    />
  );
}
