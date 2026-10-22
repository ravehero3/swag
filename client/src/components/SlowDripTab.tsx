import React, { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Zap, Clock, Gauge, Mail, Users, CheckCircle2, AlertCircle } from "lucide-react";

interface SlowDripData {
  total: number;
  sent: number;
  failed: number;
  hour: number;
  day: number;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
}


interface CampaignEmail {
  id: number;
  subject: string;
  preheader?: string;
  blocks?: any[];
  html_content?: string;
  header_options?: any;
}

interface SlowDripTabProps {
  onNavigateToCampaigns?: () => void;
}

export function SlowDripTab({ onNavigateToCampaigns }: SlowDripTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [data, setData] = useState<SlowDripData | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState(10);
  const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(null);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);


  const REFRESH_INTERVAL = 10;
  const LIMIT_H = 4;
  const LIMIT_D = 85;

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const res = await fetch("/api/marketing/campaigns", { credentials: "include" });
        if (res.ok) {
          const all = await res.json();
          const active = all.filter((c: Campaign) => c.status === "active" || c.status === "live");
          setCampaigns(active);
          if (active.length > 0) {
            setSelectedCampaignId(active[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    loadCampaigns();
  }, []);

  // Load campaign email preview
  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadEmailPreview = async () => {
      try {
        const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails`, { credentials: "include" });
        if (res.ok) {
          const emails = await res.json();
          if (emails.length > 0) {
            setCampaignEmail(emails[0]);
            // Fetch the preview HTML
            const previewRes = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emails[0].id}/preview`, { credentials: "include" });
            if (previewRes.ok) {
              const { html } = await previewRes.json();
              setEmailPreviewHtml(html);
            }
          }
        }
      } catch (err) {
        console.error("Error loading email preview:", err);
      }
    };

    loadEmailPreview();
  }, [selectedCampaignId]);



  // Load campaign data
  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadData = async () => {
      try {
        setLoadingData(true);
        const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/queue-status`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          const { queue, rateLimit } = json;
          setData({
            total: queue?.total || 0,
            sent: queue?.sent || 0,
            failed: queue?.failed || 0,
            hour: rateLimit?.current_hour_sent || 0,
            day: rateLimit?.current_day_sent || 0,
          });
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error("Error loading campaign data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [selectedCampaignId]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNextUpdateIn((prev) => (prev > 1 ? prev - 1 : REFRESH_INTERVAL));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nf = new Intl.NumberFormat("cs-CZ");
  const pf = new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const formatInt = (v: number) => nf.format(v);
  const formatPct = (v: number) => pf.format(v) + " %";

  const plural = (n: number, one: string, few: string, many: string) => {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  };

  // Loading state
  if (loadingCampaigns) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "#666", fontSize: "13px" }}>
        Načítám stav Slow Drip ochrany…
      </div>
    );
  }

  // Empty state when no campaign is active
  if (campaigns.length === 0 || !data) {
    return (
      <div style={{ paddingBottom: "60px" }}>
        {/* Hero Card with CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(11,153,252,0.12) 0%, rgba(36,224,83,0.06) 100%)",
            border: "1px solid rgba(11,153,252,0.3)",
            borderRadius: "14px",
            padding: "32px",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ maxWidth: "620px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(36,224,83,0.15)",
                border: "1px solid rgba(36,224,83,0.35)",
                padding: "4px 12px",
                borderRadius: "999px",
                color: "#24e053",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              <ShieldCheck size={13} />
              Režim ochrany domény připraven (Slow Drip)
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 10px 0" }}>
              Žádná kampaň právě neběží v režimu Slow Drip
            </h2>
            <p style={{ fontSize: "13px", color: "#aaa", lineHeight: 1.55, margin: 0 }}>
              Slow Drip slouží k bezpečnému rozesílání e-mailů s přísnými limity (<strong>max 4 e-maily za hodinu</strong> a <strong>85 e-mailů za den</strong>). Tím je zaručeno, že vaše doména a e-mailový server nikdy neskončí ve spamovém filtru Gmailu nebo Seznamu a všech <strong>5 000+ kontaktů</strong> bude spolehlivě doručeno do primární schránky.
            </p>
          </div>

          <button
            onClick={() => onNavigateToCampaigns?.()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 26px",
              background: "#0B99FC",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(11,153,252,0.45)",
              transition: "all 150ms ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 30px rgba(11,153,252,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(11,153,252,0.45)";
            }}
          >
            <span>Přejít do Kampaní</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Skeleton Preview Section Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
            UKÁZKA ROZHRANÍ PŘI BĚHU KAMPANĚ (SKELETON PREVIEW)
          </div>
          <div style={{ fontSize: "11px", color: "#444" }}>
            Informativní ukázka
          </div>
        </div>

        {/* Skeleton Dashboard Card */}
        <section
          style={{
            background: "#0f0f0f",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: "12px",
            overflow: "hidden",
            opacity: 0.9,
          }}
        >
          {/* Skeleton Header */}
          <div
            style={{
              padding: "22px 24px",
              borderBottom: "1px solid #1c1c1c",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#555", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Ukázka kampaně
              </div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: "#fff" }}>
                Beat Drop Announcement (Náhled Slow Drip fronty)
              </h2>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(36,224,83,0.3)",
                background: "rgba(36,224,83,0.06)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "12px",
                color: "#24e053",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#24e053",
                  boxShadow: "0 0 6px rgba(36,224,83,0.8)",
                }}
              />
              <span>Pohotovostní režim</span>
            </div>
          </div>

          {/* Skeleton Progress */}
          <div style={{ padding: "22px 24px", borderBottom: "1px solid #1c1c1c" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ fontSize: "42px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, color: "#aaa" }}>
                0.0 %
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#777" }}>
                <strong style={{ color: "#fff" }}>0</strong> z <span>5 066</span> odesláno
              </div>
            </div>
            <div
              style={{
                display: "flex",
                height: "10px",
                borderRadius: "4px",
                background: "#1a1a1a",
                overflow: "hidden",
              }}
            >
              <div style={{ width: "2%", background: "#0B99FC" }} />
            </div>
          </div>

          {/* Skeleton Gauges */}
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid #1c1c1c",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Hourly Gauge Skeleton */}
            <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Limit za hodinu</span>
                <span style={{ fontSize: "11px", color: "#0B99FC", fontFamily: "monospace" }}>0 / 4</span>
              </div>
              <div style={{ height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ width: "0%", height: "100%", background: "#0B99FC" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                Bezpečná rychlost max 4 e-maily / hod. Reset každou hodinu.
              </div>
            </div>

            {/* Daily Gauge Skeleton */}
            <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Denní limit (ochrana)</span>
                <span style={{ fontSize: "11px", color: "#24e053", fontFamily: "monospace" }}>0 / 85</span>
              </div>
              <div style={{ height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ width: "0%", height: "100%", background: "#24e053" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                Garantuje nulové riziko zařazení na blacklist. Reset o půlnoci.
              </div>
            </div>

            {/* ETA Skeleton */}
            <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Odhadované dokončení</span>
                <Clock size={13} color="#f9a825" />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                cca 60 dní
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                Při 85 e-mailech denně pro všech 5 066 kontaktů.
              </div>
            </div>
          </div>

          {/* Skeleton Info Footer */}
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#888",
              fontSize: "12px",
              background: "#0c0c0c",
            }}
          >
            <AlertCircle size={15} color="#0B99FC" style={{ flexShrink: 0 }} />
            <div>
              Spusťte kampaň v záložce <strong>Kampaně</strong> kliknutím na tlačítko <em>"Spustit kampaň"</em> nebo <em>"Odeslat…"</em>. Zde uvidíte živý teploměr odesílání.
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Active Campaign view
  const total = data.total;
  const sent = data.sent;
  const failed = data.failed;
  const queued = Math.max(0, total - sent - failed);
  const pct = total ? (sent / total) * 100 : 0;
  const failedPct = total ? (failed / total) * 100 : 0;
  const remaining = Math.max(0, total - sent);
  const days = Math.ceil(remaining / LIMIT_D);

  const getStatus = () => {
    if (remaining === 0 || queued === 0) return { state: "done", text: "Dokončeno" };
    if (data.hour >= LIMIT_H || data.day >= LIMIT_D) return { state: "waiting", text: "Čeká na limit" };
    return { state: "sending", text: "Odesílá se" };
  };

  const status = getStatus();
  const eta = new Date(Date.now() + days * 86400000);
  const etaStr = days === 0 ? "–" : eta.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

  return (
    <div style={{ paddingBottom: "60px" }}>
      {/* Campaign selector */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <select
            value={selectedCampaignId || ""}
            onChange={(e) => setSelectedCampaignId(parseInt(e.target.value, 10))}
            style={{
              padding: "10px 14px",
              background: "#141414",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Email Preview Section */}
      {emailPreviewHtml && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Náhled odesílaného e-mailu
          </div>
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid #222",
              borderRadius: "2px",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
              aspectRatio: "16 / 10",
              maxHeight: "600px",
            }}
          >
            <iframe
              srcDoc={emailPreviewHtml}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#fff",
              }}
              title="Email Preview"
              sandbox={{ allow: ["same-origin"] }}
            />
          </div>
          {campaignEmail && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#999" }}>
              <strong style={{ color: "#ccc" }}>Předmět:</strong> {campaignEmail.subject}
              {campaignEmail.preheader && (
                <>
                  <br />
                  <strong style={{ color: "#ccc" }}>Náhled textu:</strong> {campaignEmail.preheader}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <section
        style={{
          background: "#0f0f0f",
          border: "1px solid #222",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Kampaň
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" }}>
              {campaigns.find((c) => c.id === selectedCampaignId)?.name || "—"}
            </h2>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #333",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "#999",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: status.state === "done" ? "#666" : status.state === "waiting" ? "#f9a825" : "#24e053",
                boxShadow: status.state === "sending" ? "0 0 8px rgba(36,224,83,0.8)" : "none",
              }}
            />
            <span style={{ color: status.state === "sending" ? "#fff" : "#aaa" }}>{status.text}</span>
          </div>
        </div>

        {/* Main progress */}
        <div style={{ padding: "22px 24px", borderBottom: "1px solid #222" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{ fontSize: "46px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "#fff" }}>
              {formatPct(pct)}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#999", fontVariantNumeric: "tabular-nums" }}>
              <strong style={{ color: "#fff" }}>{formatInt(sent)}</strong> z <span>{formatInt(total)}</span> odesláno
            </div>
          </div>
          <div
            style={{
              display: "flex",
              height: "12px",
              borderRadius: "4px",
              background: "#1b1b1e",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${pct}%`, background: "#0B99FC", transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }} />
            {failed > 0 && (
              <div
                style={{
                  width: `${failedPct}%`,
                  background: "#ff5252",
                  transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            )}
          </div>
        </div>

        {/* Gauges */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #222",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Hourly */}
          <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Tato hodina</span>
              <span style={{ fontSize: "12px", color: data.hour >= LIMIT_H ? "#f9a825" : "#0B99FC", fontFamily: "monospace", fontWeight: 700 }}>
                {data.hour} / {LIMIT_H}
              </span>
            </div>
            <div style={{ height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{ width: `${Math.min(100, (data.hour / LIMIT_H) * 100)}%`, height: "100%", background: "#0B99FC" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Max 4 e-maily / hodinu.
            </div>
          </div>

          {/* Daily */}
          <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Dnes odesláno</span>
              <span style={{ fontSize: "12px", color: data.day >= LIMIT_D ? "#f9a825" : "#24e053", fontFamily: "monospace", fontWeight: 700 }}>
                {data.day} / {LIMIT_D}
              </span>
            </div>
            <div style={{ height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{ width: `${Math.min(100, (data.day / LIMIT_D) * 100)}%`, height: "100%", background: "#24e053" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Max 85 e-mailů / den.
            </div>
          </div>

          {/* ETA */}
          <div style={{ padding: "18px", background: "#141414", borderRadius: "10px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Odhadované dokončení</span>
              <Clock size={13} color="#f9a825" />
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
              {etaStr} ({days} {plural(days, "den", "dny", "dní")})
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Zbývá {formatInt(remaining)} e-mailů.
            </div>
          </div>
        </div>

        {/* Refresh timer */}
        <div
          style={{
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#666",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "1px",
              background: "#0B99FC",
              width: `${((REFRESH_INTERVAL - nextUpdateIn) / REFRESH_INTERVAL) * 100}%`,
              transition: "width 1s linear",
            }}
          />
          <span>Aktualizováno {lastUpdate?.toLocaleTimeString("cs-CZ") || "–"}</span>
          <span>Další kontrola za {nextUpdateIn} s</span>
        </div>
      </section>
    </div>
  );
}
