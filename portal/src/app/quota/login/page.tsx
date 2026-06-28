"use client";

import { useState, useEffect } from "react";
import { Key, Lock, ArrowLeft, Loader2 } from "lucide-react";
import styles from "./quota_auth.module.css";

export default function QuotaLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tài khoản hoặc mật khẩu không chính xác.");
      }

      // Lưu JWT Token và thông tin User
      localStorage.setItem("vpsward_token", data.token);
      
      // Khớp cấu trúc payload từ API `/api/auth/login` (username, roles, email)
      const hasSuperAdmin = data.roles && data.roles.includes("super_admin");
      
      if (!hasSuperAdmin) {
        localStorage.removeItem("vpsward_token");
        throw new Error("Chỉ tài khoản Quản trị cấp cao (Super Admin) mới được phép vào phân hệ này.");
      }

      localStorage.setItem("vpsward_user", JSON.stringify({
        username: data.username,
        email: data.email,
        roles: data.roles
      }));

      // Đăng nhập thành công, chuyển hướng tới quota dashboard
      window.location.href = "/quota";
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.glassCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.logoTitle}>LIT SOFTWARE</h1>
          <p className={styles.logoDesc}>AI Gateway Manager</p>
        </div>

        <div className={styles.cardBody}>
          <h2 className={styles.formTitle}>ĐĂNG NHẬP HỆ THỐNG</h2>

          {error && <div className={styles.errorBlock}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>TÊN ĐĂNG NHẬP</label>
              <div className={styles.inputWrapper}>
                <span className="material-symbols-outlined styles.inputIcon" style={{ position: 'absolute', left: '14px', fontSize: '18px', color: '#9ca3af' }}>vpn_key</span>
                <input
                  type="text"
                  required
                  placeholder="Nhập tài khoản Admin..."
                  className={styles.formInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>MẬT KHẨU</label>
              <div className={styles.inputWrapper}>
                <span className="material-symbols-outlined styles.inputIcon" style={{ position: 'absolute', left: '14px', fontSize: '18px', color: '#9ca3af' }}>lock</span>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  ĐANG XÁC THỰC...
                </>
              ) : (
                "ĐĂNG NHẬP"
              )}
            </button>

            <div className={styles.backLinkWrapper}>
              <a href="/" className={styles.backLink}>
                <ArrowLeft size={12} /> Quay lại Portal
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
