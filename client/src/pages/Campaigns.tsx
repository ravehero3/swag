import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Send, Play, Pause, X, Calendar, Clock, AlertCircle, CheckCircle, Zap } from "lucide-react";
import CampaignsTabLayout from "../components/CampaignsTabLayout";
import { CampaignProgress } from "../components/CampaignProgress";

interface CampaignEmail {
  id: number;
  position: number;
  templateId: number | null;
  delayHours: number;
  sendDate?: string;
  sendTime?: string;
  templateName?: string;
}

interface Campaign {
  id: number;
  name: string;
  audience: "buyers" | "free_downloads";
  status: "draft" | "active" | "completed" | "paused";
  audience_segment?: "paid" | "free" | "mixed";
  daily_send_limit?: number;
  total_recipients?: number;
  total_sent?: number;
  emailCount: number;
  createdAt: string;
}

interface Template {
  id: number;
  name: string;
  subject: string;
}

interface QueueStatus {
  queue: {
    queued: number;
    in_progress: number;
    sent: number;
    failed: number;
    total: number;
  };
  rateLimit: {
    daily_limit: number;
    hourly_limit: number;
    current_hour_sent: number;
    current_day_sent: number;
  };
  progress: {
    percentage: number;
    sent: number;
    total: number;
  };
}

export default function Campaigns() {
  // List view
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected campaign
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignEmails, setCampaignEmails] = useState<CampaignEmail[]>([]);

  // Campaign start dialog
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [audienceSegment, setAudienceSegment] = useState<"paid" | "free" | "mixed">("free");
  const [dailySendLimit, setDailySendLimit] = useState(85);
  const [startingCampaign, setStartingCampaign] = useState(false);

  // Queue status
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [statusRefreshInterval, setStatusRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Preview
  const [previewEmailId, setPreviewEmailId] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Test mode
  const [testEmail, setTestEmail] = useState("");
  const [testMode, setTestMode] = useState(false);

  // Date/time scheduling
  const [showDateScheduler, setShowDateScheduler] = useState(false);
  const [schedulerEmailId, setSchedulerEmailId] = useState<number | null>(null);
  const [schedulerDate, setSchedulerDate] = useState("");
  const [schedulerTime, setSchedulerTime] = useState("09:00");

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data || []);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/marketing/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  const loadCampaignEmails = async (campaignId: number) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/emails`);
      if (res.ok) {
        const data = await res.json();
        setCampaignEmails(data || []);
      }
    } catch (err) {
      console.error("Error loading campaign emails:", err);
    }
  };

  const loadQueueStatus = async (campaignId: number) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/queue-status`);
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data);
      }
    } catch (err) {
      console.error("Error loading queue status:", err);
    }
  };

  const selectCampaign = async (campaignId: number) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    setSelectedCampaignId(campaignId);
    setSelectedCampaign(campaign);
    await loadCampaignEmails(campaignId);
    setPreviewVisible(false);
    setTestMode(false);

    // Load queue status if active
    if (campaign.status === "active") {
      await loadQueueStatus(campaignId);
      
      // Set up auto-refresh
      if (statusRefreshInterval) clearInterval(statusRefreshInterval);
      const interval = setInterval(() => loadQueueStatus(campaignId), 10000);
      setStatusRefreshInterval(interval);
    } else if (statusRefreshInterval) {
      clearInterval(statusRefreshInterval);
      setStatusRefreshInterval(null);
    }
  };

  const createNewCampaign = async (name: string, audience: "buyers" | "free_downloads") => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          audience,
        }),
      });
      if (res.ok) {
        const newCampaign = await res.json();
        setCampaigns([newCampaign, ...campaigns]);
        setSelectedCampaignId(newCampaign.id);
        setSelectedCampaign(newCampaign);
        await loadCampaignEmails(newCampaign.id);
        setPreviewVisible(false);
        setTestMode(false);
      } else {
        console.error("Error creating campaign:", res.status);
        alert("Chyba při vytváření kampaně");
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
      alert("Chyba při vytváření kampaně");
    }
  };

  const deleteCampaign = async (campaignId: number) => {
    if (!confirm("Opravdu chcete smazat tuto kampan? Tato akce je nevratná.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (res.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== campaignId));
        if (selectedCampaignId === campaignId) {
          setSelectedCampaignId(null);
          setSelectedCampaign(null);
          setCampaignEmails([]);
          setQueueStatus(null);
          if (statusRefreshInterval) {
            clearInterval(statusRefreshInterval);
            setStatusRefreshInterval(null);
          }
        }
      } else {
        const error = await res.json();
        alert("Chyba: " + error.error);
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert("Chyba při mazání kampaně");
    }
  };

  const startCampaign = async () => {
    if (!selectedCampaignId || !selectedCampaign) return;
    
    setStartingCampaign(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience_segment: audienceSegment,
          daily_send_limit: dailySendLimit,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowStartDialog(false);
        await loadCampaigns();
        await selectCampaign(selectedCampaignId);
        await loadQueueStatus(selectedCampaignId);
      } else {
        const error = await res.json();
        alert("Chyba: " + error.error);
      }
    } catch (err) {
      console.error("Error starting campaign:", err);
      alert("Chyba při spuštění kampanhe");
    } finally {
      setStartingCampaign(false);
    }
  };

  const addEmailToCampaign = async () => {
    if (!selectedCampaignId) {
      console.log("[Campaigns] No campaign selected");
      return;
    }
    console.log("[Campaigns] Adding email to campaign", selectedCampaignId, "emails count:", campaignEmails.length);
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          position: campaignEmails.length + 1,
          delayHours: campaignEmails.length * 24,
        }),
      });
      console.log("[Campaigns] Add email response:", res.status);
      if (res.ok) {
        const newEmail = await res.json();
        console.log("[Campaigns] New email created:", newEmail);
        setCampaignEmails([...campaignEmails, newEmail]);
      } else {
        const error = await res.text();
        console.error("[Campaigns] Error adding email:", error);
      }
    } catch (err) {
      console.error("[Campaigns] Error adding email:", err);
    }
  };

  const deleteEmailFromCampaign = async (emailId: number) => {
    if (!selectedCampaignId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emailId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCampaignEmails(campaignEmails.filter((e) => e.id !== emailId));
        if (previewEmailId === emailId) {
          setPreviewEmailId(null);
          setPreviewVisible(false);
        }
      }
    } catch (err) {
      console.error("Error deleting email:", err);
    }
  };

  const updateEmailTemplate = async (emailId: number, templateId: number) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaignEmails(
          campaignEmails.map((e) => (e.id === emailId ? updated : e))
        );
      }
    } catch (err) {
      console.error("Error updating email:", err);
    }
  };

  const saveEmailEdits = async (emailId: number, overrides: any) => {
    if (!selectedCampaignId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaignEmails(
          campaignEmails.map((e) => (e.id === emailId ? updated : e))
        );
      }
    } catch (err) {
      console.error("Error saving email edits:", err);
    }
  };

  const updateEmailDelay = async (emailId: number, delayHours: number) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delayHours }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaignEmails(
          campaignEmails.map((e) => (e.id === emailId ? updated : e))
        );
      }
    } catch (err) {
      console.error("Error updating email:", err);
    }
  };

  const sendTestEmail = async (emailId: number) => {
    if (!testEmail.includes("@")) {
      alert("Zadejte platnou e-mailovou adresu");
      return;
    }
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${emailId}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: testEmail }),
      });
      if (res.ok) {
        alert("Testovací e-mail odeslán! Zkontrolujte si doručenou poštu (nebo spam).");
      } else {
        const err = await res.json();
        alert("Chyba: " + (err.error || "Odesílání selhalo"));
        console.error("Test email error:", err);
      }
    } catch (err) {
      console.error("Error sending test email:", err);
      alert("Chyba při odesílání: " + String(err));
    }
  };

  const estimatedDays = dailySendLimit > 0 
    ? Math.ceil((audienceSegment === "paid" ? 500 : audienceSegment === "free" ? 5050 : 5550) / dailySendLimit)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px", background: "#000" }}>
      {/* Show start dialog if campaign is draft */}
      {showStartDialog && selectedCampaign?.status === "draft" && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "32px",
            maxWidth: "500px",
            width: "90%"
          }}>
            <h2 style={{ color: "#fff", marginTop: 0 }}>🚀 Spustit kampaň</h2>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                Cílová skupina
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                {(["free", "paid", "mixed"] as const).map(seg => (
                  <label key={seg} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aaa", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="segment"
                      value={seg}
                      checked={audienceSegment === seg}
                      onChange={(e) => setAudienceSegment(e.target.value as any)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ textTransform: "capitalize" }}>{seg === "free" ? "Zdarma stahovači" : seg === "paid" ? "Kupující" : "Všichni"}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                Denní limit: {dailySendLimit} emailů/den
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={dailySendLimit}
                onChange={(e) => setDailySendLimit(parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ color: "#666", fontSize: "12px", marginTop: "8px" }}>
                Odhadem se zašle všem recipientům za <strong>{estimatedDays} dní</strong>
              </div>
            </div>

            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "24px",
              fontSize: "13px",
              color: "#aaa",
              lineHeight: "1.6"
            }}>
              <strong>ℹ️ Jak to funguje:</strong><br/>
              System automaticky odesílá emaily podle nastaveného denního limitu. Pokud spustíte kampaň na 5000 lidí s limitem 85/den, bude trvat asi 59 dní. Vždycky se respektují limity Resend free plánu.
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowStartDialog(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#222",
                  border: "1px solid #333",
                  color: "#fff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Zrušit
              </button>
              <button
                onClick={startCampaign}
                disabled={startingCampaign}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: startingCampaign ? "#555" : "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: startingCampaign ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                {startingCampaign ? "Spouštím..." : "Spustit kampaň"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show campaign progress if active */}
      {selectedCampaign?.status === "active" && selectedCampaignId && (
        <div style={{ marginBottom: "24px" }}>
          <CampaignProgress campaignId={selectedCampaignId} autoRefresh={true} refreshInterval={10000} />
        </div>
      )}

      <CampaignsTabLayout
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        campaign={selectedCampaign}
        emails={campaignEmails}
        templates={templates}
        loading={loading}
        selectedEmailId={previewEmailId}
        onSelectCampaign={selectCampaign}
        onCreateCampaign={createNewCampaign}
        onDeleteCampaign={deleteCampaign}
        onSelectEmail={setPreviewEmailId}
        onAddEmail={addEmailToCampaign}
        onDeleteEmail={deleteEmailFromCampaign}
        onUpdateEmailTemplate={updateEmailTemplate}
        onUpdateEmailDelay={updateEmailDelay}
        onRefresh={loadCampaigns}
        onStartCampaign={() => setShowStartDialog(true)}
        campaignStatus={selectedCampaign?.status}
      />
    </div>
  );
}
