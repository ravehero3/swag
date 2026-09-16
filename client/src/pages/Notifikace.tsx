import React, { useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader";

interface NotificationItem {
  id: number;
  type: "purchase" | "like" | "comment" | "system";
  title: string;
  description: string;
  related_data?: any;
  is_read: boolean;
  created_at: string;
}

const NotifikaceNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "purchase" | "like" | "comment" | "system">("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let query = `/api/admin/notifications?limit=${ITEMS_PER_PAGE}&offset=${page * ITEMS_PER_PAGE}`;
      const res = await fetch(query, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        let filtered = data;

        if (filter !== "all") {
          filtered = data.filter((n: NotificationItem) => n.type === filter);
        }

        setNotifications(filtered);
        setHasMore(filtered.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chcete smazat toto oznámení?")) return;

    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
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

  const getFilterLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: "Všechna oznámení",
      purchase: "Nákupy",
      like: "Oblíbené",
      comment: "Komentáře",
      system: "Systém",
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("cs-CZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      <AdminHeader onNavigateToNotifications={() => {}} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Oznámení</h1>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Sledujte všechny nákupy, oblíbené položky a komentáře
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {["all", "purchase", "like", "comment", "system"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilter(type as any);
                setPage(0);
              }}
              style={{
                background: filter === type ? "#E11D48" : "rgba(255,255,255,0.05)",
                border: filter === type ? "1px solid #E11D48" : "1px solid rgba(255,255,255,0.1)",
                color: filter === type ? "#fff" : "#888",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                if (filter !== type) {
                  (e.target as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                  (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== type) {
                  (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                }
              }}
            >
              {getNotificationIcon(type)} {getFilterLabel(type)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid #222",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              Načítání…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              Žádná oznámení pro tento filtr
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid #1a1a1a",
                    background: notif.is_read ? "transparent" : "rgba(225, 29, 72, 0.08)",
                    transition: "all 200ms",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = notif.is_read
                      ? "transparent"
                      : "rgba(225, 29, 72, 0.08)";
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "24px", flexShrink: 0 }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                        {notif.title}
                        {!notif.is_read && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "6px",
                              height: "6px",
                              background: "#E11D48",
                              borderRadius: "50%",
                              marginLeft: "8px",
                            }}
                          ></span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#999", lineHeight: "1.5", marginBottom: "6px" }}>
                        {notif.description}
                      </div>
                      {notif.related_data && (
                        <div style={{ fontSize: "11px", color: "#666", fontFamily: "monospace" }}>
                          {JSON.stringify(notif.related_data, null, 2)
                            .split("\n")
                            .slice(0, 2)
                            .join(" ")}
                        </div>
                      )}
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                        {formatDate(notif.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Označit jako přečtené"
                        style={{
                          background: "rgba(225, 29, 72, 0.2)",
                          border: "1px solid rgba(225, 29, 72, 0.4)",
                          color: "#E11D48",
                          borderRadius: "4px",
                          padding: "6px 10px",
                          fontSize: "10px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      title="Smazat"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#888",
                        borderRadius: "4px",
                        padding: "6px 10px",
                        fontSize: "10px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasMore && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => setPage(page + 1)}
              style={{
                background: "#E11D48",
                border: "1px solid #E11D48",
                color: "#fff",
                borderRadius: "6px",
                padding: "10px 20px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Načíst dalších
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifikaceNotifications;
