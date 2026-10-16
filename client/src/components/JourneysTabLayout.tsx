import React, { useState } from "react";
import JourneyList from "./JourneyList";
import JourneyFlowBuilder from "./JourneyFlowBuilder";
import { VisualEmailBuilder } from "./VisualEmailBuilder.js";

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
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const selectedStep = detail?.steps?.find((s: any) => s.id === selectedStepId);
  const template = templates.find((t) => t.id === selectedStep?.template_id);
  const isEmailSelected = selectedStep?.step_type === "email" && template;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px", background: "#000" }}>
      {/* Top: Journey List + Náhled Kroku (split) - 60% of viewport */}
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

        {/* Right: Náhled Kroku / Visual Editor (flex, takes remaining space) */}
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
            onKeyDown={(e) => {
              if (!detail.steps || detail.steps.length === 0) return;
              const currentIndex = detail.steps.findIndex((s: any) => s.id === selectedStepId);
              
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (currentIndex < detail.steps.length - 1) {
                  onSelectStep(detail.steps[currentIndex + 1].id);
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (currentIndex > 0) {
                  onSelectStep(detail.steps[currentIndex - 1].id);
                }
              }
            }}
            tabIndex={0}
          >
            {/* Header with Title and View Mode Toggle */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "12px 16px",
              borderBottom: "1px solid #111",
              flexShrink: 0,
              background: "#0a0a0a"
            }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Náhled Kroku
              </div>
              {isEmailSelected && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setViewMode("preview")}
                    style={{
                      background: viewMode === "preview" ? "#222" : "transparent",
                      border: `1px solid ${viewMode === "preview" ? "#444" : "#333"}`,
                      color: viewMode === "preview" ? "#ccc" : "#666",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "preview") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
                        (e.currentTarget as HTMLButtonElement).style.color = "#999";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "preview") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
                        (e.currentTarget as HTMLButtonElement).style.color = "#666";
                      }
                    }}
                  >
                    👁️ Náhled
                  </button>
                  <button
                    onClick={() => setViewMode("edit")}
                    style={{
                      background: viewMode === "edit" ? "#222" : "transparent",
                      border: `1px solid ${viewMode === "edit" ? "#444" : "#333"}`,
                      color: viewMode === "edit" ? "#ccc" : "#666",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "edit") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
                        (e.currentTarget as HTMLButtonElement).style.color = "#999";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "edit") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
                        (e.currentTarget as HTMLButtonElement).style.color = "#666";
                      }
                    }}
                  >
                    ✏️ Upravit
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
              {!isEmailSelected ? (
                // Empty state - show visual editor interface but greyed out
                <div style={{ flex: 1, overflow: "auto", position: "relative", opacity: 0.4, pointerEvents: "none" }}>
                  <VisualEmailBuilder
                    initialSubject=""
                    initialPreheader=""
                    initialBlocks={[]}
                    title="Vyberte e-mail v sekvenci níže"
                    onSave={() => {}}
                    onClose={() => {}}
                    onTestSend={() => {}}
                  />
                </div>
              ) : viewMode === "preview" ? (
                // Preview mode - show email in iframe
                <div style={{ flex: 1, overflow: "auto", padding: "20px", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #111" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>E-mailová šablona</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#999" }}>
                      {template?.name || "Bez šablony"}
                    </div>
                    {selectedStep.delay_hours ? (
                      <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>
                        Zpoždění: {selectedStep.delay_hours} hodin
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Email Preview Container */}
                  <div style={{ 
                    flex: 1, 
                    overflow: "auto", 
                    display: "flex", 
                    justifyContent: "center",
                    alignItems: "flex-start",
                    minHeight: 0
                  }}>
                    <iframe
                      src={`/api/marketing/journeys/${detail.journey.id}/steps/${selectedStep.id}/preview`}
                      style={{ 
                        width: "100%", 
                        maxWidth: "600px",
                        flex: "0 0 auto",
                        minHeight: "500px",
                        border: "none", 
                        background: "#fff", 
                        borderRadius: "4px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                      }}
                      title="Email preview"
                    />
                  </div>
                </div>
              ) : (
                // Edit mode - show visual editor
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                  <VisualEmailBuilder
                    initialSubject={template?.subject || ""}
                    initialPreheader={template?.preheader || ""}
                    initialBlocks={template?.blocks ? (typeof template.blocks === 'string' ? JSON.parse(template.blocks) : template.blocks) : []}
                    title={template?.name || "Editor e-mailu"}
                    onSave={async (html) => {
                      // Save updated template
                      try {
                        await fetch(`/api/marketing/templates/${template.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ htmlContent: html }),
                        });
                        onRefresh();
                        setViewMode("preview");
                      } catch (err) {
                        console.error("Error saving template:", err);
                      }
                    }}
                    onTestSend={async (email) => {
                      onTestEmail(selectedStep.id);
                    }}
                    onClose={() => setViewMode("preview")}
                  />
                </div>
              )}
            </div>
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
