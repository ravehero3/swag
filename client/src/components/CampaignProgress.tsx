import React, { useState, useEffect } from "react";

interface CampaignProgressProps {
  campaignId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CampaignProgress({ campaignId, autoRefresh = true, refreshInterval = 10000 }: CampaignProgressProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/queue-status`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Error loading campaign status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [campaignId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [campaignId, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Načítám stav...
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Nejsou dostupná data
      </div>
    );
  }

  const { queue, rateLimit, progress } = status;
  const percentComplete = progress.percentage;
  const daysRemaining = rateLimit ? Math.ceil((queue.total - queue.sent) / (rateLimit.daily_limit || 85)) : 0;
  const emailsPerHour = rateLimit?.hourly_limit || 4;
  const emailsPerDay = rateLimit?.daily_limit || 85;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Main Progress Bar */}
      <div style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: "8px", padding: "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>
            Průběh rozesílání
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0B99FC" }}>
            {percentComplete}%
          </span>
        </div>

        {/* Progress Bar Container */}
        <div style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "6px",
          height: "40px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "16px",
        }}>
          {/* Fill */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${percentComplete}%`,
              height: "100%",
              background: "linear-gradient(90deg, #0B99FC 0%, #0B99FC 100%)",
              transition: "width 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "12px",
            }}
          >
            {percentComplete > 10 && (
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>
                {queue.sent} odesláno
              </span>
            )}
          </div>

          {/* Text overlay */}
          {percentComplete <= 10 && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#666",
              whiteSpace: "nowrap",
            }}>
              {queue.sent} / {queue.total}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {/* Sent */}
          <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Odesláno
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0B99FC" }}>
              {queue.sent}
            </div>
          </div>

          {/* Queued */}
          <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Ve frontě
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ff9800" }}>
              {queue.queued}
            </div>
          </div>

          {/* Failed */}
          <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Selhalo
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: queue.failed > 0 ? "#f44336" : "#666" }}>
              {queue.failed}
            </div>
          </div>

          {/* Total */}
          <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Celkem
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
              {queue.total}
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limit & Timeline Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Rate Limits */}
        <div style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: "8px", padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Omezení Resend
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#aaa" }}>Za hodinu:</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                {rateLimit?.current_hour_sent || 0} / {emailsPerHour}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#aaa" }}>Za den:</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                {rateLimit?.current_day_sent || 0} / {emailsPerDay}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: "8px", padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Odhadovaný čas
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#aaa" }}>Zbývajících e-mailů:</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                {queue.total - queue.sent}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#aaa" }}>Zbývajících dní:</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: daysRemaining > 0 ? "#0B99FC" : "#666" }}>
                {daysRemaining > 0 ? `~${daysRemaining} dní` : "Hotovo!"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div style={{ background: "rgba(11, 153, 252, 0.1)", border: "1px solid rgba(11, 153, 252, 0.3)", borderRadius: "6px", padding: "12px", fontSize: "12px", color: "#0B99FC" }}>
        Kampaň se rozesílá automaticky. Scheduler běží každých 15 minut a respektuje limity Resend (4 e-maily/hodinu, 85 e-mailů/den).
      </div>
    </div>
  );
}
