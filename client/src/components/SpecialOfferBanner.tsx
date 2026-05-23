import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_MESSAGE = "Sleva 15 % na vše pro hudební producenty";

interface SpecialOfferBannerProps {
  settings: Record<string, string>;
  onActiveChange?: (active: boolean) => void;
  onHeightChange?: (height: number) => void;
}

export default function SpecialOfferBanner({
  settings,
  onActiveChange,
  onHeightChange,
}: SpecialOfferBannerProps) {
  const isEnabled = settings?.special_offer_enabled === "true";
  const percentage = parseInt(settings?.special_offer_percentage || "15", 10);
  const rawMessage = settings?.special_offer_text?.trim() || DEFAULT_MESSAGE;
  const message = rawMessage.replace("15", String(percentage));
  const durationMinutes = parseInt(settings?.special_offer_duration_minutes || "45", 10);

  const barRef = useRef<HTMLDivElement>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);

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
    setTimeLeftMs(Math.max(0, expiresAt - Date.now()));
  }, [isEnabled, durationMinutes]);

  useEffect(() => {
    if (timeLeftMs === null || timeLeftMs <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev !== null && prev > 1000) return prev - 1000;
        clearInterval(timer);
        localStorage.setItem("voodoo_special_offer_expired", "true");
        localStorage.removeItem("voodoo_temp_promo");
        localStorage.removeItem("voodoo_temp_promo_expires");
        setIsExpired(true);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftMs]);

  const visible = isEnabled && !isExpired && !!promoCode && timeLeftMs !== null && timeLeftMs > 0;

  const reportHeight = useCallback(() => {
    if (!barRef.current) {
      onHeightChange?.(0);
      return;
    }
    onHeightChange?.(Math.ceil(barRef.current.getBoundingClientRect().height));
  }, [onHeightChange]);

  useEffect(() => {
    onActiveChange?.(visible);
    window.dispatchEvent(new CustomEvent("live-offer-status", { detail: visible }));
    if (!visible) {
      onHeightChange?.(0);
    }
  }, [visible, onActiveChange, onHeightChange]);

  useEffect(() => {
    if (!visible || !barRef.current) return;

    reportHeight();
    const el = barRef.current;
    const ro = new ResizeObserver(() => reportHeight());
    ro.observe(el);
    window.addEventListener("resize", reportHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", reportHeight);
    };
  }, [visible, reportHeight, message, promoCode, timeLeftMs]);

  const handleCopyCode = useCallback(async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: user can still select text */
    }
  }, [promoCode]);

  if (!visible) return null;

  const minutes = Math.floor(timeLeftMs! / 60000);
  const seconds = Math.floor((timeLeftMs! % 60000) / 1000);
  const timeString = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

  return (
    <>
      <div
        ref={barRef}
        data-testid="special-offer-banner"
        className="live-offer-bar animate-slide-in"
        role="region"
        aria-label="Speciální nabídka"
      >
        <p className="live-offer-bar-message">{message}</p>

        <div className="live-offer-bar-actions">
          <button
            type="button"
            className="live-offer-bar-code"
            onClick={handleCopyCode}
            aria-label={copied ? "Kód zkopírován" : `Zkopírovat slevový kód ${promoCode}`}
          >
            {copied ? "ZKOPÍROVÁNO" : promoCode}
          </button>

          <span className="live-offer-bar-expiry-hint">VYPRŠÍ ZA</span>

          <span className="live-offer-bar-timer" aria-live="polite" aria-atomic="true">
            {timeString}
          </span>
        </div>
      </div>

      <style>{`
        .live-offer-bar {
          position: fixed;
          top: 42px;
          left: 0;
          right: 0;
          z-index: 99;
          box-sizing: border-box;
          width: 100%;
          max-width: 100vw;
          min-height: 40px;
          padding: 6px max(12px, env(safe-area-inset-right, 0px)) 6px max(12px, env(safe-area-inset-left, 0px));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          overflow: hidden;
          border-bottom: 1px solid #333;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background-color: rgba(13, 13, 13, 0.3);
          color: #fff;
        }

        .live-offer-bar-message {
          margin: 0;
          width: 100%;
          max-width: 36rem;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(9px, 2.8vw, 12px);
          font-weight: 400;
          letter-spacing: 0.04em;
          line-height: 1.35;
          text-transform: uppercase;
          color: #fff;
          word-break: break-word;
          hyphens: auto;
        }

        .live-offer-bar-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px 10px;
          width: 100%;
          max-width: 100%;
        }

        .live-offer-bar-code {
          margin: 0;
          border: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 32px;
          padding: 6px 14px;
          background: #000;
          color: #fff;
          border-radius: 9999px;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(10px, 3vw, 12px);
          font-weight: 700;
          letter-spacing: 0.06em;
          line-height: 1;
          user-select: all;
          -webkit-user-select: all;
          flex-shrink: 0;
          max-width: min(100%, 11rem);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .live-offer-bar-code:active {
          opacity: 0.85;
        }

        .live-offer-bar-expiry-hint {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(8px, 2.4vw, 11px);
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #aaa;
          white-space: nowrap;
        }

        .live-offer-bar-timer {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: clamp(11px, 3.2vw, 13px);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          padding: 6px 8px;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-radius: 4px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        @media (min-width: 520px) {
          .live-offer-bar {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 10px 14px;
            padding-top: 4px;
            padding-bottom: 4px;
          }

          .live-offer-bar-message {
            width: auto;
            flex: 0 1 auto;
            max-width: none;
          }

          .live-offer-bar-actions {
            width: auto;
            flex: 0 0 auto;
          }

          .live-offer-bar-expiry-hint::before {
            content: "VÁŠ UNIKÁTNÍ KÓD ";
          }
        }

        @media (max-width: 519px) {
          .live-offer-bar-expiry-hint {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .live-offer-bar {
            gap: 6px;
            padding-left: max(10px, env(safe-area-inset-left, 0px));
            padding-right: max(10px, env(safe-area-inset-right, 0px));
          }

          .live-offer-bar-message {
            font-size: 9px;
            letter-spacing: 0.03em;
          }

          .live-offer-bar-code {
            padding: 6px 12px;
            font-size: 10px;
          }
        }

        @keyframes live-offer-slide-in {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }

        .animate-slide-in {
          animation: live-offer-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-slide-in {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
