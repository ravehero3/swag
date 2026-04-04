import { useState } from "react";
import { useApp } from "../App.js";

interface ShareProduct {
  id: number;
  title: string;
  price?: number;
  artwork_url?: string;
}

interface ShareModalProps {
  product?: ShareProduct;
  productType?: "beat" | "sound_kit";
  beatId?: number;
  beatTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

function ShareModal({ product, productType = "beat", beatId, beatTitle, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "story">("link");
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useApp() as any;

  const resolvedId = product?.id ?? beatId ?? 0;
  const resolvedTitle = product?.title ?? beatTitle ?? "";
  const resolvedArtwork = product?.artwork_url ?? "";
  const resolvedType = productType;

  const shareUrl = resolvedType === "sound_kit"
    ? `${window.location.origin}/produkt/sound_kit/${resolvedId}`
    : `${window.location.origin}/beaty?beat=${resolvedId}`;

  const storyBgColor = settings?.ig_story_bg_color || "#000000";
  const storyTextColor = settings?.ig_story_text_color || "#ffffff";
  const overlayOpacity = parseFloat(settings?.ig_story_overlay_opacity || "0.45");
  const listeningText = settings?.ig_story_listening_text || "právě poslouchám";
  const websiteText = settings?.ig_story_website_text || "NA VOODOO808.COM";

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleInstagramShare = () => {
    window.open("https://www.instagram.com/", "_blank");
  };

  const downloadStoryCard = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = storyBgColor;
      ctx.fillRect(0, 0, 1080, 1920);

      if (resolvedArtwork) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = resolvedArtwork;
          setTimeout(resolve, 4000);
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.filter = "blur(40px)";
          const scale = Math.max(1080 / img.naturalWidth, 1920 / img.naturalHeight);
          const bw = img.naturalWidth * scale;
          const bh = img.naturalHeight * scale;
          ctx.drawImage(img, (1080 - bw) / 2, (1920 - bh) / 2, bw, bh);
          ctx.restore();

          ctx.fillStyle = `rgba(0,0,0,${overlayOpacity + 0.2})`;
          ctx.fillRect(0, 0, 1080, 1920);

          const artPad = 120;
          const artSize = 1080 - artPad * 2;
          const artY = (1920 - artSize) / 2 - 80;
          ctx.save();
          ctx.filter = "none";
          const src = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - src) / 2;
          const sy = (img.naturalHeight - src) / 2;
          ctx.drawImage(img, sx, sy, src, src, artPad, artY, artSize, artSize);
          ctx.restore();
        }
      }

      ctx.textAlign = "center";

      ctx.font = "bold 52px Helvetica, Arial, sans-serif";
      ctx.fillStyle = storyTextColor + "cc";
      ctx.letterSpacing = "8px";
      ctx.fillText("VOODOO808", 540, 120);

      const textAreaY = 1920 - 340;

      ctx.font = `italic 36px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = storyTextColor + "88";
      ctx.fillText(listeningText, 540, textAreaY);

      ctx.font = "bold 80px Helvetica, Arial, sans-serif";
      ctx.fillStyle = storyTextColor;
      const titleLines = wrapText(ctx, resolvedTitle.toUpperCase(), 900, 80);
      titleLines.forEach((line, i) => {
        ctx.fillText(line, 540, textAreaY + 60 + i * 96);
      });

      const afterTitle = textAreaY + 60 + titleLines.length * 96 + 30;
      ctx.font = "38px Helvetica, Arial, sans-serif";
      ctx.fillStyle = storyTextColor + "99";
      ctx.fillText(websiteText, 540, afterTitle);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voodoo808-story-${resolvedId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, _fontSize: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000, padding: "20px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: "6px", maxWidth: "480px", width: "100%", padding: "0", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #222" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", margin: 0 }}>Sdílet: {resolvedTitle}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#666", fontSize: "22px", cursor: "pointer", padding: "0", lineHeight: 1, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}>×</button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
          {(["link", "story"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "12px", background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid #fff" : "2px solid transparent", color: activeTab === t ? "#fff" : "#555", fontSize: "13px", fontWeight: activeTab === t ? "600" : "400", cursor: "pointer", transition: "all 0.15s", marginBottom: "-1px" }}>
              {t === "link" ? "Odkaz" : "Instagram Story"}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {activeTab === "link" && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>URL odkaz</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" value={shareUrl} readOnly style={{ flex: 1, padding: "10px 12px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#999", fontSize: "13px" }} />
                  <button onClick={handleCopy} style={{ padding: "10px 18px", background: copied ? "#1a3a1a" : "#fff", color: copied ? "#4CAF50" : "#000", border: copied ? "1px solid #4CAF50" : "none", borderRadius: "4px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {copied ? "✓ Zkopírováno" : "Kopírovat"}
                  </button>
                </div>
              </div>
              <button onClick={handleInstagramShare} style={{ width: "100%", padding: "13px", background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", color: "#fff", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                Otevřít Instagram
              </button>
            </>
          )}

          {activeTab === "story" && (
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ width: "120px", height: "213px", flexShrink: 0, borderRadius: "6px", overflow: "hidden", border: "1px solid #2a2a2a", position: "relative", background: storyBgColor }}>
                {resolvedArtwork && (
                  <img src={resolvedArtwork} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(12px)", transform: "scale(1.1)", opacity: 1 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity + 0.2})` }} />

                <div style={{ position: "absolute", top: "8px", left: 0, right: 0, textAlign: "center", fontSize: "7px", fontWeight: "700", color: storyTextColor, letterSpacing: "2px" }}>VOODOO808</div>

                {resolvedArtwork && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -58%)", width: "72%", aspectRatio: "1/1" }}>
                    <img src={resolvedArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "2px" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{ fontSize: "5.5px", color: storyTextColor + "88", fontStyle: "italic" }}>{listeningText}</div>
                  <div style={{ fontSize: "8px", fontWeight: "700", color: storyTextColor, textAlign: "center", letterSpacing: "0.05em", lineHeight: 1.2 }}>{resolvedTitle.toUpperCase()}</div>
                  <div style={{ fontSize: "5.5px", color: storyTextColor + "66", letterSpacing: "0.5px" }}>{websiteText}</div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "12px", color: "#555", margin: "0 0 16px 0", lineHeight: 1.6 }}>Stáhni si kartu pro Instagram Story — sdílej ji jako příběh a odkaz na produkt.</p>
                <button onClick={downloadStoryCard} disabled={isGenerating} style={{ width: "100%", padding: "11px", background: isGenerating ? "#222" : "#fff", color: isGenerating ? "#555" : "#000", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "600", cursor: isGenerating ? "default" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {isGenerating ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      Generuji...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Stáhnout Story kartu (1080×1920)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
