import React, { useState, useRef, useEffect } from "react";
import { Plus, Edit3, Trash2, Send, Clock, Calendar } from "lucide-react";

interface CampaignEmail {
  id: number;
  position: number;
  templateId: number | null;
  delayHours: number;
  sendDate?: string;
  sendTime?: string;
  templateName?: string;
}

interface Campaign {
  id: number;
  name: string;
  audience: "buyers" | "free_downloads";
  status: "draft" | "test" | "live";
}

interface CampaignSequenceBuilderProps {
  campaign: Campaign;
  emails: CampaignEmail[];
  templates: any[];
  onEditEmail: (email: CampaignEmail) => void;
  onDeleteEmail: (emailId: number) => void;
  onAddEmail: () => void;
  onTestEmail: (emailId: number) => void;
  testSendingEmailId: number | null;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  selectedEmailId?: number | null;
  onSelectEmail?: (emailId: number) => void;
}

const EMAIL_Y_SPACING = 140;
const EMAIL_WIDTH = 340;
const EMAIL_HEIGHT = 100;
const CANVAS_PADDING = 60;

export default function CampaignSequenceBuilder({
  campaign,
  emails,
  templates,
  onEditEmail,
  onDeleteEmail,
  onAddEmail,
  onTestEmail,
  testSendingEmailId,
  testEmail,
  onTestEmailChange,
  selectedEmailId,
  onSelectEmail,
}: CampaignSequenceBuilderProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const totalEmails = (emails?.length || 0) + 2;
  const canvasHeight = totalEmails * EMAIL_Y_SPACING + CANVAS_PADDING * 2;
  const canvasWidth = 1000;

  const getEmailPosition = (index: number) => ({
    x: (canvasWidth - EMAIL_WIDTH) / 2,
    y: CANVAS_PADDING + index * EMAIL_Y_SPACING,
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

  const handleQuickTestEmail = async () => {
    if (!selectedEmailId) {
      setTestMessage("Vyberte e-mail v sekvenci");
      setTimeout(() => setTestMessage(null), 3000);
      return;
    }

    const email = emails.find((e) => e.id === selectedEmailId);
    if (!email || !email.templateId) {
      setTestMessage("Vybraný e-mail nemá přiřazenou šablonu");
      setTimeout(() => setTestMessage(null), 3000);
      return;
    }

    if (!testEmail || !testEmail.includes("@")) {
      setTestMessage("Zadejte platnou e-mailovou adresu");
      setTimeout(() => setTestMessage(null), 3000);
      return;
    }

    setIsSendingTest(true);
    try {
      onTestEmail(selectedEmailId);
      setTestMessage("E-mail odeslán!");
      setTimeout(() => setTestMessage(null), 3000);
    } catch (err) {
      setTestMessage("Chyba při odesílání");
      setTimeout(() => setTestMessage(null), 3000);
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

      {/* Zoom controls */}
      <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 100, display: "flex", gap: "8px" }}>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>+</button>
        <div style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", padding: "0 8px" }}>{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>−</button>
      </div>

      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", width: canvasWidth, height: canvasHeight }}>
        <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {(emails?.length || 0) > 0 && <line x1={canvasWidth / 2} y1={getEmailPosition(0).y + EMAIL_HEIGHT} x2={canvasWidth / 2} y2={getEmailPosition(1).y} stroke="#444" strokeWidth="2" strokeDasharray="4,4" />}
          {emails?.map((_, idx) => idx < emails.length - 1 ? <line key={`connection-${idx}`} x1={canvasWidth / 2} y1={getEmailPosition(idx + 1).y + EMAIL_HEIGHT} x2={canvasWidth / 2} y2={getEmailPosition(idx + 2).y} stroke="#444" strokeWidth="2" strokeDasharray="4,4" /> : null)}
          {(emails?.length || 0) > 0 && <line x1={canvasWidth / 2} y1={getEmailPosition(emails.length).y + EMAIL_HEIGHT} x2={canvasWidth / 2} y2={getEmailPosition(emails.length + 1).y} stroke="#444" strokeWidth="2" strokeDasharray="4,4" />}
        </svg>

        {/* Start node */}
        <div style={{ position: "absolute", left: getEmailPosition(0).x, top: getEmailPosition(0).y, width: EMAIL_WIDTH, height: EMAIL_HEIGHT, background: "#0f0f0f", border: "2px solid #444", borderRadius: "8px", padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>AUDIENCE</div>
          <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>
            {campaign.audience === "buyers" ? "Kupující zákazníci" : "Zdarma stahovači"}
          </div>
          <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>
            {campaign.audience === "buyers" ? "~250+ osob" : "~5000+ osob"}
          </div>
        </div>

        {/* Email nodes */}
        {emails?.map((email, idx) => {
          const tpl = templates.find((t) => t.id === email.templateId);
          const isSelected = selectedEmailId === email.id;

          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail?.(email.id)}
              style={{
                position: "absolute",
                left: getEmailPosition(idx + 1).x,
                top: getEmailPosition(idx + 1).y,
                width: EMAIL_WIDTH,
                height: EMAIL_HEIGHT,
                background: isSelected ? "rgba(255, 255, 255, 0.08)" : "#0f0f0f",
                border: `2px solid ${isSelected ? "#fff" : "#333"}`,
                borderRadius: "8px",
                padding: "12px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: isSelected ? "0 8px 24px rgba(255, 255, 255, 0.1)" : "none",
                transform: isSelected ? "scale(1.04)" : "scale(1)",
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                  EMAIL {idx + 1}
                </div>
                <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600 }}>
                  {tpl ? tpl.name : "Bez šablony"}
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} />
                  {email.delayHours > 0 ? `Po ${email.delayHours}h` : "Ihned"}
                  {email.sendDate && ` | ${email.sendDate}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", opacity: 0, pointerEvents: "none", transition: "opacity 150ms ease-in-out" }}>
                <button onClick={() => onEditEmail(email)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#999"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }} title="Upravit e-mail"><Edit3 size={14} /></button>
                <button onClick={() => onTestEmail(email.id)} disabled={testSendingEmailId === email.id} style={{ background: "none", border: "none", color: testSendingEmailId === email.id ? "#555" : "#0B99FC", cursor: testSendingEmailId === email.id ? "default" : "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", opacity: testSendingEmailId === email.id ? 0.5 : 1, transition: "all 150ms ease" }} onMouseEnter={(e) => { if (testSendingEmailId !== email.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(11,153,252,0.1)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }} title="Poslat test">{testSendingEmailId === email.id ? "..." : <Send size={14} />}</button>
                <button onClick={() => { if (confirm("Smazat tento e-mail?")) onDeleteEmail(email.id); }} style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,82,82,0.1)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }} title="Smazat e-mail"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}

        {/* End node */}
        <div style={{ position: "absolute", left: getEmailPosition(emails?.length || 0 + 1).x, top: getEmailPosition(emails?.length || 0 + 1).y, width: EMAIL_WIDTH, height: EMAIL_HEIGHT, background: "#0f0f0f", border: "2px solid #444", borderRadius: "8px", padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #666", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#666" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Kampaň Skončena</div>
        </div>

        {/* Add button */}
        <button onClick={onAddEmail} style={{ position: "absolute", left: getEmailPosition(emails?.length || 0).x + EMAIL_WIDTH + 40, top: getEmailPosition(emails?.length || 0).y + EMAIL_HEIGHT / 2 - 16, width: "32px", height: "32px", borderRadius: "50%", background: "#0B99FC", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(11,153,252,0.3)" }} title="Přidat e-mail"><Plus size={16} /></button>
      </div>

      {/* Test email input */}
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", background: "#000000", borderBottom: "1px solid #222", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#888", zIndex: 50 }}>
        <label style={{ whiteSpace: "nowrap" }}>Testovací e-mail:</label>
        <input value={testEmail} onChange={(e) => onTestEmailChange(e.target.value)} placeholder="test@example.cz" style={{ flex: 1, maxWidth: "280px", padding: "6px 10px", background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#fff", fontSize: "12px", boxSizing: "border-box" }} />
        <button
          onClick={handleQuickTestEmail}
          disabled={isSendingTest || !selectedEmailId}
          style={{
            padding: "6px 12px",
            background: isSendingTest || !selectedEmailId ? "#222" : "#0B99FC",
            border: "1px solid " + (isSendingTest || !selectedEmailId ? "#333" : "#0B99FC"),
            borderRadius: "4px",
            color: isSendingTest || !selectedEmailId ? "#555" : "#fff",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isSendingTest || !selectedEmailId ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 150ms ease",
            opacity: isSendingTest || !selectedEmailId ? 0.6 : 1,
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isSendingTest && selectedEmailId) {
              (e.currentTarget as HTMLButtonElement).style.background = "#0099ff";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(11,153,252,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = isSendingTest || !selectedEmailId ? "#222" : "#0B99FC";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
          title="Poslat testovací e-mail"
        >
          {isSendingTest ? "Odesílám..." : "Poslat test"}
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
