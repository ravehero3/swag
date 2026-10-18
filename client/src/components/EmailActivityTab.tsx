import React, { useState, useEffect } from "react";

export function EmailActivityTab() {
  const [emails, setEmails] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [journeyId, setJourneyId] = useState<string>("");
  const [emailType, setEmailType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadActivityData();
    loadJourneys();
  }, [days, journeyId, emailType, status, page]);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("days", String(days));
      if (journeyId) params.append("journeyId", journeyId);
      params.append("emailType", emailType);
      params.append("status", status);
      params.append("limit", "50");
      params.append("offset", String(page * 50));

      const res = await fetch(`/api/marketing/email-activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading email activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadJourneys = async () => {
    try {
      const res = await fetch("/api/marketing/email-activity/journeys");
      if (res.ok) {
        const data = await res.json();
        setJourneys(data);
      }
    } catch (err) {
      console.error("Error loading journeys:", err);
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
        Načítám...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Email Aktivita</h2>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <select
            value={days}
            onChange={(e) => { setDays(parseInt(e.target.value)); setPage(0); }}
            style={{
              padding: "8px 12px",
              background: "#111",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <option value={1}>Poslední 1 den</option>
            <option value={7}>Poslední 7 dní</option>
            <option value={30}>Poslední 30 dní</option>
            <option value={90}>Poslední 90 dní</option>
          </select>

          <select
            value={journeyId}
            onChange={(e) => { setJourneyId(e.target.value); setPage(0); }}
            style={{
              padding: "8px 12px",
              background: "#111",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              flex: 1,
              minWidth: "200px"
            }}
          >
            <option value="">Všechny cesty</option>
            {journeys.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>

          <select
            value={emailType}
            onChange={(e) => { setEmailType(e.target.value); setPage(0); }}
            style={{
              padding: "8px 12px",
              background: "#111",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <option value="all">Všechny typy</option>
            <option value="transactional">Transakční</option>
            <option value="marketing">Marketing</option>
            <option value="campaign">Kampaň</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            style={{
              padding: "8px 12px",
              background: "#111",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <option value="all">Všechny stavy</option>
            <option value="sent">Odeslány</option>
            <option value="failed">Selhaly</option>
          </select>
        </div>
      </div>

      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px"
        }}>
          <div style={{ background: "#111", padding: "12px", borderRadius: "6px", border: "1px solid #333" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>Odeslano</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#fff" }}>{stats.totalSent}</div>
          </div>
          <div style={{ background: "#111", padding: "12px", borderRadius: "6px", border: "1px solid #333" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>Úspěšnost</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#0f0" }}>{stats.successRate}%</div>
          </div>
          <div style={{ background: "#111", padding: "12px", borderRadius: "6px", border: "1px solid #333" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>Otevřeno</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#0B99FC" }}>{stats.openRate}%</div>
          </div>
          <div style={{ background: "#111", padding: "12px", borderRadius: "6px", border: "1px solid #333" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>Kliknutí</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#0B99FC" }}>{stats.clickRate}%</div>
          </div>
        </div>
      )}

      {emails.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
          Žádné e-maily pro tyto filtry
        </div>
      ) : (
        <>
          <div style={{
            overflowX: "auto",
            border: "1px solid #333",
            borderRadius: "6px"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px"
            }}>
              <thead>
                <tr style={{ background: "#0a0a0a", borderBottom: "1px solid #333" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Příjemce</th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Cesta</th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Předmět</th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Otevřeno</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Kliknutí</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#999", fontWeight: 600, whiteSpace: "nowrap" }}>Čas</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email, idx) => (
                  <tr key={email.id} style={{
                    borderBottom: "1px solid #1a1a1a",
                    background: idx % 2 === 0 ? "transparent" : "#0a0a0a"
                  }}>
                    <td style={{ padding: "12px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {email.recipient}
                    </td>
                    <td style={{ padding: "12px", color: "#aaa", whiteSpace: "nowrap" }}>
                      {email.journey_name}
                    </td>
                    <td style={{ padding: "12px", color: "#aaa", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {email.subject}
                    </td>
                    <td style={{ padding: "12px", color: email.status === "sent" ? "#0f0" : "#f88", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {email.status === "sent" ? "✓ Odeslano" : "✗ Selhalo"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: email.open_count > 0 ? "#0B99FC" : "#666" }}>
                      {email.open_count}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: email.click_count > 0 ? "#0B99FC" : "#666" }}>
                      {email.click_count}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#666", whiteSpace: "nowrap", fontSize: "12px" }}>
                      {new Date(email.sent_at).toLocaleDateString("cs-CZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "13px", color: "#666" }}>
            <span>Strana {page + 1}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: "6px 12px",
                  background: page === 0 ? "#111" : "#222",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: page === 0 ? "#555" : "#fff",
                  cursor: page === 0 ? "default" : "pointer",
                  fontSize: "12px"
                }}
              >
                ← Zpět
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!stats || emails.length < 50}
                style={{
                  padding: "6px 12px",
                  background: !stats || emails.length < 50 ? "#111" : "#222",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: !stats || emails.length < 50 ? "#555" : "#fff",
                  cursor: !stats || emails.length < 50 ? "default" : "pointer",
                  fontSize: "12px"
                }}
              >
                Dál →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
