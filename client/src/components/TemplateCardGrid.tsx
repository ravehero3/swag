import React, { useState, useMemo } from "react";

interface Template {
  id: number;
  name: string;
  subject: string;
  preheader: string;
  html_content?: string;
  category?: string;
  audience?: "rapper" | "producer" | "general";
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
  const [filterBy, setFilterBy] = useState<"all" | "rapper" | "producer" | "general">("all");
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Organize templates by audience (treat missing/null as "general")
  const rapperTemplates = useMemo(
    () => templates.filter(t => t.audience === "rapper"),
    [templates]
  );

  const producerTemplates = useMemo(
    () => templates.filter(t => t.audience === "producer"),
    [templates]
  );

  const generalTemplates = useMemo(
    () => templates.filter(t => !t.audience || t.audience === "general"),
    [templates]
  );

  // Search filter
  const filterBySearch = (list: Template[]) => {
    if (!searchQuery) return list;
    return list.filter(
      t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Apply search to all categories
  const filteredRapper = useMemo(() => filterBySearch(rapperTemplates), [rapperTemplates, searchQuery]);
  const filteredProducer = useMemo(() => filterBySearch(producerTemplates), [producerTemplates, searchQuery]);
  const filteredGeneral = useMemo(() => filterBySearch(generalTemplates), [generalTemplates, searchQuery]);

  // Determine which categories to show based on filter
  const showRapper = filterBy === "all" || filterBy === "rapper";
  const showProducer = filterBy === "all" || filterBy === "producer";
  const showGeneral = filterBy === "all" || filterBy === "general" || filterBy === "rapper" || filterBy === "producer";

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
      {/* Filter Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Hledejte šablonu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "12px",
          }}
        />

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["all", "rapper", "producer", "general"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterBy(filter)}
              style={{
                padding: "6px 14px",
                background: filterBy === filter ? "#E11D48" : "rgba(255, 255, 255, 0.05)",
                border: filterBy === filter ? "1px solid #E11D48" : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: filterBy === filter ? "#000" : "#bbb",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                if (filterBy !== filter) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (filterBy !== filter) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
            >
              {filter === "all" && "Všechny"}
              {filter === "rapper" && "Rappeři"}
              {filter === "producer" && "Produceři"}
              {filter === "general" && "Obecné"}
            </button>
          ))}
        </div>
      </div>

      {/* Templates organized by audience */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* RAPPEŘI SECTION */}
        {showRapper && filteredRapper.length > 0 && (
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: 700, 
              color: "#10B981", 
              marginBottom: "12px", 
              textTransform: "uppercase", 
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              🎤 RAPPEŘI
              <span style={{ fontSize: "10px", color: "#666", fontWeight: 500, textTransform: "none", letterSpacing: "normal" }}>
                ({filteredRapper.length})
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {filteredRapper.map((t) => renderTemplateCard(t))}
            </div>
          </div>
        )}

        {/* PRODUCEŘI SECTION */}
        {showProducer && filteredProducer.length > 0 && (
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: 700, 
              color: "#6366F1", 
              marginBottom: "12px", 
              textTransform: "uppercase", 
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              🎹 PRODUCEŘI
              <span style={{ fontSize: "10px", color: "#666", fontWeight: 500, textTransform: "none", letterSpacing: "normal" }}>
                ({filteredProducer.length})
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {filteredProducer.map((t) => renderTemplateCard(t))}
            </div>
          </div>
        )}

        {/* OBECNÉ SECTION */}
        {showGeneral && filteredGeneral.length > 0 && (
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: 700, 
              color: "#F59E0B", 
              marginBottom: "12px", 
              textTransform: "uppercase", 
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              ⚙️ OBECNÉ
              <span style={{ fontSize: "10px", color: "#666", fontWeight: 500, textTransform: "none", letterSpacing: "normal" }}>
                ({filteredGeneral.length})
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {filteredGeneral.map((t) => renderTemplateCard(t))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredRapper.length === 0 && filteredProducer.length === 0 && filteredGeneral.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "12px" }}>
            Žádné šablony se neshodují s vašim hledáním.
          </div>
        )}
      </div>

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
