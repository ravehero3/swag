import React, { useState, useMemo } from "react";

interface Template {
  id: number;
  name: string;
  subject: string;
  preheader: string;
  html_content?: string;
  category?: string;
}

interface TemplateCardGridProps {
  templates: Template[];
  recommendedTemplateIds?: number[];
  selectedTemplateId?: number | string;
  onSelectTemplate: (templateId: number) => void;
  journeyId?: number;
  targetAudience?: "rapper" | "producer" | "general";
}

const TEMPLATE_AUDIENCE: Record<string, "rapper" | "producer" | "general"> = {
  "rapper_tips_spotify": "rapper",
  "rapper_feature_collab": "rapper",
  "rapper_collab_feature": "rapper",
  "producer_tips_sound_design": "producer",
  "educational_beat_breakdown": "producer",
  "seasonal_summer_guide": "producer",
};

const getAudience = (templateKey?: string): "rapper" | "producer" | "general" => {
  if (!templateKey) return "general";
  return TEMPLATE_AUDIENCE[templateKey] || "general";
};

export const TemplateCardGrid: React.FC<TemplateCardGridProps> = ({
  templates,
  recommendedTemplateIds = [],
  selectedTemplateId,
  onSelectTemplate,
  journeyId,
  targetAudience = "general",
}) => {
  const [filterBy, setFilterBy] = useState<"all" | "rapper" | "producer" | "general">(targetAudience === "general" ? "all" : targetAudience);
  const [hoveredTemplateId, setHoveredTemplateId] = useState<number | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const recommendedTemplates = useMemo(() => {
    return templates.filter(t => recommendedTemplateIds.includes(t.id));
  }, [templates, recommendedTemplateIds]);

  const otherTemplates = useMemo(() => {
    return templates.filter(t => !recommendedTemplateIds.includes(t.id));
  }, [templates, recommendedTemplateIds]);

  const filterBySearch = (list: Template[]) => {
    if (!searchQuery) return list;
    return list.filter(
      t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // FIXED FILTERING LOGIC - Include general in all filters
  const filterByAudience = (list: Template[]) => {
    if (filterBy === "all") return list;
    
    return list.filter(t => {
      const audience = getAudience(t.category);
      
      if (filterBy === "rapper") {
        // Show rapper-focused + general templates
        return audience === "rapper" || audience === "general";
      }
      if (filterBy === "producer") {
        // Show producer-focused + general templates
        return audience === "producer" || audience === "general";
      }
      if (filterBy === "general") {
        // Show only general templates
        return audience === "general";
      }
      return true;
    });
  };

  const filteredRecommended = useMemo(() => {
    return filterByAudience(filterBySearch(recommendedTemplates));
  }, [recommendedTemplates, filterBy, searchQuery]);

  const filteredOther = useMemo(() => {
    return filterByAudience(filterBySearch(otherTemplates));
  }, [otherTemplates, filterBy, searchQuery]);

  const renderTemplateCard = (template: Template, isRecommended: boolean = false) => (
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
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "160px",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        setHoveredTemplateId(template.id);
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
        setHoveredTemplateId(null);
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
      {/* Recommended Badge */}
      {isRecommended && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(225, 29, 72, 0.9)",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Doporučené
        </div>
      )}

      {/* Template Name */}
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", textAlign: "left" }}>
        {template.name}
      </div>

      {/* Subject Line Preview */}
      <div style={{ fontSize: "11px", color: "#bbb", textAlign: "left", lineHeight: "1.4" }}>
        <div style={{ color: "#888", fontSize: "9px", textTransform: "uppercase", marginBottom: "3px" }}>Subject:</div>
        {template.subject}
      </div>

      {/* Preheader Preview */}
      <div style={{ fontSize: "10px", color: "#999", textAlign: "left", lineHeight: "1.3" }}>
        <div style={{ color: "#666", fontSize: "8px", textTransform: "uppercase", marginBottom: "2px" }}>Preview:</div>
        {template.preheader}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Use Case Info */}
      <div
        style={{
          fontSize: "10px",
          color: "#666",
          textAlign: "left",
          padding: "8px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "6px",
          borderLeft: "2px solid rgba(225, 29, 72, 0.5)",
        }}
      >
        {getUseCase(template.name)}
      </div>

      {/* Click to preview button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPreviewTemplateId(template.id);
        }}
        style={{
          background: "rgba(225, 29, 72, 0.1)",
          border: "1px solid rgba(225, 29, 72, 0.3)",
          color: "#E11D48",
          borderRadius: "6px",
          padding: "6px",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 150ms",
          marginTop: "8px",
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
        Náhled e-mailu
      </button>

      {/* Select button */}
      <button
        onClick={() => onSelectTemplate(template.id)}
        style={{
          background: selectedTemplateId === template.id ? "#E11D48" : "rgba(255, 255, 255, 0.05)",
          border: selectedTemplateId === template.id ? "1px solid #E11D48" : "1px solid rgba(255, 255, 255, 0.1)",
          color: selectedTemplateId === template.id ? "#fff" : "#bbb",
          borderRadius: "6px",
          padding: "6px",
          fontSize: "10px",
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
        {selectedTemplateId === template.id ? "Vybrané ✓" : "Vybrat"}
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                padding: "6px 12px",
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
              {filter === "rapper" && "Rappeři + Obecné"}
              {filter === "producer" && "Produceři + Obecné"}
              {filter === "general" && "Pouze Obecné"}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      {filteredRecommended.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#E11D48", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Doporučené pro tento krok
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {filteredRecommended.map((t) => renderTemplateCard(t, true))}
          </div>
        </div>
      )}

      {/* Other Templates Section */}
      {filteredOther.length > 0 && (
        <div>
          {filteredRecommended.length > 0 && (
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Další šablony
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
            {filteredOther.map((t) => renderTemplateCard(t, false))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredRecommended.length === 0 && filteredOther.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px", color: "#666", fontSize: "12px" }}>
          Žádné šablony se neshodují s filtrem.
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
                Náhled e-mailu: {templates.find(t => t.id === previewTemplateId)?.name}
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
                Zavřít ✕
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
    "Free Beat Onboarding - Day 3": "Nabídne exklusivní kód novým uživatelům",
    "Free Kit Onboarding - Day 3": "Motivuje k nákupu po stažení free kitu",
    "Abandoned Checkout - Reminder": "Jemná připomínka opuštěného nákupu",
    "Abandoned Checkout - Scarcity": "Vytváří naléhavost s omezeným kódem",
    "Browse Recovery - Day 1": "Zpět na produkty, které návštěvník sledoval",
    "Browse Recovery - Day 3": "Doporučuje podobné produkty",
    "Rapper Tips - Spotify Strategy": "Edukativní obsah pro rappery",
    "Producer Tips - Sound Design": "Edukativní obsah pro producenty",
    "Post-Beat Purchase - Engagement": "Buduje komunitu po nákupu",
    "Post-Beat Purchase - Custom Arrangement": "Nabízí custom úpravy beatu",
    "Kit Cross-Sell": "Navrhuje doplňující kit s slevou",
    "Weekly Newsletter - New Drops": "Pravidelný newsletter s novými",
    "First Purchase Thank You": "Poděkování za první nákup",
    "Bundle Recommendation": "Nabídne bundle s mega slevou",
    "Educational - Beat Breakdown": "Edukativní obsah - rozbor composice",
    "Collaboration - Remix Request": "Pozvánka na kolaboraci",
    "VIP Upgrade Offer": "Upgrade na VIP tier s benefity",
    "Rapper Feature - Collab Call": "Pozvánka pro rappery na feature",
  };
  return useCases[templateName] || "Specifikované použití";
};

export default TemplateCardGrid;
