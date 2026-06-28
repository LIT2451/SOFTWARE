"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  api_url: string;
  is_active: boolean;
  backoff_level: number;
  lock_until: string | null;
  icon_svg?: string;
  created_at: string;
}

interface APIKey {
  id: string;
  key_value: string;
  name: string;
  is_active: boolean;
  quota_limit: number;
  quota_used: number;
  rpm_limit: number;
  rpd_limit: number;
  created_at: string;
  owner: string | null;
}

interface Overview {
  active_providers: number;
  total_keys: number;
  total_requests: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost: number;
}

export default function QuotaDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "providers" | "keys">("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // States dữ liệu
  const [overview, setOverview] = useState<Overview>({
    active_providers: 0,
    total_keys: 0,
    total_requests: 0,
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_cost: 0
  });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [keys, setKeys] = useState<APIKey[]>([]);

  // States modal & inputs
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm, setProviderForm] = useState({
    id: "",
    name: "",
    type: "openai",
    api_url: "https://api.openai.com",
    api_key: "",
    client_id: "",
    client_secret: ""
  });

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    id: "",
    name: "",
    quota_limit: 0.0,
    rpm_limit: 60,
    rpd_limit: 1000,
    username: ""
  });

  const [createdKeyVal, setCreatedKeyVal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const t = localStorage.getItem("vpsward_token");
    if (!t) {
      localStorage.setItem("target_redirect", "/quota");
      window.location.href = "/quota/login";
      return;
    }
    setToken(t);
    fetchData(t);
  }, []);

  const fetchData = async (authToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = { "Authorization": `Bearer ${authToken}` };
      
      const [resOverview, resProviders, resKeys] = await Promise.all([
        fetch("/quota/api/overview", { headers }),
        fetch("/quota/api/providers", { headers }),
        fetch("/quota/api/keys", { headers })
      ]);

      if (resOverview.status === 401 || resProviders.status === 401 || resKeys.status === 401) {
        localStorage.removeItem("vpsward_token");
        window.location.href = "/quota/login";
        return;
      }

      if (resOverview.ok && resProviders.ok && resKeys.ok) {
        const oData = await resOverview.json();
        const pData = await resProviders.json();
        const kData = await resKeys.json();
        setOverview(oData);
        setProviders(pData);
        setKeys(kData);
      } else {
        throw new Error("Lấy dữ liệu cấu hình thất bại.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi đồng bộ.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const isEdit = !!providerForm.id;
      const url = isEdit ? `/quota/api/providers/${providerForm.id}` : "/quota/api/providers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(providerForm)
      });

      if (res.ok) {
        setShowProviderModal(false);
        setProviderForm({ id: "", name: "", type: "openai", api_url: "https://api.openai.com", api_key: "", client_id: "", client_secret: "" });
        fetchData(token);
      } else {
        const errData = await res.json();
        alert(errData.error || "Lỗi thao tác trên Provider.");
      }
    } catch (err) {
      alert("Không kết nối được tới máy chủ.");
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!token || !confirm("Bạn có chắc chắn muốn xóa Provider này?")) return;
    try {
      const res = await fetch(`/quota/api/providers/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(token);
      } else {
        const errData = await res.json();
        alert(errData.error || "Xóa Provider thất bại.");
      }
    } catch (err) {
      alert("Không kết nối được tới máy chủ.");
    }
  };

  const handleToggleProvider = async (id: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/quota/api/providers/${id}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchData(token);
      }
    } catch (err) {
      alert("Không thay đổi được trạng thái hoạt động.");
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch("/quota/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: keyForm.name,
          quota_limit: Number(keyForm.quota_limit),
          rpm_limit: Number(keyForm.rpm_limit),
          rpd_limit: Number(keyForm.rpd_limit),
          username: keyForm.username
        })
      });

      if (res.ok) {
        const newKey = await res.json();
        setCreatedKeyVal(newKey.key_value);
        setKeyForm({ id: "", name: "", quota_limit: 0.0, rpm_limit: 60, rpd_limit: 1000, username: "" });
        fetchData(token);
      } else {
        const errData = await res.json();
        alert(errData.error || "Tạo API Key thất bại.");
      }
    } catch (err) {
      alert("Không kết nối được tới máy chủ.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!token || !confirm("Bạn có chắc chắn muốn hủy API Key này?")) return;
    try {
      const res = await fetch(`/quota/api/keys/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(token);
      } else {
        const errData = await res.json();
        alert(errData.error || "Hủy API Key thất bại.");
      }
    } catch (err) {
      alert("Không kết nối được tới máy chủ.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vpsward_token");
    localStorage.removeItem("vpsward_user");
    window.location.href = "/quota/login";
  };

  return (
    <div className="quota-container">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <span className="material-symbols-outlined text-orange-500" style={{ color: '#e56a4a' }}>hub</span>
          <div className="logo-texts">
            <span className="logo-lit">LIT SW</span>
            <span className="logo-sub">QUOTA MGMT</span>
          </div>
        </div>
        <button className="btn-mobile-menu" onClick={() => setMobileOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="quota-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>hub</span>
          </div>
          <div className="logo-texts">
            <span className="logo-lit">LIT SOFTWARE</span>
            <span className="logo-sub">QUOTA MANAGER</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
            Thống Kê Tổng Quan
          </button>
          <button 
            className={`nav-item ${activeTab === "providers" ? "active" : ""}`}
            onClick={() => setActiveTab("providers")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dns</span>
            AI Providers
          </button>
          <button 
            className={`nav-item ${activeTab === "keys" ? "active" : ""}`}
            onClick={() => setActiveTab("keys")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>vpn_key</span>
            Client API Keys
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="back-portal-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            Đăng xuất Admin
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer open">
            <div className="mobile-drawer-header">
              <div className="mobile-logo">
                <span className="material-symbols-outlined text-orange-500" style={{ color: '#e56a4a' }}>hub</span>
                <div className="logo-texts">
                  <span className="logo-lit">LIT SOFTWARE</span>
                  <span className="logo-sub">QUOTA MANAGER</span>
                </div>
              </div>
              <button className="btn-drawer-close" onClick={() => setMobileOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="sidebar-nav" style={{ flexGrow: 1 }}>
              <button 
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => { setActiveTab("dashboard"); setMobileOpen(false); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
                Thống Kê Tổng Quan
              </button>
              <button 
                className={`nav-item ${activeTab === "providers" ? "active" : ""}`}
                onClick={() => { setActiveTab("providers"); setMobileOpen(false); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dns</span>
                AI Providers
              </button>
              <button 
                className={`nav-item ${activeTab === "keys" ? "active" : ""}`}
                onClick={() => { setActiveTab("keys"); setMobileOpen(false); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>vpn_key</span>
                Client API Keys
              </button>
            </nav>
            <div className="sidebar-footer" style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
              <button className="back-portal-btn" onClick={handleLogout}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                Đăng xuất Admin
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="quota-main-content">
        <header className="content-header">
          <div className="header-title-section">
            <h2 className="header-title">
              {activeTab === "dashboard" && "THỐNG KÊ QUOTA"}
              {activeTab === "providers" && "AI PROVIDERS"}
              {activeTab === "keys" && "CLIENT API KEYS"}
            </h2>
            <p className="header-subtitle">
              Hệ thống Gateway điều phối phụ tải và quản lý giới hạn tài nguyên
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={() => token && fetchData(token)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Tải lại
            </button>
          </div>
        </header>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '8px' }}>
            <Loader2 className="animate-spin text-orange-500" style={{ color: '#e56a4a' }} size={24} />
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Đang đồng bộ dữ liệu...</span>
          </div>
        )}

        {!loading && errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '16px', borderRadius: '10px', fontSize: '13px', marginBottom: '24px' }}>
            {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && (
          <>
            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <>
                <div className="overview-grid">
                  <div className="overview-card">
                    <div className="card-info">
                      <span className="card-label">PROVIDERS HOẠT ĐỘNG</span>
                      <span className="card-value">{overview.active_providers}</span>
                    </div>
                    <div className="card-icon-box">
                      <span className="material-symbols-outlined">dns</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-info">
                      <span className="card-label">CLIENT API KEYS</span>
                      <span className="card-value">{overview.total_keys}</span>
                    </div>
                    <div className="card-icon-box">
                      <span className="material-symbols-outlined">key</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-info">
                      <span className="card-label">TỔNG REQUESTS (24H)</span>
                      <span className="card-value">{overview.total_requests}</span>
                    </div>
                    <div className="card-icon-box">
                      <span className="material-symbols-outlined">insights</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="card-info">
                      <span className="card-label">ƯỚC TÍNH CHI PHÍ</span>
                      <span className="card-value">${overview.total_cost.toFixed(4)}</span>
                    </div>
                    <div className="card-icon-box">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                  </div>
                </div>

                <div className="data-card">
                  <div className="card-title-bar">
                    <div className="card-title-section">
                      <div className="card-title-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>speed</span>
                      </div>
                      <h3 className="card-title-text">PHÂN PHỐI LƯU LƯỢNG THỜI GIAN THỰC</h3>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="quota-table">
                      <thead>
                        <tr>
                          <th>TÊN PROVIDER</th>
                          <th>PHÂN LOẠI</th>
                          <th>GATEWAY URL</th>
                          <th>TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div className="provider-logo-container">
                                {p.icon_svg ? (
                                  <div className="provider-icon-svg" dangerouslySetInnerHTML={{ __html: p.icon_svg }} />
                                ) : (
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#e56a4a' }}>dns</span>
                                )}
                                <span style={{ fontWeight: 600 }}>{p.name}</span>
                              </div>
                            </td>
                            <td><span style={{ textTransform: 'uppercase', fontSize: '11px', background: '#303030', padding: '3px 8px', borderRadius: '4px' }}>{p.type}</span></td>
                            <td><code style={{ color: '#9ca3af' }}>{p.api_url}</code></td>
                            <td>
                              {p.is_active ? (
                                <span className="badge-status active">ACTIVE</span>
                              ) : (
                                <span className="badge-status inactive">OFFLINE</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {providers.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>Chưa cấu hình Provider nào.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB: PROVIDERS CONFIG */}
            {activeTab === "providers" && (
              <div className="data-card">
                <div className="card-title-bar">
                  <div className="card-title-section">
                    <div className="card-title-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                    </div>
                    <h3 className="card-title-text">DANH SÁCH PROVIDERS</h3>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setProviderForm({ id: "", name: "", type: "openai", api_url: "https://api.openai.com", api_key: "", client_id: "", client_secret: "" });
                      setShowProviderModal(true);
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Thêm Provider Mới
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="quota-table">
                    <thead>
                      <tr>
                        <th>TÊN PROVIDER</th>
                        <th>KIỂU ĐỊNH TUYẾN</th>
                        <th>API URL</th>
                        <th>TRẠNG THÁI</th>
                        <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div className="provider-logo-container">
                              {p.icon_svg ? (
                                <div className="provider-icon-svg" dangerouslySetInnerHTML={{ __html: p.icon_svg }} />
                              ) : (
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#e56a4a' }}>dns</span>
                              )}
                              <span style={{ fontWeight: 600 }}>{p.name}</span>
                            </div>
                          </td>
                          <td><span style={{ textTransform: 'uppercase', fontSize: '11px', background: '#303030', padding: '3px 8px', borderRadius: '4px' }}>{p.type}</span></td>
                          <td><code style={{ color: '#9ca3af' }}>{p.api_url}</code></td>
                          <td>
                            <label className="switch-label">
                              <span 
                                className="material-symbols-outlined" 
                                style={{ 
                                  fontSize: '32px', 
                                  color: p.is_active ? '#e56a4a' : '#9ca3af',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleToggleProvider(p.id, p.is_active)}
                              >
                                {p.is_active ? 'toggle_on' : 'toggle_off'}
                              </span>
                            </label>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="btn-action-group" style={{ justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-action" 
                                onClick={() => {
                                  setProviderForm({
                                    id: p.id,
                                    name: p.name,
                                    type: p.type,
                                    api_url: p.api_url,
                                    api_key: "",
                                    client_id: "",
                                    client_secret: ""
                                  });
                                  setShowProviderModal(true);
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                              </button>
                              <button className="btn-action delete" onClick={() => handleDeleteProvider(p.id)}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {providers.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>Chưa cấu hình Provider nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: CLIENT API KEYS */}
            {activeTab === "keys" && (
              <div className="data-card">
                <div className="card-title-bar">
                  <div className="card-title-section">
                    <div className="card-title-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>key</span>
                    </div>
                    <h3 className="card-title-text">QUẢN LÝ CLIENT API KEYS</h3>
                  </div>
                  <button className="btn-primary" onClick={() => setShowKeyModal(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    Tạo Mới API Key
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="quota-table">
                    <thead>
                      <tr>
                        <th>TÊN MÃ / USER</th>
                        <th>API KEY VALUE</th>
                        <th>GIỚI HẠN QUOTA</th>
                        <th>ĐÃ DÙNG</th>
                        <th>RPM / RPD LIMIT</th>
                        <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(keys || []).map(k => (
                        <tr key={k.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{k.name}</span>
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>Owner: {k.owner || "System"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="key-reveal-box">
                              <code>
                                {revealKeyId === k.id ? k.key_value : "lit_key_••••••••••••••••"}
                              </code>
                              <button 
                                className="btn-icon-sm"
                                onClick={() => setRevealKeyId(revealKeyId === k.id ? null : k.id)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  {revealKeyId === k.id ? 'visibility_off' : 'visibility'}
                                </span>
                              </button>
                            </div>
                          </td>
                          <td><code>${k.quota_limit.toFixed(2)}</code></td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <code>${k.quota_used.toFixed(4)}</code>
                              <div style={{ width: '100px', height: '4px', background: '#303030', borderRadius: '2px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(100, (k.quota_used / (k.quota_limit || 1)) * 100)}%`, 
                                    height: '100%', 
                                    background: '#e56a4a' 
                                  }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              RPM: <code>{k.rpm_limit}</code> / RPD: <code>{k.rpd_limit}</code>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="btn-action-group" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-action delete" onClick={() => handleDeleteKey(k.id)}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_forever</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {keys.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>Chưa cấp phát API Key nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: THEM / SUA PROVIDER */}
      {showProviderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {providerForm.id ? "CẬP NHẬT PROVIDER" : "THÊM PROVIDER MỚI"}
              </h3>
              <button 
                className="btn-close" 
                onClick={() => setShowProviderModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreateProvider}>
              <div className="modal-body">
                <div className="modal-form-group full">
                  <label className="modal-label">TÊN HIỂN THỊ (NAME)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: OpenAI Production..."
                    className="modal-input"
                    value={providerForm.name}
                    onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  />
                </div>

                <div className="form-grid">
                  <div className="modal-form-group">
                    <label className="modal-label">KIỂU PROVIDER</label>
                    <select
                      className="modal-select"
                      value={providerForm.type}
                      onChange={(e) => setProviderForm({ ...providerForm, type: e.target.value })}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="custom">Custom Endpoint</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">BASE API URL</label>
                    <input
                      type="text"
                      required
                      placeholder="https://api.openai.com"
                      className="modal-input"
                      value={providerForm.api_url}
                      onChange={(e) => setProviderForm({ ...providerForm, api_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group full">
                  <label className="modal-label">API KEY (BỎ TRỐNG NẾU KHÔNG ĐỔI)</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="modal-input"
                    value={providerForm.api_key}
                    onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })}
                  />
                </div>

                {providerForm.type === "azure" && (
                  <div className="form-grid">
                    <div className="modal-form-group">
                      <label className="modal-label">CLIENT ID (AZURE)</label>
                      <input
                        type="text"
                        className="modal-input"
                        value={providerForm.client_id}
                        onChange={(e) => setProviderForm({ ...providerForm, client_id: e.target.value })}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label">CLIENT SECRET (AZURE)</label>
                      <input
                        type="password"
                        className="modal-input"
                        value={providerForm.client_secret}
                        onChange={(e) => setProviderForm({ ...providerForm, client_secret: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowProviderModal(false)}
                >
                  HỦY
                </button>
                <button type="submit" className="btn-primary">
                  {providerForm.id ? "CẬP NHẬT" : "THÊM MỚI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAO MOI API KEY */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">TẠO CLIENT API KEY</h3>
              <button 
                className="btn-close" 
                onClick={() => {
                  setShowKeyModal(false);
                  setCreatedKeyVal(null);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreateKey}>
              <div className="modal-body">
                {createdKeyVal ? (
                  <div className="key-box-container">
                    <span className="key-box-title">API KEY ĐÃ ĐƯỢC TẠO THÀNH CÔNG</span>
                    <div className="key-box-val">{createdKeyVal}</div>
                    <span className="key-box-warning">
                      * Hãy sao chép key này ngay bây giờ. Vì lý do bảo mật, bạn sẽ không thể xem lại nó sau khi đóng modal này.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="modal-form-group full">
                      <label className="modal-label">TÊN GỢI NHỚ (KEY NAME)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Dev Team Key, Prod App Key..."
                        className="modal-input"
                        value={keyForm.name}
                        onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="modal-form-group">
                        <label className="modal-label">GIỚI HẠN QUOTA (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="10.00"
                          className="modal-input"
                          value={keyForm.quota_limit}
                          onChange={(e) => setKeyForm({ ...keyForm, quota_limit: Number(e.target.value) })}
                        />
                      </div>

                      <div className="modal-form-group">
                        <label className="modal-label">TÀI KHOẢN OWNER (USERNAME)</label>
                        <input
                          type="text"
                          placeholder="admin, dev_user..."
                          className="modal-input"
                          value={keyForm.username}
                          onChange={(e) => setKeyForm({ ...keyForm, username: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="modal-form-group">
                        <label className="modal-label">RPM LIMIT (PHÚT)</label>
                        <input
                          type="number"
                          required
                          placeholder="60"
                          className="modal-input"
                          value={keyForm.rpm_limit}
                          onChange={(e) => setKeyForm({ ...keyForm, rpm_limit: Number(e.target.value) })}
                        />
                      </div>

                      <div className="modal-form-group">
                        <label className="modal-label">RPD LIMIT (NGÀY)</label>
                        <input
                          type="number"
                          required
                          placeholder="1000"
                          className="modal-input"
                          value={keyForm.rpd_limit}
                          onChange={(e) => setKeyForm({ ...keyForm, rpd_limit: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                {createdKeyVal ? (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => {
                      setShowKeyModal(false);
                      setCreatedKeyVal(null);
                    }}
                  >
                    HOÀN THÀNH
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => setShowKeyModal(false)}
                    >
                      HỦY
                    </button>
                    <button type="submit" className="btn-primary">
                      TẠO MỚI
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
