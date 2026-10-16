import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";

interface CampaignEmailPreviewProps {
  email: any;
  templateId: number | null;
  onClose: () => void;
  isLoading?: boolean;
}

export default function CampaignEmailPreview({
  email,
  templateId,
  onClose,
  isLoading = false,
}: CampaignEmailPreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;

    const loadPreview = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/marketing/templates/${templateId}/preview`);
        if (!res.ok) throw new Error("Nepodařilo se načíst náhled");
        const html = await res.text();
        setPreviewHtml(html);
      } catch (err) {
        setError("Chyba při načítání náhledu");
        console.error(err);
      }
    };

    loadPreview();
  }, [templateId]);

  const handleCopyHtml = async () => {
    if (previewHtml) {
      await navigator.clipboard.writeText(previewHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        background: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        borderTop: "1px solid #222",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #222",
          flexShrink: 0,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#fff" }}>
            E-mail #{email?.position}
            {email?.templateName && ` · ${email.templateName}`}
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#888" }}>
            {email?.delayHours > 0 ? `Poslán po ${email.delayHours} hodinách` : "Poslán ihned"}
            {email?.sendDate && ` | ${email.sendDate} ${email.sendTime || ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {previewHtml && (
            <button
              onClick={handleCopyHtml}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: copied ? "#24e053" : "#111",
                border: copied ? "1px solid #24e053" : "1px solid #333",
                borderRadius: "4px",
                color: copied ? "#000" : "#999",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#666";
                  (e.currentTarget as HTMLButtonElement).style.background = "#222";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
                  (e.currentTarget as HTMLButtonElement).style.background = "#111";
                }
              }}
              title="Kopírovat HTML"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Zkopírováno" : "Kopírovat"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              background: "#111",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "#999",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#666";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
              (e.currentTarget as HTMLButtonElement).style.color = "#999";
            }}
            title="Zavřít náhled"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#888",
              fontSize: "14px",
            }}
          >
            Načítání náhledu...
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#ff5252",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        ) : previewHtml ? (
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              background: "#fff",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              srcDoc={previewHtml}
              style={{
                width: "100%",
                border: "none",
                background: "#fff",
                minHeight: "600px",
              }}
              title="E-mail preview"
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#888",
              fontSize: "14px",
            }}
          >
            Žádný obsah k zobrazení
          </div>
        )}
      </div>
    </div>
  );
}
