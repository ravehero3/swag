import { useState, useEffect, CSSProperties } from "react";
import { useApp } from "../App.js";

interface ShareProduct {
  id: number;
  title: string;
  price?: number;
  artwork_url?: string;
  preview_url?: string;
}

interface ShareModalProps {
  product?: ShareProduct;
  productType?: "beat" | "sound_kit";
  beatId?: number;
  beatTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

function proxyImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("backblazeb2.com") || url.includes("b2cdn") || url.includes("b2.us")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatDur(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVE_BARS = [
  0.38,0.55,0.72,0.48,0.91,0.63,0.44,0.78,0.95,0.67,
  0.52,0.41,0.69,0.85,0.73,0.56,0.38,0.80,1.00,0.88,
  0.70,0.59,0.43,0.66,0.79,0.92,0.61,0.47,0.74,0.88,
  0.95,0.77,0.62,0.50,0.83,0.97,0.72,0.58,0.41,0.69,
  0.84,0.75,0.91,0.63,0.50,0.78,1.00,0.86,0.68,0.55,
  0.43,0.72,0.89,0.76,0.60,0.45,0.66,0.82,0.58,0.40,
];
const PLAYHEAD = 2 / 3;

function ShareModal({ product, productType = "beat", beatId, beatTitle, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "story">("link");
  const [isGenerating, setIsGenerating] = useState(false);
  const [beatDuration, setBeatDuration] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<{ text: string; email: string; avatar_url?: string | null; username?: string | null } | null>(null);
  const { settings } = useApp() as any;

  const resolvedId = product?.id ?? beatId ?? 0;
  const resolvedTitle = product?.title ?? beatTitle ?? "";
  const resolvedArtwork = product?.artwork_url ?? "";
  const resolvedPreviewUrl = product?.preview_url ?? "";
  const resolvedType = productType;

  const shareUrl = resolvedType === "sound_kit"
    ? `${window.location.origin}/produkt/sound_kit/${resolvedId}`
    : `${window.location.origin}/beaty?beat=${resolvedId}`;

  const storyBgColor = settings?.ig_story_bg_color || "#000000";
  const storyTextColor = settings?.ig_story_text_color || "#ffffff";
  const overlayOpacity = parseFloat(settings?.ig_story_overlay_opacity || "0.45");
  const listeningText = settings?.ig_story_listening_text || "právě poslouchám";
  const websiteText = settings?.ig_story_website_text || "NA VOODOO808.COM";
  const bgMode = settings?.ig_story_bg_mode || "artwork";
  const blurAmount = parseFloat(settings?.ig_story_blur || "20");
  const cardShow = settings?.ig_story_card_show !== "false";
  const cardRadius = parseFloat(settings?.ig_story_card_radius || "24");
  const cardBlur = parseFloat(settings?.ig_story_card_blur || "14");
  const cardBrightness = parseFloat(settings?.ig_story_card_brightness || "0.18");
  const cardShadow = settings?.ig_story_card_shadow !== "false";
  const cardShadowAmount = parseFloat(settings?.ig_story_card_shadow_amount || "24");
  const cardPadding = parseFloat(settings?.ig_story_card_padding || "16");
  const cardYOffset = parseInt(settings?.ig_story_card_y_offset || "0", 10);
  const cardTitleAlign = (settings?.ig_story_card_title_align || "center") as "left" | "center" | "right";
  const cardBrandAlign = (settings?.ig_story_card_brand_align || "right") as "left" | "right";
  const logoInvert = settings?.ig_story_logo_invert === "true";

  const storyLayers: { id: string; visible: boolean; y?: number; mode?: string; imageUrl?: string | null }[] = (() => {
    try {
      const parsed = JSON.parse(settings?.ig_story_layers || "null");
      return Array.isArray(parsed) ? parsed : [{ id: "logo", visible: true }, { id: "listening", visible: true }, { id: "title", visible: true }, { id: "website", visible: true }];
    } catch {
      return [{ id: "logo", visible: true }, { id: "listening", visible: true }, { id: "title", visible: true }, { id: "website", visible: true }];
    }
  })();

  useEffect(() => {
    if (!resolvedPreviewUrl || !isOpen) return;
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = `/api/audio-proxy?url=${encodeURIComponent(resolvedPreviewUrl)}`;
    audio.onloadedmetadata = () => setBeatDuration(audio.duration);
    audio.onerror = () => setBeatDuration(null);
  }, [resolvedPreviewUrl, isOpen]);

  useEffect(() => {
    if (!isOpen || !resolvedId) { setUserComment(null); return; }
    fetch(`/api/beats/${resolvedId}/my-last-comment`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.text) {
          setUserComment({ text: data.text, email: data.email, avatar_url: data.avatar_url, username: data.username });
        } else {
          setUserComment(null);
        }
      })
      .catch(() => setUserComment(null));
  }, [isOpen, resolvedId]);

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

  function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
      setTimeout(() => resolve(null), 5000);
    });
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

  const downloadStoryCard = async () => {
    setIsGenerating(true);
    try {
      const CW = 1080;
      const CH = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // ── Background ──
      ctx.fillStyle = storyBgColor;
      ctx.fillRect(0, 0, CW, CH);

      const artworkProxied = resolvedArtwork ? proxyImageUrl(resolvedArtwork) : "";
      const img = await loadImage(artworkProxied);

      if (bgMode === "artwork" && img) {
        ctx.save();
        ctx.filter = `blur(${Math.round(blurAmount * 3)}px)`;
        const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight) * 1.1;
        const bw = img.naturalWidth * scale;
        const bh = img.naturalHeight * scale;
        ctx.drawImage(img, (CW - bw) / 2, (CH - bh) / 2, bw, bh);
        ctx.restore();
      }

      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
      ctx.fillRect(0, 0, CW, CH);

      // ── Text layers (logo, listening, title, website) ──
      ctx.textAlign = "center";
      const PREV_H = 470;
      const yScale = CH / PREV_H;

      for (const layer of storyLayers) {
        if (!layer.visible) continue;
        const layerY = (typeof layer.y === "number" ? layer.y : 280) * yScale;

        if (layer.mode === "image" && layer.imageUrl) {
          const logoProxied = proxyImageUrl(layer.imageUrl);
          const logoImg = await loadImage(logoProxied);
          if (logoImg) {
            const maxH = 90;
            const s = maxH / logoImg.naturalHeight;
            const w = logoImg.naturalWidth * s;
            if (logoInvert) {
              ctx.save();
              ctx.filter = "invert(1)";
            }
            ctx.drawImage(logoImg, (CW - w) / 2, layerY - maxH / 2, w, maxH);
            if (logoInvert) ctx.restore();
          }
          continue;
        }

        ctx.letterSpacing = "0px";
        if (layer.id === "logo") {
          ctx.font = "bold 52px Helvetica, Arial, sans-serif";
          ctx.fillStyle = storyTextColor + "cc";
          ctx.letterSpacing = "8px";
          ctx.fillText("VOODOO808.COM", CW / 2, layerY);
          ctx.letterSpacing = "0px";
        } else if (layer.id === "listening") {
          ctx.font = "italic 36px Helvetica, Arial, sans-serif";
          ctx.fillStyle = storyTextColor + "88";
          ctx.fillText(listeningText, CW / 2, layerY);
        } else if (layer.id === "title") {
          ctx.font = "bold 80px Helvetica, Arial, sans-serif";
          ctx.fillStyle = storyTextColor;
          const titleLines = wrapText(ctx, resolvedTitle.toUpperCase(), 900);
          titleLines.forEach((line, li) => ctx.fillText(line, CW / 2, layerY + li * 96));
        } else if (layer.id === "website") {
          ctx.font = "38px Helvetica, Arial, sans-serif";
          ctx.fillStyle = storyTextColor + "99";
          ctx.fillText(websiteText, CW / 2, layerY);
        }
      }

      // ── Glassmorphism player card ──
      if (cardShow) {
        const PREV_W = 216;
        const CARD_MARGIN = 24;
        const cardW_prev = PREV_W - CARD_MARGIN * 2;
        const xScale = CW / PREV_W;

        const cardW = cardW_prev * xScale;
        const cardPad = cardPadding * xScale;
        const artW = cardW - cardPad * 2;
        const cardRad = cardRadius * xScale;
        const cardX = (CW - cardW) / 2;

        // Card height in canvas pixels — use xScale since card size is relative to card width
        const artWpx = (cardW_prev - cardPadding * 2) * xScale;
        const commentHpx = userComment ? (10 * xScale + 8 * xScale) : 0;
        const estimatedCardH = cardPad + artWpx
          + 10 * xScale   // after artwork
          + 9 * xScale    // title (~1 line)
          + 4 * xScale    // after title
          + 7 * xScale    // brand
          + 10 * xScale   // after brand
          + 22 * xScale   // waveform
          + 3 * xScale    // after waveform
          + 5 * xScale    // time labels
          + 8 * xScale    // after time labels
          + 20 * xScale   // player controls
          + 3 * xScale    // volume bar
          + 8 * xScale    // after volume
          + commentHpx    // optional comment bubble
          + cardPad;      // bottom padding
        const centeredCardY = (CH - estimatedCardH) / 2 + cardYOffset * yScale;
        const cardY = Math.max(10 * yScale, centeredCardY);
        const estimatedCardH_prev = estimatedCardH / xScale; // kept for card background draw below

        // Simulate glass: draw blurred artwork crop behind the card
        if (img) {
          ctx.save();
          ctx.beginPath();
          roundRect(ctx, cardX, cardY, cardW, estimatedCardH, cardRad);
          ctx.clip();
          ctx.filter = `blur(${Math.round(cardBlur * 2)}px)`;
          const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight) * 1.1;
          const bw = img.naturalWidth * scale;
          const bh = img.naturalHeight * scale;
          ctx.drawImage(img, (CW - bw) / 2, (CH - bh) / 2, bw, bh);
          ctx.filter = "none";
          ctx.restore();
        }

        // Glass fill overlay
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, estimatedCardH, cardRad);
        ctx.clip();
        ctx.fillStyle = `rgba(255,255,255,${cardBrightness})`;
        ctx.fillRect(cardX, cardY, cardW, estimatedCardH);
        ctx.restore();

        // Card border
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, estimatedCardH, cardRad);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Card shadow
        if (cardShadow) {
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.55)";
          ctx.shadowBlur = cardShadowAmount * xScale;
          ctx.shadowOffsetY = cardShadowAmount * 0.5 * xScale;
          ctx.beginPath();
          roundRect(ctx, cardX, cardY, cardW, estimatedCardH, cardRad);
          ctx.fillStyle = "transparent";
          ctx.fill();
          ctx.restore();
        }

        let curY = cardY + cardPad;

        // Artwork square
        const artRad = Math.max(0, cardRad - cardPad);
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX + cardPad, curY, artW, artW, artRad);
        ctx.clip();
        if (img) {
          const src = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - src) / 2;
          const sy = (img.naturalHeight - src) / 2;
          ctx.drawImage(img, sx, sy, src, src, cardX + cardPad, curY, artW, artW);
        } else {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(cardX + cardPad, curY, artW, artW);
        }
        ctx.restore();
        curY += artW + 10 * xScale;

        // Title
        const titleFontSize = 9 * xScale;
        ctx.font = `bold ${titleFontSize}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.letterSpacing = `${0.06 * titleFontSize}px`;
        const titleLines = wrapText(ctx, resolvedTitle.toUpperCase(), artW);
        const titleLineH = titleFontSize * 1.25;
        const titleAlign = cardTitleAlign === "left" ? cardX + cardPad : cardTitleAlign === "right" ? cardX + cardW - cardPad : CW / 2;
        ctx.textAlign = cardTitleAlign === "center" ? "center" : cardTitleAlign === "left" ? "left" : "right";
        titleLines.forEach((line, li) => ctx.fillText(line, titleAlign, curY + li * titleLineH));
        curY += titleLines.length * titleLineH + 4 * xScale;
        ctx.letterSpacing = "0px";

        // Brand
        ctx.font = `${7 * xScale}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = cardBrandAlign === "left" ? "left" : "right";
        ctx.fillText("VOODOO808.COM", cardBrandAlign === "left" ? cardX + cardPad : cardX + cardW - cardPad, curY);
        curY += 10 * xScale;

        // Waveform bars
        const barCount = WAVE_BARS.length;
        const waveH = 22 * xScale;
        const gap = 1.5 * xScale;
        const barW = (artW - gap * (barCount - 1)) / barCount;
        for (let i = 0; i < barCount; i++) {
          const bh = Math.max(2 * xScale, WAVE_BARS[i] * waveH);
          const by = curY + (waveH - bh) / 2;
          const bx = cardX + cardPad + i * (barW + gap);
          const played = (i / barCount) < PLAYHEAD;
          ctx.fillStyle = played ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)";
          ctx.beginPath();
          ctx.roundRect(bx, by, barW, bh, barW / 2);
          ctx.fill();
        }
        // Playhead line
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(cardX + cardPad + PLAYHEAD * artW - 1.5, curY, 3, waveH);
        curY += waveH + 3 * xScale;

        // Time labels
        const timeFontSize = 5 * xScale;
        ctx.font = `${timeFontSize}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        const playedTime = beatDuration ? formatDur(beatDuration * PLAYHEAD) : "–:––";
        const totalTime = beatDuration ? formatDur(beatDuration) : "–:––";
        ctx.fillText(playedTime, cardX + cardPad, curY);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(totalTime, cardX + cardW - cardPad, curY);
        ctx.textAlign = "center";
        curY += 8 * xScale;

        // Player controls — double chevron arrows + plain pause bars
        const ctrlY = curY + 9 * xScale;
        const ctrlCx = CW / 2;
        const chevH = 9 * xScale;
        const chevW = 5 * xScale;
        // Prev (two left-pointing chevrons)
        for (let ci = 0; ci < 2; ci++) {
          const ox = ctrlCx - 80 * xScale + ci * chevW * 2.2;
          ctx.beginPath();
          ctx.moveTo(ox + chevW, ctrlY - chevH); ctx.lineTo(ox, ctrlY); ctx.lineTo(ox + chevW, ctrlY + chevH);
          ctx.strokeStyle = "rgba(255,255,255,0.75)";
          ctx.lineWidth = 2 * xScale;
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.stroke();
        }
        // Pause bars
        const pauseBarW = 4 * xScale; const pauseBarH = 14 * xScale; const pauseBarGap = 5 * xScale;
        ctx.fillStyle = "#fff";
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath(); ctx.roundRect(ctrlCx - pauseBarGap / 2 - pauseBarW, ctrlY - pauseBarH / 2, pauseBarW, pauseBarH, 2 * xScale); ctx.fill();
          ctx.beginPath(); ctx.roundRect(ctrlCx + pauseBarGap / 2, ctrlY - pauseBarH / 2, pauseBarW, pauseBarH, 2 * xScale); ctx.fill();
        } else {
          ctx.fillRect(ctrlCx - pauseBarGap / 2 - pauseBarW, ctrlY - pauseBarH / 2, pauseBarW, pauseBarH);
          ctx.fillRect(ctrlCx + pauseBarGap / 2, ctrlY - pauseBarH / 2, pauseBarW, pauseBarH);
        }
        // Next (two right-pointing chevrons)
        for (let ci = 0; ci < 2; ci++) {
          const ox = ctrlCx + 68 * xScale + ci * chevW * 2.2;
          ctx.beginPath();
          ctx.moveTo(ox, ctrlY - chevH); ctx.lineTo(ox + chevW, ctrlY); ctx.lineTo(ox, ctrlY + chevH);
          ctx.strokeStyle = "rgba(255,255,255,0.75)";
          ctx.lineWidth = 2 * xScale;
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.stroke();
        }
        curY += 20 * xScale;

        // Volume bar
        const volIconW = 8 * xScale;
        const volBarH = 3 * xScale;
        const volY = curY + volBarH / 2;
        // Speaker icon (filled path — left)
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.moveTo(cardX + cardPad + volIconW * 0.5, curY - volBarH * 1.5);
        ctx.lineTo(cardX + cardPad + volIconW * 0.2, curY - volBarH * 0.5);
        ctx.lineTo(cardX + cardPad + volIconW * 0.05, curY - volBarH * 0.5);
        ctx.lineTo(cardX + cardPad + volIconW * 0.05, curY + volBarH * 1.5);
        ctx.lineTo(cardX + cardPad + volIconW * 0.2, curY + volBarH * 1.5);
        ctx.lineTo(cardX + cardPad + volIconW * 0.5, curY + volBarH * 2.5);
        ctx.closePath();
        ctx.fill();
        // Volume track
        const volTrackX = cardX + cardPad + volIconW + 3 * xScale;
        const volTrackW = artW - volIconW * 2 - 6 * xScale;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath(); ctx.roundRect(volTrackX, curY, volTrackW, volBarH, volBarH / 2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.beginPath(); ctx.roundRect(volTrackX, curY, volTrackW * 0.7, volBarH, volBarH / 2); ctx.fill();
        } else {
          ctx.fillRect(volTrackX, curY, volTrackW, volBarH);
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillRect(volTrackX, curY, volTrackW * 0.7, volBarH);
        }
        curY += volBarH + 8 * xScale;

        // Comment bubble — only if user has commented
        if (userComment) {
          const avatarSize = 18 * xScale;
          const bubblePad = 5 * xScale;
          const bubbleX = cardX + cardPad + avatarSize + 5 * xScale;
          const bubbleW = artW - avatarSize - 5 * xScale;
          const commentFontSize = 5 * xScale;
          const nameFontSize = 4 * xScale;

          // Avatar circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(cardX + cardPad + avatarSize / 2, curY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fill();
          if (userComment.avatar_url) {
            const avatarProxied = proxyImageUrl(userComment.avatar_url);
            const avatarImg = await loadImage(avatarProxied);
            if (avatarImg) {
              ctx.drawImage(avatarImg, cardX + cardPad, curY, avatarSize, avatarSize);
            }
          } else {
            const initials = (userComment.username || userComment.email || "?").charAt(0).toUpperCase();
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = `bold ${avatarSize * 0.5}px Helvetica,Arial,sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(initials, cardX + cardPad + avatarSize / 2, curY + avatarSize * 0.65);
          }
          ctx.restore();

          // Bubble background
          const bubbleH = nameFontSize + commentFontSize * 2 + bubblePad * 2 + 3 * xScale;
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath(); ctx.roundRect(bubbleX, curY, bubbleW, bubbleH, 6 * xScale); ctx.fill();
          } else {
            ctx.fillRect(bubbleX, curY, bubbleW, bubbleH);
          }

          // Username
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = `${nameFontSize}px Helvetica,Arial,sans-serif`;
          ctx.textAlign = "left";
          ctx.fillText(
            (userComment.username || userComment.email?.split("@")[0] || "user").substring(0, 30),
            bubbleX + bubblePad, curY + bubblePad + nameFontSize
          );

          // Comment text (truncated)
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = `${commentFontSize}px Helvetica,Arial,sans-serif`;
          const maxCommentW = bubbleW - bubblePad * 2;
          const commentLines = wrapText(ctx, userComment.text, maxCommentW).slice(0, 2);
          commentLines.forEach((line, li) => {
            ctx.fillText(line, bubbleX + bubblePad, curY + bubblePad + nameFontSize + 3 * xScale + (li + 1) * (commentFontSize + 2 * xScale));
          });
          ctx.textAlign = "center";
        }
      }

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

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  const durationStr = beatDuration ? formatDur(beatDuration) : null;
  const playedStr = beatDuration ? formatDur(beatDuration * PLAYHEAD) : null;

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
              {/* Mini preview — iPhone 16 Pro proportions (402×874pt) */}
              {(() => {
                const MINI_W = 120;
                const MINI_H = Math.round(MINI_W * 874 / 402); // ≈ 261px
                const CARD_MARGIN_MINI = 12;
                const cardWm = MINI_W - CARD_MARGIN_MINI * 2;
                const cardPadm = Math.round(cardPadding * (MINI_W / 216));
                const artWm = cardWm - cardPadm * 2;
                const commentRowHm = userComment ? 16 : 0;
                const cardHmEst = cardPadm + artWm + 40 + commentRowHm + cardPadm;
                const centeredTopM = (MINI_H - cardHmEst) / 2 + Math.round(cardYOffset * (MINI_H / 470));
                const cardTopM = Math.max(5, centeredTopM);
                const cardRadM = Math.round(cardRadius * (MINI_W / 216));
                return (
                  <div style={{ width: `${MINI_W}px`, height: `${MINI_H}px`, flexShrink: 0, borderRadius: "6px", overflow: "hidden", border: "1px solid #2a2a2a", position: "relative", background: bgMode === "color" ? storyBgColor : "#111" }}>
                    {bgMode === "artwork" && resolvedArtwork && (
                      <img src={resolvedArtwork} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(${blurAmount}px)`, transform: "scale(1.3)" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    )}
                    {bgMode === "artwork" && !resolvedArtwork && (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #333 0%, #111 100%)" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />

                    {/* Player card mini preview */}
                    {cardShow && resolvedArtwork && (
                      <div style={{ position: "absolute", left: `${CARD_MARGIN_MINI}px`, top: `${cardTopM}px`, width: `${cardWm}px`, borderRadius: `${cardRadM}px`, backdropFilter: `blur(${cardBlur}px)`, WebkitBackdropFilter: `blur(${cardBlur}px)`, background: `rgba(255,255,255,${cardBrightness})`, border: "1px solid rgba(255,255,255,0.18)", boxShadow: cardShadow ? `0 ${cardShadowAmount * 0.25}px ${cardShadowAmount * 0.5}px rgba(0,0,0,0.55)` : "none", padding: `${cardPadm}px`, boxSizing: "border-box" as const, display: "flex", flexDirection: "column" as const, gap: "2px" }}>
                        <div style={{ width: `${artWm}px`, height: `${artWm}px`, borderRadius: `${Math.max(0, cardRadM - cardPadm)}px`, overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
                          <img src={resolvedArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        </div>
                        <div style={{ fontSize: "4.5px", fontWeight: 700, color: "#fff", textAlign: cardTitleAlign, wordBreak: "break-word", lineHeight: 1.2, marginTop: "3px" }}>{resolvedTitle.toUpperCase()}</div>
                        <div style={{ fontSize: "3.5px", color: "rgba(255,255,255,0.6)", textAlign: cardBrandAlign }}>VOODOO808.COM</div>
                        <div style={{ marginTop: "2px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "3px", color: "rgba(255,255,255,0.5)" }}>{playedStr || "–:––"}</span>
                          <span style={{ fontSize: "3px", color: "rgba(255,255,255,0.35)" }}>{durationStr || "–:––"}</span>
                        </div>
                        {/* Player controls mini */}
                        <div style={{ marginTop: "3px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          <svg width="7" height="5" viewBox="0 0 13 10" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6.5,1 2,5 6.5,9"/><polyline points="11.5,1 7,5 11.5,9"/>
                          </svg>
                          <svg width="5" height="6" viewBox="0 0 10 12" fill="#fff">
                            <rect x="0.5" y="0.5" width="3" height="11" rx="2"/><rect x="6.5" y="0.5" width="3" height="11" rx="2"/>
                          </svg>
                          <svg width="7" height="5" viewBox="0 0 13 10" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1,1 5.5,5 1,9"/><polyline points="6,1 10.5,5 6,9"/>
                          </svg>
                        </div>
                        {/* Volume mini */}
                        <div style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "2px" }}>
                          <svg width="4" height="4" viewBox="0 0 20 20" fill="rgba(255,255,255,0.45)">
                            <path d="M10 3.5 L5.5 7.5 H2 Q1 7.5 1 8.5 V11.5 Q1 12.5 2 12.5 H5.5 L10 16.5 Z"/>
                          </svg>
                          <div style={{ flex: 1, height: "1.5px", background: "rgba(255,255,255,0.18)", borderRadius: "1px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "70%", background: "rgba(255,255,255,0.75)" }} />
                          </div>
                          <svg width="4" height="4" viewBox="0 0 20 20" fill="rgba(255,255,255,0.45)">
                            <path d="M10 3.5 L5.5 7.5 H2 Q1 7.5 1 8.5 V11.5 Q1 12.5 2 12.5 H5.5 L10 16.5 Z"/>
                          </svg>
                        </div>
                        {/* Comment bubble mini */}
                        {userComment && (
                          <div style={{ marginTop: "3px", display: "flex", alignItems: "flex-start", gap: "2px" }}>
                            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgba(255,255,255,0.18)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {userComment.avatar_url
                                ? <img src={userComment.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: "3px", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{(userComment.username || userComment.email || "?").charAt(0).toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "3px", padding: "1.5px 2.5px", minWidth: 0 }}>
                              <div style={{ fontSize: "2.5px", color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userComment.text}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text layers */}
                    {storyLayers.filter(l => l.visible).map(layer => {
                      const yPct = ((layer.y ?? 280) / 470) * 100;
                      const base: CSSProperties = { position: "absolute", left: 0, right: 0, top: yPct + "%", textAlign: "center", transform: "translateY(-50%)", pointerEvents: "none" };
                      if (layer.mode === "image" && layer.imageUrl) {
                        return <img key={layer.id} src={layer.imageUrl} alt="" style={{ ...base, height: "12px", width: "auto", maxWidth: "80%", margin: "0 auto", display: "block", objectFit: "contain", filter: logoInvert ? "invert(1)" : "none" }} />;
                      }
                      if (layer.id === "logo") return <div key="logo" style={{ ...base, fontSize: "7px", fontWeight: "700", color: storyTextColor, letterSpacing: "2px" }}>VOODOO808.COM</div>;
                      if (layer.id === "listening") return <div key="listening" style={{ ...base, fontSize: "5.5px", color: storyTextColor + "88", fontStyle: "italic" }}>{listeningText}</div>;
                      if (layer.id === "title") return <div key="title" style={{ ...base, fontSize: "8px", fontWeight: "700", color: storyTextColor, letterSpacing: "0.05em", lineHeight: 1.2 }}>{resolvedTitle.toUpperCase()}</div>;
                      if (layer.id === "website") return <div key="website" style={{ ...base, fontSize: "5.5px", color: storyTextColor + "66", letterSpacing: "0.5px" }}>{websiteText}</div>;
                      return null;
                    })}
                  </div>
                );
              })()}

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "12px", color: "#555", margin: "0 0 16px 0", lineHeight: 1.6 }}>Stáhni si kartu pro Instagram Story — sdílej ji jako příběh a odkaz na produkt. Šablona se nastavuje v Admin → Instagram Stories.</p>
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
