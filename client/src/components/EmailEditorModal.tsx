import React, { useState, useEffect } from "react";
import { VisualEmailBuilder } from "./VisualEmailBuilder";
import { X } from "lucide-react";

interface EmailEditorModalProps {
  isOpen: boolean;
  templateId: string | null;
  onClose: () => void;
  onSave?: () => void;
  onTestSend?: (email: string, subject: string, preheader: string, blocks: any[], headerOptions?: any) => Promise<void>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  html_content: string;
  blocks?: any[];
  headerOptions?: any;
}

export const EmailEditorModal: React.FC<EmailEditorModalProps> = ({
  isOpen,
  templateId,
  onClose,
  onSave,
  onTestSend,
}) => {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissWarning, setDismissWarning] = useState(false);

  // Fetch template data when modal opens
  useEffect(() => {
    if (!isOpen || !templateId) return;

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/marketing/templates/${templateId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load template");
        }

        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        console.error("Error loading template:", err);
        setError("Chyba při načítání šablony");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [isOpen, templateId]);

  if (!isOpen || !templateId) return null;

  // Check if template has HTML content but no blocks (old templates)
  const hasBlocksButNoHtml = template?.blocks && Array.isArray(template.blocks) && template.blocks.length > 0 && !template.html_content;
  const hasHtmlButNoBlocks = template?.html_content && (!template?.blocks || (Array.isArray(template.blocks) && template.blocks.length === 0));
  const warningMessage = hasHtmlButNoBlocks && !dismissWarning ? "⚠️ Tato šablona byla vytvořena starou metodou (čistý HTML). Zde vidíte náhled emailu. Pro úpravu budete muset vytvořit nový design s bloky." : null;

  const handleSave = async (data: any) => {
    try {
      const response = await fetch(`/api/marketing/templates/${templateId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: data.subject,
          preheader: data.preheader,
          blocks: data.blocks,
          headerOptions: data.headerOptions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      // Trigger parent callback
      if (onSave) {
        onSave();
      }

      onClose();
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Chyba při ukládání šablony");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.95)",
          zIndex: 99998,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0a0a0a",
            borderBottom: "1px solid #222",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: 0 }}>
              Upravit e-mailovou šablonu
            </h2>
            <p style={{ fontSize: "12px", color: "#888", margin: "4px 0 0 0" }}>
              {template?.name || "Načítání..."}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#888",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
              (e.currentTarget as HTMLElement).style.color = "#888";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Editor Container */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            background: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {warningMessage && (
            <div
              style={{
                background: "rgba(255, 165, 0, 0.1)",
                border: "1px solid rgba(255, 165, 0, 0.3)",
                color: "#ffb347",
                padding: "16px",
                fontSize: "12px",
                marginBottom: "8px",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "8px",
              }}
            >
              <span>{warningMessage}</span>
              <button
                onClick={() => setDismissWarning(true)}
                style={{
                  background: "#ffb347",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Rozumím
              </button>
            </div>
          )}
          {hasHtmlButNoBlocks && template && (
            <div
              style={{
                flex: 1,
                overflow: "auto",
                background: "#1a1a1a",
              }}
            >
              <iframe
                key={`iframe-${templateId}`}
                srcDoc={template.html_content || "<p>Chyba: Obsah emailu nebyl nalezen</p>"}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
                title="Email preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
          {!hasHtmlButNoBlocks && loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#888",
              }}
            >
              Načítání editoru...
            </div>
          )}

          {!hasHtmlButNoBlocks && error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#ff6b6b",
              }}
            >
              {error}
            </div>
          )}

          {!hasHtmlButNoBlocks && template && !loading && !error && (
            <VisualEmailBuilder
              initialSubject={template.subject}
              initialPreheader={template.preheader}
              initialBlocks={template.blocks}
              initialHeaderConfig={template.headerOptions}
              title={template.name}
              onSave={handleSave}
              onClose={onClose}
              onTestSend={onTestSend}
            />
          )}
        </div>
      </div>
    </>
  );
};
