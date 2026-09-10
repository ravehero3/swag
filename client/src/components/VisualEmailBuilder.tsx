import React, { useState, useEffect, useCallback } from "react";
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
  Undo2,
  Redo2,
  Tag,
  Share2,
  Grid2X2,
  Palette,
  Eye,
  Sliders,
  GripVertical,
  Layers,
  HelpCircle,
  CopyCheck
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
  | "multi_beat_grid"
  | "info_box"
  | "coupon_box"
  | "social_links";

export interface EmailBlockGridItem {
  title: string;
  subtitle?: string;
  coverUrl?: string;
  price?: string;
  url?: string;
}

export interface EmailBlock {
  id: string;
  type: BlockType;
  // Heading
  headingText?: string;
  headingLevel?: "h1" | "h2" | "h3";
  headingAlign?: "left" | "center" | "right";
  headingColor?: string;

  // Paragraph
  paragraphText?: string;
  paragraphAlign?: "left" | "center" | "right";

  // Button
  buttonText?: string;
  buttonUrl?: string;
  buttonAlign?: "left" | "center" | "right";
  buttonBgColor?: string;
  buttonTextColor?: string;

  // Image
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: string;

  // Divider
  dividerColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted";

  // Spacer
  spacerHeight?: number;

  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroButtonText?: string;
  heroButtonUrl?: string;

  // Beat Highlight
  beatTitle?: string;
  beatSubtitle?: string;
  beatCoverUrl?: string;
  beatPrice?: string;
  beatUrl?: string;
  beatBpmKey?: string;

  // Multi Beat Grid
  gridItems?: EmailBlockGridItem[];

  // Info Box
  infoTitle?: string;
  infoText?: string;
  infoBorderColor?: string;
  infoBgColor?: string;

  // Coupon Box
  couponCode?: string;
  couponDiscount?: string;
  couponDescription?: string;

  // Social Links
  instagramUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  beatstarsUrl?: string;
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

const BRAND_COLORS = ["#ffffff", "#000000", "#ff2d55", "#0B99FC", "#eab308", "#111111", "#222222", "#444444"];

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

  // Starter blocks default
  const defaultBlocks: EmailBlock[] = [
    { id: "b1", type: "heading", headingText: "Nová hudba na VOODOO808 🔥", headingLevel: "h1", headingAlign: "center", headingColor: "#ffffff" },
    { id: "b2", type: "paragraph", paragraphText: "Ahoj {{first_name}},\n\npřipravili jsme pro tebe zrovna vyjde nové exkluzivní beaty a sound kity přímo z našeho studia. Podívej se na novinky níže!", paragraphAlign: "left" },
    { id: "b3", type: "hero", heroTitle: "VOODOO808 NEW RELEASES", heroSubtitle: "Prémiové trap & drill beaty se 100% autorskými právy.", heroImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80", heroButtonText: "PROHLÉDNOUT SI KATALOG", heroButtonUrl: "{{site_url}}/beaty" },
    { id: "b4", type: "button", buttonText: "ZÍSKAT SLEVU NA BEATY", buttonUrl: "{{site_url}}/beaty", buttonAlign: "center", buttonBgColor: "#ffffff", buttonTextColor: "#000000" },
  ];

  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    return Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : defaultBlocks;
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<EmailBlock[][]>([Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : defaultBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateBlocksState = useCallback((newBlocks: EmailBlock[]) => {
    setBlocks(newBlocks);
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      return [...nextHistory, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setBlocks(history[newIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setBlocks(history[newIdx]);
    }
  }, [historyIndex, history]);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id || null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState(() => localStorage.getItem("voodoo808_marketing_test_email") || "");
  const [showTestModal, setShowTestModal] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"content" | "style">("content");

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
      newBlock.headingColor = "#ffffff";
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
      newBlock.heroSubtitle = "Nové beaty a zvukové sady pro vaši tvorbu.";
      newBlock.heroImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80";
      newBlock.heroButtonText = "ZOBRAZIT NABÍDKU";
      newBlock.heroButtonUrl = "{{site_url}}/beaty";
    } else if (type === "beat_highlight") {
      newBlock.beatTitle = selectItems[0]?.title || "Exkluzivní Beat / Kit";
      newBlock.beatSubtitle = selectItems[0]?.subtitle || "Čerstvě přidaný do katalogu";
      newBlock.beatPrice = selectItems[0]?.price || "od 990 Kč";
      newBlock.beatUrl = selectItems[0] ? `{{site_url}}${selectItems[0].url}` : "{{site_url}}/beaty";
      newBlock.beatCoverUrl = selectItems[0]?.coverUrl || "";
      newBlock.beatBpmKey = selectItems[0]?.bpmKey || "";
    } else if (type === "multi_beat_grid") {
      newBlock.gridItems = [
        {
          title: selectItems[0]?.title || "Beat #1",
          subtitle: selectItems[0]?.bpmKey || "140 BPM",
          price: selectItems[0]?.price || "990 Kč",
          coverUrl: selectItems[0]?.coverUrl || "",
          url: selectItems[0] ? `{{site_url}}${selectItems[0].url}` : "{{site_url}}/beaty",
        },
        {
          title: selectItems[1]?.title || "Beat #2",
          subtitle: selectItems[1]?.bpmKey || "130 BPM",
          price: selectItems[1]?.price || "990 Kč",
          coverUrl: selectItems[1]?.coverUrl || "",
          url: selectItems[1] ? `{{site_url}}${selectItems[1].url}` : "{{site_url}}/beaty",
        },
      ];
    } else if (type === "coupon_box") {
      newBlock.couponCode = "VOODOO20";
      newBlock.couponDiscount = "20% SLEVA";
      newBlock.couponDescription = "Použijte tento kód v nákupním košíku pro získání slevy na váš nákup.";
    } else if (type === "social_links") {
      newBlock.instagramUrl = "https://instagram.com/voodoo808";
      newBlock.youtubeUrl = "https://youtube.com/@voodoo808";
      newBlock.spotifyUrl = "https://open.spotify.com";
    } else if (type === "info_box") {
      newBlock.infoTitle = "Tip pro vás";
      newBlock.infoText = "Při zakoupení 2 beatů získáte 3. zdarma s promo kódem VOODOO3FOR2.";
      newBlock.infoBorderColor = "#222222";
      newBlock.infoBgColor = "#111111";
    }

    const nextList = [...blocks, newBlock];
    updateBlocksState(nextList);
    setSelectedBlockId(newId);
  };

  const updateSelectedBlock = (patch: Partial<EmailBlock>) => {
    if (!selectedBlockId) return;
    const nextList = blocks.map((b) => (b.id === selectedBlockId ? { ...b, ...patch } : b));
    updateBlocksState(nextList);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    updateBlocksState(copy);
  };

  const duplicateBlock = (index: number) => {
    const original = blocks[index];
    const newId = "b_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const copy = { ...original, id: newId };
    const list = [...blocks];
    list.splice(index + 1, 0, copy);
    updateBlocksState(list);
    setSelectedBlockId(newId);
  };

  const deleteBlock = (id: string) => {
    const list = blocks.filter((b) => b.id !== id);
    updateBlocksState(list);
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

  const insertVariableToActive = (varName: string, target: "subject" | "preheader") => {
    if (target === "subject") setSubject((prev) => prev + ` {{${varName}}}`);
    else setPreheader((prev) => prev + ` {{${varName}}}`);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const BLOCK_CATEGORIES = [
    {
      title: "📝 Text & Obsah",
      items: [
        { type: "heading" as BlockType, label: "Nadpis", icon: Type },
        { type: "paragraph" as BlockType, label: "Odstavec", icon: AlignLeft },
        { type: "info_box" as BlockType, label: "Info Box", icon: Info },
        { type: "coupon_box" as BlockType, label: "Slevový Kód", icon: Tag },
      ],
    },
    {
      title: "🎨 Média & Rozvržení",
      items: [
        { type: "hero" as BlockType, label: "Hero Banner", icon: Layout },
        { type: "image" as BlockType, label: "Obrázek", icon: ImageIcon },
        { type: "divider" as BlockType, label: "Oddělovač", icon: Minus },
        { type: "spacer" as BlockType, label: "Mezera", icon: Maximize2 },
      ],
    },
    {
      title: "🎵 VOODOO808 Hudba",
      items: [
        { type: "beat_highlight" as BlockType, label: "Beat Highlight", icon: Music },
        { type: "multi_beat_grid" as BlockType, label: "Grid Beatů (2x)", icon: Grid2X2 },
      ],
    },
    {
      title: "🔘 Odkazy & Akce",
      items: [
        { type: "button" as BlockType, label: "Tlačítko (CTA)", icon: Square },
        { type: "social_links" as BlockType, label: "Sociální sítě", icon: Share2 },
      ],
    },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: "#111111",
    border: "1px solid #262626",
    borderRadius: "6px",
    color: "#eee",
    fontSize: "12px",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Top Bar Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "rgba(13, 13, 13, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ff2d55 0%, #0B99FC 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(255, 45, 85, 0.4)",
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.01em", color: "#fff" }}>
              {title}
            </div>
            <div style={{ fontSize: "11px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              {blocks.length} bloků v e-mailu
            </div>
          </div>
        </div>

        {/* Center Toolbar: History & Preview Modes */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Undo / Redo Buttons */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Zpět (Ctrl+Z)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: historyIndex <= 0 ? "not-allowed" : "pointer",
                background: "transparent",
                color: historyIndex <= 0 ? "#444" : "#ccc",
              }}
            >
              <Undo2 size={13} /> Zpět
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Vpřed (Ctrl+Y)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer",
                background: "transparent",
                color: historyIndex >= history.length - 1 ? "#444" : "#ccc",
              }}
            >
              <Redo2 size={13} /> Vpřed
            </button>
          </div>

          {/* Device Toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "3px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setPreviewMode("desktop")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "desktop" ? "rgba(255,255,255,0.12)" : "transparent",
                color: previewMode === "desktop" ? "#fff" : "#777",
                transition: "all 0.15s ease",
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
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "mobile" ? "rgba(255,255,255,0.12)" : "transparent",
                color: previewMode === "mobile" ? "#fff" : "#777",
                transition: "all 0.15s ease",
              }}
            >
              <Smartphone size={13} /> Mobil
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowTestModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(11,153,252,0.08)",
              border: "1px solid rgba(11,153,252,0.3)",
              color: "#0B99FC",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
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
              borderRadius: "6px",
              padding: "8px 18px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 10px rgba(255,255,255,0.15)",
              transition: "transform 0.1s ease",
            }}
          >
            <Check size={14} /> {isSaving ? "Ukládám…" : "Uložit e-mail"}
          </button>

          <button
            onClick={onClose}
            title="Zavřít editor"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #262626",
              color: "#888",
              borderRadius: "6px",
              padding: "7px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Grid Workspace Layout ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", flex: 1, overflow: "hidden" }}>

        {/* Left Drawer: Block Palette */}
        <div style={{ background: "#0b0b0b", borderRight: "1px solid #1a1a1a", padding: "18px 14px", overflowY: "auto" }}>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={13} /> Bloky e-mailu
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", marginBottom: "8px" }}>
                  {cat.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => addBlock(item.type)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "12px 8px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          color: "#ccc",
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Icon size={16} style={{ color: "#fff" }} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Variable Insertion Box */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <HelpCircle size={12} /> Rychlé proměnné
            </div>
            <p style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
              Kliknutím vložíte proměnnou do předmětu e-mailu:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["first_name", "email", "site_url", "unsubscribe_url"].map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariableToActive(v, "subject")}
                  title={`Kliknutím přidáte {{${v}}} do předmětu`}
                  style={{
                    background: "#161616",
                    border: "1px solid #282828",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "#0B99FC",
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Middle Live Canvas Workspace ──────────────────────────────────── */}
        <div style={{ background: "#050505", display: "flex", flexDirection: "column", overflowY: "auto", padding: "24px 20px" }}>

          {/* Email Inbox Preview Line (Gmail / Apple Mail look) */}
          <div style={{ width: "min(680px, 98%)", margin: "0 auto 20px auto", background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px" }}>
              <Eye size={14} style={{ color: "#0B99FC" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Náhled v doručené poště (Inbox)</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Předmět e-mailu *</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="např. Nový beat pack je venku 🔥"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Preheader (náhledový text v inboksu)</label>
                <input
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="např. Stáhni si nejnovější kity pro tvůj příští track…"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div
            style={{
              width: previewMode === "mobile" ? "390px" : "640px",
              maxWidth: "100%",
              margin: "0 auto",
              background: "#0a0a0a",
              border: previewMode === "mobile" ? "12px solid #1a1a1a" : "1px solid #222",
              borderRadius: previewMode === "mobile" ? "40px" : "10px",
              boxShadow: "0 15px 50px rgba(0,0,0,0.85)",
              overflow: "hidden",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
            }}
          >
            {/* Phone Notch Mockup in Mobile Mode */}
            {previewMode === "mobile" && (
              <div style={{ background: "#1a1a1a", padding: "8px 0 4px 0", textAlign: "center" }}>
                <div style={{ width: "120px", height: "14px", background: "#0a0a0a", borderRadius: "10px", margin: "0 auto" }} />
              </div>
            )}

            {/* Header Logo Banner */}
            <div style={{ padding: "28px 0 20px 0", textAlign: "center", borderBottom: "1px solid #1f1f1f", background: "#0a0a0a" }}>
              <img
                src="/uploads/artwork/voodoo808-main-logo.png"
                alt="VOODOO808"
                style={{ width: "160px", height: "auto", display: "inline-block" }}
                onError={(e) => {
                  (e.currentTarget as any).style.display = "none";
                }}
              />
              <div style={{ color: "#fff", fontWeight: 900, fontSize: "18px", letterSpacing: "3px", textTransform: "uppercase" }}>
                VOODOO808
              </div>
            </div>

            {/* Block Canvas Area */}
            <div style={{ padding: "20px 16px" }}>
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
                        marginBottom: "10px",
                        padding: "8px",
                        border: isSelected ? "2px solid #ffffff" : "1px dashed rgba(255,255,255,0.08)",
                        borderRadius: "8px",
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
                          gap: "3px",
                          background: "#181818",
                          border: "1px solid #333",
                          borderRadius: "6px",
                          padding: "2px 4px",
                          zIndex: 10,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                          disabled={idx === 0}
                          title="Posunout nahoru"
                          style={{ background: "none", border: "none", color: idx === 0 ? "#444" : "#ccc", cursor: "pointer", padding: "3px" }}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                          disabled={idx === blocks.length - 1}
                          title="Posunout dolů"
                          style={{ background: "none", border: "none", color: idx === blocks.length - 1 ? "#444" : "#ccc", cursor: "pointer", padding: "3px" }}
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(idx); }}
                          title="Duplikovat"
                          style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: "3px" }}
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          title="Smazat"
                          style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", padding: "3px" }}
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
            <div style={{ padding: "24px 20px", borderTop: "1px solid #1f1f1f", textAlign: "center", background: "#080808" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#555", lineHeight: 1.6 }}>
                VOODOO808 • Vojtěch Vojkovský<br />
                <span style={{ color: "#777", textDecoration: "underline" }}>Odhlásit se z marketingových e-mailů</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Inspector ───────────────────────────────────────── */}
        <div style={{ background: "#0b0b0b", borderLeft: "1px solid #1a1a1a", padding: "18px 14px", overflowY: "auto" }}>
          {selectedBlock ? (
            <div>
              {/* Tab Selector */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "3px" }}>
                <button
                  onClick={() => setActiveInspectorTab("content")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: activeInspectorTab === "content" ? "rgba(255,255,255,0.12)" : "transparent",
                    color: activeInspectorTab === "content" ? "#fff" : "#777",
                  }}
                >
                  <Sliders size={13} /> Obsah
                </button>
                <button
                  onClick={() => setActiveInspectorTab("style")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: activeInspectorTab === "style" ? "rgba(255,255,255,0.12)" : "transparent",
                    color: activeInspectorTab === "style" ? "#fff" : "#777",
                  }}
                >
                  <Palette size={13} /> Vzhled
                </button>
              </div>

              <BlockInspector
                block={selectedBlock}
                onChange={updateSelectedBlock}
                selectItems={selectItems}
                activeTab={activeInspectorTab}
              />
            </div>
          ) : (
            <div style={{ padding: "40px 10px", textAlign: "center", color: "#555", fontSize: "12px" }}>
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
              borderRadius: "10px",
              width: "min(420px, 96vw)",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#eee", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={16} style={{ color: "#0B99FC" }} /> Odeslat testovací e-mail
            </div>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px", lineHeight: 1.5 }}>
              Zašleme náhled s aktuálními bloky a předmětem na vaši zadanou e-mailovou adresu přes Resend API.
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
                  marginTop: "12px",
                }}
              >
                {testResult}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleTestSendSubmit}
                disabled={isTestSending}
                style={{
                  flex: 1,
                  background: "#0B99FC",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "9px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
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
                  borderRadius: "6px",
                  padding: "9px 16px",
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

// ── Block Renderer (In-canvas visual representation) ───────────────────────
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
              padding: "10px 24px",
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
              style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }}
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
    case "multi_beat_grid": {
      const items = block.gridItems && block.gridItems.length > 0 ? block.gridItems : [
        { title: "Beat #1", subtitle: "140 BPM", price: "990 Kč", coverUrl: "" },
        { title: "Beat #2", subtitle: "130 BPM", price: "990 Kč", coverUrl: "" },
      ];
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: "10px", margin: "8px 0" }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              {item.coverUrl ? (
                <img src={item.coverUrl} alt="" style={{ width: "100%", height: "90px", borderRadius: "6px", objectFit: "cover", marginBottom: "8px" }} />
              ) : (
                <div style={{ width: "100%", height: "90px", background: "#1a1a1a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", marginBottom: "8px" }}>
                  <Music size={20} />
                </div>
              )}
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "10px", color: "#777", margin: "2px 0 6px 0" }}>
                {item.subtitle}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0B99FC" }}>
                {item.price}
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "coupon_box": {
      return (
        <div style={{ background: "#111", border: "2px dashed #ffffff", borderRadius: "8px", padding: "16px", textAlign: "center", margin: "8px 0" }}>
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", textTransform: "uppercase", marginBottom: "6px" }}>
            {block.couponDiscount || "20% SLEVA"}
          </span>
          <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "2px", color: "#fff", fontFamily: "monospace", margin: "4px 0" }}>
            {block.couponCode || "VOODOO20"}
          </div>
          <div style={{ fontSize: "11px", color: "#888" }}>
            {block.couponDescription || "Použijte kód v košíku pro získání slevy."}
          </div>
        </div>
      );
    }
    case "social_links": {
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", padding: "12px 0", fontSize: "12px", color: "#888", fontWeight: 600 }}>
          <span>Instagram</span>
          <span>•</span>
          <span>YouTube</span>
          <span>•</span>
          <span>Spotify</span>
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
  activeTab,
}: {
  block: EmailBlock;
  onChange: (patch: Partial<EmailBlock>) => void;
  selectItems: SelectItem[];
  activeTab: "content" | "style";
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 9px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
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
      <div style={{ fontSize: "12px", fontWeight: 700, color: "#eee", marginBottom: "14px", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Nastavení: <strong style={{ color: "#0B99FC" }}>{block.type}</strong></span>
        <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", color: "#888" }}>#{block.id.slice(-4)}</span>
      </div>

      {activeTab === "style" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "6px" }}>Rychlá paleta barev</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    if (block.type === "heading") onChange({ headingColor: c });
                    if (block.type === "button") onChange({ buttonBgColor: c });
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: c,
                    border: "1px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {block.type === "heading" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Barva nadpisu</label>
              <input
                type="color"
                value={block.headingColor || "#ffffff"}
                onChange={(e) => onChange({ headingColor: e.target.value })}
                style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
              />
            </div>
          )}

          {block.type === "button" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Barva pozadí</label>
                <input
                  type="color"
                  value={block.buttonBgColor || "#ffffff"}
                  onChange={(e) => onChange({ buttonBgColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Barva textu</label>
                <input
                  type="color"
                  value={block.buttonTextColor || "#000000"}
                  onChange={(e) => onChange({ buttonTextColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
            </>
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
        </div>
      ) : (
        /* Content Tab */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {block.type === "heading" && (
            <>
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
            </>
          )}

          {block.type === "paragraph" && (
            <>
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
            </>
          )}

          {block.type === "button" && (
            <>
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
            </>
          )}

          {block.type === "image" && (
            <>
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
            </>
          )}

          {block.type === "beat_highlight" && (
            <>
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
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Cena</label>
                <input
                  value={block.beatPrice || ""}
                  onChange={(e) => onChange({ beatPrice: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {block.type === "coupon_box" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Promo kód</label>
                <input
                  value={block.couponCode || ""}
                  onChange={(e) => onChange({ couponCode: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Sleva (Štítek)</label>
                <input
                  value={block.couponDiscount || ""}
                  onChange={(e) => onChange({ couponDiscount: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>Popis akce</label>
                <input
                  value={block.couponDescription || ""}
                  onChange={(e) => onChange({ couponDescription: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {block.type === "hero" && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
