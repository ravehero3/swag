import { useState, useEffect } from "react";

const CONSENT_KEY = "cookieConsent";
const CONSENT_DETAIL_KEY = "voodoo808_cookie_settings";

export type ConsentValue = "accepted" | "essential-only";

export interface ConsentDetail {
  necessary: boolean;
  analytical: boolean;
  functional: boolean;
  marketing: boolean;
}

export function getConsent(): ConsentValue | null {
  try {
    return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue, detail?: ConsentDetail) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (detail) {
      localStorage.setItem(CONSENT_DETAIL_KEY, JSON.stringify(detail));
    }
  } catch {}
}

export function getConsentDetail(): ConsentDetail | null {
  try {
    const raw = localStorage.getItem(CONSENT_DETAIL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const CATEGORIES = [
  {
    key: "necessary" as keyof ConsentDetail,
    label: "Nezbytné cookies",
    desc: "Zajišťují základní funkce webu jako přihlášení, košík a zabezpečení. Bez nich web nemůže správně fungovat.",
    required: true,
  },
  {
    key: "analytical" as keyof ConsentDetail,
    label: "Analytické cookies",
    desc: "Pomáhají nám porozumět, jak návštěvníci web používají (např. které stránky navštěvují). Veškerá data jsou anonymizovaná.",
    required: false,
  },
  {
    key: "functional" as keyof ConsentDetail,
    label: "Funkční cookies",
    desc: "Umožňují webu zapamatovat si vaše preference a nastavení pro pohodlnější používání.",
    required: false,
  },
  {
    key: "marketing" as keyof ConsentDetail,
    label: "Marketingové cookies",
    desc: "Slouží k zobrazování personalizovaného obsahu a reklam odpovídajících vašim zájmům.",
    required: false,
  },
];

export default function CookieConsent({ onConsent }: { onConsent?: (v: ConsentValue) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detail, setDetail] = useState<ConsentDetail>({
    necessary: true,
    analytical: false,
    functional: false,
    marketing: false,
  });

  useEffect(() => {
    if (!getConsent()) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (value: ConsentValue, detailOverride?: ConsentDetail) => {
    setConsent(value, detailOverride ?? detail);
    setLeaving(true);
    setTimeout(() => setVisible(false), 380);
    onConsent?.(value);
  };

  const acceptAll = () => {
    const all: ConsentDetail = { necessary: true, analytical: true, functional: true, marketing: true };
    dismiss("accepted", all);
  };

  const rejectAll = () => {
    const none: ConsentDetail = { necessary: true, analytical: false, functional: false, marketing: false };
    dismiss("essential-only", none);
  };

  const saveCustom = () => {
    const anyOptional = detail.analytical || detail.functional || detail.marketing;
    dismiss(anyOptional ? "accepted" : "essential-only");
  };

  const toggle = (key: keyof ConsentDetail) => {
    if (key === "necessary") return;
    setDetail((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cc-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cc-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .cc-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: cc-backdrop-in 0.3s ease forwards;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 0 24px 0;
        }
        @media (min-width: 560px) {
          .cc-backdrop {
            align-items: center;
            padding: 0;
          }
        }
        .cc-backdrop.cc-leaving {
          animation: cc-out 0.35s ease forwards;
        }
        .cc-modal {
          background: #0e0e0e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          width: calc(100vw - 32px);
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8);
          animation: cc-modal-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          font-family: inherit;
        }
        .cc-header {
          padding: 22px 22px 0 22px;
        }
        .cc-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 10px 0;
          letter-spacing: 0.01em;
        }
        .cc-body-text {
          font-size: 12.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 4px 0;
        }
        .cc-body-text a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .cc-body-text a:hover { color: #fff; }
        .cc-details-toggle {
          background: none;
          border: none;
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          padding: 8px 0 0 0;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 150ms;
          letter-spacing: 0.01em;
        }
        .cc-details-toggle:hover { color: rgba(255,255,255,0.75); }
        .cc-details-toggle svg {
          transition: transform 200ms;
        }
        .cc-details-toggle.open svg {
          transform: rotate(180deg);
        }
        .cc-categories {
          padding: 14px 22px 4px 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cc-category {
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 9px;
          background: rgba(255,255,255,0.025);
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .cc-category-info { flex: 1; min-width: 0; }
        .cc-category-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
          margin: 0 0 3px 0;
        }
        .cc-category-desc {
          font-size: 11.5px;
          line-height: 1.55;
          color: rgba(255,255,255,0.38);
          margin: 0;
        }
        .cc-toggle {
          flex-shrink: 0;
          width: 40px;
          height: 22px;
          border-radius: 11px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 200ms;
          margin-top: 1px;
        }
        .cc-toggle.on  { background: rgba(255,255,255,0.9); }
        .cc-toggle.off { background: rgba(255,255,255,0.12); }
        .cc-toggle.disabled { cursor: not-allowed; opacity: 0.4; }
        .cc-toggle-knob {
          position: absolute;
          top: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          transition: left 180ms, background 200ms;
        }
        .cc-toggle.on  .cc-toggle-knob { left: 21px; background: #000; }
        .cc-toggle.off .cc-toggle-knob { left: 3px;  background: rgba(255,255,255,0.45); }
        .cc-footer {
          padding: 16px 22px 22px 22px;
        }
        .cc-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cc-btn {
          flex: 1;
          min-width: 120px;
          padding: 10px 14px;
          font-size: 12.5px;
          font-family: inherit;
          font-weight: 500;
          letter-spacing: 0.025em;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.13);
          cursor: pointer;
          transition: background 140ms, border-color 140ms, color 140ms;
          text-align: center;
          white-space: nowrap;
        }
        .cc-btn-accept {
          background: rgba(255,255,255,0.92);
          color: #000;
          border-color: transparent;
        }
        .cc-btn-accept:hover { background: #fff; }
        .cc-btn-reject {
          background: transparent;
          color: rgba(255,255,255,0.45);
        }
        .cc-btn-reject:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.75);
        }
        .cc-btn-save {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.15);
          width: 100%;
          flex: unset;
          margin-top: 6px;
        }
        .cc-btn-save:hover {
          background: rgba(255,255,255,0.13);
          color: #fff;
        }
        .cc-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0 22px;
        }
      `}</style>

      <div
        className={`cc-backdrop${leaving ? " cc-leaving" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Nastavení souborů cookie"
      >
        <div className="cc-modal">
          <div className="cc-header">
            <p className="cc-title">Tento web používá soubory cookie</p>
            <p className="cc-body-text">
              Používáme cookies, abychom vám zajistili co nejlepší zážitek na našem webu.
              Část cookies je nezbytná pro správné fungování, ostatní nám pomáhají web zlepšovat.
              Svůj souhlas můžete kdykoliv změnit v{" "}
              <a href="/nastaveni-cookies">nastavení cookies</a>.
              Více informací v{" "}
              <a href="/cookies">zásadách používání cookies</a>.
            </p>

            <button
              className={`cc-details-toggle${showDetails ? " open" : ""}`}
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
            >
              {showDetails ? "Skrýt podrobnosti" : "Podrobné nastavení"}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {showDetails && (
            <div className="cc-categories">
              {CATEGORIES.map((cat) => (
                <div className="cc-category" key={cat.key}>
                  <div className="cc-category-info">
                    <p className="cc-category-label">{cat.label}</p>
                    <p className="cc-category-desc">{cat.desc}</p>
                  </div>
                  <button
                    className={`cc-toggle ${detail[cat.key] ? "on" : "off"}${cat.required ? " disabled" : ""}`}
                    onClick={() => toggle(cat.key)}
                    disabled={cat.required}
                    aria-pressed={detail[cat.key]}
                    aria-label={cat.label}
                  >
                    <span className="cc-toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: "16px" }} />
          <div className="cc-divider" />

          <div className="cc-footer">
            <div className="cc-actions">
              <button className="cc-btn cc-btn-accept" onClick={acceptAll} data-testid="button-cookie-accept-all">
                Přijmout vše
              </button>
              <button className="cc-btn cc-btn-reject" onClick={rejectAll} data-testid="button-cookie-reject-all">
                Pouze nezbytné
              </button>
            </div>
            {showDetails && (
              <button className="cc-btn cc-btn-save" onClick={saveCustom} data-testid="button-cookie-save-custom">
                Uložit vlastní nastavení
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
