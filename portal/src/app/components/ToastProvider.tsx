"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import styles from "./toast.module.css";

type ToastType = "success" | "error" | "info" | "warning";

// Vẽ inline SVG cực nét thay cho thư viện icon ngoài để đảm bảo tính độc lập và đồng bộ
const ToastIcons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.toastSvgIcon}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.toastSvgIcon}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" x2="9" y1="9" y2="15" />
      <line x1="9" x2="15" y1="9" y2="15" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.toastSvgIcon}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.toastSvgIcon}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  )
};

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    // Nếu đang có toast, dọn dẹp timeout cũ
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    // Bắt đầu hiệu ứng Dynamic Island xuất hiện từ nhỏ sang mở rộng
    setActiveToast({ id, type, message, duration });
    setIsExpanding(true);

    const closeId = setTimeout(() => {
      setIsExpanding(false);
      // Đợi hiệu ứng co nhỏ hoàn tất rồi mới ẩn hẳn
      setTimeout(() => {
        setActiveToast(null);
      }, 300);
    }, duration);

    setTimeoutId(closeId);
  }, [timeoutId]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return ToastIcons.success;
      case "error":
        return ToastIcons.error;
      case "warning":
        return ToastIcons.warning;
      case "info":
      default:
        return ToastIcons.info;
    }
  };

  const getStyleClass = (type: ToastType) => {
    switch (type) {
      case "success":
        return styles.toastSuccess;
      case "error":
        return styles.toastError;
      case "warning":
        return styles.toastWarning;
      case "info":
      default:
        return styles.toastInfo;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Dynamic Island Toast Container */}
      <div className={styles.islandContainer}>
        {activeToast && (
          <div 
            className={`${styles.island} ${getStyleClass(activeToast.type)} ${
              isExpanding ? styles.islandExpanded : styles.islandIdle
            }`}
          >
            <div className={styles.islandContent}>
              <div className={styles.iconWrapper}>
                {getIcon(activeToast.type)}
              </div>
              <span className={styles.messageText}>
                {activeToast.message}
              </span>
            </div>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
