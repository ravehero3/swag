import { useState, useEffect } from "react";

const DEFAULT_MESSAGE = "Sleva 15 % na vše pro hudební producenty";

interface SpecialOfferBannerProps {
  settings: Record<string, string>;
  onActiveChange?: (active: boolean) => void;
}

export default function SpecialOfferBanner({ settings, onActiveChange }: SpecialOfferBannerProps) {
  const isEnabled = settings?.special_offer_enabled === "true";
  const message =
    settings?.special_offer_text?.trim() || DEFAULT_MESSAGE;
  const durationMinutes = parseInt(settings?.special_offer_duration_minutes || "45", 10);

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    if (localStorage.getItem("voodoo_special_offer_expired") === "true") {
      setIsExpired(true);
      return;
    }

    let code = localStorage.getItem("voodoo_temp_promo");
    let expiresStr = localStorage.getItem("voodoo_temp_promo_expires");
    let expiresAt = expiresStr ? parseInt(expiresStr, 10) : 0;

    const registerCodeOnBackend = async (newCode: string) => {
      try {
        await fetch("/api/promo-codes/register-temp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: newCode }),
        });
      } catch (err) {
        console.error("Chyba při registraci dočasného kódu:", err);
      }
    };

    if (!code || !expiresAt || Date.now() > expiresAt) {
      if (expiresAt && Date.now() > expiresAt) {
        localStorage.setItem("voodoo_special_offer_expired", "true");
        localStorage.removeItem("voodoo_temp_promo");
        localStorage.removeItem("voodoo_temp_promo_expires");
        setIsExpired(true);
        return;
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `VOODOO${randomNum}`;
      expiresAt = Date.now() + durationMinutes * 60 * 1000;

      localStorage.setItem("voodoo_temp_promo", code);
      localStorage.setItem("voodoo_temp_promo_expires", expiresAt.toString());
      registerCodeOnBackend(code);
    }

    setPromoCode(code);
    setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        localStorage.setItem("voodoo_special_offer_expired", "true");
        localStorage.removeItem("voodoo_temp_promo");
        localStorage.removeItem("voodoo_temp_promo_expires");
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, durationMinutes]);

  const visible = isEnabled && !isExpired && !!promoCode && timeLeft > 0;

  useEffect(() => {
    onActiveChange?.(visible);
  }, [visible, onActiveChange]);

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const timeString = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  const mono: React.CSSProperties = {
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    color: "#ccc",
    letterSpacing: "0.02em",
  };

  return (
    <div
      data-testid="special-offer-banner"
      style={{
        position: "fixed",
        top: "42px",
        left: 0,
        right: 0,
        zIndex: 99,
        height: "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #333",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "rgba(13, 13, 13, 0.3)",
        gap: "12px",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          overflow: "hidden",
        }}
      >
        <span style={{ ...mono, color: "#fff", fontWeight: 600, flexShrink: 0 }}>
          {message}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <span style={{ ...mono, fontFamily: "monospace", color: "#aaa" }}>{timeString}</span>
        <span
          style={{
            ...mono,
            fontFamily: "monospace",
            color: "#fff",
            border: "1px solid #444",
            padding: "2px 8px",
            borderRadius: "2px",
          }}
        >
          {promoCode}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...mono,
            background: "transparent",
            border: "1px solid #555",
            color: copied ? "#fff" : "#aaa",
            padding: "2px 10px",
            borderRadius: "2px",
            cursor: "pointer",
            transition: "color 0.2s ease, border-color 0.2s ease",
          }}
        >
          {copied ? "OK" : "Kopírovat"}
        </button>
      </div>
    </div>
  );
}
