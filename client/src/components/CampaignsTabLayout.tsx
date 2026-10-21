import React, { useState } from "react";
import CampaignList from "./CampaignList";
import CompactEmailEditor from "./CompactEmailEditor";
import CampaignSequenceBuilder from "./CampaignSequenceBuilder";
import { Play, Pause } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  audience: "buyers" | "free_downloads";
  status: "draft" | "active" | "completed" | "paused";
  emailCount: number;
  createdAt: string;
}

interface CampaignEmail {
  id: number;
  position: number;
  templateId: number | null;
  delayHours: number;
  sendDate?: string;
  sendTime?: string;
  templateName?: string;
  subject?: string;
  preheader?: string;
  blocks?: any;
  headerOptions?: any;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  preheader?: string;
  blocks?: any;
  headerOptions?: any;
}

interface CampaignsLayoutProps {
  campaigns: Campaign[];
  selectedCampaignId: number | null;
  campaign: Campaign | null;
  emails: CampaignEmail[];
  templates: Template[];
  loading: boolean;
  selectedEmailId: number | null;
  campaignStatus?: "draft" | "active" | "completed" | "paused";

  onSelectCampaign: (id: number) => void;
  onCreateCampaign: (name: string, audience: "buyers" | "free_downloads") => void;
  onDeleteCampaign: (id: number) => void;
  onSelectEmail: (emailId: number) => void;
  onAddEmail: () => void;
  onDeleteEmail: (emailId: number) => void;
  onUpdateEmailTemplate: (emailId: number, templateId: number) => void;
  onUpdateEmailDelay: (emailId: number, delayHours: number) => void;
  onSaveEmailEdits?: (emailId: number, overrides: any) => Promise<void>;
  onRefresh: () => void;
  onStartCampaign?: () => void;
  onTestEmail?: (emailId: number) => Promise<void>;
  testEmail?: string;
  onTestEmailChange?: (email: string) => void;
}

export default function CampaignsTabLayout({
  campaigns,
  selectedCampaignId,
  campaign,
  emails,
  templates,
  loading,
  selectedEmailId,
  campaignStatus,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
  onSelectEmail,
  onAddEmail,
  onDeleteEmail,
  onUpdateEmailTemplate,
  onUpdateEmailDelay,
  onSaveEmailEdits,
  onRefresh,
  onStartCampaign,
  onTestEmail,
  testEmail = "",
  onTestEmailChange,
}: CampaignsLayoutProps) {
  const selectedEmail = (selectedEmailId ? emails.find((e) => e.id === selectedEmailId) : null) || (emails.length > 0 ? emails[0] : null);
  
  // Merge template with campaign email overrides
  const templateId = selectedEmail?.template_id || selectedEmail?.templateId;
  const selectedTemplate = templateId
    ? templates.find((t) => t.id === templateId)
    : null;

  // Create merged template that includes campaign-specific overrides
  // Works with or without a template - uses campaign email's own blocks if no template
  const mergedTemplate = selectedEmail
    ? {
        id: selectedTemplate?.id || -1,
        name: selectedTemplate?.name || selectedEmail.subject || "E-mail kampaně",
        subject: selectedEmail.subject || selectedTemplate?.subject || "E-mail kampaně",
        preheader: selectedEmail.preheader || selectedTemplate?.preheader || "",
        blocks: selectedEmail.blocks || selectedTemplate?.blocks || [],
        headerOptions: selectedEmail.header_options || selectedEmail.headerOptions || selectedTemplate?.header_options || selectedTemplate?.headerOptions || {},
        campaignEmailId: selectedEmail.id,
      }
    : null;

  const isEmailSelected = !!mergedTemplate;

  const handleSaveCampaignEmail = async (data: { subject: string; preheader: string; blocks: any[]; headerOptions?: any; name?: string }) => {
    if (!selectedCampaignId || !selectedEmail?.id) return;
    const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${selectedEmail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subject: data.subject,
        preheader: data.preheader,
        blocks: data.blocks,
        headerOptions: data.headerOptions,
      }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData?.error || "Chyba při ukládání e-mailu");

    // Mirror save directly to parent campaign as well for safety
    await fetch(`/api/marketing/campaigns/${selectedCampaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subject: data.subject,
        preheader: data.preheader,
        blocks: data.blocks,
        headerOptions: data.headerOptions,
      }),
    }).catch(() => {});

    if (onSaveEmailEdits) {
      await onSaveEmailEdits(selectedEmail.id, {
        subject: data.subject,
        preheader: data.preheader,
        blocks: data.blocks,
        headerOptions: data.headerOptions,
      });
    }
  };

  const handleTestSendCampaignEmail = async (email: string, subject: string, preheader: string, blocks: any[], headerOptions?: any) => {
    if (!selectedCampaignId || !selectedEmail?.id) throw new Error("Vyberte kampaň a e-mail");
    const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/emails/${selectedEmail.id}/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        to: email,
        subject,
        preheader,
        blocks,
        headerOptions,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Odeslání testovacího e-mailu selhalo");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px", background: "#000" }}>
      {/* Top: Campaign List + Compact Email Editor (split) - 60% of viewport */}
      <div style={{ display: "flex", gap: "16px", height: "60vh", flexShrink: 0 }}>
        {/* Left: Campaign List (400px fixed) */}
        <div
          style={{
            width: "400px",
            flexShrink: 0,
            overflow: "auto",
            borderRight: "1px solid #111",
            paddingRight: "16px",
            background: "#000",
          }}
        >
          <CampaignList
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={onSelectCampaign}
            onCreateCampaign={onCreateCampaign}
            onDeleteCampaign={onDeleteCampaign}
            loading={loading}
          />
        </div>

        {/* Right: Compact Email Editor (flex, takes remaining space) */}
        {campaign && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
              background: "#000",
              border: "1px solid #111",
              borderRadius: "4px",
            }}
          >
            {!isEmailSelected ? (
              // Empty state
              <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#444", fontSize: "13px", textAlign: "center" }}>
                  Vyberte e-mailový krok v sekvenci níže
                </div>
              </div>
            ) : (
              // Compact Email Editor - fits all 4 sections in tight space
              <CompactEmailEditor
                template={mergedTemplate}
                onSave={handleSaveCampaignEmail}
                onTestSend={handleTestSendCampaignEmail}
                onRefresh={onRefresh}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom: Full-width Sequence Section - 40% of viewport */}
      {campaign && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "12px" 
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sekvence: {campaign.name}
            </div>
            
            {campaignStatus === "draft" && (
              <button
                onClick={onStartCampaign}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "#0f0",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  letterSpacing: "0.5px"
                }}
              >
                <Play size={14} />
                Spustit kampaň
              </button>
            )}
          </div>
          
          <div
            style={{
              flex: 1,
              position: "relative",
              background: "#000",
              border: "1px solid #111",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <CampaignSequenceBuilder
              campaign={campaign}
              emails={emails}
              templates={templates}
              selectedEmailId={selectedEmailId}
              onSelectEmail={onSelectEmail}
              onAddEmail={onAddEmail}
              onDeleteEmail={onDeleteEmail}
              onUpdateEmailTemplate={onUpdateEmailTemplate}
              onUpdateEmailDelay={onUpdateEmailDelay}
              onTestEmail={onTestEmail}
              testEmail={testEmail}
              onTestEmailChange={onTestEmailChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
