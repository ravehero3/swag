import React, { useState, useRef, useEffect } from "react";
import { Plus, Edit3, Trash2, Send, Clock, Pencil, Check, X } from "lucide-react";

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
  onTestEmail: (stepId: number) => Promise<void> | void;
  testSendingStepId: number | null;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  stepStats?: Record<number, { sends: number; open_rate: number; click_rate: number }>;
  selectedStepId?: number | null;
  onSelectStep?: (stepId: number) => void;
  onOpenVisualEditor?: (step: Step) => void;
  onRefresh?: () => void;
}

const STEP_TYPE_LABELS: Record<string, string> = {
  email: "E-mail",
  wait: "Čekat",
  condition: "Podmínka",
  tag_add: "Přidat tag",
  tag_remove: "Odebrat tag",
  end: "Konec",
};

const NODE_X_SPACING = 380;  // Horizontal spacing (was vertical before)
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
  selectedStepId,
  onSelectStep,
  onOpenVisualEditor,
  onRefresh,
}: JourneyFlowBuilderProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [hoveredStepId, setHoveredStepId] = useState<number | null>(null);

  // Inline rename state
  const [renamingStepId, setRenamingStepId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const totalSteps = (steps?.length || 0) + 2;
  const canvasWidth = CANVAS_PADDING * 2 + totalSteps * NODE_X_SPACING;  // Much wider now
  const canvasHeight = 400;  // Fixed height, much shorter

  const getNodePosition = (index: number) => ({
    x: CANVAS_PADDING + index * NODE_X_SPACING,  // Horizontal layout
    y: (canvasHeight - NODE_HEIGHT) / 2,  // Centered vertically
  });

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(3, zoom - (e.deltaY > 0 ? 0.1 : 0.1)));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.button === 2) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
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

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingStepId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingStepId]);

  const startRename = (e: React.MouseEvent, step: Step) => {
    e.stopPropagation();
    const tpl = templates.find((t) => t.id === step.template_id);
    const currentName = tpl?.name || "";
    setRenameValue(currentName);
    setRenamingStepId(step.id);
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingStepId(null);
    setRenameValue("");
  };

  const saveRename = async (e: React.MouseEvent | null, step: Step) => {
    e?.stopPropagation();
    const cleanName = renameValue.trim();
    if (!cleanName) {
      cancelRename();
      return;
    }
    const tpl = templates.find((t) => t.id === step.template_id);
    setIsSavingRename(true);
    try {
      if (tpl?.id) {
        await fetch(`/api/marketing/templates/${tpl.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: cleanName }),
        });
        // Update local template name optimistically
        tpl.name = cleanName;
      } else {
        // Create new template with this name and link it to this step
        const createRes = await fetch("/api/marketing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: cleanName,
            subject: cleanName,
            preheader: "",
            blocks: [],
            headerOptions: { logoStyle: "metallic", logoSize: "medium", showBrandText: false },
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          await fetch(`/api/marketing/journeys/${journey.id}/steps/${step.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              stepType: step.step_type,
              delayHours: step.delay_hours,
              templateId: created.id,
              configuration: step.configuration,
            }),
          });
          step.template_id = created.id;
          templates.push(created);
        }
      }
      onRefresh?.();
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsSavingRename(false);
      setRenamingStepId(null);
      setRenameValue("");
    }
  };

  const handleQuickTestEmail = async () => {
    if (!selectedStepId) {
      setTestMessage("⚠️ Vyberte e-mailový krok v sekvenci");
      setTimeout(() => setTestMessage(null), 4000);
      return;
    }

    const step = steps.find((s) => s.id === selectedStepId);
    if (!step || step.step_type !== "email") {
      setTestMessage("⚠️ Vybraný krok není e-mail");
      setTimeout(() => setTestMessage(null), 4000);
      return;
    }

    if (!testEmail || !testEmail.includes("@")) {
      setTestMessage("⚠️ Zadejte platnou e-mailovou adresu");
      setTimeout(() => setTestMessage(null), 4000);
      return;
    }

    setIsSendingTest(true);
    setTestMessage(null);
    try {
      if (onTestEmail) {
        await onTestEmail(selectedStepId);
        setTestMessage("✅ Testovací e-mail odeslán!");
        setTimeout(() => setTestMessage(null), 5000);
      }
    } catch (err: any) {
      setTestMessage(`❌ Chyba: ${err?.message || "Odeslání selhalo"}`);
      setTimeout(() => setTestMessage(null), 6000);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        background: "#080808",
        position: "relative",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} pointerEvents="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 100, display: "flex", gap: "8px" }}>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>+</button>
        <div style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", padding: "0 8px" }}>{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>−</button>
      </div>

      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", width: canvasWidth, height: canvasHeight }}>
      <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {/* Horizontal connections */}
          {(steps?.length || 0) > 0 && <line x1={getNodePosition(0).x + NODE_WIDTH} y1={getNodePosition(0).y + NODE_HEIGHT / 2} x2={getNodePosition(1).x} y2={getNodePosition(1).y + NODE_HEIGHT / 2} stroke="#444" strokeWidth="2" strokeDasharray="4,4" />}
          {steps?.map((_, idx) => idx < steps.length - 1 ? <line key={`connection-${idx}`} x1={getNodePosition(idx + 1).x + NODE_WIDTH} y1={getNodePosition(idx + 1).y + NODE_HEIGHT / 2} x2={getNodePosition(idx + 2).x} y2={getNodePosition(idx + 2).y + NODE_HEIGHT / 2} stroke="#444" strokeWidth="2" strokeDasharray="4,4" /> : null)}
          {(steps?.length || 0) > 0 && <line x1={getNodePosition(steps.length).x + NODE_WIDTH} y1={getNodePosition(steps.length).y + NODE_HEIGHT / 2} x2={getNodePosition(steps.length + 1).x} y2={getNodePosition(steps.length + 1).y + NODE_HEIGHT / 2} stroke="#444" strokeWidth="2" strokeDasharray="4,4" />}
        </svg>

        {/* Trigger node */}
        <div style={{ position: "absolute", left: getNodePosition(0).x, top: getNodePosition(0).y, width: NODE_WIDTH, height: NODE_HEIGHT, background: "#0f0f0f", border: "2px solid #444", borderRadius: "8px", padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>TRIGGER</div>
          <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>{journey.trigger_type}</div>
          {journey.trigger_value && <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>{journey.trigger_value}</div>}
        </div>

        {steps?.map((step, idx) => {
          const tpl = templates.find((t) => t.id === step.template_id);
          const isSelected = selectedStepId === step.id;
          const isHovered = hoveredStepId === step.id;
          const isRenaming = renamingStepId === step.id;
          const hasNoTemplate = step.step_type === "email" && !step.template_id;
          const displayName = tpl ? tpl.name : (hasNoTemplate ? "Bez šablony" : (STEP_TYPE_LABELS[step.step_type] || step.step_type));

          return (
            <div
              key={step.id}
              onClick={() => { if (!isRenaming) onSelectStep?.(step.id); }}
              onMouseEnter={() => setHoveredStepId(step.id)}
              onMouseLeave={() => setHoveredStepId(null)}
              style={{
                position: "absolute",
                left: getNodePosition(idx + 1).x,
                top: getNodePosition(idx + 1).y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                background: isSelected ? "rgba(255, 255, 255, 0.08)" : "#0f0f0f",
                border: `2px solid ${isSelected ? "#fff" : isHovered ? "#555" : "#333"}`,
                borderRadius: "8px",
                padding: "12px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: isSelected ? "0 8px 24px rgba(255, 255, 255, 0.1)" : "none",
                transform: isSelected ? "scale(1.04)" : "scale(1)",
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: isRenaming ? "default" : "pointer",
              }}
            >
              {/* Top: label + name + pencil rename */}
              <div>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {STEP_TYPE_LABELS[step.step_type]?.toUpperCase()}
                </div>

                {/* Name row with inline rename */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minHeight: "22px" }}>
                  {isRenaming ? (
                    <>
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") saveRename(null, step);
                          if (e.key === "Escape") cancelRename();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          background: "#1a1a1a",
                          border: "1px solid #0B99FC",
                          borderRadius: "4px",
                          color: "#fff",
                          fontSize: "12px",
                          padding: "3px 7px",
                          outline: "none",
                        }}
                        placeholder="Název šablony…"
                      />
                      <button
                        onClick={(e) => saveRename(e, step)}
                        disabled={isSavingRename}
                        style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        title="Uložit název"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelRename}
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        title="Zrušit"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: hasNoTemplate ? "#f59e0b" : "#fff",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {displayName}
                      </div>
                      {/* Pencil icon — on hover/select for all email steps */}
                      {step.step_type === "email" && (isHovered || isSelected) && (
                        <button
                          onClick={(e) => startRename(e, step)}
                          title={tpl ? "Přejmenovat e-mail" : "Pojmenovat e-mail"}
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            borderRadius: "4px",
                            color: "#bbb",
                            cursor: "pointer",
                            padding: "3px 6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            flexShrink: 0,
                            transition: "all 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(11, 153, 252, 0.2)";
                            (e.currentTarget as HTMLElement).style.color = "#0B99FC";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.08)";
                            (e.currentTarget as HTMLElement).style.color = "#bbb";
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {step.delay_hours > 0 && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {step.delay_hours}h</div>}
                {stepStats[step.id] && stepStats[step.id].sends > 0 && (
                  <div style={{ fontSize: "10px", color: "#666", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #222", display: "flex", gap: "8px" }}>
                    <span>{stepStats[step.id].sends} sent</span>
                    {stepStats[step.id].open_rate > 0 && <span>{stepStats[step.id].open_rate}% open</span>}
                    {stepStats[step.id].click_rate > 0 && <span>{stepStats[step.id].click_rate}% click</span>}
                  </div>
                )}
              </div>

              {/* Bottom action buttons row */}
              <div style={{
                display: "flex",
                gap: "6px",
                opacity: isHovered || isSelected || hasNoTemplate ? 1 : 0,
                pointerEvents: isHovered || isSelected || hasNoTemplate ? "auto" : "none",
                transition: "opacity 150ms ease-in-out",
              }}>
                {/* Edit step settings */}
                <button
                  onClick={(e) => { e.stopPropagation(); onEditStep(step); }}
                  style={{ background: "none", border: "none", color: "#999", cursor: "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", transition: "all 150ms ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#999"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  title="Upravit nastavení kroku"
                >
                  <Edit3 size={14} />
                </button>

                {/* Upravit email - for steps with a template */}
                {step.step_type === "email" && step.template_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectStep?.(step.id); }}
                    style={{ background: "none", border: "none", color: "#0B99FC", cursor: "pointer", padding: "6px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "4px", transition: "all 150ms ease", display: "flex", alignItems: "center", gap: "4px" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(11,153,252,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    title="Upravit e-mail ve vizuálním editoru"
                  >
                    <Pencil size={12} /> Upravit
                  </button>
                )}

                {/* Vytvorit email - for steps with NO template */}
                {hasNoTemplate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectStep?.(step.id); }}
                    style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", cursor: "pointer", padding: "4px 10px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", transition: "all 150ms ease", display: "flex", alignItems: "center", gap: "4px" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.22)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.12)"; }}
                    title="Vytvořit e-mail od nuly"
                  >
                    <Pencil size={12} /> Upravit
                  </button>
                )}

                {/* Send test — only if has template */}
                {step.step_type === "email" && step.template_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onTestEmail(step.id); }}
                    disabled={testSendingStepId === step.id}
                    style={{ background: "none", border: "none", color: testSendingStepId === step.id ? "#555" : "#0B99FC", cursor: testSendingStepId === step.id ? "default" : "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", opacity: testSendingStepId === step.id ? 0.5 : 1, transition: "all 150ms ease" }}
                    onMouseEnter={(e) => { if (testSendingStepId !== step.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(11,153,252,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    title="Odeslat testovací e-mail"
                  >
                    {testSendingStepId === step.id ? "..." : <Send size={14} />}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm("Smazat tento krok?")) onDeleteStep(step.id); }}
                  style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", transition: "all 150ms ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,82,82,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                  title="Smazat krok"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {/* End node */}
        <div style={{ position: "absolute", left: getNodePosition(steps?.length || 0 + 1).x, top: getNodePosition(steps?.length || 0 + 1).y, width: NODE_WIDTH, height: NODE_HEIGHT, background: "#0f0f0f", border: "2px solid #444", borderRadius: "8px", padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #666", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#666" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Kontakt Odchází</div>
        </div>

        {/* Add step button */}
        <button onClick={onAddStep} style={{ position: "absolute", left: getNodePosition(steps?.length || 0).x + NODE_WIDTH + 40, top: getNodePosition(steps?.length || 0).y + NODE_HEIGHT / 2 - 16, width: "32px", height: "32px", borderRadius: "50%", background: "#0B99FC", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(11,153,252,0.3)" }} title="Přidat krok"><Plus size={16} /></button>
      </div>

      {/* Top bar: test email */}
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", background: "#000000", borderBottom: "1px solid #222", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#888", zIndex: 50 }}>
        <label style={{ whiteSpace: "nowrap" }}>Testovaci e-mail:</label>
        <input value={testEmail} onChange={(e) => onTestEmailChange(e.target.value)} placeholder="test@example.cz" style={{ flex: 1, maxWidth: "280px", padding: "6px 10px", background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", fontSize: "12px", boxSizing: "border-box" }} />
        <button
          onClick={handleQuickTestEmail}
          disabled={isSendingTest || !selectedStepId}
          style={{
            padding: "6px 12px",
            background: isSendingTest || !selectedStepId ? "#222" : "#0B99FC",
            border: "1px solid " + (isSendingTest || !selectedStepId ? "#333" : "#0B99FC"),
            borderRadius: "4px",
            color: isSendingTest || !selectedStepId ? "#555" : "#fff",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isSendingTest || !selectedStepId ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 150ms ease",
            opacity: isSendingTest || !selectedStepId ? 0.6 : 1,
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isSendingTest && selectedStepId) {
              (e.currentTarget as HTMLButtonElement).style.background = "#0099ff";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(11,153,252,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = isSendingTest || !selectedStepId ? "#222" : "#0B99FC";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
          title="Posli test email vybranemu kroku"
        >
          {isSendingTest ? "Odesilan..." : "Poslat test"}
        </button>
        {testMessage && (
          <div style={{
            marginLeft: "auto",
            padding: "4px 8px",
            background: testMessage.includes("!") ? "rgba(11,153,252,0.2)" : testMessage.includes("Chyba") ? "rgba(255,82,82,0.2)" : "rgba(255,165,0,0.2)",
            color: testMessage.includes("!") ? "#0B99FC" : testMessage.includes("Chyba") ? "#ff5252" : "#ffb347",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}>
            {testMessage}
          </div>
        )}
      </div>
    </div>
  );
}
