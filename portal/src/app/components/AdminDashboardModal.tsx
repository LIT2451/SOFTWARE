import React, { useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import { 
  Trash2, 
  Pencil, 
  Plus, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  UserPlus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  Mail,
  Calendar,
  DollarSign,
  Receipt,
  HardDrive,
  Key,
  Globe
} from "lucide-react";

// Inline brand logo SVGs for Windows, Apple, and Linux to prevent dependency conflicts
const WindowsLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.95 1.95L24 0v11.55H10.95V1.95zM10.95 12.45H24v11.55l-13.05-1.95v-9.6z"/>
  </svg>
);

const AppleLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z"/>
  </svg>
);

const LinuxLogo = ({ size = 14, style = {} }: { size?: number, style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, verticalAlign: "middle" }}>
    <path d="M12 2c-3.3 0-6 2.7-6 6v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V8c0-3.3-2.7-6-6-6zm-1.5 5c-.8 0-1.5-.7-1.5-1.5S9.7 4 10.5 4s1.5.7 1.5 1.5S11.3 7 10.5 7zm3 0c-.8 0-1.5-.7-1.5-1.5S12.7 4 13.5 4s1.5.7 1.5 1.5S14.3 7 13.5 7zm-5 7c-2.2 0-4 1.8-4 4v1c0 .6.4 1 1 1h13c.6 0 1-.4 1-1v-1c0-2.2-1.8-4-4-4H8.5z"/>
  </svg>
);

interface AdminPanelProps {
  token: string;
  activeTab: "users" | "packages" | "payments" | "devices";
}

interface AdminDevice {
  id: string;
  user_id: string;
  username: string; // Tên chủ sở hữu
  name: string;
  os: string;
  status: string;
  created_at: string;
}

interface UserAccount {
  id: string;
  username: string;
  email: string;
  status: string;
  created_at: string;
  role: string;
  avatar_url?: string;
}

interface PackageConfig {
  id: number;
  name: string;
  price: number;
  max_devices: number;
  description: string;
}

interface PayOSPayment {
  id: string;
  username: string;
  amount: number;
  transaction_code: string;
  payment_gateway: string;
  content: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  package_name: string;
}

// Định nghĩa helper icon hệ điều hành sinh động cho admin
const getOSIcon = (osName: string, size: number = 14) => {
  const name = (osName || "").toLowerCase();
  if (name.includes("windows")) {
    return <WindowsLogo size={size} style={{ color: "#0078d4", verticalAlign: "middle" }} />;
  } else if (name.includes("darwin") || name.includes("mac") || name.includes("apple")) {
    return <AppleLogo size={size} style={{ color: "#ffffff", verticalAlign: "middle" }} />;
  }
  return <LinuxLogo size={size} style={{ color: "#f8a51d", verticalAlign: "middle" }} />;
};

export default function AdminDashboardPanel({ token, activeTab }: AdminPanelProps) {
  const { showToast } = useToast();
  
  // Dữ liệu API quản lý
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [payments, setPayments] = useState<PayOSPayment[]>([]);
  const [adminHardDrive, setAdminHardDrive] = useState<AdminDevice[]>([]);
  const [loading, setLoading] = useState(false);

  // Phân trang & Tìm kiếm (Chỉ áp dụng Quản lý tài khoản)
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 6; // Số user hiển thị mỗi trang (hợp lý trên mobile và desktop)

  // Trạng thái modal Thêm/Sửa tài khoản
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user"
  });

  // Trạng thái chỉnh sửa gói
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageModalMode, setPackageModalMode] = useState<"create" | "edit">("create");
  const [packageForm, setPackageForm] = useState({
    name: "",
    price: "",
    max_devices: "",
    description: ""
  });

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return host === "localhost" || host === "127.0.0.1" ? "http://localhost:8080" : `https://${host}`;
  };

  // Tải dữ liệu dựa theo tab được active, page, hoặc search
  useEffect(() => {
    if (!token) return;

    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "packages") {
      fetchPackages();
    } else if (activeTab === "payments") {
      fetchPayments();
    } else if (activeTab === "devices") {
      fetchAdminHardDrive();
    }
  }, [activeTab, token, page]);

  // Bắt sự kiện gõ tìm kiếm user có debounce/hoặc enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset về trang 1 khi tìm kiếm
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
      } else {
        showToast("Không thể tải danh sách tài khoản", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/packages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data || []);
      } else {
        showToast("Không thể tải cấu hình gói", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/payments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data || []);
      } else {
        showToast("Không thể tải lịch sử thanh toán", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn phê duyệt giao dịch này và kích hoạt gói cước cho người dùng?")) return;
    try {
      const res = await fetch(`${getApiBase()}/api/admin/payments/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Phê duyệt giao dịch thành công!", "success");
        fetchPayments();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Phê duyệt thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  const handleRejectPayment = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối và hủy bỏ giao dịch này?")) return;
    try {
      const res = await fetch(`${getApiBase()}/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Đã từ chối giao dịch", "info");
        fetchPayments();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Từ chối thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  const fetchAdminHardDrive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/devices`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHardDrive(data || []);
      } else {
        showToast("Không thể tải danh sách thiết bị toàn hệ thống", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminDevice = async (device: AdminDevice) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa thiết bị "${device.name}" của người dùng "${device.username}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/admin/devices/${device.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Đã xóa thiết bị thành công!", "success");
        fetchAdminHardDrive();
      } else {
        const data = await res.json();
        showToast(data.error || "Không thể xóa thiết bị", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Cập nhật trạng thái tài khoản (Khóa/Mở khóa)
  const toggleUserStatus = async (user: UserAccount) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    const statusText = newStatus === "active" ? "mở khóa" : "khóa";
    
    if (!confirm(`Bạn có chắc chắn muốn ${statusText} tài khoản "${user.username}" không?`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Đã ${statusText} tài khoản thành công!`, "success");
        fetchUsers();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Không thể cập nhật tài khoản", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật máy chủ", "error");
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (user: UserAccount) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${user.username}"? Mọi dữ liệu thiết bị liên quan sẽ bị xóa sạch!`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Đã xóa tài khoản thành công!", "success");
        // Nếu trang hiện tại không còn user nào sau khi xóa, lùi lại 1 trang
        if (users.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchUsers();
        }
      } else {
        const errData = await res.json();
        showToast(errData.error || "Không thể xóa tài khoản", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Mở modal thêm user
  const openCreateUserModal = () => {
    setModalMode("create");
    setUserForm({
      username: "",
      email: "",
      password: "",
      role: "user"
    });
    setShowUserModal(true);
  };

  // Mở modal sửa user
  const openEditUserModal = (user: UserAccount) => {
    setModalMode("edit");
    setSelectedUserId(user.id);
    setUserForm({
      username: user.username, // Chỉ để hiển thị (không cho sửa username ở backend)
      email: user.email,
      password: "", // Để trống, chỉ nhập khi muốn đổi pass
      role: user.role
    });
    setShowUserModal(true);
  };

  // Submit tạo/sửa user
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let url = `${getApiBase()}/api/admin/users`;
      let method = "POST";
      let bodyData: any = {
        email: userForm.email,
        role: userForm.role
      };

      if (modalMode === "create") {
        bodyData.username = userForm.username;
        bodyData.password = userForm.password;
      } else {
        url = `${getApiBase()}/api/admin/users/${selectedUserId}`;
        method = "PUT";
        if (userForm.password) {
          bodyData.password = userForm.password;
        }
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(modalMode === "create" ? "Tạo tài khoản mới thành công!" : "Cập nhật tài khoản thành công!", "success");
        setShowUserModal(false);
        fetchUsers();
      } else {
        showToast(data.error || "Tác vụ thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Kích hoạt form chỉnh sửa gói
  const startEditPackage = (pkg: PackageConfig) => {
    setEditingPackage(pkg);
    setPackageModalMode("edit");
    setPackageForm({
      name: pkg.name,
      price: pkg.price.toString(),
      max_devices: pkg.max_devices.toString(),
      description: pkg.description || ""
    });
    setShowPackageModal(true);
  };

  // Mở form thêm gói mới
  const startCreatePackage = () => {
    setEditingPackage(null);
    setPackageModalMode("create");
    setPackageForm({
      name: "",
      price: "",
      max_devices: "",
      description: ""
    });
    setShowPackageModal(true);
  };

  // Submit cập nhật/tạo gói
  const handlePackageFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let url = `${getApiBase()}/api/admin/packages`;
      let method = "POST";
      const bodyData = {
        name: packageForm.name,
        price: parseFloat(packageForm.price),
        max_devices: parseInt(packageForm.max_devices),
        description: packageForm.description
      };

      if (packageModalMode === "edit" && editingPackage) {
        url = `${getApiBase()}/api/admin/packages/${editingPackage.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(packageModalMode === "create" ? "Thêm gói dịch vụ mới thành công!" : "Cập nhật thông số gói thành công!", "success");
        setShowPackageModal(false);
        fetchPackages();
      } else {
        showToast(data.error || "Tác vụ thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Xóa gói dịch vụ
  const handleDeletePackage = async (pkg: PackageConfig) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${pkg.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/admin/packages/${pkg.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Đã xóa gói dịch vụ thành công!", "success");
        fetchPackages();
      } else {
        showToast(data.error || "Không thể xóa gói", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  // Tính toán số trang
  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Loading state hoặc Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            <div className="spinner" style={{ border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #38bdf8", borderRadius: "50%", width: "24px", height: "24px", margin: "0 auto 12px auto", animation: "spin 0.8s linear infinite" }}></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {/* Tab 1: Quản lý tài khoản */}
            {activeTab === "users" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Thanh công cụ: Tìm kiếm & Thêm mới */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, minWidth: "260px", position: "relative" }}>
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tài khoản, email..." 
                      className="formInput"
                      style={{ width: "100%", paddingRight: "40px", height: "40px", borderRadius: 0, background: "rgba(0, 0, 0, 0.25)" }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      style={{ position: "absolute", right: "4px", top: "4px", bottom: "4px", width: "32px", border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Search size={18} />
                    </button>
                  </form>
                  <button 
                    onClick={openCreateUserModal}
                    className="submitBtn"
                    style={{ margin: 0, marginLeft: "auto", height: "40px", display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", borderRadius: 0, background: "#38bdf8" }}
                  >
                    <UserPlus size={16} style={{ color: "#000" }} />
                    <span style={{ color: "#000", fontWeight: 600 }}>Tạo tài khoản</span>
                  </button>
                </div>

                <div className="tableContainer">
                  <table className="adminTable">
                    <thead>
                      <tr>
                        <th>Tài khoản</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.4)" }}>
                            Không tìm thấy tài khoản người dùng nào.
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td data-label="Tài khoản" style={{ fontWeight: 600 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div 
                                  style={{ 
                                    width: "28px", 
                                    height: "28px", 
                                    borderRadius: "50%", 
                                    background: user.avatar_url 
                                      ? `url(${getApiBase()}${user.avatar_url}) center/cover no-repeat`
                                      : "rgba(255,255,255,0.06)", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#fff"
                                  }}
                                >
                                  {!user.avatar_url && (user.username ? user.username.charAt(0).toUpperCase() : "U")}
                                </div>
                                <span>{user.username}</span>
                              </div>
                            </td>
                            <td data-label="Email">{user.email}</td>
                            <td data-label="Vai trò">
                              <span className={`badge ${user.role === "super_admin" ? "badgeAdmin" : "badgeUser"}`}>
                                {user.role === "super_admin" ? "Admin" : "Người dùng"}
                              </span>
                            </td>
                            <td data-label="Trạng thái">
                              <span className={`badge ${user.status === "active" ? "badgeActive" : "badgeInactive"}`}>
                                {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                              </span>
                            </td>
                            <td data-label="Hành động" style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                {/* Nút Edit */}
                                <button 
                                  className="actionBtn btnSuccess"
                                  style={{ padding: "6px" }}
                                  title="Chỉnh sửa tài khoản"
                                  onClick={() => openEditUserModal(user)}
                                >
                                  <Pencil size={14} />
                                </button>
                                
                                {user.role !== "super_admin" && (
                                  <>
                                    {/* Nút Lock / Unlock */}
                                    <button 
                                      className={`actionBtn ${user.status === "active" ? "btnDanger" : "btnSuccess"}`}
                                      style={{ padding: "6px" }}
                                      title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                      onClick={() => toggleUserStatus(user)}
                                    >
                                      {user.status === "active" ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>

                                    {/* Nút Delete */}
                                    <button 
                                      className="actionBtn btnDanger"
                                      style={{ padding: "6px" }}
                                      title="Xóa tài khoản"
                                      onClick={() => handleDeleteUser(user)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang (Pagination) */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", flexWrap: "wrap", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      Trang {page} / {totalPages} (Tổng số {totalUsers} người dùng)
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button 
                        className="actionBtn"
                        disabled={page === 1}
                        style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                      >
                        <ChevronLeft size={14} /> Trước
                      </button>
                      <button 
                        className="actionBtn"
                        disabled={page === totalPages}
                        style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      >
                        Sau <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Quản lý gói */}
            {activeTab === "packages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Nút thêm gói mới */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={startCreatePackage}
                    className="submitBtn"
                    style={{ margin: 0, height: "40px", display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", borderRadius: 0, background: "#38bdf8" }}
                  >
                    <Plus size={16} style={{ color: "#000" }} />
                    <span style={{ color: "#000", fontWeight: 600 }}>Thêm gói cước</span>
                  </button>
                </div>

                <div className="tableContainer">
                  <table className="adminTable">
                    <thead>
                      <tr>
                        <th>Tên gói</th>
                        <th>Giá bán</th>
                        <th>Giới hạn VPS</th>
                        <th>Mô tả</th>
                        <th style={{ textAlign: "right" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td data-label="Tên gói" style={{ fontWeight: 600 }}>{pkg.name}</td>
                          <td data-label="Giá bán">
                            <span style={{ color: "#38bdf8", fontWeight: 600 }}>
                              {pkg.price.toLocaleString("vi-VN")} VND
                            </span>
                          </td>
                          <td data-label="Giới hạn VPS">
                            <span className="badge badgeUser">
                              Tối đa {pkg.max_devices} VPS
                            </span>
                          </td>
                          <td data-label="Mô tả" style={{ color: "rgba(255,255,255,0.6)" }}>{pkg.description}</td>
                          <td data-label="Hành động" style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button 
                                className="actionBtn btnSuccess"
                                style={{ padding: "6px" }}
                                title="Sửa gói cước"
                                onClick={() => startEditPackage(pkg)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                className="actionBtn btnDanger"
                                style={{ padding: "6px" }}
                                title="Xóa gói cước"
                                onClick={() => handleDeletePackage(pkg)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Giao dịch PayOS và MoMo */}
            {activeTab === "payments" && (
              <div className="tableContainer">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>Tài khoản</th>
                      <th>Gói cước</th>
                      <th>Số tiền</th>
                      <th>Cổng</th>
                      <th>Mã giao dịch</th>
                      <th>Nội dung</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                      <th style={{ textAlign: "right" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                            <Receipt size={48} color="rgba(255,255,255,0.15)"  />
                            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                              Chưa có giao dịch thanh toán nào được ghi nhận.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      payments.map((pay) => (
                        <tr key={pay.id}>
                          <td data-label="Tài khoản" style={{ fontWeight: 600 }}>{pay.username}</td>
                          <td data-label="Gói cước" style={{ color: "rgba(255, 255, 255, 0.8)" }}>{pay.package_name || "Gói lẻ"}</td>
                          <td data-label="Số tiền" style={{ color: "#34d399", fontWeight: 600 }}>
                            +{pay.amount.toLocaleString("vi-VN")}đ
                          </td>
                          <td data-label="Cổng">
                            <span style={{ 
                              background: pay.payment_gateway === "Momo" ? "rgba(165, 18, 93, 0.15)" : "rgba(59, 130, 246, 0.15)",
                              color: pay.payment_gateway === "Momo" ? "#ec4899" : "#3b82f6",
                              border: pay.payment_gateway === "Momo" ? "1px solid rgba(165, 18, 93, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600
                            }}>
                              {pay.payment_gateway}
                            </span>
                          </td>
                          <td data-label="Mã giao dịch">
                            <code style={{ background: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}>
                              {pay.transaction_code}
                            </code>
                          </td>
                          <td data-label="Nội dung">{pay.content}</td>
                          <td data-label="Trạng thái">
                            <span className={`badge ${
                              pay.status === "completed" 
                                ? "badgeActive" 
                                : pay.status === "failed" 
                                ? "badgeInactive" 
                                : "badgeUser"
                            }`}>
                              {pay.status === "completed" ? "Thành công" : pay.status === "failed" ? "Thất bại" : "Chờ xử lý"}
                            </span>
                          </td>
                          <td data-label="Thời gian" style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                            {new Date(pay.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td data-label="Hành động" style={{ textAlign: "right" }}>
                            {pay.status === "pending" ? (
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                <button 
                                  onClick={() => handleApprovePayment(pay.id)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    background: "rgba(52, 211, 153, 0.15)",
                                    border: "1px solid rgba(52, 211, 153, 0.3)",
                                    color: "#34d399",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Duyệt
                                </button>
                                <button 
                                  onClick={() => handleRejectPayment(pay.id)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    background: "rgba(248, 113, 113, 0.15)",
                                    border: "1px solid rgba(248, 113, 113, 0.3)",
                                    color: "#f87171",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: "rgba(255, 255, 255, 0.25)" }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4: Quản lý thiết bị toàn hệ thống */}
            {activeTab === "devices" && (
              <div className="tableContainer">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>Tên thiết bị</th>
                      <th>Chủ sở hữu</th>
                      <th>Hệ điều hành</th>
                      <th>Trạng thái</th>
                      <th>Ngày khởi tạo</th>
                      <th style={{ textAlign: "right" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminHardDrive.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                            <HardDrive size={48} color="rgba(255,255,255,0.15)"  />
                            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                              Chưa có thiết bị nào được khởi tạo trên toàn bộ hệ thống.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      adminHardDrive.map((dev) => (
                        <tr key={dev.id}>
                          <td data-label="Tên thiết bị" style={{ fontWeight: 600 }}>{dev.name}</td>
                          <td data-label="Chủ sở hữu" style={{ color: "#38bdf8", fontWeight: 600 }}>
                            {dev.username}
                          </td>
                          <td data-label="Hệ điều hành">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", textTransform: "capitalize" }}>
                              {getOSIcon(dev.os, 14)} {dev.os}
                            </span>
                          </td>
                          <td data-label="Trạng thái">
                            <span className={`badge ${dev.status === "online" ? "badgeActive" : "badgeInactive"}`}>
                              {dev.status === "online" ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td data-label="Ngày khởi tạo" style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                            {new Date(dev.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td data-label="Hành động" style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button 
                                className="actionBtn btnDanger"
                                style={{ padding: "6px" }}
                                title="Xóa thiết bị khỏi hệ thống"
                                onClick={() => handleDeleteAdminDevice(dev)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Thêm / Sửa người dùng */}
      {showUserModal && (
        <div className="modalOverlay" style={{ zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="modalContent" style={{ maxWidth: "420px", width: "90%", margin: "auto", position: "relative" }}>
            <div className="modalHeader">
              <h3 className="modalTitle" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {modalMode === "create" ? <UserPlus size={20} color="#38bdf8" /> : <Pencil size={20} color="#38bdf8" />}
                {modalMode === "create" ? "Tạo tài khoản mới" : "Chỉnh sửa tài khoản"}
              </h3>
              <button className="closeButton" onClick={() => setShowUserModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Username (Chỉ cho sửa ở mode Create) */}
              <div className="formGroup">
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={13} /> Tên đăng nhập</label>
                <input 
                  type="text" 
                  className="formInput"
                  disabled={modalMode === "edit"}
                  style={{ opacity: modalMode === "edit" ? 0.6 : 1, background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important" }}
                  placeholder="Nhập tên đăng nhập..."
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="formGroup">
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={13} /> Địa chỉ Email</label>
                <input 
                  type="email" 
                  className="formInput"
                  style={{ background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important" }}
                  placeholder="example@domain.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              {/* Password */}
              <div className="formGroup">
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><Key size={13} /> Mật khẩu {modalMode === "edit" && "(để trống nếu không đổi)"}</label>
                <input 
                  type="password" 
                  className="formInput"
                  style={{ background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important" }}
                  placeholder={modalMode === "create" ? "Nhập mật khẩu..." : "••••••••"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={modalMode === "create"}
                />
              </div>

              {/* Role */}
              <div className="formGroup">
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}><Shield size={13} /> Vai trò hệ thống</label>
                <select
                  className="formInput"
                  style={{ background: "rgba(0, 0, 0, 0.25)", height: "38px", color: "#fff", cursor: "pointer", fontSize: "16px !important" }}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="user" style={{ background: "#1c1c22" }}>Người dùng bình thường (User)</option>
                  <option value="super_admin" style={{ background: "#1c1c22" }}>Quản trị viên (Super Admin)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" className="cancelBtn" onClick={() => setShowUserModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="submitBtn" style={{ marginTop: 0 }}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa gói cước */}
      {showPackageModal && (
        <div className="modalOverlay" style={{ zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="modalContent" style={{ maxWidth: "420px", width: "90%", margin: "auto", position: "relative" }}>
            <div className="modalHeader">
              <h3 className="modalTitle" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign size={20} color="#38bdf8" />
                {packageModalMode === "create" ? "Thêm gói dịch vụ mới" : "Chỉnh sửa cấu hình gói"}
              </h3>
              <button className="closeButton" onClick={() => setShowPackageModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePackageFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Tên gói */}
              <div className="formGroup">
                <label>Tên gói dịch vụ</label>
                <input 
                  type="text" 
                  className="formInput"
                  style={{ background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important" }}
                  placeholder="Ví dụ: Gói Cơ Bản, Gói Nâng Cao..."
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  required
                />
              </div>

              /* Giá bán & Giới hạn thiết bị */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="formGroup">
                  <label>Giá bán (VND)</label>
                  <input 
                    type="number" 
                    className="formInput"
                    style={{ background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important", width: "100%" }}
                    placeholder="55000"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="formGroup">
                  <label>Giới hạn VPS</label>
                  <input 
                    type="number" 
                    className="formInput"
                    style={{ background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important", width: "100%" }}
                    placeholder="3"
                    value={packageForm.max_devices}
                    onChange={(e) => setPackageForm({ ...packageForm, max_devices: e.target.value })}
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Mô tả gói */}
              <div className="formGroup">
                <label>Mô tả gói</label>
                <textarea 
                  className="formInput"
                  style={{ minHeight: "80px", resize: "vertical", background: "rgba(0, 0, 0, 0.25)", fontSize: "16px !important" }}
                  placeholder="Mô tả thông tin chi tiết về gói..."
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" className="cancelBtn" onClick={() => setShowPackageModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="submitBtn" style={{ marginTop: 0 }}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}