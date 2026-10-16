import React, { useState } from "react";
import { Play, Pause, ChevronRight, Zap, Users, Mail, TrendingUp } from "lucide-react";

interface Journey {
  id: number;
  name: string;
  status: string;
  trigger_type: string;
  trigger_value?: string;
  description?: string;
  activeEnrollments?: number;
  completedEnrollments?: number;
  emailsSent?: number;
  stepCount?: number;
}

interface JourneyListProps {
  journeys: Journey[];
  selectedJourneyId: number | null;
  onSelectJourney: (id: number) => void;
  onStatusChange: (id: number, newStatus: string) => void;
}

export default function JourneyList({
  journeys,
  selectedJourneyId,
  onSelectJourney,
  onStatusChange,
}: JourneyListProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    active: { bg: "#24e05320", text: "#24e053", icon: "●" },
    paused: { bg: "#f9a82520", text: "#f9a825", icon: "⏸" },
    draft: { bg: "#0B99FC20", text: "#0B99FC", icon: "⭘" },
  };

  const TRIGGER_ICONS: Record<string, string> = {
    free_download: "🎁",
    purchase: "💳",
    abandoned_cart: "🛒",
    user_signup: "✉️",
    tag_added: "🏷️",
    custom: "⚙️",
  };

  const getTriggerLabel = (type: string): string => {
    const labels: Record<string, string> = {
      free_download: "Free Download",
      purchase: "After Purchase",
      abandoned_cart: "Abandoned Checkout",
      user_signup: "User Signup",
      tag_added: "Tag Added",
      custom: "Custom Trigger",
    };
    return labels[type] || type;
  };

  const rowStyle = (journey: Journey) => ({
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr 1.2fr 1.2fr 1fr",
    alignItems: "center",
    padding: "14px 16px",
    background: selectedJourneyId === journey.id ? "rgba(11, 153, 252, 0.08)" : hoveredId === journey.id ? "#0f0f0f" : "transparent",
    border: selectedJourneyId === journey.id ? "2px solid #0B99FC" : hoveredId === journey.id ? "1px solid #333" : "1px solid transparent",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    marginBottom: "8px",
  });

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
          📧 Všechny Journeys
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
          {journeys.length} journey{journeys.length === 1 ? "" : "s"} — klikněte pro editaci sekvence
        </p>
      </div>

      {/* Table-like Layout */}
      <div style={{ borderRadius: "8px", border: "1px solid #222", overflow: "hidden", background: "#0a0a0a" }}>
        {/* Column Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr 1.2fr 1.2fr 1fr",
            alignItems: "center",
            padding: "12px 16px",
            background: "#0f0f0f",
            borderBottom: "1px solid #222",
            fontSize: "11px",
            fontWeight: 700,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            gap: "12px",
          }}
        >
          <div>Status</div>
          <div>Journey Name</div>
          <div>Trigger</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Users size={12} /> Active
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <TrendingUp size={12} /> Completed
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Mail size={12} /> Emails
          </div>
        </div>

        {/* Rows */}
        {journeys.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#666",
              fontSize: "13px",
            }}
          >
            No journeys yet. Create one to get started.
          </div>
        ) : (
          journeys.map((journey) => {
            const statusConfig = STATUS_COLORS[journey.status] || STATUS_COLORS.draft;
            return (
              <div
                key={journey.id}
                onMouseEnter={() => setHoveredId(journey.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectJourney(journey.id)}
                style={rowStyle(journey)}
              >
                {/* Status Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(journey.id, journey.status === "active" ? "paused" : "active");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: statusConfig.bg,
                      border: `1.5px solid ${statusConfig.text}`,
                      color: statusConfig.text,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 8px ${statusConfig.text}40`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                    }}
                    title={journey.status === "active" ? "Pause" : "Activate"}
                  >
                    {journey.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: statusConfig.bg,
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: statusConfig.text,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {statusConfig.icon}
                    {journey.status}
                  </div>
                </div>

                {/* Journey Name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: selectedJourneyId === journey.id ? "#0B99FC" : "#fff",
                      transition: "color 200ms ease",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {journey.name}
                  </div>
                  {selectedJourneyId === journey.id && (
                    <ChevronRight size={16} style={{ color: "#0B99FC", flexShrink: 0 }} />
                  )}
                </div>

                {/* Trigger Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: "#888",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{TRIGGER_ICONS[journey.trigger_type] || "⚙️"}</span>
                  <span>{getTriggerLabel(journey.trigger_type)}</span>
                </div>

                {/* Active Count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      background: "#24e05310",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#24e053",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {journey.activeEnrollments || 0}
                  </div>
                  <span style={{ color: "#666", fontSize: "11px", minWidth: "40px" }}>active</span>
                </div>

                {/* Completed Count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      background: "#f9a82510",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f9a825",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {journey.completedEnrollments || 0}
                  </div>
                  <span style={{ color: "#666", fontSize: "11px", minWidth: "50px" }}>completed</span>
                </div>

                {/* Emails Sent */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0B99FC",
                  }}
                >
                  <Mail size={14} style={{ marginRight: "4px" }} />
                  {journey.emailsSent || 0}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          background: "#0f0f0f",
          borderRadius: "6px",
          border: "1px solid #222",
          fontSize: "11px",
          color: "#666",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Zap size={12} style={{ color: "#24e053" }} />
            <span>Active = Enrolling &amp; sending</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Pause size={12} style={{ color: "#f9a825" }} />
            <span>Paused = No new enrollments</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Zap size={12} style={{ color: "#0B99FC" }} />
            <span>Draft = Not active yet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
