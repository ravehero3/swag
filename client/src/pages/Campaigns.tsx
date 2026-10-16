import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Send, Play, Pause, X, Calendar, Clock, AlertCircle } from "lucide-react";
import CampaignSequenceBuilder from "../components/CampaignSequenceBuilder";
import CampaignEmailPreview from "../components/CampaignEmailPreview";
import CampaignAudienceSelector from "../components/CampaignAudienceSelector";

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
  status: "draft" | "test" | "live";
  emailCount: number;
  createdAt: string;
}

interface Template {
  id: number;
  name: string;
  subject: string;
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

  // Preview
  const [previewEmailId, setPreviewEmailId] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Modal states
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignAudience, setNewCampaignAudience] = useState<"buyers" | "free_downloads">("buyers");

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

  const selectCampaign = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id);
    setSelectedCampaign(campaign);
    loadCampaignEmails(campaign.id);
    setPreviewVisible(false);
    setTestMode(false);
  };

  const createNewCampaign = async () => {
    if (!newCampaignName.trim()) return;
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName,
          audience: newCampaignAudience,
        }),
      });
      if (res.ok) {
        const newCampaign = await res.json();
        setCampaigns([newCampaign, ...campaigns]);
        setNewCampaignName("");
        setShowNewCampaignModal(false);
        selectCampaign(newCampaign);
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
    }
  };

  const addEmailToCampaign = async () => {
    if (!selectedCampaignId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: campaignEmails.length + 1,
          delayHours: campaignEmails.length * 24,
        }),
      });
      if (res.ok) {
        const newEmail = await res.json();
        setCampaignEmails([...campaignEmails, newEmail]);
      }
    } catch (err) {
      console.error("Error adding email:", err);
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

  const scheduleEmailSend = async () => {
    if (!schedulerEmailId || !schedulerDate || !schedulerTime) return;
    const sendDateTime = `${schedulerDate}T${schedulerTime}:00Z`;
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${schedulerEmailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendDate: schedulerDate,
          sendTime: schedulerTime,
          sendDateTime,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaignEmails(
          campaignEmails.map((e) => (e.id === schedulerEmailId ? updated : e))
        );
        setShowDateScheduler(false);
      }
    } catch (err) {
      console.error("Error scheduling email:", err);
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
        body: JSON.stringify({ email: testEmail }),
      });
      if (res.ok) {
        alert("Testovací e-mail odeslán!");
      }
    } catch (err) {
      console.error("Error sending test email:", err);
    }
  };

  const publishCampaign = async () => {
    if (!selectedCampaignId) return;
    const confirmed = window.confirm(
      `Opravdu chcete spustit kampaň pro ${selectedCampaign?.audience === "buyers" ? "kupující" : "zdarma stahovače"}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: testMode ? "test" : "live" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaigns(campaigns.map((c) => (c.id === updated.id ? updated : c)));
        setSelectedCampaign(updated);
        alert("Kampaň spuštěna!");
      }
    } catch (err) {
      console.error("Error publishing campaign:", err);
    }
  };

  if (!selectedCampaign) {
    return (
      <div style={{ padding: "24px", background: "#000", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
              🎯 KAMPANĚ
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>
              Spravujte e-mailové kampaně pro kupující a volné zákazníky
            </p>
          </div>

          {/* New campaign button */}
          <button
            onClick={() => setShowNewCampaignModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "#0B99FC",
              border: "none",
              borderRadius: "6px",
              color: "#000",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "24px",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#0099ff";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(11,153,252,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#0B99FC";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            Nová kampaň
          </button>

          {/* Campaign list */}
          {loading ? (
            <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>
              Načítání...
            </div>
          ) : campaigns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#0f0f0f",
                borderRadius: "8px",
                border: "1px solid #222",
              }}
            >
              <p style={{ margin: 0, fontSize: "16px", color: "#888" }}>
                Zatím nemáte žádné kampaně
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#666" }}>
                Klikněte na "Nová kampaň" pro začátek
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => selectCampaign(campaign)}
                  style={{
                    padding: "16px",
                    background: "#0f0f0f",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#666";
                    btn.style.background = "#1a1a1a";
                    btn.style.boxShadow = "0 4px 12px rgba(11,153,252,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#333";
                    btn.style.background = "#0f0f0f";
                    btn.style.boxShadow = "none";
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                    {campaign.name}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#888" }}>
                      {campaign.audience === "buyers" ? "💳 Kupující" : "🎁 Zdarma"}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        background: campaign.status === "live" ? "#24e05320" : campaign.status === "test" ? "#f9a82520" : "#0B99FC20",
                        color: campaign.status === "live" ? "#24e053" : campaign.status === "test" ? "#f9a825" : "#0B99FC",
                        borderRadius: "3px",
                      }}
                    >
                      {campaign.status === "live"
                        ? "LIVE"
                        : campaign.status === "test"
                        ? "TEST"
                        : "DRAFT"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                    {campaign.emailCount} e-mailů
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New campaign modal */}
        {showNewCampaignModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
            onClick={() => setShowNewCampaignModal(false)}
          >
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "500px",
                width: "90%",
                border: "1px solid #333",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                Nová kampaň
              </h2>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: 600 }}>
                  Název kampaně
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="např. Letní slevy, Nový release..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0f0f0f",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "12px", fontWeight: 600 }}>
                  Cílová skupina
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <button
                    onClick={() => setNewCampaignAudience("buyers")}
                    style={{
                      padding: "12px",
                      background: newCampaignAudience === "buyers" ? "#0B99FC" : "#0f0f0f",
                      border: newCampaignAudience === "buyers" ? "none" : "1px solid #333",
                      borderRadius: "6px",
                      color: newCampaignAudience === "buyers" ? "#000" : "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💳 Kupující
                  </button>
                  <button
                    onClick={() => setNewCampaignAudience("free_downloads")}
                    style={{
                      padding: "12px",
                      background: newCampaignAudience === "free_downloads" ? "#0B99FC" : "#0f0f0f",
                      border: newCampaignAudience === "free_downloads" ? "none" : "1px solid #333",
                      borderRadius: "6px",
                      color: newCampaignAudience === "free_downloads" ? "#000" : "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🎁 Zdarma stahovači
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowNewCampaignModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#0f0f0f",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Zrušit
                </button>
                <button
                  onClick={createNewCampaign}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#0B99FC",
                    border: "none",
                    borderRadius: "6px",
                    color: "#000",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Vytvořit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Campaign detail view
  const selectedEmailForPreview = campaignEmails.find((e) => e.id === previewEmailId);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000" }}>
      {/* Left sidebar - campaign info */}
      <div
        style={{
          width: "300px",
          background: "#0a0a0a",
          borderRight: "1px solid #222",
          padding: "20px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => {
            setSelectedCampaign(null);
            setSelectedCampaignId(null);
            setCampaignEmails([]);
          }}
          style={{
            marginBottom: "20px",
            padding: "8px 12px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#999",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          ← Zpět na seznam
        </button>

        <h2 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
          {selectedCampaign.name}
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>STAV</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              background: selectedCampaign.status === "live" ? "#24e05320" : selectedCampaign.status === "test" ? "#f9a82520" : "#0B99FC20",
              color: selectedCampaign.status === "live" ? "#24e053" : selectedCampaign.status === "test" ? "#f9a825" : "#0B99FC",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "currentColor",
              }}
            />
            {selectedCampaign.status === "live"
              ? "LIVE"
              : selectedCampaign.status === "test"
              ? "TEST"
              : "DRAFT"}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>CÍLOVÁ SKUPINA</div>
          <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
            {selectedCampaign.audience === "buyers" ? "💳 Kupující zákazníci" : "🎁 Zdarma stahovači"}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>POČET E-MAILŮ</div>
          <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
            {campaignEmails.length}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Test/Live toggle */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "12px" }}>
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "12px", color: "#fff" }}>
              TEST MODE
            </span>
          </label>
          {testMode && (
            <div style={{ fontSize: "11px", color: "#f9a825", background: "#f9a82510", padding: "8px", borderRadius: "4px", border: "1px solid #f9a82520" }}>
              E-maily budou poslány pouze na testovací adresu
            </div>
          )}
        </div>

        {/* Publish button */}
        <button
          onClick={publishCampaign}
          disabled={campaignEmails.length === 0 || selectedCampaign.status !== "draft"}
          style={{
            width: "100%",
            padding: "12px",
            background: selectedCampaign.status === "draft" ? "#24e053" : "#555",
            border: "none",
            borderRadius: "6px",
            color: selectedCampaign.status === "draft" ? "#000" : "#999",
            fontSize: "12px",
            fontWeight: 700,
            cursor: selectedCampaign.status === "draft" && campaignEmails.length > 0 ? "pointer" : "not-allowed",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (selectedCampaign.status === "draft" && campaignEmails.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(36,224,83,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          {selectedCampaign.status === "draft"
            ? testMode
              ? "SPUSTIT TEST"
              : "SPUSTIT LIVE"
            : "JIŽ SPUŠTĚNO"}
        </button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Sequence builder */}
        <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
          <CampaignSequenceBuilder
            campaign={selectedCampaign}
            emails={campaignEmails}
            templates={templates}
            onEditEmail={(email) => {
              // Open email editor modal
            }}
            onDeleteEmail={deleteEmailFromCampaign}
            onAddEmail={addEmailToCampaign}
            onTestEmail={() => {}}
            testSendingEmailId={null}
            testEmail={testEmail}
            onTestEmailChange={setTestEmail}
            selectedEmailId={previewEmailId}
            onSelectEmail={(emailId) => {
              setPreviewEmailId(emailId);
              setPreviewVisible(true);
            }}
          />
        </div>

        {/* Email preview overlay */}
        {previewVisible && selectedEmailForPreview && (
          <CampaignEmailPreview
            email={selectedEmailForPreview}
            templateId={selectedEmailForPreview.templateId}
            onClose={() => setPreviewVisible(false)}
          />
        )}
      </div>
    </div>
  );
}
