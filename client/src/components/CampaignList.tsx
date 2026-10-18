import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  audience: "buyers" | "free_downloads";
  status: "draft" | "test" | "live";
  emailCount: number;
  createdAt: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  selectedCampaignId: number | null;
  loading: boolean;
  onSelectCampaign: (id: number) => void;
  onCreateCampaign: (name: string, audience: "buyers" | "free_downloads") => void;
  onDeleteCampaign: (id: number) => void;
}

export default function CampaignList({
  campaigns,
  selectedCampaignId,
  loading,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
}: CampaignListProps) {
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignAudience, setNewCampaignAudience] = useState<"buyers" | "free_downloads">("buyers");

  const handleCreate = async () => {
    if (!newCampaignName.trim()) return;
    onCreateCampaign(newCampaignName, newCampaignAudience);
    setNewCampaignName("");
    setShowNewCampaignModal(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          KAMPANĚ
        </h2>

        <button
          onClick={() => setShowNewCampaignModal(true)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px",
            background: "#0B99FC",
            border: "none",
            borderRadius: "6px",
            color: "#000",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#0099ff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(11,153,252,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#0B99FC";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <Plus size={14} />
          Nová kampaň
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: "20px", fontSize: "12px" }}>
          Načítání...
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{ color: "#666", fontSize: "12px", textAlign: "center", padding: "20px" }}>
          Žádné kampaně
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              style={{
                padding: "12px",
                background: selectedCampaignId === campaign.id ? "#0B99FC20" : "#0f0f0f",
                border: selectedCampaignId === campaign.id ? "1px solid #0B99FC" : "1px solid #333",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (selectedCampaignId !== campaign.id) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#666";
                  (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCampaignId !== campaign.id) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#333";
                  (e.currentTarget as HTMLDivElement).style.background = "#0f0f0f";
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onSelectCampaign(campaign.id)}>
                  <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                    {campaign.name}
                  </h3>
                </div>
                {campaign.status === "draft" && (
                  <button
                    onClick={() => onDeleteCampaign(campaign.id)}
                    title="Smazat kampaň"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      padding: 0,
                      background: "transparent",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#999",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#ff5252";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ff5252";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,82,82,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
                      (e.currentTarget as HTMLButtonElement).style.color = "#999";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", color: "#888" }}>
                  {campaign.audience === "buyers" ? "Kupující" : "Zdarma"}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    background:
                      campaign.status === "live"
                        ? "#3a3a3a"
                        : campaign.status === "test"
                        ? "#2a2a2a"
                        : "#1a1a1a",
                    color:
                      campaign.status === "live"
                        ? "#ccc"
                        : campaign.status === "test"
                        ? "#888"
                        : "#666",
                    borderRadius: "3px",
                  }}
                >
                  {campaign.status === "live" ? "LIVE" : campaign.status === "test" ? "TEST" : "DRAFT"}
                </span>
              </div>

              <div style={{ fontSize: "11px", color: "#666" }}>
                {campaign.emailCount} e-mailů
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New campaign modal */}
      {showNewCampaignModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowNewCampaignModal(false)}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              border: "1px solid #333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
              Nová kampaň
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: 600 }}>
                Název kampaně
              </label>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="např. Letní slevy..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#0f0f0f",
                  border: "1px solid #333",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "12px", fontWeight: 600 }}>
                Cílová skupina
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  onClick={() => setNewCampaignAudience("buyers")}
                  style={{
                    padding: "12px",
                    background: newCampaignAudience === "buyers" ? "#0B99FC" : "#0f0f0f",
                    border: newCampaignAudience === "buyers" ? "none" : "1px solid #333",
                    borderRadius: "6px",
                    color: newCampaignAudience === "buyers" ? "#000" : "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Kupující
                </button>
                <button
                  onClick={() => setNewCampaignAudience("free_downloads")}
                  style={{
                    padding: "12px",
                    background: newCampaignAudience === "free_downloads" ? "#0B99FC" : "#0f0f0f",
                    border: newCampaignAudience === "free_downloads" ? "none" : "1px solid #333",
                    borderRadius: "6px",
                    color: newCampaignAudience === "free_downloads" ? "#000" : "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Zdarma
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowNewCampaignModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#0f0f0f",
                  border: "1px solid #333",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Zrušit
              </button>
              <button
                onClick={handleCreate}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#0B99FC",
                  border: "none",
                  borderRadius: "6px",
                  color: "#000",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
