import React, { useState, useEffect, useCallback, useRef } from "react";
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
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  Code2,
  CheckCircle2,
  Layers
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
  paragraphColor?: string;
  paragraphFontSize?: string;

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
  heroBgColor?: string;
  heroTitleColor?: string;

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

const BRAND_COLORS = [
  "#ffffff",
  "#000000",
  "#ff2d55",
  "#0B99FC",
  "#eab308",
  "#22c55e",
  "#111111",
  "#222222",
  "#444444",
  "#888888",
  "#aaaaaa",
];

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: "Nadpis",
  paragraph: "Odstavec",
  button: "Tlačítko (CTA)",
  image: "Obrázek",
  divider: "Oddělovač",
  spacer: "Mezera",
  hero: "Hero Banner",
  beat_highlight: "Beat Highlight",
  multi_beat_grid: "Mřížka beatů",
  info_box: "Informační box",
  coupon_box: "Slevový kód",
  social_links: "Sociální sítě",
};

// Replaces template variables with sample values for realistic WYSIWYG preview
function substituteSampleVars(text?: string): string {
  if (!text) return "";
  const samples: Record<string, string> = {
    first_name: "Petr",
    email: "petr@example.com",
    site_url: "https://voodoo808.com",
    unsubscribe_url: "https://voodoo808.com/odhlasit-marketing",
  };
  return text.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_, key) => samples[key] ?? `{{${key}}}`);
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

  // Starter blocks default
  const defaultBlocks: EmailBlock[] = [
    {
      id: "b1",
      type: "heading",
      headingText: "Nová hudba na VOODOO808 🔥",
      headingLevel: "h1",
      headingAlign: "center",
      headingColor: "#ffffff",
    },
    {
      id: "b2",
      type: "paragraph",
      paragraphText:
        "Ahoj {{first_name}},\n\npřipravili jsme pro tebe zrovna nové exkluzivní beaty a sound kity přímo z našeho studia. Podívej se na novinky níže!",
      paragraphAlign: "left",
      paragraphColor: "#aaaaaa",
      paragraphFontSize: "15px",
    },
    {
      id: "b3",
      type: "hero",
      heroTitle: "VOODOO808 NEW RELEASES",
      heroSubtitle: "Prémiové trap & drill beaty se 100% autorskými právy.",
      heroImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80",
      heroButtonText: "PROHLÉDNOUT SI KATALOG",
      heroButtonUrl: "{{site_url}}/beaty",
    },
    {
      id: "b4",
      type: "button",
      buttonText: "ZÍSKAT SLEVU NA BEATY",
      buttonUrl: "{{site_url}}/beaty",
      buttonAlign: "center",
      buttonBgColor: "#ffffff",
      buttonTextColor: "#000000",
    },
  ];

  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    return Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : defaultBlocks;
  });

  // Track initial snapshot for dirty state & unsaved changes warning
  const initialSnapshotRef = useRef(
    JSON.stringify({
      subject: initialSubject,
      preheader: initialPreheader,
      blocks: Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : defaultBlocks,
    })
  );

  const isDirty =
    JSON.stringify({ subject, preheader, blocks }) !== initialSnapshotRef.current;

  // Warn on browser tab / window close if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Safe close handler with prompt
  const handleSafeClose = () => {
    if (isDirty) {
      if (window.confirm("Máte neuložené změny. Opravdu chcete editor zavřít bez uložení?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // History stack for Undo / Redo
  const [history, setHistory] = useState<EmailBlock[][]>([
    Array.isArray(initialBlocks) && initialBlocks.length > 0 ? initialBlocks : defaultBlocks,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateBlocksState = useCallback(
    (newBlocks: EmailBlock[]) => {
      setBlocks(newBlocks);
      setHistory((prev) => {
        const nextHistory = prev.slice(0, historyIndex + 1);
        return [...nextHistory, newBlocks];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

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
  const [viewTab, setViewTab] = useState<"builder" | "live_preview">("builder");
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  // Live compiled HTML for iframe preview
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Debounced fetch of live compiled HTML from backend endpoint
  useEffect(() => {
    let timer = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const res = await fetch("/api/marketing/preview-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ blocks, subject, preheader }),
        });
        if (res.ok) {
          const html = await res.text();
          setPreviewHtml(html);
        }
      } catch (err) {
        console.error("Failed to load block preview:", err);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [blocks, subject, preheader]);

  const [testEmail, setTestEmail] = useState(
    () => localStorage.getItem("voodoo808_marketing_test_email") || ""
  );
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
      newBlock.paragraphColor = "#aaaaaa";
      newBlock.paragraphFontSize = "15px";
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
      newBlock.beatstarsUrl = "https://beatstars.com/voodoo808";
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
      initialSnapshotRef.current = JSON.stringify({ subject, preheader, blocks });
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
          body: JSON.stringify({ email: testEmail, subject, preheader, blocks }),
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

  // Subject line character length guidance
  const subjectLen = subject.length;
  let subjectBadgeColor = "#22c55e";
  let subjectBadgeText = `Ideální délka (${subjectLen}/60)`;
  if (subjectLen === 0) {
    subjectBadgeColor = "#888";
    subjectBadgeText = "Vyžadováno";
  } else if (subjectLen > 70) {
    subjectBadgeColor = "#ef4444";
    subjectBadgeText = `Příliš dlouhé (${subjectLen}/60) — na mobilech se ořízne`;
  } else if (subjectLen > 50) {
    subjectBadgeColor = "#f59e0b";
    subjectBadgeText = `Delší předmět (${subjectLen}/60)`;
  }

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
          padding: "10px 20px",
          background: "rgba(13, 13, 13, 0.98)",
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
            <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#666" }}>{blocks.length} bloků</span>
              <span style={{ color: "#444" }}>•</span>
              {isDirty ? (
                <span style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                  Neuložené změny
                </span>
              ) : (
                <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                  Vše uloženo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Toolbar: History & Canvas Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Undo / Redo */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
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

          {/* Builder vs Live Preview Toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setViewTab("builder")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: viewTab === "builder" ? "rgba(255,255,255,0.12)" : "transparent",
                color: viewTab === "builder" ? "#fff" : "#888",
              }}
            >
              <Layers size={13} /> Editor bloků
            </button>
            <button
              onClick={() => setViewTab("live_preview")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                fontSize: "11px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: viewTab === "live_preview" ? "#0B99FC" : "transparent",
                color: viewTab === "live_preview" ? "#fff" : "#888",
              }}
            >
              <Eye size={13} /> Živý HTML náhled
              {isPreviewLoading && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1s infinite",
                  }}
                />
              )}
            </button>
          </div>

          {/* Device Toggle (Desktop / Mobile) */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setPreviewMode("desktop")}
              title="Náhled na počítači"
              style={{
                padding: "5px 8px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "desktop" ? "rgba(255,255,255,0.12)" : "transparent",
                color: previewMode === "desktop" ? "#fff" : "#666",
              }}
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              title="Náhled na mobilu"
              style={{
                padding: "5px 8px",
                fontSize: "11px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: previewMode === "mobile" ? "rgba(255,255,255,0.12)" : "transparent",
                color: previewMode === "mobile" ? "#fff" : "#666",
              }}
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              setShowTestModal(true);
              setTestResult(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 13px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "#eee",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Send size={13} style={{ color: "#0B99FC" }} /> Odeslat test
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              background: "#ffffff",
              color: "#000000",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            <Check size={14} /> {isSaving ? "Ukládám…" : "Uložit šablonu"}
          </button>

          <button
            onClick={handleSafeClose}
            title="Zavřít editor"
            style={{
              background: "none",
              border: "none",
              color: "#888",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Main Workspace Layout ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 340px", flex: 1, overflow: "hidden" }}>
        {/* Left Drawer: Block Palette */}
        <div
          style={{
            background: "#0b0b0b",
            borderRight: "1px solid #1a1a1a",
            padding: "16px 14px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Layers size={13} /> Bloky e-mailu
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "8px" }}>
                  {cat.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          addBlock(item.type);
                          if (viewTab !== "builder") setViewTab("builder");
                        }}
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
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <HelpCircle size={12} /> Proměnné do předmětu
            </div>
            <p style={{ fontSize: "11px", color: "#666", marginBottom: "8px", lineHeight: 1.4 }}>
              Kliknutím vložíte tag do předmětu nebo preheaderu:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["first_name", "email", "site_url", "unsubscribe_url"].map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariableToActive(v, "subject")}
                  title={`Přidat {{${v}}} do předmětu`}
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

        {/* ── Middle Live Workspace ─────────────────────────────────────────── */}
        <div
          style={{
            background: "#050505",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "20px 16px 40px 16px",
          }}
        >
          {/* Inbox Preview Header Box */}
          <div
            style={{
              width: "min(680px, 98%)",
              margin: "0 auto 20px auto",
              background: "#0d0d0d",
              border: "1px solid #1f1f1f",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                borderBottom: "1px solid #1a1a1a",
                paddingBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Eye size={14} style={{ color: "#0B99FC" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Nastavení doručení &amp; Inbox
                </span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: subjectBadgeColor,
                  background: "rgba(255,255,255,0.04)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border: `1px solid ${subjectBadgeColor}33`,
                }}
              >
                {subjectBadgeText}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#888",
                    marginBottom: "4px",
                  }}
                >
                  <span>Předmět e-mailu *</span>
                  <span style={{ color: subjectBadgeColor }}>{subjectLen}/60 znaků</span>
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="např. Nový beat pack je venku 🔥"
                  style={{
                    ...inputStyle,
                    borderColor: subjectLen > 70 ? "#ef4444" : "#262626",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Preheader (náhledový text zobrazený v seznamu e-mailů)
                </label>
                <input
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="např. Stáhni si nejnovější kity pro tvůj příští track…"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Canvas or Live Iframe View */}
          {viewTab === "live_preview" ? (
            /* Live WYSIWYG Iframe View */
            <div
              style={{
                width: previewMode === "mobile" ? "390px" : "640px",
                maxWidth: "100%",
                height: "750px",
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
              {previewMode === "mobile" && (
                <div style={{ background: "#1a1a1a", padding: "8px 0 4px 0", textAlign: "center" }}>
                  <div style={{ width: "120px", height: "14px", background: "#0a0a0a", borderRadius: "10px", margin: "0 auto" }} />
                </div>
              )}
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Live Email Preview"
                  style={{
                    width: "100%",
                    height: previewMode === "mobile" ? "calc(100% - 26px)" : "100%",
                    border: "none",
                    background: "#0a0a0a",
                  }}
                  sandbox="allow-same-origin allow-popups"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  Generuji přesný HTML náhled…
                </div>
              )}
            </div>
          ) : (
            /* Interactive Block Editor Canvas */
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
              <div style={{ padding: "32px 0 24px 0", textAlign: "center", borderBottom: "1px solid #1f1f1f", background: "#0a0a0a" }}>
                <img
                  src="/uploads/artwork/voodoo808-main-logo.png"
                  alt="VOODOO808"
                  style={{ width: "200px", height: "auto", display: "inline-block" }}
                  onError={(e) => {
                    (e.currentTarget as any).style.display = "none";
                  }}
                />
                <div style={{ color: "#fff", fontWeight: 900, fontSize: "18px", letterSpacing: "3px", textTransform: "uppercase" }}>
                  VOODOO808
                </div>
              </div>

              {/* Block Canvas Area */}
              <div style={{ padding: "24px 20px" }}>
                {blocks.length === 0 ? (
                  <div
                    style={{
                      padding: "48px 24px",
                      textAlign: "center",
                      background: "#0f0f0f",
                      border: "2px dashed #222",
                      borderRadius: "12px",
                      margin: "12px 0",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                        color: "#888",
                      }}
                    >
                      <Layers size={20} />
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#eee", marginBottom: "6px" }}>
                      Váš e-mail je zatím prázdný
                    </div>
                    <p style={{ fontSize: "12px", color: "#666", maxWidth: "340px", margin: "0 auto 16px auto", lineHeight: 1.5 }}>
                      Klikněte na blok v levém panelu pro přidání, nebo začněte s připravenou šablonou.
                    </p>
                    <button
                      onClick={() => updateBlocksState(defaultBlocks)}
                      style={{
                        padding: "8px 16px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Načíst výchozí šablonu
                    </button>
                  </div>
                ) : (
                  blocks.map((block, idx) => {
                    const isSelected = block.id === selectedBlockId;
                    const isHovered = block.id === hoveredBlockId;
                    const showToolbar = isSelected || isHovered;

                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        style={{
                          position: "relative",
                          marginBottom: "12px",
                          padding: "10px 12px",
                          border: isSelected
                            ? "2px solid #ffffff"
                            : isHovered
                            ? "1px solid rgba(255,255,255,0.25)"
                            : "1px dashed rgba(255,255,255,0.07)",
                          borderRadius: "8px",
                          background: isSelected ? "rgba(255,255,255,0.02)" : "transparent",
                          cursor: "pointer",
                          transition: "border 0.15s ease, background 0.15s ease",
                        }}
                      >
                        {/* Block Action Controls Toolbar (Shows on Hover & on Select) */}
                        <div
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "-12px",
                            display: showToolbar ? "flex" : "none",
                            alignItems: "center",
                            gap: "3px",
                            background: "#1c1c1c",
                            border: "1px solid #333",
                            borderRadius: "6px",
                            padding: "3px 6px",
                            zIndex: 20,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#888",
                              textTransform: "uppercase",
                              paddingRight: "4px",
                              borderRight: "1px solid #333",
                              marginRight: "2px",
                            }}
                          >
                            {BLOCK_TYPE_LABELS[block.type] || block.type}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(idx, -1);
                            }}
                            disabled={idx === 0}
                            title="Posunout nahoru"
                            style={{
                              background: "none",
                              border: "none",
                              color: idx === 0 ? "#444" : "#ccc",
                              cursor: idx === 0 ? "not-allowed" : "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(idx, 1);
                            }}
                            disabled={idx === blocks.length - 1}
                            title="Posunout dolů"
                            style={{
                              background: "none",
                              border: "none",
                              color: idx === blocks.length - 1 ? "#444" : "#ccc",
                              cursor: idx === blocks.length - 1 ? "not-allowed" : "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(idx);
                            }}
                            title="Duplikovat blok"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ccc",
                              cursor: "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                            title="Smazat blok"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Render Block visually with variable substitutions */}
                        <BlockRenderer block={block} />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Branded Footer Preview (Matches brandKit.ts exactly) */}
              <div
                style={{
                  padding: "32px 20px",
                  borderTop: "1px solid #1f1f1f",
                  textAlign: "center",
                  background: "#080808",
                }}
              >
                <p style={{ margin: 0, fontSize: "11px", color: "#555555", lineHeight: 1.7 }}>
                  VOODOO808 &bull; Vojtěch Vojkovský<br />
                  <span style={{ color: "#666666", textDecoration: "underline" }}>
                    Odhlásit se z marketingových e-mailů
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Drawer: Property Inspector ─────────────────────────────── */}
        <div
          style={{
            background: "#0b0b0b",
            borderLeft: "1px solid #1a1a1a",
            padding: "16px 14px",
            overflowY: "auto",
          }}
        >
          {selectedBlock ? (
            <div>
              {/* Tab Selector: Obsah vs Vzhled */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  marginBottom: "16px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "6px",
                  padding: "3px",
                }}
              >
                <button
                  onClick={() => setActiveInspectorTab("content")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "7px",
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
                    padding: "7px",
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
              Klikněte na jakýkoliv blok v e-mailu pro úpravu jeho obsahu nebo vzhledu.
            </div>
          )}
        </div>
      </div>

      {/* ── Test Email Send Modal ─────────────────────────────────────────── */}
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
              border: "1px solid #262626",
              borderRadius: "12px",
              width: "min(460px, 96vw)",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#eee",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Send size={16} style={{ color: "#0B99FC" }} /> Odeslat testovací e-mail
            </div>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px", lineHeight: 1.5 }}>
              Zašleme kompletní náhled se všemi styly a {blocks.length} bloky přes Resend API.
            </p>

            {/* Subject preview inside test modal so admin verifies what's being tested */}
            <div
              style={{
                background: "#141414",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <div style={{ color: "#666", fontSize: "10px", textTransform: "uppercase", marginBottom: "2px" }}>
                Předmět testu
              </div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{subject || "(Bez předmětu)"}</div>
              {preheader && (
                <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
                  Preheader: {preheader}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                Příjemce testu
              </label>
              <input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="vase@adresa.cz"
                style={inputStyle}
              />
            </div>

            {testResult && (
              <div
                style={{
                  fontSize: "12px",
                  color: testResult.startsWith("Chyba") ? "#ef4444" : "#22c55e",
                  marginTop: "12px",
                  background: testResult.startsWith("Chyba") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${testResult.startsWith("Chyba") ? "#ef444433" : "#22c55e33"}`,
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
                  padding: "10px 16px",
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
                  padding: "10px 16px",
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

// ── Block Renderer (Visual Canvas Representation with Variable Substitution) ──
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
          {substituteSampleVars(block.headingText) || "Nadpis"}
        </div>
      );
    }
    case "paragraph": {
      const fontSize = block.paragraphFontSize || "15px";
      const color = block.paragraphColor || "#aaaaaa";
      return (
        <div
          style={{
            fontSize,
            color,
            lineHeight: 1.6,
            textAlign: block.paragraphAlign || "left",
            whiteSpace: "pre-wrap",
          }}
        >
          {substituteSampleVars(block.paragraphText) || "Text odstavce…"}
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
              padding: "11px 26px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {substituteSampleVars(block.buttonText) || "TLAČÍTKO"}
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
                display: "inline-block",
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
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
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
            background: block.heroBgColor || "#111111",
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
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: block.heroTitleColor || "#ffffff",
                marginBottom: "6px",
              }}
            >
              {substituteSampleVars(block.heroTitle) || "HERO NADPIS"}
            </div>
            <div style={{ fontSize: "13px", color: "#aaaaaa", marginBottom: "14px" }}>
              {substituteSampleVars(block.heroSubtitle) || "Podnadpis hero sekce"}
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
              {substituteSampleVars(block.heroButtonText) || "TLAČÍTKO"}
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
      const items =
        block.gridItems && block.gridItems.length > 0
          ? block.gridItems
          : [
              { title: "Beat #1", subtitle: "140 BPM", price: "990 Kč", coverUrl: "" },
              { title: "Beat #2", subtitle: "130 BPM", price: "990 Kč", coverUrl: "" },
            ];
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${items.length}, 1fr)`,
            gap: "10px",
            margin: "8px 0",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "90px",
                    borderRadius: "6px",
                    objectFit: "cover",
                    marginBottom: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "90px",
                    background: "#1a1a1a",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#444",
                    marginBottom: "8px",
                  }}
                >
                  <Music size={20} />
                </div>
              )}
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
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
        <div
          style={{
            background: "#111",
            border: "2px dashed #ffffff",
            borderRadius: "8px",
            padding: "16px",
            textAlign: "center",
            margin: "8px 0",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "12px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {block.couponDiscount || "20% SLEVA"}
          </span>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "2px",
              color: "#fff",
              fontFamily: "monospace",
              margin: "4px 0",
            }}
          >
            {block.couponCode || "VOODOO20"}
          </div>
          <div style={{ fontSize: "11px", color: "#888" }}>
            {substituteSampleVars(block.couponDescription) || "Použijte kód v košíku pro získání slevy."}
          </div>
        </div>
      );
    }
    case "social_links": {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            padding: "12px 0",
            fontSize: "12px",
            color: "#888",
            fontWeight: 600,
          }}
        >
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
              {substituteSampleVars(block.infoTitle)}
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#aaa", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {substituteSampleVars(block.infoText) || "Text boxu…"}
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

  const insertVariableIntoParagraph = (varName: string) => {
    const current = block.paragraphText || "";
    onChange({ paragraphText: current + ` {{${varName}}}` });
  };

  return (
    <div>
      {/* Header with human-friendly Czech block name */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#eee",
          marginBottom: "14px",
          borderBottom: "1px solid #1a1a1a",
          paddingBottom: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          Nastavení: <strong style={{ color: "#0B99FC" }}>{BLOCK_TYPE_LABELS[block.type] || block.type}</strong>
        </span>
        <span
          style={{
            fontSize: "10px",
            background: "rgba(255,255,255,0.06)",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "#888",
          }}
        >
          #{block.id.slice(-4)}
        </span>
      </div>

      {activeTab === "style" ? (
        /* ── Style Tab for All Blocks ─────────────────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Quick Color Palette for color-supporting blocks */}
          {(block.type === "heading" ||
            block.type === "paragraph" ||
            block.type === "button" ||
            block.type === "info_box" ||
            block.type === "divider") && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "6px" }}>
                Rychlá paleta barev
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      if (block.type === "heading") onChange({ headingColor: c });
                      else if (block.type === "paragraph") onChange({ paragraphColor: c });
                      else if (block.type === "button") onChange({ buttonBgColor: c });
                      else if (block.type === "info_box") onChange({ infoBorderColor: c });
                      else if (block.type === "divider") onChange({ dividerColor: c });
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: c,
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Heading Style */}
          {block.type === "heading" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva nadpisu
                </label>
                <input
                  type="color"
                  value={block.headingColor || "#ffffff"}
                  onChange={(e) => onChange({ headingColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Zarovnání
                </label>
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

          {/* Paragraph Style */}
          {block.type === "paragraph" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva textu
                </label>
                <input
                  type="color"
                  value={block.paragraphColor || "#aaaaaa"}
                  onChange={(e) => onChange({ paragraphColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Velikost písma
                </label>
                <select
                  value={block.paragraphFontSize || "15px"}
                  onChange={(e) => onChange({ paragraphFontSize: e.target.value })}
                  style={inputStyle}
                >
                  <option value="13px">Malé (13px)</option>
                  <option value="15px">Standardní (15px)</option>
                  <option value="17px">Větší (17px)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Zarovnání
                </label>
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

          {/* Button Style */}
          {block.type === "button" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva pozadí tlačítka
                </label>
                <input
                  type="color"
                  value={block.buttonBgColor || "#ffffff"}
                  onChange={(e) => onChange({ buttonBgColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva textu tlačítka
                </label>
                <input
                  type="color"
                  value={block.buttonTextColor || "#000000"}
                  onChange={(e) => onChange({ buttonTextColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Zarovnání tlačítka
                </label>
                <select
                  value={block.buttonAlign || "center"}
                  onChange={(e) => onChange({ buttonAlign: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="left">Vlevo</option>
                  <option value="center">Na střed</option>
                  <option value="right">Vpravo</option>
                </select>
              </div>
            </>
          )}

          {/* Image Style */}
          {block.type === "image" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Šířka obrázku
                </label>
                <select
                  value={block.imageWidth || "100%"}
                  onChange={(e) => onChange({ imageWidth: e.target.value })}
                  style={inputStyle}
                >
                  <option value="100%">100% (Plná šířka)</option>
                  <option value="80%">80%</option>
                  <option value="60%">60%</option>
                  <option value="40%">40%</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Zarovnání obrázku
                </label>
                <select
                  value={block.imageAlign || "center"}
                  onChange={(e) => onChange({ imageAlign: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="left">Vlevo</option>
                  <option value="center">Na střed</option>
                  <option value="right">Vpravo</option>
                </select>
              </div>
            </>
          )}

          {/* Hero Style */}
          {block.type === "hero" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva pozadí banneru
                </label>
                <input
                  type="color"
                  value={block.heroBgColor || "#111111"}
                  onChange={(e) => onChange({ heroBgColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva titulku
                </label>
                <input
                  type="color"
                  value={block.heroTitleColor || "#ffffff"}
                  onChange={(e) => onChange({ heroTitleColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
            </>
          )}

          {/* Info Box Style */}
          {block.type === "info_box" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva pozadí boxu
                </label>
                <input
                  type="color"
                  value={block.infoBgColor || "#111111"}
                  onChange={(e) => onChange({ infoBgColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva rámečku
                </label>
                <input
                  type="color"
                  value={block.infoBorderColor || "#222222"}
                  onChange={(e) => onChange({ infoBorderColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
            </>
          )}

          {/* Spacer Style */}
          {block.type === "spacer" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                Výška mezery ({block.spacerHeight || 24}px)
              </label>
              <input
                type="range"
                min={8}
                max={120}
                value={block.spacerHeight || 24}
                onChange={(e) => onChange({ spacerHeight: Number(e.target.value) })}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {/* Divider Style */}
          {block.type === "divider" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Styl čáry
                </label>
                <select
                  value={block.dividerStyle || "solid"}
                  onChange={(e) => onChange({ dividerStyle: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="solid">Plná čára (Solid)</option>
                  <option value="dashed">Čárkovaná (Dashed)</option>
                  <option value="dotted">Tečkovaná (Dotted)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Barva oddělovače
                </label>
                <input
                  type="color"
                  value={block.dividerColor || "#222222"}
                  onChange={(e) => onChange({ dividerColor: e.target.value })}
                  style={{ ...inputStyle, height: "36px", padding: "2px", cursor: "pointer" }}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Content Tab ──────────────────────────────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Heading Content */}
          {block.type === "heading" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Text nadpisu
                </label>
                <input
                  value={block.headingText || ""}
                  onChange={(e) => onChange({ headingText: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Velikost (Level)
                </label>
                <select
                  value={block.headingLevel || "h1"}
                  onChange={(e) => onChange({ headingLevel: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="h1">Velký (H1 - 24px)</option>
                  <option value="h2">Střední (H2 - 20px)</option>
                  <option value="h3">Malý (H3 - 17px)</option>
                </select>
              </div>
            </>
          )}

          {/* Paragraph Content */}
          {block.type === "paragraph" && (
            <>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <label style={{ fontSize: "11px", color: "#888" }}>Text odstavce</label>
                  <span style={{ fontSize: "10px", color: "#666" }}>Podporuje proměnné</span>
                </div>
                <textarea
                  rows={6}
                  value={block.paragraphText || ""}
                  onChange={(e) => onChange({ paragraphText: e.target.value })}
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                />
                {/* Variable insertion chips right in the inspector */}
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", color: "#666" }}>+ Vložit:</span>
                  {["first_name", "email", "site_url"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariableIntoParagraph(v)}
                      style={{
                        background: "rgba(11, 153, 252, 0.1)",
                        border: "1px solid rgba(11, 153, 252, 0.3)",
                        borderRadius: "3px",
                        padding: "2px 6px",
                        fontSize: "10px",
                        color: "#0B99FC",
                        cursor: "pointer",
                      }}
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Button Content */}
          {block.type === "button" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Text tlačítka
                </label>
                <input
                  value={block.buttonText || ""}
                  onChange={(e) => onChange({ buttonText: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Cílová URL adresa
                </label>
                <input
                  value={block.buttonUrl || ""}
                  onChange={(e) => onChange({ buttonUrl: e.target.value })}
                  placeholder="{{site_url}}/beaty"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Image Content */}
          {block.type === "image" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  URL obrázku
                </label>
                <input
                  value={block.imageUrl || ""}
                  onChange={(e) => onChange({ imageUrl: e.target.value })}
                  placeholder="https://…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Odkaz po kliknutí (Link URL)
                </label>
                <input
                  value={block.imageLink || ""}
                  onChange={(e) => onChange({ imageLink: e.target.value })}
                  placeholder="{{site_url}}/beaty"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Alt text (popisek pro čtečky / blokované obrázky)
                </label>
                <input
                  value={block.imageAlt || ""}
                  onChange={(e) => onChange({ imageAlt: e.target.value })}
                  placeholder="Popis obrázku"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Hero Content (Includes Button Text & Button URL) */}
          {block.type === "hero" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Hlavní nadpis
                </label>
                <input
                  value={block.heroTitle || ""}
                  onChange={(e) => onChange({ heroTitle: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Podnadpis
                </label>
                <input
                  value={block.heroSubtitle || ""}
                  onChange={(e) => onChange({ heroSubtitle: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  URL obrázku v pozadí
                </label>
                <input
                  value={block.heroImageUrl || ""}
                  onChange={(e) => onChange({ heroImageUrl: e.target.value })}
                  placeholder="https://…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Text tlačítka hero banneru
                </label>
                <input
                  value={block.heroButtonText || ""}
                  onChange={(e) => onChange({ heroButtonText: e.target.value })}
                  placeholder="PROZKOUMAT KATALOG"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Cílová URL tlačítka
                </label>
                <input
                  value={block.heroButtonUrl || ""}
                  onChange={(e) => onChange({ heroButtonUrl: e.target.value })}
                  placeholder="{{site_url}}/beaty"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Beat Highlight Content */}
          {block.type === "beat_highlight" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Vybrat z obchodu (Beat / Sound Kit)
                </label>
                <select onChange={handleSelectBeatChange} style={inputStyle}>
                  <option value="">-- Vyberte položku pro předvyplnění --</option>
                  {selectItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.subtitle} - {item.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Název beatu / kitu
                </label>
                <input
                  value={block.beatTitle || ""}
                  onChange={(e) => onChange({ beatTitle: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Podtitul (např. Exkluzivní novinka)
                </label>
                <input
                  value={block.beatSubtitle || ""}
                  onChange={(e) => onChange({ beatSubtitle: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  BPM / Tónina
                </label>
                <input
                  value={block.beatBpmKey || ""}
                  onChange={(e) => onChange({ beatBpmKey: e.target.value })}
                  placeholder="140 BPM, D minor"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Cena
                </label>
                <input
                  value={block.beatPrice || ""}
                  onChange={(e) => onChange({ beatPrice: e.target.value })}
                  placeholder="od 990 Kč"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  URL coveru (Obrázek)
                </label>
                <input
                  value={block.beatCoverUrl || ""}
                  onChange={(e) => onChange({ beatCoverUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Odkaz na nákup / poslech
                </label>
                <input
                  value={block.beatUrl || ""}
                  onChange={(e) => onChange({ beatUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Multi Beat Grid Content (Full Item Editor!) */}
          {block.type === "multi_beat_grid" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11px", color: "#888" }}>Položky mřížky (Grid Items)</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.gridItems || [];
                    if (current.length >= 4) {
                      alert("Mřížka podporuje maximálně 4 položky pro zachování čitelnosti v e-mailu.");
                      return;
                    }
                    const newItem: EmailBlockGridItem = {
                      title: selectItems[current.length]?.title || `Beat #${current.length + 1}`,
                      subtitle: selectItems[current.length]?.bpmKey || "140 BPM",
                      price: selectItems[current.length]?.price || "990 Kč",
                      coverUrl: selectItems[current.length]?.coverUrl || "",
                      url: selectItems[current.length]
                        ? `{{site_url}}${selectItems[current.length].url}`
                        : "{{site_url}}/beaty",
                    };
                    onChange({ gridItems: [...current, newItem] });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={12} /> Přidat beat
                </button>
              </div>

              {(block.gridItems || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#141414",
                    border: "1px solid #222",
                    borderRadius: "6px",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                      Položka #{idx + 1}
                    </span>
                    {(block.gridItems || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = (block.gridItems || []).filter((_, i) => i !== idx);
                          onChange({ gridItems: next });
                        }}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                        title="Odebrat z mřížky"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Pick from store dropdown */}
                  <select
                    onChange={(e) => {
                      const found = selectItems.find((s) => s.id === e.target.value);
                      if (found) {
                        const next = [...(block.gridItems || [])];
                        next[idx] = {
                          ...next[idx],
                          title: found.title,
                          subtitle: found.bpmKey || found.subtitle,
                          price: found.price,
                          coverUrl: found.coverUrl,
                          url: `{{site_url}}${found.url}`,
                        };
                        onChange({ gridItems: next });
                      }
                    }}
                    style={inputStyle}
                  >
                    <option value="">-- Vybrat ze skladu --</option>
                    {selectItems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.price})
                      </option>
                    ))}
                  </select>

                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...(block.gridItems || [])];
                      next[idx] = { ...next[idx], title: e.target.value };
                      onChange({ gridItems: next });
                    }}
                    placeholder="Název beatu"
                    style={inputStyle}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <input
                      value={item.subtitle || ""}
                      onChange={(e) => {
                        const next = [...(block.gridItems || [])];
                        next[idx] = { ...next[idx], subtitle: e.target.value };
                        onChange({ gridItems: next });
                      }}
                      placeholder="BPM / Klíč"
                      style={inputStyle}
                    />
                    <input
                      value={item.price || ""}
                      onChange={(e) => {
                        const next = [...(block.gridItems || [])];
                        next[idx] = { ...next[idx], price: e.target.value };
                        onChange({ gridItems: next });
                      }}
                      placeholder="Cena"
                      style={inputStyle}
                    />
                  </div>

                  <input
                    value={item.coverUrl || ""}
                    onChange={(e) => {
                      const next = [...(block.gridItems || [])];
                      next[idx] = { ...next[idx], coverUrl: e.target.value };
                      onChange({ gridItems: next });
                    }}
                    placeholder="URL cover obrázku"
                    style={inputStyle}
                  />

                  <input
                    value={item.url || ""}
                    onChange={(e) => {
                      const next = [...(block.gridItems || [])];
                      next[idx] = { ...next[idx], url: e.target.value };
                      onChange({ gridItems: next });
                    }}
                    placeholder="Cílová URL adresa"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Coupon Box Content */}
          {block.type === "coupon_box" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Promo kód
                </label>
                <input
                  value={block.couponCode || ""}
                  onChange={(e) => onChange({ couponCode: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Výše slevy (Štítek)
                </label>
                <input
                  value={block.couponDiscount || ""}
                  onChange={(e) => onChange({ couponDiscount: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Popis slevové akce
                </label>
                <input
                  value={block.couponDescription || ""}
                  onChange={(e) => onChange({ couponDescription: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Info Box Content */}
          {block.type === "info_box" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Nadpis boxu
                </label>
                <input
                  value={block.infoTitle || ""}
                  onChange={(e) => onChange({ infoTitle: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Text informace
                </label>
                <textarea
                  rows={4}
                  value={block.infoText || ""}
                  onChange={(e) => onChange({ infoText: e.target.value })}
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
            </>
          )}

          {/* Social Links Content (Instagram, YouTube, Spotify, Beatstars) */}
          {block.type === "social_links" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Instagram URL
                </label>
                <input
                  value={block.instagramUrl || ""}
                  onChange={(e) => onChange({ instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/voodoo808"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  YouTube URL
                </label>
                <input
                  value={block.youtubeUrl || ""}
                  onChange={(e) => onChange({ youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/@voodoo808"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Spotify URL
                </label>
                <input
                  value={block.spotifyUrl || ""}
                  onChange={(e) => onChange({ spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/artist/…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  Beatstars URL
                </label>
                <input
                  value={block.beatstarsUrl || ""}
                  onChange={(e) => onChange({ beatstarsUrl: e.target.value })}
                  placeholder="https://beatstars.com/voodoo808"
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
