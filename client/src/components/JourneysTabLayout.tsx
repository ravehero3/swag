import React, { useState } from "react";
import JourneyList from "./JourneyList";
import JourneyFlowBuilder from "./JourneyFlowBuilder";
import CompactEmailEditor from "./CompactEmailEditor";

interface JourneysLayoutProps {
  journeys: any[];
  selectedJourneyId: number | null;
  detail: any;
  loading: boolean;
  selectedStepId: number | null;
  templates: any[];
  testSendingStepId: number | null;
  testEmail: string;
  stepStats: any;
  
  onSelectJourney: (id: number) => void;
  onStatusChange: (id: number, newStatus: string) => void;
  onSelectStep: (id: number) => void;
  onEditStep: (step: any) => void;
  onDeleteStep: (id: number) => void;
  onAddStep: () => void;
  onTestEmail: (stepId: number) => void;
  onTestEmailChange: (email: string) => void;
  onOpenVisualEditor: (step: any) => void;
  onRefresh: () => void;
}

export default function JourneysTabLayout({
  journeys,
  selectedJourneyId,
  detail,
  loading,
  selectedStepId,
  templates,
  testSendingStepId,
  testEmail,
  stepStats,
  onSelectJourney,
  onStatusChange,
  onSelectStep,
  onEditStep,
  onDeleteStep,
  onAddStep,
  onTestEmail,
  onTestEmailChange,
  onOpenVisualEditor,
  onRefresh,
}: JourneysLayoutProps) {
  const selectedStep = (selectedStepId ? detail?.steps?.find((s: any) => s.id === selectedStepId) : null)
    || detail?.steps?.find((s: any) => s.step_type === "email")
    || (detail?.steps?.length > 0 ? detail.steps[0] : null);
  const template = templates.find((t) => t.id === selectedStep?.template_id);
  
  // Show editor if: step is selected AND it's an email step
  const isEmailSelected = selectedStep?.step_type === "email";
  
  // Priority: step's custom blocks/subject (from db join or configuration) > linked template
  const stepBlocks = selectedStep?.blocks || selectedStep?.configuration?.blocks;
  const templateBlocks = template?.blocks;
  const resolvedBlocks = (stepBlocks && Array.isArray(stepBlocks) && stepBlocks.length > 0)
    ? stepBlocks
    : (typeof stepBlocks === "string" ? (() => { try { return JSON.parse(stepBlocks); } catch { return []; } })() : null)
    || (templateBlocks && Array.isArray(templateBlocks) && templateBlocks.length > 0 ? templateBlocks : null)
    || (typeof templateBlocks === "string" ? (() => { try { return JSON.parse(templateBlocks); } catch { return []; } })() : null)
    || [];

  const displayTemplate = {
    ...selectedStep,
    ...(template || {}),
    id: template?.id || selectedStep?.template_id || selectedStep?.id,
    campaignEmailId: `journey-step-${selectedStep?.id}`,
    name: template?.name || selectedStep?.template_name || `${detail?.journey?.name || "Journey"} — E-mail`,
    subject: selectedStep?.subject || selectedStep?.configuration?.subject || template?.subject || "",
    preheader: selectedStep?.preheader || selectedStep?.configuration?.preheader || template?.preheader || "",
    blocks: resolvedBlocks,
    headerOptions: selectedStep?.header_options || selectedStep?.configuration?.headerOptions || template?.header_options || template?.headerOptions,
  };

  const handleSaveStepEmail = async (data: { subject: string; preheader: string; blocks: any[]; headerOptions?: any; name?: string }) => {
    if (!selectedStep || !detail?.journey?.id) throw new Error("Journey nebo krok nebyl vybrán");
    const tplName = data.name || template?.name || `${detail.journey.name} — E-mail krok`;
    let activeTemplateId = selectedStep.template_id;
    try {
      if (activeTemplateId) {
        // PATCH existing template
        const res = await fetch(`/api/marketing/templates/${activeTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: tplName,
            subject: data.subject,
            preheader: data.preheader,
            blocks: data.blocks,
            headerOptions: data.headerOptions,
          }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData?.error || "Chyba při ukládání šablony");
        console.log("[Journey Email Save] Template updated successfully", activeTemplateId);
      } else {
        // CREATE new template
        const createRes = await fetch("/api/marketing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: tplName,
            subject: data.subject,
            preheader: data.preheader,
            blocks: data.blocks,
            headerOptions: data.headerOptions,
          }),
        });
        const created = await createRes.json();
        if (!createRes.ok) throw new Error(created?.error || "Chyba při vytváření šablony");
        console.log("[Journey Email Save] Template created", created.id);
        activeTemplateId = created.id;
      }
    } catch (err) {
      console.error("[Journey Email Save] Error:", err);
      throw err;
    }

    // Always mirror save directly to the journey step's configuration as well
    await fetch(`/api/marketing/journeys/${detail.journey.id}/steps/${selectedStep.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        templateId: activeTemplateId,
        configuration: {
          ...(selectedStep.configuration || {}),
          subject: data.subject,
          preheader: data.preheader,
          blocks: data.blocks,
          headerOptions: data.headerOptions,
        },
      }),
    });
  };

  const handleTestSendStepEmail = async (email: string, subject: string, preheader: string, blocks: any[], headerOptions?: any) => {
    if (!selectedStep || !detail?.journey?.id) throw new Error("Vyberte journey a krok");
    const url = `/api/marketing/journeys/${detail.journey.id}/steps/${selectedStep.id}/send-test`;
    const res = await fetch(url, {
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
      {/* Top: Journey List + Visual Email Editor (split) - 60% of viewport */}
      <div style={{ display: "flex", gap: "16px", height: "60vh", flexShrink: 0 }}>
        {/* Left: Journey List (400px fixed) */}
        <div style={{ width: "400px", flexShrink: 0, overflow: "auto", borderRight: "1px solid #111", paddingRight: "16px", background: "#000" }}>
          <JourneyList
            journeys={journeys}
            selectedJourneyId={selectedJourneyId}
            onSelectJourney={(id) => {
              onSelectJourney(id);
            }}
            onStatusChange={onStatusChange}
          />
        </div>

        {/* Right: Compact Email Editor (flex, takes remaining space) */}
        {detail?.journey && (
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
                template={displayTemplate}
                onSave={handleSaveStepEmail}
                onTestSend={handleTestSendStepEmail}
                onRefresh={onRefresh}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom: Full-width Sequence Section - 40% of viewport */}
      {detail?.journey && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#999", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sekvence: {detail.journey.name}
          </div>
          <div style={{ flex: 1, position: "relative", background: "#000", border: "1px solid #111", borderRadius: "4px", overflow: "hidden" }}>
            <JourneyFlowBuilder
              journey={detail.journey}
              steps={detail.steps || []}
              templates={templates}
              selectedStepId={selectedStepId}
              onSelectStep={onSelectStep}
              onEditStep={onEditStep}
              onDeleteStep={onDeleteStep}
              onAddStep={onAddStep}
              onTestEmail={onTestEmail}
              testSendingStepId={testSendingStepId}
              testEmail={testEmail}
              onTestEmailChange={onTestEmailChange}
              stepStats={stepStats}
              onOpenVisualEditor={onOpenVisualEditor}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
}
