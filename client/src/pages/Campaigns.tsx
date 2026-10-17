import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Send, Play, Pause, X, Calendar, Clock, AlertCircle } from "lucide-react";
import CampaignsTabLayout from "../components/CampaignsTabLayout";

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

  const selectCampaign = async (campaignId: number) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    setSelectedCampaignId(campaignId);
    setSelectedCampaign(campaign);
    await loadCampaignEmails(campaignId);
    setPreviewVisible(false);
    setTestMode(false);
  };

  const createNewCampaign = async (name: string, audience: "buyers" | "free_downloads") => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          audience,
        }),
      });
      if (res.ok) {
        const newCampaign = await res.json();
        setCampaigns([newCampaign, ...campaigns]);
        selectCampaign(newCampaign.id);
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px", background: "#000" }}>
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
        onSelectEmail={setPreviewEmailId}
        onAddEmail={addEmailToCampaign}
        onDeleteEmail={deleteEmailFromCampaign}
        onUpdateEmailTemplate={updateEmailTemplate}
        onUpdateEmailDelay={updateEmailDelay}
        onRefresh={loadCampaigns}
      />
    </div>
  );
}
