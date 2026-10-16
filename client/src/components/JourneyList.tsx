import React, { useState } from "react";
import { Play, Pause, ChevronRight, Zap, Users, Mail, TrendingUp, MoreVertical } from "lucide-react";

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
  emails?: any[];
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const TRIGGER_ICONS: Record<string, string> = {
    free_download: "🎁",
    purchase: "💳",
    abandoned_cart: "🛒",
    user_signup: "✉️",
    tag_added: "🏷️",
    custom: "⚙️",
  };

  const TRANSACTIONAL_TRIGGERS = {
    order_created: "Order Confirmation",
    digital_license_ready: "License Delivery",
    invoice_ready: "Invoice & Receipt",
  };

  const isTransactional = (journey: Journey): boolean => {
    return journey.trigger_value ? journey.trigger_value in TRANSACTIONAL_TRIGGERS : false;
  };

  const getTriggerLabel = (type: string, triggerValue?: string): string => {
    if (triggerValue && triggerValue in TRANSACTIONAL_TRIGGERS) {
      return TRANSACTIONAL_TRIGGERS[triggerValue as keyof typeof TRANSACTIONAL_TRIGGERS];
    }
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

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          📧 Všechny Journeys
        </h3>
        <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>
          {journeys.length} journey{journeys.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Minimalist List */}
      <div style={{ borderRadius: "6px", border: "1px solid #222", overflow: "hidden", background: "#0a0a0a" }}>
        {journeys.length === 0 ? (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "#666", fontSize: "12px" }}>
            No journeys yet
          </div>
        ) : (
          journeys.map((journey) => {
            const isSelected = selectedJourneyId === journey.id;
            const isHovered = hoveredId === journey.id;
            const isExpanded = expandedId === journey.id;

            return (
              <div
                key={journey.id}
                onMouseEnter={() => setHoveredId(journey.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectJourney(journey.id)}
                style={{
                  padding: "12px 16px",
                  background: isSelected ? "rgba(11, 153, 252, 0.08)" : isHovered ? "#0f0f0f" : "transparent",
                  border:
                    isSelected ? "1px solid #0B99FC" : isHovered ? "1px solid #333" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  borderBottom: journey.id !== journeys[journeys.length - 1].id ? "1px solid #111" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  position: "relative",
                }}
              >
                {/* Status Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(journey.id, journey.status === "active" ? "paused" : "active");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    background: journey.status === "active" ? "#24e05320" : "#f9a82520",
                    border: `1px solid ${journey.status === "active" ? "#24e053" : "#f9a825"}`,
                    color: journey.status === "active" ? "#24e053" : "#f9a825",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                  title={journey.status === "active" ? "Pause" : "Activate"}
                >
                  {journey.status === "active" ? <Pause size={12} /> : <Play size={12} />}
                </button>

                {/* Journey Name & Trigger */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? "#0B99FC" : "#fff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {journey.name}
                    </div>
                    {isTransactional(journey) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#1a2a1a",
                          border: "1px solid #3d6d3d",
                          borderRadius: "3px",
                          padding: "2px 8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "#5dd65d",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ⚡ Transační
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
                    {TRIGGER_ICONS[journey.trigger_type] || "⚙️"} {getTriggerLabel(journey.trigger_type)}
                  </div>
                </div>

                {/* Metrics Mini */}
                <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "#666", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <Users size={10} />
                    {journey.activeEnrollments || 0}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <TrendingUp size={10} />
                    {journey.completedEnrollments || 0}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <Mail size={10} />
                    {journey.emailsSent || 0}
                  </div>
                </div>

                {/* Hover Detail */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "100%",
                      background: "#111",
                      border: "1px solid #333",
                      borderRadius: "6px",
                      padding: "12px",
                      marginTop: "4px",
                      minWidth: "200px",
                      fontSize: "11px",
                      color: "#888",
                      zIndex: 1000,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ color: "#666", fontSize: "10px", marginBottom: "2px" }}>Status</div>
                      <div style={{ color: journey.status === "active" ? "#24e053" : "#f9a825", fontWeight: 600 }}>
                        {journey.status === "active" ? "● Active" : "⏸ Paused"}
                      </div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ color: "#666", fontSize: "10px", marginBottom: "2px" }}>Emails</div>
                      <div style={{ color: "#fff" }}>{journey.stepCount || 0} emails in sequence</div>
                    </div>
                    <div>
                      <div style={{ color: "#666", fontSize: "10px", marginBottom: "2px" }}>Active Enrollments</div>
                      <div style={{ color: "#24e053" }}>{journey.activeEnrollments || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
