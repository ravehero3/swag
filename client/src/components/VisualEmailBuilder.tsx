import React, { useState, useEffect } from "react";
import {
  Type,
  AlignLeft,
  Square,
  Image as ImageIcon,
  Minus,
  Maximize2,
  Layout,
  Music,
  Info,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Send,
  Smartphone,
  Monitor,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export type BlockType =
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "hero"
  | "beat_highlight"
  | "info_box";

export interface EmailBlock {
  id: string;
  type: BlockType;
  headingText?: string;
  headingLevel?: "h1" | "h2" | "h3";
  headingAlign?: "left" | "center" | "right";
  headingColor?: string;

  paragraphText?: string;
  paragraphAlign?: "left" | "center" | "right";

  buttonText?: string;
  buttonUrl?: string;
  buttonAlign?: "left" | "center" | "right";
  buttonBgColor?: string;
  buttonTextColor?: string;

  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: string;

  dividerColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted";

  spacerHeight?: number;

  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroButtonText?: string;
  heroButtonUrl?: string;

  beatTitle?: string;
  beatSubtitle?: string;
  beatCoverUrl?: string;
  beatPrice?: string;
  beatUrl?: string;
  beatBpmKey?: string;

  infoTitle?: string;
  infoText?: string;
  infoBorderColor?: string;
  infoBgColor?: string;
}

interface SelectItem {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  price: string;
  bpmKey: string;
  url: string;
}

interface VisualEmailBuilderProps {
  initialSubject?: string;
  initialPreheader?: string;
  initialBlocks?: EmailBlock[];
  title?: string;
  onSave: (data: { subject: string; preheader: string; blocks: EmailBlock[] }) => Promise<void>;
  onClose: () => void;
  onTestSend?: (email: string, subject: string, preheader: string, blocks: EmailBlock[]) => Promise<void>;
}

export function VisualEmailBuilder({
  initialSubject = "",
  initialPreheader = "",
  initialBlocks = [],
  title = "Vizuální editor e-mailu",
  onSave,
  onClose,
  onTestSend,
}: VisualEmailBuilderProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [preheader, setPreheader] = useState(initialPreheader);
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      return initialBlocks;
    }
    // Default starter blocks
    return [
      { id: "b1", type: "heading", headingText: "Nová hudba na VOODOO808", headingLevel: "h1", headingAlign: "center" },
      { id: "b2", type: "paragraph", paragraphText: "Ahoj {{first_name}},\n\npřipravili jsme pro tebe nové beaty a sound kity přímo z našeho studia.", paragraphAlign: "left" },
      { id: "b3", type: "button", buttonText: "PROHLÉDNOUT SI BEATY", buttonUrl: "{{site_url}}/beaty", buttonAlign: "center" },
    ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id || null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState(() => localStorage.getItem("voodoo808_marketing_test_email") || "");
  const [showTestModal, setShowTestModal] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Store beat items from DB for selection
  const [selectItems, setSelectItems] = useState<SelectItem[]>([]);

  useEffect(() => {
    fetch("/api/marketing/beats-select", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSelectItems)
      .catch(() => {});
  }, []);

  const addBlock = (type: BlockType) => {
    const newId = "b_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    let newBlock: EmailBlock = { id: newId, type };

    if (type === "heading") {
      newBlock.headingText = "Nový nadpis";
      newBlock.headingLevel = "h2";
      newBlock.headingAlign = "left";
    } else if (type === "paragraph") {
      newBlock.paragraphText = "Zadejte text odstavce…";
      newBlock.paragraphAlign = "left";
    } else if (type === "button") {
      newBlock.buttonText = "KLIKNĚTE ZDE";
      newBlock.buttonUrl = "{{site_url}}";
      newBlock.buttonAlign = "center";
      newBlock.buttonBgColor = "#ffffff";
      newBlock.buttonTextColor = "#000000";
    } else if (type === "image") {
      newBlock.imageUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80";
      newBlock.imageAlt = "Obrázek";
      newBlock.imageAlign = "center";
      newBlock.imageWidth = "100%";
    } else if (type === "divider") {
      newBlock.dividerColor = "#222222";
      newBlock.dividerStyle = "solid";
    } else if (type === "spacer") {
      newBlock.spacerHeight = 24;
    } else if (type === "hero") {
      newBlock.heroTitle = "VOODOO808 EXCLUSIVES";
      newBlock.heroSubtitle = "Nové beaty azvukové sady pro vaši tvorbu.";
      newBlock.heroImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80";
      newBlock.heroButtonText = "ZOBRAZIT NÁBÍDKU";
      newBlock.heroButtonUrl = "{{site_url}}/beaty";
    } else if (type === "beat_highlight") {
      newBlock.beatTitle = "Exkluzivní Beat / Kit";
      newBlock.beatSubtitle = "Čerstvě přidaný do katalogu";
      newBlock.beatPrice = "od 990 Kč";
      newBlock.beatUrl = "{{site_url}}/beaty";
      newBlock.beatCoverUrl = selectItems[0]?.coverUrl || "";
    } else if (type === "info_box") {
      newBlock.infoTitle = "Tip pro vás";
      newBlock.infoText = "Při zakoupení 2 beatů získáte 3. zdarma s promo kódem VOODOO3FOR2.";
      newBlock.infoBorderColor = "#222222";
      newBlock.infoBgColor = "#111111";
    }

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
  };

  const updateSelectedBlock = (patch: Partial<EmailBlock>) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlockId ? { ...b, ...patch } : b))
    );
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setBlocks(copy);
  };

  const duplicateBlock = (index: number) => {
    const original = blocks[index];
    const newId = "b_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const copy = { ...original, id: newId };
    const list = [...blocks];
    list.splice(index + 1, 0, copy);
    setBlocks(list);
    setSelectedBlockId(newId);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      alert("Zadejte předmět e-mailu.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ subject, preheader, blocks });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSendSubmit = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      alert("Zadejte platnou e-mailovou adresu.");
      return;
    }
    localStorage.setItem("voodoo808_marketing_test_email", testEmail);
    setIsTestSending(true);
    setTestResult(null);
    try {
      if (onTestSend) {
        await onTestSend(testEmail, subject, preheader, blocks);
      } else {
        const res = await fetch("/api/marketing/templates/1/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: testEmail }),
        });
        if (!res.ok) throw new Error("Chyba při odesílání testu");
      }
      setTestResult(`Testovací e-mail byl úspěšně odeslán na ${testEmail}.`);
    } catch (err: any) {
      setTestResult(`Chyba: ${err.message || "Odeslání selhalo"}`);
    } finally {
      setIsTestSending(false);
    }
  };

  const insertVariable = (varName: string, field: "subject" | "preheader") => {
    if (field === "subject") setSubject((prev) => prev + ` {{${varName}}}`);
    else setPreheader((prev) => prev + ` {{${varName}}}`);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const BLOCK_TYPE_LABELS: Record<BlockType, { label: string; icon: any }> = {
    heading: { label: "Nadpis", icon: Type },
    paragraph: { label: "Odstavec", icon: AlignLeft },
    button: { label: "Tlačítko", icon: Square },
    image: { label: "Obrázek", icon: ImageIcon },
    divider: { label: "Oddělovač", icon: Minus },
    spacer: { label: "Mezera", icon: Maximize2 },
    hero: { label: "Hero Banner", icon: Layout },
    beat_highlight: { label: "Beat / Kit Highlight", icon: Music },
    info_box: { label: "Info Box", icon: Info },
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#eee",
    fontSize: "12px",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080808",
        zIndex: 10005,
        display: "flex",
        flexDirection: "column",
        color: "#eee",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "#0d0d0d",
          borderBottom: "1px solid #1f1f1f",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "0.02em" }}>
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Device Toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "3px",
            }}
          >
            <button
              onClick={() => setPreviewMode("desktop")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "desktop" ? "rgba(255,255,255,0.15)" : "transparent",
                color: previewMode === "desktop" ? "#fff" : "#777",
              }}
            >
              <Monitor size={13} /> Desktop
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "mobile" ? "rgba(255,255,255,0.15)" : "transparent",
                color: previewMode === "mobile" ? "#fff" : "#777",
              }}
            >
              <Smartphone size={13} /> Mobil
            </button>
          </div>

          <button
            onClick={() => setShowTestModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(11,153,252,0.1)",
              border: "1px solid rgba(11,153,252,0.3)",
              color: "#0B99FC",
              borderRadius: "4px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Send size={13} /> Odeslat test
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              color: "#000000",
              border: "none",
              borderRadius: "4px",
              padding: "7px 16px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            <Check size={14} /> {isSaving ? "Ukládám…" : "Uložit"}
          </button>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #333",
              color: "#888",
              borderRadius: "4px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", flex: 1, overflow: "hidden" }}>
        
        {/* Left Panel: Block Catalog Drawer */}
        <div style={{ background: "#0c0c0c", borderRight: "1px solid #1a1a1a", padding: "16px", overflowY: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Přidat blok do e-mailu
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
            {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => {
              const { label, icon: Icon } = BLOCK_TYPE_LABELS[type];
              return (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "6px",
                    color: "#ccc",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <Icon size={15} style={{ color: "#888" }} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Proměnné (zákazník)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["first_name", "email", "site_url", "unsubscribe_url"].map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariable(v, "subject")}
                  title={`Kliknutím přidáte {{${v}}} do předmětu`}
                  style={{
                    background: "#161616",
                    border: "1px solid #282828",
                    borderRadius: "4px",
                    padding: "3px 7px",
                    fontSize: "10px",
                    color: "#aaa",
                    cursor: "pointer",
                  }}
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Canvas & Live Preview Container */}
        <div style={{ background: "#050505", display: "flex", flexDirection: "column", overflowY: "auto", padding: "20px" }}>
          
          {/* Header Metadata Inputs */}
          <div style={{ width: "min(640px, 98%)", margin: "0 auto 20px auto", background: "#0c0c0c", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Předmět e-mailu *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="např. Nový beat pack je venku 🔥"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Preheader (náhledový text)</label>
              <input
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="např. Stáhni si nejnovější kity pro tvůj příští track…"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email Preview Outer Container */}
          <div
            style={{
              width: previewMode === "mobile" ? "390px" : "640px",
              maxWidth: "100%",
              margin: "0 auto",
              background: "#0a0a0a",
              border: "1px solid #222",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              overflow: "hidden",
              transition: "width 0.25s ease",
            }}
          >
            {/* Header Logo Banner */}
            <div style={{ padding: "28px 0", textAlign: "center", borderBottom: "1px solid #222", background: "#0a0a0a" }}>
              <img
                src="/uploads/artwork/voodoo808-main-logo.png"
                alt="VOODOO808"
                style={{ width: "180px", height: "auto", display: "inline-block" }}
                onError={(e) => {
                  (e.currentTarget as any).style.display = "none";
                }}
              />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "16px", letterSpacing: "2px" }}>
                VOODOO808
              </span>
            </div>

            {/* Block Canvas Area */}
            <div style={{ padding: "24px 20px" }}>
              {blocks.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#555", fontSize: "13px" }}>
                  Žádné bloky v e-mailu. Vyberte blok z levého panelu pro přidání.
                </div>
              ) : (
                blocks.map((block, idx) => {
                  const isSelected = block.id === selectedBlockId;
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      style={{
                        position: "relative",
                        marginBottom: "12px",
                        padding: "10px",
                        border: isSelected ? "2px solid #ffffff" : "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        background: isSelected ? "rgba(255,255,255,0.02)" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Block Hover/Select Action Controls */}
                      <div
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "-12px",
                          display: isSelected ? "flex" : "none",
                          alignItems: "center",
                          gap: "4px",
                          background: "#161616",
                          border: "1px solid #333",
                          borderRadius: "4px",
                          padding: "2px 4px",
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                          disabled={idx === 0}
                          title="Posunout nahoru"
                          style={{ background: "none", border: "none", color: idx === 0 ? "#444" : "#ccc", cursor: "pointer", padding: "2px" }}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                          disabled={idx === blocks.length - 1}
                          title="Posunout dolů"
                          style={{ background: "none", border: "none", color: idx === blocks.length - 1 ? "#444" : "#ccc", cursor: "pointer", padding: "2px" }}
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(idx); }}
                          title="Duplikovat"
                          style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: "2px" }}
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          title="Smazat"
                          style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", padding: "2px" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Render Visual Preview of Block */}
                      <BlockRenderer block={block} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Preview */}
            <div style={{ padding: "24px 20px", borderTop: "1px solid #222", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#555", lineHeight: 1.6 }}>
                VOODOO808 • Vojtěch Vojkovský<br />
                <span style={{ color: "#777", textDecoration: "underline" }}>Odhlásit se z marketingových e-mailů</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Block Inspector */}
        <div style={{ background: "#0c0c0c", borderLeft: "1px solid #1a1a1a", padding: "16px", overflowY: "auto" }}>
          {selectedBlock ? (
            <BlockInspector
              block={selectedBlock}
              onChange={updateSelectedBlock}
              selectItems={selectItems}
            />
          ) : (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "#555", fontSize: "12px" }}>
              Klikněte na jakýkoliv blok v e-mailu pro jeho úpravu.
            </div>
          )}
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div
          onClick={() => setShowTestModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 10010,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d0d0d",
              border: "1px solid #222",
              borderRadius: "8px",
              width: "min(420px, 96vw)",
              padding: "20px",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#eee", marginBottom: "12px" }}>
              Odeslat testovací e-mail
            </div>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "14px", lineHeight: 1.5 }}>
              Zašleme náhled s aktuálními bloky a předmětem na vaši zadanou e-mailovou adresu.
            </p>

            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="vase@adresa.cz"
              style={inputStyle}
            />

            {testResult && (
              <div
                style={{
                  fontSize: "12px",
                  color: testResult.startsWith("Chyba") ? "#ff5252" : "#24e053",
                  marginTop: "10px",
                }}
              >
                {testResult}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
              <button
                onClick={handleTestSendSubmit}
                disabled={isTestSending}
                style={{
                  background: "#0B99FC",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isTestSending ? "not-allowed" : "pointer",
                }}
              >
                {isTestSending ? "Odesílám…" : "Odeslat test"}
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                style={{
                  background: "none",
                  border: "1px solid #333",
                  color: "#aaa",
                  borderRadius: "4px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Block Renderer (In-canvas representation) ──────────────────────────────
function BlockRenderer({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case "heading": {
      const level = block.headingLevel || "h1";
      const size = level === "h1" ? "22px" : level === "h2" ? "18px" : "15px";
      return (
        <div
          style={{
            fontSize: size,
            fontWeight: 700,
            color: block.headingColor || "#ffffff",
            textAlign: block.headingAlign || "left",
            lineHeight: 1.3,
          }}
        >
          {block.headingText || "Nadpis"}
        </div>
      );
    }
    case "paragraph": {
      return (
        <div
          style={{
            fontSize: "14px",
            color: "#aaaaaa",
            lineHeight: 1.6,
            textAlign: block.paragraphAlign || "left",
            whiteSpace: "pre-wrap",
          }}
        >
          {block.paragraphText || "Text odstavce…"}
        </div>
      );
    }
    case "button": {
      return (
        <div style={{ textAlign: block.buttonAlign || "left", margin: "8px 0" }}>
          <span
            style={{
              display: "inline-block",
              background: block.buttonBgColor || "#ffffff",
              color: block.buttonTextColor || "#000000",
              fontWeight: 700,
              fontSize: "12px",
              padding: "10px 22px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {block.buttonText || "TLAČÍTKO"}
          </span>
        </div>
      );
    }
    case "image": {
      return (
        <div style={{ textAlign: block.imageAlign || "center", margin: "8px 0" }}>
          {block.imageUrl ? (
            <img
              src={block.imageUrl}
              alt={block.imageAlt || ""}
              style={{
                maxWidth: "100%",
                width: block.imageWidth || "100%",
                height: "auto",
                borderRadius: "6px",
                border: "1px solid #222",
              }}
            />
          ) : (
            <div
              style={{
                padding: "30px",
                background: "#111",
                border: "1px dashed #333",
                borderRadius: "6px",
                color: "#666",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Vložte URL obrázku v pravém panelu
            </div>
          )}
        </div>
      );
    }
    case "divider": {
      return (
        <div
          style={{
            margin: "14px 0",
            borderBottom: `1px ${block.dividerStyle || "solid"} ${block.dividerColor || "#222"}`,
          }}
        />
      );
    }
    case "spacer": {
      const h = block.spacerHeight || 24;
      return (
        <div
          style={{
            height: `${h}px`,
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#555",
          }}
        >
          Mezera ({h}px)
        </div>
      );
    }
    case "hero": {
      return (
        <div
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: "8px",
            overflow: "hidden",
            margin: "8px 0",
          }}
        >
          {block.heroImageUrl && (
            <img
              src={block.heroImageUrl}
              alt=""
              style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }}
            />
          )}
          <div style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
              {block.heroTitle || "HERO NADPIS"}
            </div>
            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "14px" }}>
              {block.heroSubtitle || "Podnadpis hero sekce"}
            </div>
            <span
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#000000",
                fontWeight: 700,
                fontSize: "11px",
                padding: "8px 20px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              {block.heroButtonText || "TLAČÍTKO"}
            </span>
          </div>
        </div>
      );
    }
    case "beat_highlight": {
      return (
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: "8px",
            padding: "12px 14px",
            margin: "8px 0",
          }}
        >
          {block.beatCoverUrl ? (
            <img
              src={block.beatCoverUrl}
              alt=""
              style={{ width: "70px", height: "70px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "6px",
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#444",
                flexShrink: 0,
              }}
            >
              <Music size={24} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
              {block.beatTitle || "Název beatů/kitu"}
            </div>
            {block.beatSubtitle && (
              <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>{block.beatSubtitle}</div>
            )}
            {block.beatBpmKey && (
              <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{block.beatBpmKey}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                {block.beatPrice || "Cena"}
              </span>
              <span
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "3px",
                  textTransform: "uppercase",
                }}
              >
                Koupit
              </span>
            </div>
          </div>
        </div>
      );
    }
    case "info_box": {
      return (
        <div
          style={{
            background: block.infoBgColor || "#111111",
            border: `1px solid ${block.infoBorderColor || "#222222"}`,
            borderRadius: "6px",
            padding: "14px 16px",
            margin: "8px 0",
          }}
        >
          {block.infoTitle && (
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
              {block.infoTitle}
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#aaa", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {block.infoText || "Text boxu…"}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

// ── Property Inspector Component ───────────────────────────────────────────
function BlockInspector({
  block,
  onChange,
  selectItems,
}: {
  block: EmailBlock;
  onChange: (patch: Partial<EmailBlock>) => void;
  selectItems: SelectItem[];
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 9px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#eee",
    fontSize: "12px",
    boxSizing: "border-box",
  };

  const handleSelectBeatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = selectItems.find((item) => item.id === selectedId);
    if (found) {
      onChange({
        beatTitle: found.title,
        beatSubtitle: found.subtitle,
        beatCoverUrl: found.coverUrl,
        beatPrice: found.price,
        beatUrl: `{{site_url}}${found.url}`,
        beatBpmKey: found.bpmKey,
      });
    }
  };

  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#eee", marginBottom: "14px", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px" }}>
        Nastavení bloku: <span style={{ color: "#888" }}>{block.type}</span>
      </div>

      {block.type === "heading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Text nadpisu</label>
            <input
              value={block.headingText || ""}
              onChange={(e) => onChange({ headingText: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Velikost (Level)</label>
            <select
              value={block.headingLevel || "h1"}
              onChange={(e) => onChange({ headingLevel: e.target.value as any })}
              style={inputStyle}
            >
              <option value="h1">Velký (H1)</option>
              <option value="h2">Střední (H2)</option>
              <option value="h3">Malý (H3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Zarovnání</label>
            <select
              value={block.headingAlign || "left"}
              onChange={(e) => onChange({ headingAlign: e.target.value as any })}
              style={inputStyle}
            >
              <option value="left">Vlevo</option>
              <option value="center">Na střed</option>
              <option value="right">Vpravo</option>
            </select>
          </div>
        </div>
      )}

      {block.type === "paragraph" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Text odstavce</label>
            <textarea
              rows={6}
              value={block.paragraphText || ""}
              onChange={(e) => onChange({ paragraphText: e.target.value })}
              style={{ ...inputStyle, fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Zarovnání</label>
            <select
              value={block.paragraphAlign || "left"}
              onChange={(e) => onChange({ paragraphAlign: e.target.value as any })}
              style={inputStyle}
            >
              <option value="left">Vlevo</option>
              <option value="center">Na střed</option>
              <option value="right">Vpravo</option>
            </select>
          </div>
        </div>
      )}

      {block.type === "button" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Text tlačítka</label>
            <input
              value={block.buttonText || ""}
              onChange={(e) => onChange({ buttonText: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Cílová URL adresa</label>
            <input
              value={block.buttonUrl || ""}
              onChange={(e) => onChange({ buttonUrl: e.target.value })}
              placeholder="{{site_url}}/beaty"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Zarovnání</label>
            <select
              value={block.buttonAlign || "left"}
              onChange={(e) => onChange({ buttonAlign: e.target.value as any })}
              style={inputStyle}
            >
              <option value="left">Vlevo</option>
              <option value="center">Na střed</option>
              <option value="right">Vpravo</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Barva pozadí</label>
            <input
              type="color"
              value={block.buttonBgColor || "#ffffff"}
              onChange={(e) => onChange({ buttonBgColor: e.target.value })}
              style={{ ...inputStyle, height: "34px", padding: "2px", cursor: "pointer" }}
            />
          </div>
        </div>
      )}

      {block.type === "image" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>URL obrázku</label>
            <input
              value={block.imageUrl || ""}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              placeholder="https://…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Alt text (popisek)</label>
            <input
              value={block.imageAlt || ""}
              onChange={(e) => onChange({ imageAlt: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Odkaz při kliknutí (nepovinné)</label>
            <input
              value={block.imageLink || ""}
              onChange={(e) => onChange({ imageLink: e.target.value })}
              placeholder="{{site_url}}"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {block.type === "spacer" && (
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Výška mezery ({block.spacerHeight || 24}px)</label>
          <input
            type="range"
            min={8}
            max={100}
            value={block.spacerHeight || 24}
            onChange={(e) => onChange({ spacerHeight: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>
      )}

      {block.type === "beat_highlight" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Vybrat z obchodu (Beat / Kit)</label>
            <select onChange={handleSelectBeatChange} style={inputStyle}>
              <option value="">-- Vyberte položku --</option>
              {selectItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.subtitle} - {item.price})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Název</label>
            <input
              value={block.beatTitle || ""}
              onChange={(e) => onChange({ beatTitle: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Podnázev / Popis</label>
            <input
              value={block.beatSubtitle || ""}
              onChange={(e) => onChange({ beatSubtitle: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>BPM / Tónina</label>
            <input
              value={block.beatBpmKey || ""}
              onChange={(e) => onChange({ beatBpmKey: e.target.value })}
              placeholder="např. 140 BPM • C Minor"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Cena</label>
            <input
              value={block.beatPrice || ""}
              onChange={(e) => onChange({ beatPrice: e.target.value })}
              placeholder="od 990 Kč"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Cover Obrázek (URL)</label>
            <input
              value={block.beatCoverUrl || ""}
              onChange={(e) => onChange({ beatCoverUrl: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {block.type === "hero" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Hlavní nadpis</label>
            <input
              value={block.heroTitle || ""}
              onChange={(e) => onChange({ heroTitle: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Podnadpis</label>
            <input
              value={block.heroSubtitle || ""}
              onChange={(e) => onChange({ heroSubtitle: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Obrázek na pozadí (URL)</label>
            <input
              value={block.heroImageUrl || ""}
              onChange={(e) => onChange({ heroImageUrl: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Text tlačítka</label>
            <input
              value={block.heroButtonText || ""}
              onChange={(e) => onChange({ heroButtonText: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>URL tlačítka</label>
            <input
              value={block.heroButtonUrl || ""}
              onChange={(e) => onChange({ heroButtonUrl: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {block.type === "info_box" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Titulková věta</label>
            <input
              value={block.infoTitle || ""}
              onChange={(e) => onChange({ infoTitle: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Obsah zprávy</label>
            <textarea
              rows={4}
              value={block.infoText || ""}
              onChange={(e) => onChange({ infoText: e.target.value })}
              style={{ ...inputStyle, fontFamily: "inherit" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
