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
  const [editMode, setEditMode] = useState(false);
  const selectedStep = detail?.steps?.find((s: any) => s.id === selectedStepId);
  const template = templates.find((t) => t.id === selectedStep?.template_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px", background: "#000" }}>
      {/* Top: Journey List + Preview (split) - 60% of viewport */}
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

        {/* Right: Email Preview or Editor (flex, takes remaining space) */}
        {detail?.journey && (
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              overflow: "hidden",
              minWidth: 0,
              background: "#000",
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
            {/* Header with Title and Toggle Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #111" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {editMode ? "Úprava Šablony" : "Náhled Kroku"}
              </div>
              {selectedStepId && selectedStep?.step_type === "email" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    style={{
                      background: editMode ? "#222" : "#1a1a1a",
                      border: `1px solid ${editMode ? "#444" : "#333"}`,
                      color: editMode ? "#ccc" : "#999",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!editMode) {
                        (e.currentTarget as HTMLButtonElement).style.background = "#222";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#444";
                        (e.currentTarget as HTMLButtonElement).style.color = "#ccc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!editMode) {
                        (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
                        (e.currentTarget as HTMLButtonElement).style.color = "#999";
                      }
                    }}
                  >
                    {editMode ? "👁️ Náhled" : "✏️ Upravit"}
                  </button>
                </div>
              )}
            </div>
            
            {selectedStepId ? (() => {
              if (!selectedStep) return <div style={{ color: "#555", fontSize: "12px" }}>Krok nenalezen</div>;
              
              if (selectedStep.step_type === "email") {
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                    {!editMode && (
                      <>
                        <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #111", flexShrink: 0 }}>
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

                        {/* Email Preview Container - fills available space */}
                        {template?.html_content && (
                          <div style={{ 
                            flex: 1, 
                            overflow: "auto", 
                            border: "1px solid #111", 
                            borderRadius: "4px", 
                            background: "#1a1a1a", 
                            minHeight: 0, 
                            display: "flex", 
                            justifyContent: "center", 
                            alignItems: "flex-start", 
                            padding: "40px 20px", 
                            width: "100%",
                            boxSizing: "border-box"
                          }}>
                            <iframe
                              src={`/api/marketing/journeys/${detail.journey.id}/steps/${selectedStep.id}/preview`}
                              style={{ 
                                width: "100%", 
                                maxWidth: "600px",
                                minHeight: "400px",
                                border: "none", 
                                background: "#fff", 
                                display: "block",
                                borderRadius: "4px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                              }}
                              title="Email preview"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {editMode && template && (
                      <div style={{ flex: 1, overflow: "auto", background: "#000", borderRadius: "4px", minHeight: 0 }}>
                        <VisualEmailBuilder
                          initialSubject={template.subject || ""}
                          initialPreheader={template.preheader || ""}
                          initialBlocks={template.blocks ? JSON.parse(template.blocks) : []}
                          title={template.name}
                          onSave={async (html) => {
                            // Save updated template
                            await fetch(`/api/marketing/templates/${template.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ htmlContent: html }),
                              credentials: "include"
                            });
                            onRefresh();
                          }}
                          onTestSend={async (email) => {
                            onTestEmail(selectedStep.id);
                          }}
                          onClose={() => setEditMode(false)}
                        />
                      </div>
                    )}
                  </div>
                );
              } else {
                return <div style={{ color: "#555", fontSize: "12px" }}>Krok: {selectedStep.step_type}</div>;
              }
            })() : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "12px", borderTop: "1px solid #111" }}>
                Vyberte krok v sekvenci níže
              </div>
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
