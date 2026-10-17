import React, { useState } from "react";
import { VisualEmailBuilder } from "./VisualEmailBuilder.js";

interface CompactEmailEditorProps {
  template: any;
  onSave: (html: string) => void;
  onRefresh: () => void;
  saveEndpoint?: string; // Optional custom save endpoint for campaign emails
}

/**
 * Wrapper for VisualEmailBuilder optimized for embedding in JourneysTabLayout
 * Compresses spacing and ensures all sections fit within 60vh right panel
 */
export default function CompactEmailEditor({ template, onSave, onRefresh, saveEndpoint }: CompactEmailEditorProps) {
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
          // Compress internal spacing
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
            title={template?.name || "Editor e-mailu"}
            embedded={true}
            onSave={async (html, subject, preheader, blocks, headerOptions) => {
              try {
                const endpoint = saveEndpoint || `/api/marketing/templates/${template.id}`;
                await fetch(endpoint, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ 
                    htmlContent: html,
                    subject,
                    preheader,
                    blocks,
                    headerOptions
                  }),
                });
                onRefresh();
                onSave(html);
              } catch (err) {
                console.error("Error saving:", err);
              }
            }}
            onTestSend={async (email) => {
              console.log("Test send to:", email);
            }}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
