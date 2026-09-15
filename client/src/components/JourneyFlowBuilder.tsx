import React, { useState, useRef, useEffect } from "react";
import { Plus, Edit3, Trash2, Send } from "lucide-react";

interface Step {
  id: number;
  step_type: string;
  delay_hours: number;
  template_id: number | null;
  configuration: Record<string, any>;
}

interface Journey {
  id: number;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  description: string | null;
}

interface JourneyFlowBuilderProps {
  journey: Journey;
  steps: Step[];
  templates: any[];
  onEditStep: (step: Step) => void;
  onDeleteStep: (stepId: number) => void;
  onAddStep: () => void;
  onTestEmail: (stepId: number) => void;
  testSendingStepId: number | null;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  stepStats?: Record<number, { sends: number; open_rate: number; click_rate: number }>;
}

const STEP_TYPE_LABELS: Record<string, string> = {
  email: "E-mail",
  wait: "Čekat",
  condition: "Podmínka",
  tag_add: "Přidat tag",
  tag_remove: "Odebrat tag",
  end: "Konec",
};

const NODE_Y_SPACING = 140;
const NODE_WIDTH = 340;
const NODE_HEIGHT = 100;
const CANVAS_PADDING = 60;

export default function JourneyFlowBuilder({
  journey,
  steps,
  templates,
  onEditStep,
  onDeleteStep,
  onAddStep,
  onTestEmail,
  testSendingStepId,
  testEmail,
  onTestEmailChange,
  stepStats = {},
}: JourneyFlowBuilderProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate canvas dimensions
  const totalSteps = (steps?.length || 0) + 2; // +2 for trigger and exit
  const canvasHeight = totalSteps * NODE_Y_SPACING + CANVAS_PADDING * 2;
  const canvasWidth = 1000;

  // Get node position
  const getNodePosition = (index: number) => ({
    x: (canvasWidth - NODE_WIDTH) / 2,
    y: CANVAS_PADDING + index * NODE_Y_SPACING,
  });

  // Handle pan/zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(3, zoom - (e.deltaY > 0 ? 0.1 : 0.1)));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 2 && !(e.ctrlKey || e.metaKey)) return; // Only pan on right-click or Ctrl+drag
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{
        width: "100%",
        height: "600px",
        background: "#080808",
        position: "relative",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Grid Background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        pointerEvents="none"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Zoom Controls */}
      <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 100, display: "flex", gap: "8px" }}>
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.2))}
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#fff",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          +
        </button>
        <div style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", padding: "0 8px" }}>
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#fff",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          −
        </button>
      </div>

      {/* Canvas Content */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* SVG Connections */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          {/* Trigger to First Step */}
          {(steps?.length || 0) > 0 && (
            <line
              x1={canvasWidth / 2}
              y1={getNodePosition(0).y + NODE_HEIGHT}
              x2={canvasWidth / 2}
              y2={getNodePosition(1).y}
              stroke="#444"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          )}

          {/* Step to Step */}
          {steps?.map((_, idx) => {
            if (idx < steps.length - 1) {
              return (
                <line
                  key={`connection-${idx}`}
                  x1={canvasWidth / 2}
                  y1={getNodePosition(idx + 1).y + NODE_HEIGHT}
                  x2={canvasWidth / 2}
                  y2={getNodePosition(idx + 2).y}
                  stroke="#444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              );
            }
            return null;
          })}

          {/* Last Step to Exit */}
          {(steps?.length || 0) > 0 && (
            <line
              x1={canvasWidth / 2}
              y1={getNodePosition(steps.length).y + NODE_HEIGHT}
              x2={canvasWidth / 2}
              y2={getNodePosition(steps.length + 1).y}
              stroke="#444"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          )}
        </svg>

        {/* Nodes */}
        {/* Trigger Node */}
        <div
          style={{
            position: "absolute",
            left: getNodePosition(0).x,
            top: getNodePosition(0).y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            background: "#0f0f0f",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
            TRIGGER
          </div>
          <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{journey.trigger_type}</div>
          {journey.trigger_value && <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>{journey.trigger_value}</div>}
        </div>

        {/* Step Nodes */}
        {steps?.map((step, idx) => {
          const tpl = templates.find((t) => t.id === step.template_id);
          const borderColor = "#444";

          return (
            <div
              key={step.id}
              style={{
                position: "absolute",
                left: getNodePosition(idx + 1).x,
                top: getNodePosition(idx + 1).y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                background: "#0f0f0f",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {STEP_TYPE_LABELS[step.step_type]?.toUpperCase()}
                </div>
                <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>
                  {step.step_type === "email" ? (tpl ? tpl.name : "No template") : STEP_TYPE_LABELS[step.step_type]}
                </div>
                {step.delay_hours > 0 && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Wait {step.delay_hours}h</div>}
                
                {/* Step Stats */}
                {stepStats[step.id] && stepStats[step.id].sends > 0 && (
                  <div style={{ fontSize: "10px", color: "#666", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #222", display: "flex", gap: "8px" }}>
                    <span>{stepStats[step.id].sends} sent</span>
                    {stepStats[step.id].open_rate > 0 && <span>{stepStats[step.id].open_rate}% open</span>}
                    {stepStats[step.id].click_rate > 0 && <span>{stepStats[step.id].click_rate}% click</span>}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => onEditStep(step)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    padding: "4px",
                    fontSize: "12px",
                  }}
                  title="Edit step"
                >
                  <Edit3 size={14} />
                </button>
                {step.step_type === "email" && step.template_id && (
                  <button
                    onClick={() => onTestEmail(step.id)}
                    disabled={testSendingStepId === step.id}
                    style={{
                      background: "none",
                      border: "none",
                      color: testSendingStepId === step.id ? "#444" : "#0B99FC",
                      cursor: testSendingStepId === step.id ? "default" : "pointer",
                      padding: "4px",
                      fontSize: "12px",
                      opacity: testSendingStepId === step.id ? 0.5 : 1,
                    }}
                    title="Send test email"
                  >
                    {testSendingStepId === step.id ? "..." : <Send size={14} />}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Smazat tento krok?")) onDeleteStep(step.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff5252",
                    cursor: "pointer",
                    padding: "4px",
                    fontSize: "12px",
                  }}
                  title="Delete step"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Exit Node */}
        <div
          style={{
            position: "absolute",
            left: getNodePosition(steps?.length || 0 + 1).x,
            top: getNodePosition(steps?.length || 0 + 1).y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            background: "#0f0f0f",
            border: "2px solid #444",
            borderRadius: "8px",
            padding: "12px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "2px solid #666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#666" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Contact Exits</div>
        </div>

        {/* Add Step Button (floating) */}
        <button
          onClick={onAddStep}
          style={{
            position: "absolute",
            left: getNodePosition(steps?.length || 0).x + NODE_WIDTH + 40,
            top: getNodePosition(steps?.length || 0).y + NODE_HEIGHT / 2 - 16,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#0B99FC",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(11,153,252,0.3)",
          }}
          title="Add step"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Test Email Bar */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          background: "#000000",
          borderBottom: "1px solid #222",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "#888",
          zIndex: 50,
        }}
      >
        <label style={{ whiteSpace: "nowrap" }}>Testovací e-mail:</label>
        <input
          value={testEmail}
          onChange={(e) => onTestEmailChange(e.target.value)}
          placeholder="test@example.cz"
          style={{
            flex: 1,
            maxWidth: "280px",
            padding: "6px 10px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "12px",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
