import { useState, useEffect } from "react";

const CONSENT_KEY = "cookieConsent";

export type ConsentValue = "accepted" | "essential-only";

export function getConsent(): ConsentValue | null {
  try {
    return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

export default function CookieConsent({ onConsent }: { onConsent?: (v: ConsentValue) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!getConsent()) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (value: ConsentValue) => {
    setConsent(value);
    setLeaving(true);
    setTimeout(() => setVisible(false), 380);
    onConsent?.(value);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cc-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cc-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(10px); }
        }
        .cc-root {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9999;
          max-width: 340px;
          width: calc(100vw - 40px);
          background: rgba(10, 10, 10, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          padding: 16px 18px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          font-family: inherit;
          animation: cc-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .cc-root.cc-leaving {
          animation: cc-out 0.35s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        .cc-text {
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.55);
          margin: 0 0 14px 0;
          letter-spacing: 0.01em;
        }
        .cc-text a {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .cc-text a:hover {
          color: #fff;
        }
        .cc-actions {
          display: flex;
          gap: 8px;
        }
        .cc-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 11.5px;
          font-family: inherit;
          font-weight: 500;
          letter-spacing: 0.025em;
          border-radius: 7px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          cursor: pointer;
          transition: background 140ms, border-color 140ms, color 140ms;
          text-align: center;
          white-space: nowrap;
        }
        .cc-btn-accept {
          background: rgba(255, 255, 255, 0.92);
          color: #000;
          border-color: transparent;
        }
        .cc-btn-accept:hover {
          background: #fff;
        }
        .cc-btn-essential {
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
        }
        .cc-btn-essential:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
      <div className={`cc-root${leaving ? " cc-leaving" : ""}`} role="region" aria-label="Souhlas s cookies">
        <p className="cc-text">
          Tento web používá cookies pro analýzu a funkčnost.{" "}
          <a href="/cookies" tabIndex={0}>Více info</a>.
        </p>
        <div className="cc-actions">
          <button className="cc-btn cc-btn-accept" onClick={() => dismiss("accepted")}>
            Povolit vše
          </button>
          <button className="cc-btn cc-btn-essential" onClick={() => dismiss("essential-only")}>
            Jen nezbytné
          </button>
        </div>
      </div>
    </>
  );
}
