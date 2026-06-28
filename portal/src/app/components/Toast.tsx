"use client";

import React, { createContext, useContext, useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 9999,
        maxWidth: "350px"
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "14px 20px",
              borderRadius: "14px",
              backgroundColor: t.type === "success" ? "rgba(16, 185, 129, 0.08)" : t.type === "error" ? "rgba(239, 68, 68, 0.08)" : "rgba(124, 58, 237, 0.08)",
              backdropFilter: "blur(16px) saturate(180%)",
              border: `1px solid ${t.type === "success" ? "rgba(16, 185, 129, 0.25)" : t.type === "error" ? "rgba(239, 68, 68, 0.25)" : "rgba(124, 58, 237, 0.25)"}`,
              color: "#f8fafc",
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              animation: "slideIn 0.2s ease-out"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: t.type === "success" ? "#10b981" : t.type === "error" ? "#ef4444" : "#a855f7",
                boxShadow: `0 0 8px ${t.type === "success" ? "#10b981" : t.type === "error" ? "#ef4444" : "#a855f7"}`
              }} />
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
