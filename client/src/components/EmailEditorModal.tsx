import React, { useState, useEffect } from "react";
import { VisualEmailBuilder } from "./VisualEmailBuilder";
import { ErrorLog } from "./ErrorLog";
import { parseEmailHTMLToBlocks } from "../lib/parseEmailHTML";
import { X } from "lucide-react";

interface ErrorLogEntry {
  timestamp: string;
  action: string;
  error: string;
  details?: string;
}

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
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);

  const addError = (action: string, error: string, details?: string) => {
    const now = new Date().toLocaleTimeString();
    setErrorLogs((prev) => [...prev, { timestamp: now, action, error, details }]);
    console.error(`[${action}] ${error}`, details);
  };

  // Fetch template data when modal opens
  useEffect(() => {
    if (!isOpen || !templateId) return;

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);
      setErrorLogs([]);
      try {
        const response = await fetch(`/api/marketing/templates/${templateId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("[EmailEditorModal] Template fetched:", data);
        setTemplate(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        addError("Load Template", errorMsg);
        setError("Chyba při načítání šablony");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [isOpen, templateId]);

  // Debug: Log parsed blocks after template loads
  useEffect(() => {
    if (template?.html_content) {
      const parsed = parseEmailHTMLToBlocks(template.html_content, template.subject);
      console.log("[EmailEditorModal] Blocks to pass to VisualEmailBuilder:", {
        templateId,
        templateName: template.name,
        hasHtml: !!template.html_content,
        existingBlocks: template.blocks?.length || 0,
        parsedBlocksCount: parsed.length,
        parsedBlocks: parsed.map(b => ({ id: b.id, type: b.type, content: b.headingText || b.paragraphText || b.infoTitle || "..." })),
      });
    }
  }, [template]);

  if (!isOpen || !templateId) return null;

  // Check if template has HTML content but no blocks (old templates)
  const hasBlocksButNoHtml = template?.blocks && Array.isArray(template.blocks) && template.blocks.length > 0 && !template.html_content;
  const hasHtmlButNoBlocks = template?.html_content && (!template?.blocks || (Array.isArray(template.blocks) && template.blocks.length === 0));
  const warningMessage = hasHtmlButNoBlocks && !dismissWarning ? "⚠️ Tato šablona byla vytvořena starou metodou (čistý HTML). Zde vidíte náhled emailu. Pro úpravu budete muset vytvořit nový design s bloky." : null;

  const handleSave = async (data: any) => {
    try {
      console.log("Saving template:", { templateId, data });
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

      console.log("Save response status:", response.status);
      const responseData = await response.json();
      console.log("Save response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      // Trigger parent callback
      if (onSave) {
        onSave();
      }

      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addError("Save Template", errorMsg, JSON.stringify(data).slice(0, 200));
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

        {/* Error Log */}
        {errorLogs.length > 0 && (
          <ErrorLog errors={errorLogs} onClear={() => setErrorLogs([])} />
        )}

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
            <VisualEmailBuilder
              initialSubject={template.subject}
              initialPreheader={template.preheader}
              initialBlocks={parseEmailHTMLToBlocks(template.html_content, template.subject)}
              initialHeaderConfig={template.headerOptions}
              title={template.name}
              onSave={handleSave}
              onClose={onClose}
              onTestSend={onTestSend}
            />
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
