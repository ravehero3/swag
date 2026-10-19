import React, { useState, useEffect } from "react";

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

export function SlowDripTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [data, setData] = useState<SlowDripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState(10);

  const REFRESH_INTERVAL = 10;
  const LIMIT_H = 4;
  const LIMIT_D = 85;

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await fetch("/api/marketing/campaigns", { credentials: "include" });
        if (res.ok) {
          const all = await res.json();
          const active = all.filter((c: Campaign) => c.status === "active");
          setCampaigns(active);
          if (active.length > 0 && !selectedCampaignId) {
            setSelectedCampaignId(active[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading campaigns:", err);
      }
    };
    loadCampaigns();
  }, []);

  // Load campaign data
  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadData = async () => {
      try {
        const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/queue-status`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          const { queue, rateLimit } = json;
          setData({
            total: queue.total,
            sent: queue.sent,
            failed: queue.failed,
            hour: rateLimit?.current_hour_sent || 0,
            day: rateLimit?.current_day_sent || 0,
          });
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error("Error loading campaign data:", err);
      } finally {
        setLoading(false);
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

  if (!data || loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Načítám data...
      </div>
    );
  }

  const total = data.total;
  const sent = data.sent;
  const failed = data.failed;
  const queued = Math.max(0, total - sent - failed);
  const pct = total ? (sent / total) * 100 : 0;
  const failedPct = total ? (failed / total) * 100 : 0;
  const remaining = Math.max(0, total - sent);
  const days = Math.ceil(remaining / LIMIT_D);

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
              padding: "10px 12px",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">Vyberte kampaň...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
          Žádné aktivní kampaně
        </div>
      ) : (
        <section
          style={{
            background: "#0f0f0f",
            border: "1px solid #222",
            borderRadius: "10px",
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
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" }}>
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
                  background: status.state === "done" ? "#666" : status.state === "waiting" ? "transparent" : "#fff",
                  border: status.state === "waiting" ? "1px solid #999" : "none",
                  animation: status.state === "sending" ? "pulse 1.8s ease-in-out infinite" : "none",
                }}
              />
              <span>{status.text}</span>
            </div>
          </div>

          {/* Main progress */}
          <div style={{ padding: "22px 24px", borderBottom: "1px solid #222" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ fontSize: "46px", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
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
                borderRadius: "3px",
                background: "#1b1b1e",
                overflow: "hidden",
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <div style={{ flex: 1, width: `${pct}%`, background: "#fff", transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }} />
              {failed > 0 && (
                <div
                  style={{
                    width: `${failedPct}%`,
                    backgroundImage: "repeating-linear-gradient(135deg, #999 0 2px, transparent 2px 4px)",
                    transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              background: "#222",
              padding: 0,
              borderBottom: "1px solid #222",
            }}
          >
            {[
              { label: "Odesláno", value: sent, color: "#fff" },
              { label: "Ve frontě", value: queued, color: "#999" },
              { label: "Selhalo", value: failed, color: failed > 0 ? "#f44336" : "#666" },
              { label: "Celkem", value: total, color: "#fff" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "#0f0f0f", padding: "18px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#999" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: i === 3 ? "50%" : "2px",
                      background:
                        i === 0 ? "#fff" : i === 1 ? "transparent" : i === 2 ? (failed > 0 ? "#f44336" : "transparent") : "transparent",
                      border: i === 1 || i === 2 || i === 3 ? "1px solid #666" : "none",
                    }}
                  />
                  {stat.label}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "26px",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    color: stat.color,
                  }}
                >
                  {formatInt(stat.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Rate limits + timeline */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "#222",
              padding: 0,
              borderBottom: "1px solid #222",
            }}
          >
            {/* Limits */}
            <div style={{ background: "#0f0f0f", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Limity odesílání
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: "#999", fontSize: "13px" }}>Za hodinu</span>
                  <span style={{ fontFamily: "monospace", fontSize: "13px", fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                    {data.hour} <span style={{ color: "#666" }}>/ {LIMIT_H}</span>
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      style={{
                        height: "4px",
                        borderRadius: "1px",
                        background: i < data.hour ? "#fff" : "#1b1b1e",
                        transition: "background 0.4s",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: "#999", fontSize: "13px" }}>Za den</span>
                  <span style={{ fontFamily: "monospace", fontSize: "13px", fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                    {data.day} <span style={{ color: "#666" }}>/ {LIMIT_D}</span>
                  </span>
                </div>
                <div style={{ height: "4px", borderRadius: "1px", background: "#1b1b1e", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "#fff",
                      width: `${Math.min(100, (data.day / LIMIT_D) * 100)}%`,
                      transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: "#0f0f0f", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Časový plán
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid #222" }}>
                  <span style={{ color: "#999", fontSize: "13px" }}>Zbývajících e-mailů</span>
                  <span style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                    {formatInt(remaining)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid #222" }}>
                  <span style={{ color: "#999", fontSize: "13px" }}>Zbývajících dní</span>
                  <span style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                    {days}
                    <span style={{ fontSize: "12px", color: "#666", marginLeft: "4px" }}>
                      {plural(days, "den", "dny", "dní")}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#999", fontSize: "13px" }}>Odhad dokončení</span>
                  <span style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", color: "#fff" }}>
                    {etaStr}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div
            style={{
              padding: "22px 24px",
              display: "flex",
              gap: "12px",
              color: "#999",
              fontSize: "13px",
              lineHeight: 1.55,
              borderBottom: "1px solid #222",
            }}
          >
            <span style={{ width: "16px", height: "16px", border: "1px solid #666", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "10px", color: "#666", flex: "none", marginTop: "2px" }}>
              i
            </span>
            <p style={{ margin: 0 }}>
              E-maily se odesílají automaticky v dávkách každých 15 minut. Systém dodržuje limity za hodinu i za den, takže kampaň nemusíte nijak hlídat.
            </p>
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
                background: "#999",
                width: `${((REFRESH_INTERVAL - nextUpdateIn) / REFRESH_INTERVAL) * 100}%`,
                transition: "width 1s linear",
              }}
            />
            <span>Aktualizováno {lastUpdate?.toLocaleTimeString("cs-CZ") || "–"}</span>
            <span>Další aktualizace za {nextUpdateIn} s</span>
          </div>
        </section>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
