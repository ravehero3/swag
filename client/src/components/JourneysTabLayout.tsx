import React from "react";
import JourneyList from "./JourneyList";
import JourneyFlowBuilder from "./JourneyFlowBuilder";

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
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
      {/* Top: Journey List + Preview (split) */}
      <div style={{ display: "flex", gap: "16px", height: "400px", minHeight: "300px", flexShrink: 0 }}>
        {/* Left: Journey List (400px fixed) */}
        <div style={{ width: "400px", flexShrink: 0, overflow: "auto", borderRight: "1px solid #222", paddingRight: "16px" }}>
          <JourneyList
            journeys={journeys}
            selectedJourneyId={selectedJourneyId}
            onSelectJourney={(id) => {
              onSelectJourney(id);
            }}
            onStatusChange={onStatusChange}
          />
        </div>

        {/* Right: Email Preview (flex, takes remaining space) */}
        {detail?.journey && (
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              overflow: "auto",
              minWidth: 0,
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
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Náhled Kroku
            </div>
            
            {selectedStepId ? (() => {
              const selectedStep = detail.steps?.find((s: any) => s.id === selectedStepId);
              if (!selectedStep) return <div style={{ color: "#666", fontSize: "12px" }}>Krok nenalezen</div>;
              
              if (selectedStep.step_type === "email") {
                const template = templates.find((t) => t.id === selectedStep.template_id);
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>E-mailová šablona</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0B99FC" }}>
                        {template?.name || "Bez šablony"}
                      </div>
                      {selectedStep.delay_hours ? (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                          Zpoždění: {selectedStep.delay_hours} hodin
                        </div>
                      ) : null}
                    </div>
                    
                    {template?.html_content && (
                      <div style={{ flex: 1, overflow: "auto", border: "1px solid #222", borderRadius: "4px", background: "#fff", minHeight: 0 }}>
                        <iframe
                          srcDoc={template.html_content}
                          style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                          title="Email preview"
                        />
                      </div>
                    )}
                  </div>
                );
              } else {
                return <div style={{ color: "#666", fontSize: "12px" }}>Krok: {selectedStep.step_type}</div>;
              }
            })() : (
              <div style={{ color: "#666", fontSize: "12px" }}>
                Vyberte krok v sekvenci níže
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Full-width Sequence Section */}
      {detail?.journey && (
        <div style={{ flex: 1, minHeight: "300px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sekvence: {detail.journey.name}
          </div>
          <div style={{ flex: 1, position: "relative", background: "#0a0a0a", border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
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
