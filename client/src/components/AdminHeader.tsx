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
}

interface AdminInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
  adminName: string;
  adminProfileImage?: string;
}

const AdminInfoModal: React.FC<AdminInfoModalProps> = ({
  isOpen,
  onClose,
  adminEmail,
  adminName,
  adminProfileImage,
}) => {
  const [profileImage, setProfileImage] = useState(adminProfileImage);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Soubor je příliš velký. Maximum je 5MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Prosím vyberte obrázek.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfileImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profileImage || profileImage === adminProfileImage) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile/image", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: profileImage,
        }),
      });

      if (response.ok) {
        // Reload page to update with new image
        window.location.reload();
      } else {
        alert("Chyba při ukládání fotografie. Zkuste to znovu.");
      }
    } catch (err) {
      console.error("Error saving profile image:", err);
      alert("Chyba při ukládání fotografie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#0a0a0a",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "32px",
          zIndex: 1001,
          minWidth: "320px",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "#888",
            fontSize: "20px",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            transition: "all 200ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#888";
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#fff",
            margin: "0 0 24px 0",
            paddingRight: "24px",
          }}
        >
          Profil administrátora
        </h2>

        {/* Profile Picture Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          {/* Profile Picture */}
          <div
            onClick={handleUploadClick}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: profileImage ? `url('${profileImage}') center / cover` : "linear-gradient(135deg, #E11D48, #EA580C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "28px",
              border: "2px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
              transition: "all 200ms",
              marginBottom: "12px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.5)";
              (e.currentTarget as HTMLElement).style.background = profileImage
                ? `url('${profileImage}') center / cover, rgba(225, 29, 72, 0.2)`
                : "linear-gradient(135deg, #E11D48, #EA580C)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLElement).style.background = profileImage
                ? `url('${profileImage}') center / cover`
                : "linear-gradient(135deg, #E11D48, #EA580C)";
            }}
            title="Kliknutím změňte fotku"
          >
            {!profileImage && adminEmail.charAt(0).toUpperCase()}
            {/* Overlay hint */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                opacity: 0,
                transition: "opacity 200ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0";
              }}
            >
              Změnit
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            style={{
              background: "rgba(225, 29, 72, 0.1)",
              border: "1px solid rgba(225, 29, 72, 0.3)",
              color: "#E11D48",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.2)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.1)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.3)";
            }}
          >
            Nahrát fotografii
          </button>
        </div>

        {/* Admin Info */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              Jméno
            </div>
            <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>{adminName || "Admin"}</div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              E-mail
            </div>
            <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500, wordBreak: "break-all" }}>
              {adminEmail}
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{
              flex: 1,
              background: "#E11D48",
              border: "1px solid #E11D48",
              color: "#fff",
              borderRadius: "6px",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isSaving ? "default" : "pointer",
              transition: "all 200ms",
              opacity: isSaving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                (e.currentTarget as HTMLElement).style.background = "#C91640";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(225, 29, 72, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#E11D48";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {isSaving ? "Ukládám..." : "Uložit"}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              borderRadius: "6px",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isSaving ? "default" : "pointer",
              transition: "all 200ms",
              opacity: isSaving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            Zavřít
          </button>
        </div>
      </div>
    </>
  );
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminEmail = "admin@voodoo808.com",
  adminName = "Admin",
  adminProfileImage,
  onNavigateToNotifications,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
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
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4V2m10 2v-2M3.5 10h17M5 10v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8H5z" />
          </svg>
        );
      case "like":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "comment":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case "system":
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
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
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 16px",
          height: "42px",
          borderBottom: "1px solid #333",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(13, 13, 13, 0.3)",
        }}
      >
        {/* Left - Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/uploads/artwork/voodoo808-logo.png"
            alt="VOODOO808"
            style={{
              height: "24px",
              cursor: "pointer",
              filter: "invert(1)",
              display: "block",
            }}
          />
        </div>

        {/* Right - Notifications & Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", zIndex: 10, paddingRight: "8px" }}>
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
                width: "36px",
                height: "36px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                position: "relative",
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.color = "#888";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {unreadCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#E11D48",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
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
                  top: "48px",
                  right: 0,
                  background: "#0a0a0a",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  width: "380px",
                  maxHeight: "500px",
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
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Oznámení</span>
                  <button
                    onClick={handleNavigateToNotifications}
                    style={{
                      background: "transparent",
                      border: "1px solid #E11D48",
                      color: "#E11D48",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "9px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 200ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    Podrobnosti
                  </button>
                </div>

                {/* Notifications List */}
                <div style={{ overflow: "auto", flex: 1 }}>
                  {loading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "11px" }}>
                      Načítání...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#666", fontSize: "11px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto", opacity: 0.5 }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div>Žádná oznámení</div>
                      <div style={{ fontSize: "9px", color: "#555", marginTop: "4px" }}>
                        Budou se zde zobrazovat nákupy, oblíbené a komentáře
                      </div>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #1a1a1a",
                          cursor: "pointer",
                          background: notif.is_read ? "rgba(255,255,255,0.02)" : "rgba(225, 29, 72, 0.08)",
                          transition: "background 200ms",
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.12)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = notif.is_read
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(225, 29, 72, 0.08)";
                        }}
                      >
                        <span style={{ fontSize: "14px", flexShrink: 0, color: "#E11D48", marginTop: "2px" }}>
                          {getNotificationIcon(notif.type)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#fff",
                              marginBottom: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {notif.title}
                            {!notif.is_read && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "4px",
                                  height: "4px",
                                  background: "#E11D48",
                                  borderRadius: "50%",
                                }}
                              ></span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#999",
                              marginBottom: "4px",
                              lineHeight: "1.4",
                            }}
                          >
                            {notif.description}
                          </div>
                          <div style={{ fontSize: "9px", color: "#666" }}>
                            {formatDate(notif.created_at)}
                          </div>
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
                        fontSize: "10px",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: "4px 0",
                        transition: "all 200ms",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "0.7";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                      }}
                    >
                      Zobrazit všechna oznámení
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Picture Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: adminProfileImage
                ? `url('${adminProfileImage}') center / cover`
                : "linear-gradient(135deg, #E11D48, #EA580C)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              transition: "all 200ms",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
            title="Profil administrátora"
          >
            {!adminProfileImage && adminEmail.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Admin Info Modal */}
      <AdminInfoModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        adminEmail={adminEmail}
        adminName={adminName}
        adminProfileImage={adminProfileImage}
      />
    </>
  );
};

export default AdminHeader;
