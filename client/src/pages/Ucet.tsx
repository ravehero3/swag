import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../App.js";
import { useLocation, Link } from "wouter";
import AvatarCropModal from "../components/AvatarCropModal.js";

interface OrderItem {
  productId: number;
  title: string;
  price: number;
  productType: string;
  artwork_url?: string | null;
  downloadUrl?: string | null;
  trackoutDownloadUrl?: string | null;
  contractAvailable?: boolean;
  contractDownloadUrl?: string | null;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  payment_method?: string;
}

export default function Ucet() {
  const { user, setUser, addToCart, cart, previewPlayer } = useApp() as any;
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadBanner, setShowDownloadBanner] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
    if (user?.username) setUsername(user.username);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stazeno") === "1") {
      setShowDownloadBanner(true);
      window.history.replaceState({}, "", "/ucet");
      const t = setTimeout(() => setShowDownloadBanner(false), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleUsernameEdit = () => {
    setUsernameInput(username);
    setUsernameError(null);
    setEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    if (!usernameInput.trim()) return;
    setSavingUsername(true);
    setUsernameError(null);
    try {
      const res = await fetch("/api/auth/username", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username);
        setEditingUsername(false);
        if (user) setUser({ ...user, username: data.username });
      } else {
        setUsernameError(data.error || "Chyba při ukládání");
      }
    } catch {
      setUsernameError("Chyba připojení");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }, []);

  const handleCropSave = useCallback(async (blob: Blob) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        setCropImageSrc(null);
        if (user) setUser({ ...user, avatarUrl: data.avatarUrl });
      } else {
        alert(data.error || "Chyba při nahrávání");
      }
    } catch {
      alert("Chyba při nahrávání avataru.");
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLocation("/prihlasit-se");
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, savedRes] = await Promise.all([
          fetch("/api/orders/my", { credentials: "include" }),
          fetch("/api/saved", { credentials: "include" })
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedItems(Array.isArray(savedData) ? savedData.filter((item: any) => item.item_data != null) : []);
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, setLocation]);

  const getSavedPreviewUrl = (item: any) => {
    const urls = [
      ...(Array.isArray(item.item_data?.preview_urls) ? item.item_data.preview_urls : []),
      item.item_data?.preview_url,
    ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    return urls[0] || "";
  };

  const toPreviewPlayerItem = (item: any) => {
    const previewUrl = getSavedPreviewUrl(item);
    if (!previewUrl) return;
    return {
      id: item.item_data?.id || item.item_id,
      title: item.item_data?.title || "Preview",
      artist: item.item_type === "beat" ? item.item_data?.artist || "Beat" : "Sound Kit",
      bpm: item.item_data?.bpm || 0,
      key: item.item_data?.key || "",
      price: Number(item.item_data?.price || 0),
      preview_url: previewUrl,
      artwork_url: item.item_data?.artwork_url || "/uploads/artwork/metallic-logo.png",
      product_type: item.item_type === "beat" ? "beat" as const : "sound_kit" as const,
    };
  };

  const handleSavedItemClick = (item: any) => {
    const previewItem = toPreviewPlayerItem(item);
    if (!previewItem) return;
    const queue = savedItems.map(toPreviewPlayerItem).filter(Boolean);
    previewPlayer.playPreview(previewItem, queue);
  };

  const handleCancelOrder = async (orderId: number) => {
    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
        setConfirmCancelId(null);
      } else {
        alert(data.error || "Nepodařilo se zrušit objednávku.");
      }
    } catch {
      alert("Chyba při rušení objednávky.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handlePayOrder = async (orderId: number) => {
    setPayingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.gw_url) {
        window.location.href = `/gopay-redirect?url=${encodeURIComponent(data.gw_url)}`;
      } else {
        alert(data.error || "Nepodařilo se zahájit platbu.");
      }
    } catch {
      alert("Chyba při připojování k platební bráně.");
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: item.item_data?.id || item.item_id,
      productType: item.item_type as "beat" | "sound_kit",
      title: item.item_data?.title,
      price: Number(item.item_data?.price || 0),
      artworkUrl: item.item_data?.artwork_url || null,
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#666" }}>
        Načítání...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "100px 20px 120px" }}>
      {showDownloadBanner && (
        <div
          data-testid="banner-download-success"
          style={{
            position: "fixed",
            top: "58px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 20px",
            background: "linear-gradient(135deg, #0d1f10 0%, #0a1a0c 100%)",
            border: "1px solid rgba(36,224,83,0.35)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(36,224,83,0.1)",
            animation: "slideDownFade 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            maxWidth: "420px",
            width: "calc(100vw - 32px)",
          }}
        >
          <style>{`@keyframes slideDownFade { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(36,224,83,0.12)", border: "1px solid rgba(36,224,83,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#24e053" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>Soubory jsou připraveny!</div>
            <div style={{ fontSize: "12px", color: "#555" }}>Stáhni je níže v sekci Stažení zdarma</div>
          </div>
          <button
            onClick={() => setShowDownloadBanner(false)}
            style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "4px", flexShrink: 0, lineHeight: 1 }}
            aria-label="Zavřít"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .ucet-order-card {
          padding: 24px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          cursor: default;
        }
        .ucet-order-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 32px rgba(13,13,13,0.5);
          border-color: #555;
        }
        .ucet-saved-item {
          position: relative;
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        .ucet-saved-item:hover {
          transform: scale(1.02);
        }
        .ucet-saved-item:hover .ucet-play-overlay {
          opacity: 1;
        }
        .ucet-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 4px;
          background: rgba(13,13,13,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .ucet-saved-item.is-playing .ucet-play-overlay {
          opacity: 1;
        }
        .ucet-pay-btn {
          background: #24e053;
          color: #000;
          border: none;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: opacity 0.2s ease, transform 0.15s ease;
          white-space: nowrap;
        }
        .ucet-pay-btn:hover {
          opacity: 0.85;
          transform: scale(1.03);
        }
        .ucet-pay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .ucet-cancel-btn {
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.2s ease, color 0.2s ease;
          white-space: nowrap;
          font-family: inherit;
        }
        .ucet-cancel-btn:hover {
          background: #ef4444;
          color: #fff;
        }
        .ucet-cancel-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ucet-add-cart-btn {
          width: 100%;
          margin-top: 10px;
          padding: 6px 10px;
          background: #000;
          color: #666;
          border: 1px solid #444;
          border-radius: 4px;
          font-size: 11px;
          font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
          font-weight: 500;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .ucet-add-cart-btn:hover {
          background: #fff;
          color: #000;
          border-color: #fff;
        }
        .ucet-add-cart-btn.in-cart {
          background: #24e053;
          color: #000;
          border-color: #24e053;
        }
        .ucet-contract-btn {
          padding: 4px 12px;
          background: transparent;
          color: #0B99FC;
          border: 1px solid #0B99FC;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .ucet-contract-btn:hover {
          background: #0B99FC;
          color: #000;
        }
      `}} />

      <h1 style={{ fontSize: "32px", marginBottom: "32px", fontWeight: "400" }}>Můj účet</h1>
      
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onSave={handleCropSave}
          saving={uploadingAvatar}
        />
      )}

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleAvatarFileSelect}
        data-testid="input-avatar-upload"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
        <div style={{ padding: "24px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Osobní údaje</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{ position: "relative", width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", background: "#222", border: "1px solid #333", cursor: `url('/cursors/handwriting-custom.cur'), crosshair`, flexShrink: 0, transition: "transform 0.2s ease", transform: "scale(1)" }}
              title="Klikněte pro změnu fotky"
              data-testid="button-change-avatar"
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.5)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#444" }}>
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                <span style={{ fontSize: "11px", color: "#fff", textAlign: "center", lineHeight: 1.3 }}>{uploadingAvatar ? "..." : "Změnit"}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", margin: "0 0 6px 0", fontSize: "14px" }}>{user?.email}</p>
              {editingUsername ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUsernameSave(); if (e.key === "Escape") setEditingUsername(false); }}
                      placeholder="vase_jmeno"
                      maxLength={50}
                      autoFocus
                      data-testid="input-username"
                      style={{ flex: 1, padding: "4px 10px", background: "#000", border: "1px solid #555", borderRadius: "4px", color: "#fff", fontSize: "13px", fontFamily: "inherit", outline: "none", minWidth: 0 }}
                    />
                    <button
                      onClick={handleUsernameSave}
                      disabled={savingUsername || !usernameInput.trim()}
                      data-testid="button-save-username"
                      style={{ padding: "4px 12px", background: "#fff", color: "#000", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: savingUsername ? 0.6 : 1 }}
                    >
                      {savingUsername ? "..." : "Uložit"}
                    </button>
                    <button
                      onClick={() => setEditingUsername(false)}
                      style={{ padding: "4px 8px", background: "transparent", color: "#666", border: "1px solid #333", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ✕
                    </button>
                  </div>
                  {usernameError && <p style={{ color: "#f87171", fontSize: "11px", margin: 0 }}>{usernameError}</p>}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: username ? "#aaa" : "#555", fontSize: "13px" }}>
                    {username ? `@${username}` : "Přidat uživatelské jméno"}
                  </span>
                  <button
                    onClick={handleUsernameEdit}
                    data-testid="button-edit-username"
                    style={{ padding: "2px 8px", background: "transparent", color: "#555", border: "1px solid #333", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#555"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#555"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; }}
                  >
                    {username ? "Upravit" : "+ Přidat"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Statistiky</h2>
          <p style={{ color: "#fff", margin: "0 0 8px 0" }}>Objednávky: {orders.length}</p>
          <p style={{ color: "#fff", margin: 0 }}>Uložené položky: {savedItems.length}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "48px" }}>
        <section>
          <h2 style={{ fontSize: "24px", marginBottom: "24px", fontWeight: "400" }}>Moje objednávky</h2>
          {orders.filter((o) => Number(o.total) > 0 && o.payment_method !== "free").length === 0 ? (
            <p style={{ color: "#666" }}>Zatím nemáte žádné objednávky.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.filter((o) => Number(o.total) > 0 && o.payment_method !== "free").map((order) => {
                const isPaid = order.status === "completed" || order.status === "paid";
                const isCancelled = order.status === "cancelled";
                const isAwaitingBankTransfer = order.status === "awaiting_payment" && order.payment_method === "bank_transfer";
                const isPendingGoPay = !isPaid && !isCancelled && !isAwaitingBankTransfer;
                const canCancel = !isPaid && !isCancelled;
                const statusColor = isPaid ? "#24e053" : isCancelled ? "#ef4444" : isAwaitingBankTransfer ? "#818cf8" : "#facc15";
                const statusLabel = isPaid ? "Dokončeno" : isCancelled ? "Zrušeno" : isAwaitingBankTransfer ? "Čeká na ověření platby" : "Čeká na platbu";
                const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="ucet-order-card" style={{ opacity: isCancelled ? 0.6 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>ČÍSLO OBJEDNÁVKY</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0 }}>#{order.id}</p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>DATUM</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>STAV</p>
                        <p style={{ color: statusColor, fontSize: "14px", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                          {statusLabel}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>CELKEM</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: "500" }}>{Number(order.total).toFixed(0)} CZK</p>
                      </div>
                      {(isPendingGoPay || isAwaitingBankTransfer) && (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                          {isPendingGoPay && (
                            <button
                              className="ucet-pay-btn"
                              disabled={payingOrderId === order.id}
                              onClick={() => handlePayOrder(order.id)}
                              data-testid={`button-pay-order-${order.id}`}
                            >
                              {payingOrderId === order.id ? "Přesměrování..." : "Zaplatit přes GoPay"}
                            </button>
                          )}
                          {isAwaitingBankTransfer && (
                            <div style={{ fontSize: "12px", color: "#818cf8", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: "4px", padding: "8px 14px", lineHeight: "1.5" }}>
                              Platba bankovním převodem čeká na ověření administrátorem.
                            </div>
                          )}
                          {canCancel && (
                            confirmCancelId === order.id ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa", whiteSpace: "nowrap" }}>Opravdu zrušit?</span>
                                <button
                                  className="ucet-cancel-btn"
                                  disabled={cancellingOrderId === order.id}
                                  onClick={() => handleCancelOrder(order.id)}
                                  data-testid={`button-confirm-cancel-${order.id}`}
                                >
                                  {cancellingOrderId === order.id ? "..." : "Ano, zrušit"}
                                </button>
                                <button
                                  onClick={() => setConfirmCancelId(null)}
                                  style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: "8px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}
                                >
                                  Ne
                                </button>
                              </div>
                            ) : (
                              <button
                                className="ucet-cancel-btn"
                                onClick={() => setConfirmCancelId(order.id)}
                                data-testid={`button-cancel-order-${order.id}`}
                              >
                                Zrušit
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ borderTop: "1px solid #222", paddingTop: "16px" }}>
                      <p style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>POLOŽKY</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {items.length === 0 ? (
                          <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>—</p>
                        ) : items.map((item, idx) => (
                          <div
                            key={`${item.productId ?? idx}-${idx}`}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ccc", fontSize: "14px", gap: "12px", flexWrap: "wrap" }}
                          >
                            <span style={{ flex: "1 1 auto", minWidth: 0 }}>{item.title || "—"}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                              {isPaid && item.downloadUrl && (
                                <a
                                  href={item.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`link-download-${order.id}-${item.productId ?? idx}`}
                                  style={{ padding: "4px 12px", background: "#24e053", color: "#000", borderRadius: "4px", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}
                                >
                                  Stáhnout
                                </a>
                              )}
                              {isPaid && item.trackoutDownloadUrl && (
                                <a
                                  href={item.trackoutDownloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`link-trackout-${order.id}-${item.productId ?? idx}`}
                                  style={{ padding: "4px 12px", background: "transparent", color: "#24e053", border: "1px solid #24e053", borderRadius: "4px", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}
                                >
                                  Trackout
                                </a>
                              )}
                              {isPaid && item.contractDownloadUrl && (
                                <a
                                  href={item.contractDownloadUrl}
                                  className="ucet-contract-btn"
                                  data-testid={`link-contract-${order.id}-${item.productId ?? idx}`}
                                >
                                  Licence (PDF)
                                </a>
                              )}
                              {isPaid && !item.downloadUrl && (
                                <span style={{ color: "#666", fontSize: "12px" }}>Odkaz připravujeme</span>
                              )}
                              <span style={{ color: "#fff", minWidth: "70px", textAlign: "right" }}>{item.price} CZK</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: "24px", marginBottom: "24px", fontWeight: "400" }}>Stažení zdarma</h2>
          {orders.filter((o) => Number(o.total) === 0 || o.payment_method === "free").length === 0 ? (
            <p style={{ color: "#666" }}>Zatím nemáte žádná stažení zdarma.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.filter((o) => Number(o.total) === 0 || o.payment_method === "free").map((order) => {
                const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="ucet-order-card" data-testid={`card-free-order-${order.id}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>DATUM</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</p>
                      </div>
                      <div>
                        <span style={{ padding: "4px 12px", background: "#24e053", color: "#000", borderRadius: "4px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>
                          ZDARMA
                        </span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid #222", paddingTop: "16px" }}>
                      <p style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>POLOŽKY</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {items.length === 0 ? (
                          <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>—</p>
                        ) : items.map((item, idx) => (
                          <div
                            key={`${item.productId ?? idx}-${idx}`}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ccc", fontSize: "14px", gap: "12px", flexWrap: "wrap" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 auto", minWidth: 0 }}>
                              {item.artwork_url && (
                                <img
                                  src={item.artwork_url}
                                  alt=""
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                  style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                                />
                              )}
                              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || "—"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                              {item.downloadUrl ? (
                                <a
                                  href={item.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`link-free-download-${order.id}-${item.productId ?? idx}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "7px 16px",
                                    background: "linear-gradient(135deg, #24e053 0%, #1bc447 100%)",
                                    color: "#000",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.03em",
                                    boxShadow: "0 2px 12px rgba(36,224,83,0.25)",
                                    transition: "opacity 0.15s ease, transform 0.15s ease",
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                  Stáhnout
                                </a>
                              ) : (
                                <span style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>Soubor brzy k dispozici</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", margin: 0, fontWeight: "400" }}>Uložené produkty</h2>
            <Link href="/ulozeno" style={{ color: "#24e053", fontSize: "14px", textDecoration: "none" }}>Zobrazit vše</Link>
          </div>
          {savedItems.length === 0 ? (
            <p style={{ color: "#666" }}>Nemáte žádné uložené produkty.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {savedItems.slice(0, 4).map((item) => {
                const hasAudio = !!getSavedPreviewUrl(item);
                const itemPlaying =
                  previewPlayer.currentItem?.id === (item.item_data?.id || item.item_id) &&
                  previewPlayer.currentItem?.product_type === (item.item_type === "beat" ? "beat" : "sound_kit") &&
                  previewPlayer.isPlaying;
                return (
                  <div
                    key={`${item.item_type}-${item.item_id}`}
                    className={`ucet-saved-item${itemPlaying ? " is-playing" : ""}`}
                    onClick={() => hasAudio && handleSavedItemClick(item)}
                    style={{ padding: "16px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}
                    data-testid={`card-saved-${item.item_type}-${item.item_id}`}
                  >
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <img 
                        src={item.item_data?.artwork_url || "/uploads/artwork/metallic-logo.png"}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                        alt={item.item_data?.title || "Product"} 
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "4px", display: "block" }} 
                      />
                      {hasAudio && (
                        <div className="ucet-play-overlay">
                          {itemPlaying ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <h3 style={{ fontSize: "14px", color: "#fff", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.item_data?.title}</h3>
                    <p style={{ fontSize: "12px", color: "#666", margin: "0 0 8px 0", textTransform: "capitalize" }}>{item.item_type === 'beat' ? 'Beat' : 'Sound Kit'}</p>
                    {!item.item_data?.is_free && (
                      <button
                        className={`ucet-add-cart-btn${cart.some((c: any) => c.id === item.item_id) ? " in-cart" : ""}`}
                        onClick={(e) => handleAddToCart(item, e)}
                        data-testid={`button-add-to-cart-saved-${item.item_id}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="6" width="18" height="15" rx="2" />
                          <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                        </svg>
                        {cart.some((c: any) => c.id === item.item_id) ? "✓ V KOŠÍKU" : `${item.item_data?.price} CZK`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
