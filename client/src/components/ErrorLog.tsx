import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy, X } from "lucide-react";

interface ErrorLogEntry {
  timestamp: string;
  action: string;
  error: string;
  details?: string;
}

interface ErrorLogProps {
  errors: ErrorLogEntry[];
  onClear: () => void;
}

export const ErrorLog: React.FC<ErrorLogProps> = ({ errors, onClear }) => {
  const [isOpen, setIsOpen] = useState(errors.length > 0);

  if (errors.length === 0) return null;

  const copyLogs = () => {
    const logText = errors
      .map(
        (e) =>
          `[${e.timestamp}] ${e.action}\nError: ${e.error}${
            e.details ? `\nDetails: ${e.details}` : ""
          }`
      )
      .join("\n\n");
    navigator.clipboard.writeText(logText);
    alert("Copied to clipboard!");
  };

  return (
    <div
      style={{
        background: "rgba(255, 82, 82, 0.1)",
        border: "1px solid rgba(255, 82, 82, 0.3)",
        borderRadius: "4px",
        margin: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px",
          cursor: "pointer",
          background: "rgba(255, 82, 82, 0.15)",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isOpen ? (
            <ChevronUp size={16} style={{ color: "#ff5252" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "#ff5252" }} />
          )}
          <span style={{ color: "#ff5252", fontWeight: 600, fontSize: "12px" }}>
            ❌ {errors.length} Error{errors.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyLogs();
            }}
            style={{
              background: "#ff5252",
              color: "#fff",
              border: "none",
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Copy size={12} /> Copy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={{
              background: "rgba(255, 82, 82, 0.2)",
              color: "#ff5252",
              border: "1px solid rgba(255, 82, 82, 0.3)",
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <X size={12} /> Clear
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            padding: "12px",
            maxHeight: "200px",
            overflow: "auto",
            background: "rgba(0, 0, 0, 0.3)",
          }}
        >
          {errors.map((err, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
                paddingBottom: "12px",
                borderBottom: idx < errors.length - 1 ? "1px solid rgba(255, 82, 82, 0.2)" : "none",
              }}
            >
              <div style={{ fontSize: "11px", color: "#ffb3b3", fontWeight: 600 }}>
                [{err.timestamp}] {err.action}
              </div>
              <div style={{ fontSize: "11px", color: "#ff9999", marginTop: "4px" }}>
                {err.error}
              </div>
              {err.details && (
                <div style={{ fontSize: "10px", color: "#ff8888", marginTop: "4px", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {err.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
