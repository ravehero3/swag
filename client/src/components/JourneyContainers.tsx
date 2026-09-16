import React, { useState } from "react";
import { Grid3X3, List } from "lucide-react";

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
}

interface JourneyContainersProps {
  journeys: Journey[];
  selectedJourneyId: number | null;
  onSelectJourney: (id: number) => void;
  onStatusChange: (id: number, newStatus: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#24e053",
  paused: "#f9a825",
  draft: "#0B99FC",
};

export default function JourneyContainers({
  journeys,
  selectedJourneyId,
  onSelectJourney,
  onStatusChange,
}: JourneyContainersProps) {
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const gridCols = viewMode === "grid" ? 4 : 8;
  const containerHeight = viewMode === "grid" ? "140px" : "100px";
  const nameFontSize = viewMode === "grid" ? "13px" : "11px";
  const descriptionFontSize = viewMode === "grid" ? "11px" : "9px";

  const containerStyle = (journey: Journey) => ({
    position: "relative" as const,
    background: selectedJourneyId === journey.id ? "#1a1a1a" : "#0f0f0f",
    border: selectedJourneyId === journey.id ? "2px solid #0B99FC" : "1px solid #222",
    borderRadius: "8px",
    padding: viewMode === "grid" ? "12px" : "10px",
    cursor: "pointer",
    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    height: containerHeight,
    overflow: "hidden",
    boxShadow:
      selectedJourneyId === journey.id
        ? "0 8px 24px rgba(11,153,252,0.2)"
        : hoveredId === journey.id
          ? "0 4px 12px rgba(11,153,252,0.1)"
          : "none",
    transform:
      selectedJourneyId === journey.id
        ? "scale(1.02)"
        : hoveredId === journey.id
          ? "scale(1.01)"
          : "scale(1)",
  });

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* View Mode Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          padding: "0 0 12px 0",
          borderBottom: "1px solid #222",
        }}
      >
        <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>
          View:
        </span>
        <button
          onClick={() => setViewMode("grid")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: viewMode === "grid" ? "#0B99FC" : "transparent",
            border: viewMode === "grid" ? "none" : "1px solid #333",
            borderRadius: "4px",
            color: viewMode === "grid" ? "#000" : "#888",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (viewMode !== "grid") (e.currentTarget as HTMLButtonElement).style.borderColor = "#444";
          }}
          onMouseLeave={(e) => {
            if (viewMode !== "grid") (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
          }}
        >
          <Grid3X3 size={14} />
          Grid (4×2)
        </button>
        <button
          onClick={() => setViewMode("row")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: viewMode === "row" ? "#0B99FC" : "transparent",
            border: viewMode === "row" ? "none" : "1px solid #333",
            borderRadius: "4px",
            color: viewMode === "row" ? "#000" : "#888",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (viewMode !== "row") (e.currentTarget as HTMLButtonElement).style.borderColor = "#444";
          }}
          onMouseLeave={(e) => {
            if (viewMode !== "row") (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
          }}
        >
          <List size={14} />
          Row (1×8)
        </button>
      </div>

      {/* Journey Containers Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: viewMode === "grid" ? "12px" : "8px",
          minHeight: viewMode === "grid" ? "320px" : "100px",
        }}
      >
        {journeys.map((journey) => {
          const showDetails = hoveredId === journey.id || selectedJourneyId === journey.id;
          return (
          <div
            key={journey.id}
            onMouseEnter={() => setHoveredId(journey.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectJourney(journey.id)}
            style={containerStyle(journey)}
          >
            {/* Background gradient overlay on hover */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  hoveredId === journey.id
                    ? "linear-gradient(135deg, rgba(11,153,252,0.05) 0%, transparent 100%)"
                    : "transparent",
                transition: "background 200ms ease",
                pointerEvents: "none",
                borderRadius: "8px",
              }}
            />

            {/* Content Container */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header: Name + Status Badge */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: viewMode === "grid" ? "8px" : "6px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: nameFontSize,
                      fontWeight: 600,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {journey.name}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: STATUS_COLORS[journey.status] || "#555",
                    background: `${STATUS_COLORS[journey.status] || "#555"}15`,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {journey.status}
                </span>
              </div>

              {/* Collapsed View: Trigger (always visible) */}
              <div
                style={{
                  fontSize: descriptionFontSize,
                  color: "#888",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: hoveredId === journey.id ? 0 : 1,
                  transition: "opacity 200ms ease",
                  height: "14px",
                  lineHeight: "14px",
                }}
              >
                {journey.trigger_type}
              </div>

              {/* Hover Details: Metrics */}
              <div
                style={{
                  opacity: hoveredId === journey.id ? 1 : 0,
                  transition: "opacity 200ms ease",
                  position: "absolute",
                  inset: 0,
                  padding: viewMode === "grid" ? "12px" : "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                {/* Metrics Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(36, 224, 83, 0.1)",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: viewMode === "grid" ? "14px" : "11px",
                        fontWeight: 700,
                        color: "#24e053",
                      }}
                    >
                      {journey.activeEnrollments || 0}
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        color: "#24e053",
                        marginTop: "1px",
                      }}
                    >
                      Active
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(249, 168, 37, 0.1)",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: viewMode === "grid" ? "14px" : "11px",
                        fontWeight: 700,
                        color: "#f9a825",
                      }}
                    >
                      {journey.completedEnrollments || 0}
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        color: "#f9a825",
                        marginTop: "1px",
                      }}
                    >
                      Done
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(11, 153, 252, 0.1)",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: viewMode === "grid" ? "14px" : "11px",
                        fontWeight: 700,
                        color: "#0B99FC",
                      }}
                    >
                      {journey.emailsSent || 0}
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        color: "#0B99FC",
                        marginTop: "1px",
                      }}
                    >
                      Email
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(journey.id, journey.status === "active" ? "paused" : "active");
                  }}
                  style={{
                    padding: viewMode === "grid" ? "6px 10px" : "4px 8px",
                    background: journey.status === "active" ? "transparent" : "transparent",
                    border: `1px solid ${journey.status === "active" ? "#f9a825" : "#24e053"}`,
                    color: journey.status === "active" ? "#f9a825" : "#24e053",
                    borderRadius: "4px",
                    fontSize: viewMode === "grid" ? "11px" : "9px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    pointerEvents: "auto",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      journey.status === "active" ? "#f9a82510" : "#24e05310";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {journey.status === "active" ? "Pause" : "Activate"}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
