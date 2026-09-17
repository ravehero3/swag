import React, { useEffect, useState } from "react";

interface EmailPreviewTooltipProps {
  stepId: number | null;
  journeyId: number | null;
  position: { x: number; y: number } | null;
}

export const EmailPreviewTooltip: React.FC<EmailPreviewTooltipProps> = ({
  stepId,
  journeyId,
  position,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stepId || !journeyId || !position) {
      setContent(null);
      return;
    }

    setLoading(true);
    setContent(null);

    // Fetch email preview
    fetch(`/api/marketing/journeys/${journeyId}/steps/${stepId}/preview`)
      .then((res) => res.text())
      .then((html) => {
        setContent(html);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching email preview:", err);
        setLoading(false);
      });
  }, [stepId, journeyId, position]);

  if (!stepId || !journeyId || !position || !content) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: "380px",
        maxHeight: "600px",
        background: "#0a0a0a",
        border: "1px solid #333",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 9999,
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(11, 153, 252, 0.1)",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#0B99FC" }}>
          Náhled e-mailu
        </div>
        {loading && (
          <div
            style={{
              fontSize: "10px",
              color: "#666",
              animation: "spin 1s linear infinite",
            }}
          >
            ⟳
          </div>
        )}
      </div>

      {/* Email Content Preview */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "#0a0a0a",
        }}
      >
        <iframe
          srcDoc={content}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            minHeight: "500px",
          }}
          title="Email preview"
        />
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default EmailPreviewTooltip;
