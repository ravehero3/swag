import React, { useState, useEffect, useRef } from "react";

interface NotificationItem {
  id: number;
  type: "purchase" | "like" | "comment" | "system";
  title: string;
  description: string;
  related_data?: any;
  is_read: boolean;
  created_at: string;
}

interface AdminHeaderProps {
  adminEmail?: string;
  adminName?: string;
  adminProfileImage?: string;
  onNavigateToNotifications?: () => void;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminEmail = "admin@voodoo808.com",
  adminName = "Admin",
  adminProfileImage,
  onNavigateToNotifications,
  onLogout,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/admin/notifications/count/unread", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?limit=100", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        // Mark all as read when viewing
        await markAllAsRead();
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleNotificationClick = () => {
    fetchNotifications();
    setShowDropdown(!showDropdown);
  };

  const handleNavigateToNotifications = () => {
    setShowDropdown(false);
    onNavigateToNotifications?.();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return "🛒";
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "system":
        return "⚙️";
      default:
        return "📬";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "právě teď";
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffHours < 24) return `před ${diffHours} h`;
    if (diffDays < 7) return `před ${diffDays} dny`;
    return date.toLocaleDateString("cs-CZ");
  };

  return (
    <div
      style={{
        background: "linear-gradient(to right, #0a0a0a, #1a1a1a)",
        borderBottom: "1px solid #222",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left - Logo/Branding */}
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "1px" }}>
        🎵 VOODOO808
      </div>

      {/* Center - Title (optional) */}
      <div style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}></div>

      {/* Right - Profile & Notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={handleNotificationClick}
            aria-label="Oznámení"
            aria-expanded={showDropdown}
            aria-haspopup="true"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              position: "relative",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255,255,255,0.1)";
              (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            🔔
            {unreadCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#E11D48",
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "2px solid #0a0a0a",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "50px",
                right: 0,
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: "8px",
                width: "400px",
                maxHeight: "600px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #222",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Oznámení</span>
                <button
                  onClick={handleNavigateToNotifications}
                  style={{
                    background: "transparent",
                    border: "1px solid #E11D48",
                    color: "#E11D48",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "10px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Podrobnosti →
                </button>
              </div>

              {/* Notifications List */}
              <div style={{ overflow: "auto", flex: 1 }}>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "12px" }}>
                    Načítání…
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#666", fontSize: "12px" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>📬</div>
                    <div>Žádná oznámení</div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Budou se zde zobrazovat nákupy, oblíbené a komentáře</div>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #1a1a1a",
                        cursor: "pointer",
                        background: notif.is_read ? "rgba(255,255,255,0.02)" : "rgba(225, 29, 72, 0.1)",
                        transition: "background 200ms",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = notif.is_read
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(225, 29, 72, 0.1)";
                      }}
                    >
                      <span style={{ fontSize: "18px", flexShrink: 0 }}>{getNotificationIcon(notif.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {notif.title}
                          {!notif.is_read && (
                            <span
                              style={{
                                display: "inline-block",
                                width: "5px",
                                height: "5px",
                                background: "#E11D48",
                                borderRadius: "50%",
                              }}
                            ></span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px", lineHeight: "1.4" }}>
                          {notif.description}
                        </div>
                        <div style={{ fontSize: "10px", color: "#666" }}>{formatDate(notif.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderTop: "1px solid #222",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={handleNavigateToNotifications}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#E11D48",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: "4px 0",
                    }}
                  >
                    Zobrazit všechny oznámení →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Info & Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Admin Email */}
          <div style={{ textAlign: "right", fontSize: "11px" }}>
            <div style={{ color: "#fff", fontWeight: 600 }}>{adminName}</div>
            <div style={{ color: "#888", fontSize: "10px" }}>{adminEmail}</div>
          </div>

          {/* Profile Picture */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: adminProfileImage
                ? `url('${adminProfileImage}') center / cover`
                : "linear-gradient(135deg, #E11D48, #EA580C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              border: "2px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
              group: true,
            }}
            title={adminEmail}
          >
            {!adminProfileImage && adminEmail.charAt(0).toUpperCase()}
          </div>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Odhlásit se"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#888",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              Odhlásit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
