"use client";

import { useState, useEffect } from "react";
import styles from "./auth.module.css";
import { useToast } from "./ToastProvider";
import AuroraBackground from "./AuroraBackground";

// Định nghĩa mã SVG tùy chỉnh cực nét, chuẩn tỷ lệ pixel cho toàn bộ giao diện Auth
const SVGIcons = {
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  envelope: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  lock: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeSlash: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  signIn: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIconInline}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  ),
  userPlus: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIconInline}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIconWarning}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  github: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.svgIconOauth}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  google: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.svgIconOauth}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
};

import { Globe, Terminal, ArrowLeft, Key } from "lucide-react";

export interface AuthProps {
  onSuccess: (token: string, userId: string, username: string) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const { showToast } = useToast();
  const [view, setView] = useState<"portal" | "login" | "register">("portal");
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Keep isLogin in sync with view
  useEffect(() => {
    if (view === "login") {
      setIsLogin(true);
    } else if (view === "register") {
      setIsLogin(false);
    }
  }, [view]);

  // Theo dõi phím Caps Lock hoạt động
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState("CapsLock"));
      }
    };
    window.addEventListener("keydown", handleKeyUp);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyUp);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Lấy độ trễ API giả lập để thông báo trạng thái Server
  useEffect(() => {
    const start = Date.now();
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const apiBase = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
    
    fetch(`${apiBase}/api/ping`) // Gọi thử endpoint công khai để test speed
      .then(() => {
        setDbLatency(Date.now() - start);
      })
      .catch(() => {
        setDbLatency(null);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!", "error");
      setLoading(false);
      return;
    }

    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const apiBase = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const payload = isLogin 
        ? { username, password } 
        : { username, email, password };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }

      if (isLogin) {
        showToast("Đăng nhập thành công!", "success");
        
        setTimeout(() => {
          localStorage.setItem("vpsward_token", data.token);
          localStorage.setItem("vpsward_user_id", data.user_id);
          localStorage.setItem("vpsward_username", data.username);
          onSuccess(data.token, data.user_id, data.username);
        }, 1000);
      } else {
        showToast("Đăng ký thành công! Đang chuyển sang màn hình đăng nhập...", "success");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      showToast(err.message || "Kết nối máy chủ thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {view === "portal" ? (
        <div className={styles.portalCard}>
          {/* Logo và tiêu đề LIT Portal */}
          <div className={styles.authLogoArea}>
            <img src="/fire_logo.png" alt="Logo" className={styles.authLogoImg} />
            <h1 className={styles.authLogoText} style={{ fontFamily: "Oswald, sans-serif", fontSize: "22px", letterSpacing: "0.1em" }}>LIT SOFTWARE PORTAL</h1>
          </div>

          <h2 className={styles.authTitle} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
            CHỌN HỆ THỐNG CẦN TRUY CẬP
          </h2>

          <div className={styles.portalGrid}>
            {/* Cổng 1: Giám sát VPS-WARD */}
            <button 
              type="button" 
              className={styles.portalOptionBtn}
              onClick={() => setView("login")}
            >
              <Globe size={32} color="#38bdf8" />
              <h3 className={styles.portalOptionBtnTitle}>Giám sát VPS-WARD</h3>
              <p className={styles.portalOptionBtnDesc}>
                Xem thông tin CPU, RAM, ổ đĩa, tiến trình, docker, cổng mạng thời gian thực.
              </p>
            </button>

            {/* Cổng 2: Quản lý Quota AI */}
            <a 
              href="/quota" 
              className={styles.portalOptionBtn}
            >
              <Key size={32} color="#a78bfa" />
              <h3 className={styles.portalOptionBtnTitle}>Quản lý Quota AI</h3>
              <p className={styles.portalOptionBtnDesc}>
                Phân bổ hạn mức Token, cấu hình Providers AI và giám sát lưu lượng API Gateway.
              </p>
            </a>

            {/* Cổng 3: Quản lý Hermes */}
            <a 
              href="/manager/" 
              className={styles.portalOptionBtn}
            >
              <Terminal size={32} color="#ec4899" />
              <h3 className={styles.portalOptionBtnTitle}>Quản lý Hermes</h3>
              <p className={styles.portalOptionBtnDesc}>
                Quản trị trợ lý AI tác nhân, cấu hình models, crontab, sessions và file hệ thống.
              </p>
            </a>
          </div>

          {/* Database Latency Status */}
          {dbLatency !== null && (
            <div style={{ textAlign: "center", fontSize: "10.5px", fontFamily: "monospace", color: "var(--text-muted)" }}>
              KẾT NỐI MÁY CHỦ: {dbLatency}MS
            </div>
          )}
        </div>
      ) : (
        <div className={styles.authCard}>
          {/* Nút quay lại Portal Selector */}
          <button 
            type="button" 
            className={styles.portalBackBtn} 
            onClick={() => setView("portal")}
          >
            <ArrowLeft size={14} /> Quay lại cổng hệ thống
          </button>

          {/* Logo và tên trang web nằm trong khung đăng ký/đăng nhập */}
          <div className={styles.authLogoArea}>
            <img src="/fire_logo.png" alt="Logo" className={styles.authLogoImg} />
            <h1 className={styles.authLogoText}>VPS-WARD</h1>
          </div>

          <h2 className={styles.authTitle}>
            {isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
          </h2>
          <p className={styles.authSubtitle}>
            {isLogin ? "Giám sát hệ thống của bạn thời gian thực" : "Tạo tài khoản giám sát hệ thống của bạn"}
          </p>

          {/* Bọc trong một transition container để chuyển đổi mượt mà */}
        <div className={`${styles.formTransitionContainer} ${styles.formActive}`} key={isLogin ? "login" : "register"}>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            {/* Tên tài khoản */}
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input 
                  type="text" 
                  id="username"
                  className={styles.authInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=" "
                  required
                />
                {SVGIcons.user}
                <label htmlFor="username" className={styles.inputLabel}>Tên tài khoản</label>
              </div>
            </div>

            {/* Email (Chỉ đăng ký) */}
            {!isLogin && (
              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <input 
                    type="email" 
                    id="email"
                    className={styles.authInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                  />
                  {SVGIcons.envelope}
                  <label htmlFor="email" className={styles.inputLabel}>Email</label>
                </div>
              </div>
            )}

            {/* Mật khẩu */}
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  className={styles.authInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                />
                {SVGIcons.lock}
                <label htmlFor="password" className={styles.inputLabel}>Mật khẩu</label>
                
                {/* Nút Ẩn/Hiện mật khẩu */}
                <button 
                  type="button" 
                  className={styles.passwordToggle} 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? SVGIcons.eyeSlash : SVGIcons.eye}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu (Chỉ khi đăng ký) */}
            {!isLogin && (
              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword"
                    className={styles.authInput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  {SVGIcons.lock}
                  <label htmlFor="confirmPassword" className={styles.inputLabel}>Xác nhận mật khẩu</label>
                  
                  {/* Nút Ẩn/Hiện mật khẩu xác nhận */}
                  <button 
                    type="button" 
                    className={styles.passwordToggle} 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? SVGIcons.eyeSlash : SVGIcons.eye}
                  </button>
                </div>
              </div>
            )}

            {/* Cảnh báo Caps Lock hoạt động */}
            {capsLockActive && (
              <div className={styles.capsLockWarning}>
                {SVGIcons.warning}
                <span>Chế độ Caps Lock đang bật!</span>
              </div>
            )}

            {/* Hàng Tiện ích: Ghi nhớ đăng nhập & Quên mật khẩu */}
            {isLogin && (
              <div className={styles.authOptions}>
                <label className={styles.rememberMe}>
                  <input type="checkbox" className={styles.checkboxInput} />
                  <span className={styles.checkboxLabel}>Ghi nhớ mật khẩu</span>
                </label>
                <button type="button" className={styles.forgotBtn} onClick={() => showToast("Vui lòng liên hệ Admin để khôi phục mật khẩu", "info")}>
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button type="submit" className={styles.authBtn} disabled={loading}>
              {loading ? (
                "Vui lòng chờ..."
              ) : isLogin ? (
                <>
                  {SVGIcons.signIn}
                  Đăng Nhập
                </>
              ) : (
                <>
                  {SVGIcons.userPlus}
                  Đăng Ký Tài Khoản
                </>
              )}
            </button>
          </form>
        </div>

        {/* Hàng chia sẻ OAuth Đăng nhập nhanh bằng MXH */}
        {isLogin && (
          <>
            <div className={styles.divider}>
              <span className={styles.dividerLine}></span>
              <span className={styles.dividerText}>Hoặc đăng nhập nhanh</span>
              <span className={styles.dividerLine}></span>
            </div>
            
            <div className={styles.oauthContainer}>
              <button 
                type="button" 
                className={styles.oauthBtn} 
                onClick={() => showToast("Phương thức đăng nhập qua GitHub sẽ được tích hợp sớm", "info")}
              >
                {SVGIcons.github}
                GitHub
              </button>
              <button 
                type="button" 
                className={styles.oauthBtn} 
                onClick={() => showToast("Phương thức đăng nhập qua Google sẽ được tích hợp sớm", "info")}
              >
                {SVGIcons.google}
                Google
              </button>
            </div>
          </>
        )}

        <div className={styles.authToggle}>
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          <button 
            type="button" 
            className={styles.authToggleBtn}
            onClick={() => {
              setIsLogin(!isLogin);
            }}
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
