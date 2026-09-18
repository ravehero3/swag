import React, { useState, useMemo } from "react";

interface Template {
  id: number;
  name: string;
  subject: string;
  preheader: string;
  html_content?: string;
  category?: string;
  audience?: "rapper" | "producer" | "general" | null;
}

interface TemplateCardGridProps {
  templates: Template[];
  recommendedTemplateIds?: number[];
  selectedTemplateId?: number | string;
  onSelectTemplate: (templateId: number) => void;
  journeyId?: number;
}

export const TemplateCardGrid: React.FC<TemplateCardGridProps> = ({
  templates,
  recommendedTemplateIds = [],
  selectedTemplateId,
  onSelectTemplate,
  journeyId,
}) => {
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);

  const renderTemplateCard = (template: Template) => (
    <div
      key={template.id}
      style={{
        position: "relative",
        background: selectedTemplateId === template.id 
          ? "rgba(225, 29, 72, 0.15)" 
          : "rgba(255, 255, 255, 0.03)",
        border: selectedTemplateId === template.id 
          ? "2px solid #E11D48" 
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "10px",
        padding: "14px",
        cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "150px",
        overflow: "hidden",
      }}
      onClick={() => onSelectTemplate(template.id)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = selectedTemplateId === template.id
          ? "rgba(225, 29, 72, 0.2)"
          : "rgba(255, 255, 255, 0.05)";
        (e.currentTarget as HTMLElement).style.borderColor = selectedTemplateId === template.id
          ? "#E11D48"
          : "rgba(255, 255, 255, 0.15)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.4)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = selectedTemplateId === template.id 
          ? "rgba(225, 29, 72, 0.15)" 
          : "rgba(255, 255, 255, 0.03)";
        (e.currentTarget as HTMLElement).style.borderColor = selectedTemplateId === template.id 
          ? "2px solid #E11D48" 
          : "1px solid rgba(255, 255, 255, 0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Template Name */}
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", textAlign: "left" }}>
        {template.name}
      </div>

      {/* Subject Line Preview */}
      <div style={{ fontSize: "10px", color: "#bbb", textAlign: "left", lineHeight: "1.3" }}>
        <div style={{ color: "#888", fontSize: "8px", textTransform: "uppercase", marginBottom: "2px" }}>Subject:</div>
        {template.subject}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Use Case Info */}
      <div
        style={{
          fontSize: "9px",
          color: "#666",
          textAlign: "left",
          padding: "8px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "6px",
          borderLeft: "2px solid rgba(225, 29, 72, 0.5)",
          lineHeight: "1.3",
        }}
      >
        {getUseCase(template.name)}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreviewTemplateId(template.id);
          }}
          style={{
            flex: 1,
            background: "rgba(225, 29, 72, 0.1)",
            border: "1px solid rgba(225, 29, 72, 0.3)",
            color: "#E11D48",
            borderRadius: "5px",
            padding: "5px",
            fontSize: "9px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.2)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(225, 29, 72, 0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.3)";
          }}
        >
          Náhled
        </button>

        <button
          style={{
            flex: 1,
            background: selectedTemplateId === template.id ? "#E11D48" : "rgba(255, 255, 255, 0.05)",
            border: selectedTemplateId === template.id ? "1px solid #E11D48" : "1px solid rgba(255, 255, 255, 0.1)",
            color: selectedTemplateId === template.id ? "#fff" : "#bbb",
            borderRadius: "5px",
            padding: "5px",
            fontSize: "9px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#E11D48";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = selectedTemplateId === template.id ? "#E11D48" : "rgba(255, 255, 255, 0.05)";
            (e.currentTarget as HTMLElement).style.color = selectedTemplateId === template.id ? "#fff" : "#bbb";
          }}
        >
          {selectedTemplateId === template.id ? "✓" : "Vybrat"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Simple grid - no filters, no search */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
        {templates.map((t) => renderTemplateCard(t))}
      </div>

      {templates.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "12px" }}>
          Žádné šablony k dispozici.
        </div>
      )}

      {/* Email Preview Modal */}
      {previewTemplateId && (
        <div
          onClick={() => setPreviewTemplateId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a0a",
              border: "1px solid #333",
              borderRadius: "12px",
              width: "min(800px, 90vw)",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.9)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(225, 29, 72, 0.1)",
                borderBottom: "1px solid #222",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                Náhled: {templates.find(t => t.id === previewTemplateId)?.name}
              </div>
              <button
                onClick={() => setPreviewTemplateId(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "#888",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#666";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#444";
                  (e.currentTarget as HTMLElement).style.color = "#888";
                }}
              >
                Zavřít
              </button>
            </div>

            {/* Email Content Preview */}
            <div style={{ flex: 1, overflow: "auto" }}>
              <iframe
                srcDoc={templates.find(t => t.id === previewTemplateId)?.html_content || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  minHeight: "600px",
                }}
                title="Email preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getUseCase = (templateName: string): string => {
  const useCases: Record<string, string> = {
    "Free Beat Onboarding - Day 3": "Nabídne exkluzivní kód novým",
    "Free Kit Onboarding - Day 3": "Motivuje k nákupu po stažení",
    "Abandoned Checkout - Reminder": "Jemná připomínka",
    "Abandoned Checkout - Scarcity": "Vytváří naléhavost",
    "Browse Recovery - Day 1": "Zpět na produkty",
    "Browse Recovery - Day 3": "Doporučuje podobné",
    "Rapper Tips - Spotify Strategy": "Pro rappery: Spotify strategie",
    "Producer Tips - Sound Design": "Pro producenty: Design tipů",
    "Post-Beat Purchase - Engagement": "Buduje komunitu",
    "Post-Beat Purchase - Custom Arrangement": "Nabízí custom úpravy",
    "Kit Cross-Sell": "Navrhuje doplňující kit",
    "Weekly Newsletter - New Drops": "Pravidelný newsletter",
    "First Purchase Thank You": "Poděkování za nákup",
    "Bundle Recommendation": "Nabídne bundle",
    "Educational - Beat Breakdown": "Rozbor composice",
    "Collaboration - Remix Request": "Pozvánka na kolaboraci",
    "VIP Upgrade Offer": "Upgrade na VIP tier",
    "Rapper Feature - Collab Call": "Pozvánka na feature",
  };
  return useCases[templateName] || "Specifikované";
};

export default TemplateCardGrid;
