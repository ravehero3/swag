import React, { useState, useEffect } from "react";
import { Users, ShoppingCart, Gift } from "lucide-react";

interface CampaignAudienceSelectorProps {
  selected: "buyers" | "free_downloads";
  onSelect: (audience: "buyers" | "free_downloads") => void;
  buyerCount?: number;
  freeCount?: number;
  loading?: boolean;
}

export default function CampaignAudienceSelector({
  selected,
  onSelect,
  buyerCount = 250,
  freeCount = 5000,
  loading = false,
}: CampaignAudienceSelectorProps) {
  const [stats, setStats] = useState({ buyers: buyerCount, free: freeCount });

  useEffect(() => {
    // In a real app, you'd fetch these from the API
    setStats({ buyers: buyerCount, free: freeCount });
  }, [buyerCount, freeCount]);

  const AudienceCard = ({
    id,
    title,
    description,
    icon: Icon,
    count,
    isSelected,
  }: {
    id: "buyers" | "free_downloads";
    title: string;
    description: string;
    icon: React.ReactNode;
    count: number;
    isSelected: boolean;
  }) => (
    <button
      onClick={() => onSelect(id)}
      disabled={loading}
      style={{
        flex: 1,
        padding: "20px",
        background: isSelected ? "rgba(11, 153, 252, 0.1)" : "#0f0f0f",
        border: `2px solid ${isSelected ? "#0B99FC" : "#333"}`,
        borderRadius: "8px",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: loading && !isSelected ? 0.5 : 1,
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!loading && !isSelected) {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "#666";
          btn.style.background = "rgba(11, 153, 252, 0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "#333";
          btn.style.background = "#0f0f0f";
        }
      }}
    >
      {/* Background gradient on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            isSelected && !loading
              ? "linear-gradient(135deg, rgba(11,153,252,0.1) 0%, transparent 100%)"
              : "transparent",
          transition: "background 200ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: isSelected
                ? "rgba(11, 153, 252, 0.2)"
                : "rgba(11, 153, 252, 0.1)",
              color: isSelected ? "#0B99FC" : "#0B99FC",
              transition: "all 200ms ease",
            }}
          >
            {Icon}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>
              {title}
            </h3>
            {isSelected && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#0B99FC",
                  marginTop: "2px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                VYBRÁN
              </div>
            )}
          </div>
        </div>

        <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#888", lineHeight: "1.5" }}>
          {description}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "4px",
            paddingTop: "12px",
            borderTop: "1px solid #222",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
            {count.toLocaleString("cs-CZ")}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>osob</div>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#0B99FC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 700,
            fontSize: "12px",
          }}
        >
          ✓
        </div>
      )}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "20px",
        background: "#000",
        borderRadius: "8px",
        border: "1px solid #222",
      }}
    >
      <AudienceCard
        id="buyers"
        title="Kupující zákazníci"
        description="Lidé, kteří již od vás něco koupili. Ideální pro upsell a re-engagement."
        icon={<ShoppingCart size={20} />}
        count={stats.buyers}
        isSelected={selected === "buyers"}
      />

      <AudienceCard
        id="free_downloads"
        title="Zdarma stahovači"
        description="Lidé, kteří si stáhli vaši bezplatnou nabídku. Perfektní pro seznámení a konverzi."
        icon={<Gift size={20} />}
        count={stats.free}
        isSelected={selected === "free_downloads"}
      />
    </div>
  );
}
