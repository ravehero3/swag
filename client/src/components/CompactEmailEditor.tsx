import React from "react";
import { VisualEmailBuilder } from "./VisualEmailBuilder.js";

interface CompactEmailEditorProps {
  template: any;
  onSave?: (data: any) => Promise<void> | void;
  onRefresh: () => void;
  saveEndpoint?: string; // Optional custom save endpoint for campaign emails
  testSendEndpoint?: string;
  onTestSend?: (email: string, subject: string, preheader: string, blocks: any[], headerOptions?: any) => Promise<void>;
}

/**
 * Wrapper for VisualEmailBuilder optimized for embedding in JourneysTabLayout and CampaignsTabLayout
 * Compresses spacing and ensures all sections fit within right panel
 */
export default function CompactEmailEditor({
  template,
  onSave,
  onRefresh,
  saveEndpoint,
  testSendEndpoint,
  onTestSend,
}: CompactEmailEditorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Compact wrapper that constrains VisualEmailBuilder */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          fontSize: "12px",
        }}
      >
        <style>{`
          .compact-editor-wrapper .email-builder-section {
            padding: 8px 12px !important;
            margin: 0 !important;
            gap: 4px !important;
          }
          .compact-editor-wrapper .email-builder-header {
            padding: 8px 12px !important;
            gap: 4px !important;
            min-height: 36px !important;
          }
          .compact-editor-wrapper .email-builder-inputs {
            padding: 4px 12px !important;
            gap: 2px !important;
          }
          .compact-editor-wrapper input,
          .compact-editor-wrapper textarea {
            padding: 6px 8px !important;
            font-size: 12px !important;
            height: 28px !important;
          }
          .compact-editor-wrapper .email-blocks-container {
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            padding: 8px 12px !important;
          }
          .compact-editor-wrapper button {
            padding: 4px 12px !important;
            font-size: 12px !important;
            height: 28px !important;
          }
        `}</style>

        <div className="compact-editor-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <VisualEmailBuilder
            initialSubject={template?.subject || ""}
            initialPreheader={template?.preheader || ""}
            initialBlocks={
              template?.blocks ? (typeof template.blocks === "string" ? JSON.parse(template.blocks) : template.blocks) : []
            }
            initialHeaderConfig={template?.headerOptions || template?.header_options}
            title={template?.name || template?.subject || "Editor e-mailu"}
            embedded={true}
            onSave={async (data: { subject: string; preheader: string; blocks: any[]; headerOptions?: any; name?: string }) => {
              try {
                if (onSave) {
                  await onSave(data);
                  alert("✅ Změny v e-mailu byly úspěšně uloženy!");
                  onRefresh();
                  return;
                }
                const endpoint = saveEndpoint || (template?.id ? `/api/marketing/templates/${template.id}` : null);
                if (!endpoint) {
                  throw new Error("Cílový koncový bod pro uložení nebyl nalezen.");
                }
                const res = await fetch(endpoint, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ 
                    subject: data.subject,
                    preheader: data.preheader,
                    blocks: data.blocks,
                    headerOptions: data.headerOptions,
                    name: data.name,
                  }),
                });
                const resData = await res.json();
                if (!res.ok) throw new Error(resData?.error || "Chyba při ukládání");
                alert("✅ Změny v e-mailu byly úspěšně uloženy!");
                onRefresh();
              } catch (err: any) {
                console.error("Error saving:", err);
                alert("❌ Chyba při ukládání: " + (err?.message || String(err)));
                throw err;
              }
            }}
            onTestSend={async (email, subject, preheader, blocks, headerConfig) => {
              try {
                if (onTestSend) {
                  await onTestSend(email, subject, preheader, blocks, headerConfig);
                  return;
                }
                const endpoint = testSendEndpoint || (template?.id && template.id > 0 ? `/api/marketing/templates/${template.id}/send-test` : "/api/marketing/test-email");
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    email,
                    to: email,
                    subject,
                    preheader,
                    blocks,
                    headerOptions: headerConfig,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Odeslání testovacího e-mailu selhalo");
              } catch (err: any) {
                console.error("Test send error:", err);
                throw err;
              }
            }}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
