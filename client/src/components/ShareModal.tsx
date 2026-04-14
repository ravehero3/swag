import { useState, useEffect, CSSProperties } from "react";
import { useApp } from "../App.js";
import { getWaveform, preloadWaveform } from "../lib/waveformCache.js";

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
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatDur(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 120 fallback bars (more detailed than before)
const WAVE_BARS: number[] = Array.from({ length: 120 }, (_, i) => {
  const t = i / 120;
  return Math.max(0.15, Math.abs(Math.sin(t * Math.PI * 7 + 0.3) * 0.6 + Math.sin(t * Math.PI * 13 + 1.1) * 0.3 + 0.35));
});

const PLAYHEAD = 2 / 3;

function ShareModal({ product, productType = "beat", beatId, beatTitle, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "story">("link");
  const [isGenerating, setIsGenerating] = useState(false);
  const [beatDuration, setBeatDuration] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<{ text: string; email: string; avatar_url?: string | null; username?: string | null; time_offset?: number } | null>(null);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
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

  // ZVUKY settings (for sound_kit story cards)
  const zvukyBgBlur = parseFloat(settings?.ig_zvuky_bg_blur || "20");
  const zvukyOverlayOpacity = parseFloat(settings?.ig_zvuky_overlay_opacity || "0.5");
  const zvukyTextColor = settings?.ig_zvuky_text_color || "#ffffff";
  const zvukyShowHoverCard = settings?.ig_zvuky_show_hover_card === "true";
  const zvukyHoverShowSounds = settings?.ig_zvuky_hover_show_sounds !== "false";
  const zvukyTypeLabels: Record<string, string> = { drum_kit: "Drum Kit", one_shot_kit: "One Shot Kit", loop_kit: "Loop Kit", one_shot_bundle: "One Shot Bundle", drum_kit_bundle: "Drum Kit Bundle" };
  const zvukyShowArtworkBg = settings?.ig_zvuky_show_artwork_bg === "true";
  const zvukyLogoInvert = settings?.ig_zvuky_logo_invert === "true";
  const zvukyLayers: { id: string; visible: boolean; y?: number; mode?: string; imageUrl?: string | null; align?: string }[] = (() => {
    try {
      const parsed = JSON.parse(settings?.ig_zvuky_layers || "null");
      return Array.isArray(parsed) ? parsed : [
        { id: "logo", visible: true, y: 40, mode: "text", imageUrl: null, align: "center" },
        { id: "title", visible: true, y: 450, mode: "text", imageUrl: null, align: "center" },
        { id: "website", visible: true, y: 480, mode: "text", imageUrl: null, align: "center" },
      ];
    } catch {
      return [
        { id: "logo", visible: true, y: 40, mode: "text", imageUrl: null, align: "center" },
        { id: "title", visible: true, y: 450, mode: "text", imageUrl: null, align: "center" },
        { id: "website", visible: true, y: 480, mode: "text", imageUrl: null, align: "center" },
      ];
    }
  })();

  // Effective playhead position — use comment time_offset if available
  const PLAYHEAD_POS = typeof userComment?.time_offset === "number" ? userComment.time_offset : PLAYHEAD;

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
          setUserComment({ text: data.text, email: data.email, avatar_url: data.avatar_url, username: data.username, time_offset: typeof data.time_offset === "number" ? data.time_offset : PLAYHEAD });
        } else {
          setUserComment(null);
        }
      })
      .catch(() => setUserComment(null));
  }, [isOpen, resolvedId]);

  useEffect(() => {
    if (!isOpen || !resolvedPreviewUrl) { setWaveformData(null); return; }
    const cached = getWaveform(resolvedPreviewUrl);
    if (cached && cached.length > 0) { setWaveformData(cached); return; }
    preloadWaveform(resolvedPreviewUrl).then(() => {
      const data = getWaveform(resolvedPreviewUrl);
      if (data && data.length > 0) setWaveformData(data);
    }).catch(() => {});
  }, [isOpen, resolvedPreviewUrl]);

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
      let settled = false;
      const settle = (val: HTMLImageElement | null) => {
        if (!settled) { settled = true; resolve(val); }
      };
      img.onload = () => settle(img);
      // Never fall back to a non-CORS load — that would taint the canvas
      // and crash drawImage mid-render. Just resolve null and use the placeholder.
      img.onerror = () => settle(null);
      img.src = src;
      setTimeout(() => settle(null), 10000);
    });
  }

  // Load a black-on-transparent PNG icon and draw it as white at (cx, cy) centered
  async function drawIconWhite(
    ctx: CanvasRenderingContext2D,
    src: string,
    cx: number,
    cy: number,
    w: number,
    h: number,
    opacity = 1,
    flipX = false
  ) {
    const img = await loadImage(src);
    if (!img) return;
    const tmpC = document.createElement("canvas");
    tmpC.width = img.naturalWidth;
    tmpC.height = img.naturalHeight;
    const tc = tmpC.getContext("2d")!;
    tc.drawImage(img, 0, 0);
    const d = tc.getImageData(0, 0, tmpC.width, tmpC.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 10) {
        px[i] = 255; px[i + 1] = 255; px[i + 2] = 255;
        px[i + 3] = Math.round(px[i + 3] * opacity);
      }
    }
    tc.putImageData(d, 0, 0);
    ctx.save();
    if (flipX) {
      ctx.translate(cx, cy - h / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(tmpC, -w / 2, 0, w, h);
    } else {
      ctx.drawImage(tmpC, cx - w / 2, cy - h / 2, w, h);
    }
    ctx.restore();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else if (!current) {
        // Single word wider than maxWidth — break at character level
        let partial = "";
        for (const char of word) {
          if (ctx.measureText(partial + char).width > maxWidth && partial) {
            lines.push(partial);
            partial = char;
          } else {
            partial += char;
          }
        }
        current = partial;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

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

  // Resample peaks array to targetCount bars
  function resamplePeaks(peaks: number[], targetCount: number): number[] {
    if (peaks.length === 0) return Array(targetCount).fill(0.5);
    return Array.from({ length: targetCount }, (_, i) => {
      const t = i / (targetCount - 1);
      const src = t * (peaks.length - 1);
      const lo = Math.floor(src);
      const hi = Math.min(lo + 1, peaks.length - 1);
      return peaks[lo] + (peaks[hi] - peaks[lo]) * (src - lo);
    });
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

      // Load artwork image — always route external URLs through proxy for CORS
      const artworkProxied = resolvedArtwork ? proxyImageUrl(resolvedArtwork) : "";
      const img = await loadImage(artworkProxied);

      if (bgMode === "artwork") {
        if (img) {
          ctx.save();
          ctx.filter = `blur(${Math.round(blurAmount * 3)}px)`;
          const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight) * 1.1;
          const bw = img.naturalWidth * scale;
          const bh = img.naturalHeight * scale;
          ctx.drawImage(img, (CW - bw) / 2, (CH - bh) / 2, bw, bh);
          ctx.restore();
        } else {
          // Fallback gradient if artwork didn't load
          const grad = ctx.createLinearGradient(0, 0, CW, CH);
          grad.addColorStop(0, "#1a1a1a");
          grad.addColorStop(1, "#0a0a0a");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, CW, CH);
        }
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

        const artWpx = (cardW_prev - cardPadding * 2) * xScale;
        const estimatedCardH = cardPad + artWpx
          + 10 * xScale
          + 9 * xScale
          + 4 * xScale
          + 7 * xScale
          + 10 * xScale
          + 28 * xScale   // waveform
          + 3 * xScale
          + 5 * xScale    // time labels
          + 8 * xScale
          + 20 * xScale   // player controls
          + 3 * xScale    // volume
          + 8 * xScale
          + cardPad;
        const centeredCardY = (CH - estimatedCardH) / 2 + cardYOffset * yScale;
        const cardY = Math.max(10 * yScale, centeredCardY);

        // Glass: blurred artwork crop behind card
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

        // ── Waveform — 200 bars, thinner, closer (like webapp) ──
        const TARGET_BARS = 200;
        const rawPeaks = waveformData && waveformData.length > 0 ? waveformData : WAVE_BARS;
        const peaks = resamplePeaks(rawPeaks, TARGET_BARS);
        const waveH = 28 * xScale;
        const waveStartY = curY;
        const waveEndX = cardX + cardPad + artW;
        const slotW = artW / TARGET_BARS;
        const barW = Math.max(0.8, slotW * 0.38);  // thinner bars, more space between them
        const wDivY = waveStartY + waveH * 0.70;
        const topMaxAmp = waveH * 0.70 * 0.90;
        const botMaxAmp = waveH * 0.30 * 0.90;
        const barRadius = Math.min(barW / 2, 0.8);

        for (let i = 0; i < TARGET_BARS; i++) {
          const bx = cardX + cardPad + i * slotW + (slotW - barW) / 2;
          const peak = peaks[i] ?? 0.5;
          const topAmp = Math.max(peak * topMaxAmp, xScale * 0.5);
          const botAmp = Math.max(peak * botMaxAmp, xScale * 0.3);
          const isPlayed = (i / TARGET_BARS) < PLAYHEAD_POS;
          const isHead = Math.abs(i / TARGET_BARS - PLAYHEAD_POS) < (1.5 / TARGET_BARS);

          if (isHead) {
            ctx.fillStyle = "rgba(255,255,255,1)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, wDivY - topAmp, barW, topAmp + botAmp, barRadius);
            else ctx.rect(bx, wDivY - topAmp, barW, topAmp + botAmp);
            ctx.fill();
          } else {
            ctx.fillStyle = isPlayed ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, wDivY - topAmp, barW, topAmp, barRadius);
            else ctx.rect(bx, wDivY - topAmp, barW, topAmp);
            ctx.fill();
            ctx.fillStyle = isPlayed ? "rgba(255,255,255,0.61)" : "rgba(255,255,255,0.13)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, wDivY, barW, botAmp, barRadius);
            else ctx.rect(bx, wDivY, barW, botAmp);
            ctx.fill();
          }
        }

        // Divider line
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(cardX + cardPad, wDivY, artW, Math.max(1, xScale * 0.3));

        // Playhead vertical line
        const playheadX = cardX + cardPad + PLAYHEAD_POS * artW;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillRect(playheadX - 0.75 * xScale, waveStartY, 1.5 * xScale, waveH);

        curY = waveStartY + waveH + 3 * xScale;

        // Time labels
        const timeFontSize = 5 * xScale;
        ctx.font = `${timeFontSize}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        const playedTime = beatDuration ? formatDur(beatDuration * PLAYHEAD_POS) : "–:––";
        const totalTime = beatDuration ? formatDur(beatDuration) : "–:––";
        ctx.fillText(playedTime, cardX + cardPad, curY);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(totalTime, cardX + cardW - cardPad, curY);
        ctx.textAlign = "center";
        curY += 8 * xScale;

        // ── Player controls — PNG icons (black→white pixel conversion) ──
        const ctrlY = curY + 10 * xScale;
        const ctrlCx = CW / 2;
        const arrowW = 16 * xScale;   // prev/next icon width
        const arrowH = 16 * xScale;   // prev/next icon height
        const pauseW = 13 * xScale;   // pause icon width
        const pauseH = 16 * xScale;   // pause icon height

        // Prev (previous.png) — 75% opacity
        await drawIconWhite(ctx, "/icons/previous.png", ctrlCx - 28 * xScale, ctrlY, arrowW, arrowH, 0.75);
        // Pause (pause.png) — full opacity, white
        await drawIconWhite(ctx, "/icons/pause.png", ctrlCx, ctrlY, pauseW, pauseH, 1.0);
        // Next (mirror of previous.png) — 75% opacity, flipped
        await drawIconWhite(ctx, "/icons/previous.png", ctrlCx + 28 * xScale, ctrlY, arrowW, arrowH, 0.75, true);

        curY += 20 * xScale;

        // ── Volume bar — left icon (speaker only), track, right icon (speaker + 3 arcs) ──
        const volIconW = 7 * xScale;
        const volIconH = 7 * xScale;  // square — less tall
        const volBarH = 3 * xScale;
        const volCY = curY + volBarH * 0.5;

        // Speaker body (no sound waves)
        const drawSpeakerOnly = (x: number, cy: number, iw: number, ih: number) => {
          const hh = ih / 2;
          ctx.beginPath();
          ctx.moveTo(x + iw * 0.55, cy - hh);
          ctx.lineTo(x + iw * 0.22, cy - hh * 0.38);
          ctx.lineTo(x + iw * 0.05, cy - hh * 0.38);
          ctx.lineTo(x + iw * 0.05, cy + hh * 0.38);
          ctx.lineTo(x + iw * 0.22, cy + hh * 0.38);
          ctx.lineTo(x + iw * 0.55, cy + hh);
          ctx.closePath();
          ctx.fill();
        };

        // Speaker body + 3 curved arcs
        const drawSpeakerWithArcs = (x: number, cy: number, iw: number, ih: number) => {
          drawSpeakerOnly(x, cy, iw, ih);
          // 3 arcs from the tip of the speaker
          const tipX = x + iw * 0.55;
          const arcAngle = Math.PI * 0.38;
          const lw = Math.max(0.5, iw * 0.09);
          ctx.save();
          ctx.strokeStyle = ctx.fillStyle as string;
          ctx.lineWidth = lw;
          ctx.lineCap = "round";
          [iw * 0.28, iw * 0.46, iw * 0.64].forEach((r) => {
            ctx.beginPath();
            ctx.arc(tipX, cy, r, -arcAngle, arcAngle);
            ctx.stroke();
          });
          ctx.restore();
        };

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        drawSpeakerOnly(cardX + cardPad, volCY, volIconW, volIconH);

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

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        const rightIconX = cardX + cardPad + artW - volIconW;
        drawSpeakerWithArcs(rightIconX, volCY, volIconW, volIconH);

        curY += volBarH + 8 * xScale;

        // ── User comment pill — drawn LAST so it sits on top of every other card element ──
        if (userComment) {
          const commentX = Math.max(cardX + cardPad + 12 * xScale, Math.min(waveEndX - 12 * xScale, playheadX));
          const commentCY = waveStartY + waveH * 0.50;
          const avatarR = 11 * xScale;

          // Avatar circle (filled background + optional image / initial letter)
          ctx.save();
          ctx.beginPath();
          ctx.arc(commentX, commentCY, avatarR, 0, Math.PI * 2);
          ctx.fillStyle = "#1a1a1a";
          ctx.fill();
          ctx.clip();

          if (userComment.avatar_url) {
            const avProxied = proxyImageUrl(userComment.avatar_url);
            const avImg = await loadImage(avProxied);
            if (avImg) ctx.drawImage(avImg, commentX - avatarR, commentCY - avatarR, avatarR * 2, avatarR * 2);
          }

          if (!userComment.avatar_url) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = `bold ${avatarR * 0.9}px Helvetica,Arial,sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((userComment.username || userComment.email || "?").charAt(0).toUpperCase(), commentX, commentCY);
          }
          ctx.restore();

          // White ring around avatar
          ctx.save();
          ctx.beginPath();
          ctx.arc(commentX, commentCY, avatarR, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.75)";
          ctx.lineWidth = 1.5 * xScale;
          ctx.stroke();
          ctx.restore();

          // Pill geometry — ensure the font is set BEFORE calling wrapText
          const tipPadX = 8 * xScale;
          const tipPadY = 6 * xScale;
          const nameFsz = 4.5 * xScale;
          const cFsz = 5.5 * xScale;
          const lineGap = 2.5 * xScale;
          const maxTipW = Math.min(artW * 0.88, 230 * xScale);
          const innerW = maxTipW - tipPadX * 2;

          // Set font before measuring so wrapText uses the correct metrics
          ctx.font = `${cFsz}px Helvetica,Arial,sans-serif`;
          const MAX_COMMENT_LINES = 3;
          const allCommentLines = wrapText(ctx, userComment.text, innerW);
          let commentLines: string[];
          if (allCommentLines.length > MAX_COMMENT_LINES) {
            let lastLine = allCommentLines[MAX_COMMENT_LINES - 1];
            while (lastLine.length > 0 && ctx.measureText(lastLine + "…").width > innerW) {
              lastLine = lastLine.slice(0, -1);
            }
            commentLines = [...allCommentLines.slice(0, MAX_COMMENT_LINES - 1), lastLine + "…"];
          } else {
            commentLines = allCommentLines;
          }

          // Height: top-pad + username row + gap + comment rows + bottom-pad
          const tipH = tipPadY * 2 + nameFsz + lineGap + commentLines.length * cFsz + (commentLines.length - 1) * lineGap;
          const tipW = maxTipW;
          const tipX = Math.max(cardX + cardPad, Math.min(waveEndX - tipW, commentX - tipW / 2));
          // Position pill below the avatar; clamp so it stays within the card
          const rawTipY = commentCY + avatarR + 6 * xScale;
          const tipY = Math.min(rawTipY, cardY + estimatedCardH - tipH - cardPad);

          // Pill background — frosted glass, semi-transparent
          ctx.save();
          ctx.globalAlpha = 1;
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(tipX, tipY, tipW, tipH, 6 * xScale); }
          else { ctx.beginPath(); ctx.rect(tipX, tipY, tipW, tipH); }
          ctx.fillStyle = "rgba(255,255,255,0.13)";
          ctx.fill();

          // Glossy top-half highlight
          const glossGrad = ctx.createLinearGradient(tipX, tipY, tipX, tipY + tipH * 0.55);
          glossGrad.addColorStop(0, "rgba(255,255,255,0.22)");
          glossGrad.addColorStop(1, "rgba(255,255,255,0)");
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(tipX, tipY, tipW, tipH * 0.55, [6 * xScale, 6 * xScale, 0, 0]); }
          else { ctx.beginPath(); ctx.rect(tipX, tipY, tipW, tipH * 0.55); }
          ctx.fillStyle = glossGrad;
          ctx.fill();
          ctx.restore();

          // Pill border — glassy edge
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.38)";
          ctx.lineWidth = xScale;
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(tipX, tipY, tipW, tipH, 6 * xScale); ctx.stroke(); }
          ctx.restore();

          // Username line
          ctx.fillStyle = "rgba(255,255,255,0.72)";
          ctx.font = `${nameFsz}px Helvetica,Arial,sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(
            (userComment.username || userComment.email?.split("@")[0] || "user").substring(0, 24),
            tipX + tipPadX, tipY + tipPadY
          );

          // Comment text lines
          ctx.fillStyle = "rgba(255,255,255,1)";
          ctx.font = `${cFsz}px Helvetica,Arial,sans-serif`;
          commentLines.forEach((line, li) =>
            ctx.fillText(line, tipX + tipPadX, tipY + tipPadY + nameFsz + lineGap + li * (cFsz + lineGap))
          );

          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
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

  const downloadZvukyStoryCard = async () => {
    setIsGenerating(true);
    try {
      const CW = 1080;
      const CH = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CW, CH);

      const artworkProxied = resolvedArtwork ? proxyImageUrl(resolvedArtwork) : "";
      const img = await loadImage(artworkProxied);

      // Blurred background
      if (img) {
        ctx.save();
        ctx.filter = `blur(${Math.round(zvukyBgBlur * 3)}px)`;
        const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight) * 1.2;
        const bw = img.naturalWidth * scale;
        const bh = img.naturalHeight * scale;
        ctx.drawImage(img, (CW - bw) / 2, (CH - bh) / 2, bw, bh);
        ctx.restore();
      }

      // Dark overlay
      ctx.fillStyle = `rgba(0,0,0,${zvukyOverlayOpacity})`;
      ctx.fillRect(0, 0, CW, CH);

      // Centered artwork square
      const artMaxSide = Math.round(CW * 0.7);
      const artX = (CW - artMaxSide) / 2;
      const artY = (CH - artMaxSide) / 2 - Math.round(CH * 0.06);

      if (img) {
        const iW = img.naturalWidth, iH = img.naturalHeight;
        const scale = Math.min(artMaxSide / iW, artMaxSide / iH);
        const dw = iW * scale, dh = iH * scale;
        const dx = artX + (artMaxSide - dw) / 2;
        const dy = artY + (artMaxSide - dh) / 2;
        ctx.save();
        if (zvukyShowArtworkBg) {
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(artX, artY, artMaxSide, artMaxSide, 24);
          else ctx.rect(artX, artY, artMaxSide, artMaxSide);
          ctx.clip();
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(artX, artY, artMaxSide, artMaxSide);
        }
        ctx.drawImage(img, 0, 0, iW, iH, dx, dy, dw, dh);
        ctx.restore();
      } else {
        if (zvukyShowArtworkBg) {
          ctx.fillStyle = "#1a1a1a";
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(artX, artY, artMaxSide, artMaxSide, 24); ctx.fill(); }
          else ctx.fillRect(artX, artY, artMaxSide, artMaxSide);
        }
      }

      // White glow beneath artwork
      {
        const glowCX = artX + artMaxSide / 2;
        const glowCY = artY + artMaxSide;
        const glowRX = artMaxSide * 0.55;
        const glowRY = artMaxSide * 0.22;
        const glow = ctx.createRadialGradient(glowCX, glowCY, 0, glowCX, glowCY, glowRX);
        glow.addColorStop(0, "rgba(255,255,255,0.38)");
        glow.addColorStop(0.5, "rgba(255,255,255,0.14)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.scale(1, glowRY / glowRX);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(glowCX, glowCY * (glowRX / glowRY), glowRX, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Optional hover card below artwork — product-info-pill style with V-arrow caret
      if (zvukyShowHoverCard) {
        const hcW = artMaxSide;
        const hcH = 220;
        const hcX = artX;
        const hcY = artY + artMaxSide + 60;

        // V-arrow caret (rotated square, top-left+top borders only)
        const caretSz = 28;
        const caretX = hcX + hcW / 2 - caretSz / 2;
        const caretY = hcY - caretSz / 2;
        ctx.save();
        ctx.translate(hcX + hcW / 2, caretY + caretSz / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "rgba(10,10,10,0.92)";
        ctx.fillRect(-caretSz / 2, -caretSz / 2, caretSz, caretSz);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        // Only stroke top and left edges (top-left corner of the rotated square = the visible "V" point)
        ctx.beginPath();
        ctx.moveTo(-caretSz / 2, caretSz / 2);
        ctx.lineTo(-caretSz / 2, -caretSz / 2);
        ctx.lineTo(caretSz / 2, -caretSz / 2);
        ctx.stroke();
        ctx.restore();

        // Pill body with backdrop simulation
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(hcX, hcY, hcW, hcH, 16);
        else ctx.rect(hcX, hcY, hcW, hcH);
        ctx.clip();
        if (img) {
          ctx.filter = `blur(24px)`;
          const s = Math.max(hcW / img.naturalWidth, hcH / img.naturalHeight) * 1.2;
          ctx.drawImage(img, hcX + (hcW - img.naturalWidth * s) / 2, hcY + (hcH - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
          ctx.filter = "none";
        }
        ctx.fillStyle = "rgba(10,10,10,0.92)";
        ctx.fillRect(hcX, hcY, hcW, hcH);
        ctx.restore();

        // Pill border
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(hcX, hcY, hcW, hcH, 16);
        else ctx.rect(hcX, hcY, hcW, hcH);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Pill text
        ctx.textAlign = "center";
        ctx.font = "34px Helvetica, Arial, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        const productTypeLabel = zvukyTypeLabels[(product as any)?.type] || (product as any)?.typeLabel || "Sound Kit";
        ctx.fillText(productTypeLabel.toUpperCase(), CW / 2, hcY + 60);
        ctx.font = "bold 62px Helvetica, Arial, sans-serif";
        ctx.fillStyle = "#fff";
        const hcTitleLines = wrapText(ctx, resolvedTitle, hcW - 80);
        hcTitleLines.slice(0, 2).forEach((line, li) => ctx.fillText(line, CW / 2, hcY + 130 + li * 70));
        ctx.font = "40px Helvetica, Arial, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        if (zvukyHoverShowSounds && (product as any)?.number_of_sounds != null) {
          ctx.fillText(`${(product as any).number_of_sounds} zvuků`, CW / 2, hcY + 196);
        } else if (!zvukyHoverShowSounds && product?.price !== undefined) {
          ctx.fillText(product.price === 0 ? "ZDARMA" : `${product.price} CZK`, CW / 2, hcY + 196);
        }
      }

      // Text layers (logo, title, website)
      const ZVUKY_PREV_H = 630;
      const yScale = CH / ZVUKY_PREV_H;
      const ZVUKY_MARGIN = 90;

      for (const layer of zvukyLayers) {
        if (!layer.visible) continue;
        const layerY = (typeof layer.y === "number" ? layer.y : 280) * yScale;
        const layerAlign = (layer.align || "center") as "left" | "center" | "right";
        const textX = layerAlign === "left" ? ZVUKY_MARGIN : layerAlign === "right" ? CW - ZVUKY_MARGIN : CW / 2;

        if (layer.mode === "image" && layer.imageUrl) {
          const logoProxied = proxyImageUrl(layer.imageUrl);
          const logoImg = await loadImage(logoProxied);
          if (logoImg) {
            const maxH = 90;
            const s = maxH / logoImg.naturalHeight;
            const w = logoImg.naturalWidth * s;
            const imgX = layerAlign === "left" ? ZVUKY_MARGIN : layerAlign === "right" ? CW - ZVUKY_MARGIN - w : (CW - w) / 2;
            if (zvukyLogoInvert) { ctx.save(); ctx.filter = "invert(1)"; }
            ctx.drawImage(logoImg, imgX, layerY - maxH / 2, w, maxH);
            if (zvukyLogoInvert) ctx.restore();
          }
          continue;
        }

        ctx.textAlign = layerAlign === "center" ? "center" : layerAlign === "left" ? "left" : "right";
        ctx.letterSpacing = "0px";
        if (layer.id === "logo") {
          ctx.font = "bold 52px Helvetica, Arial, sans-serif";
          ctx.fillStyle = zvukyTextColor + "cc";
          ctx.letterSpacing = "8px";
          ctx.fillText("VOODOO808.COM", textX, layerY);
          ctx.letterSpacing = "0px";
        } else if (layer.id === "title") {
          ctx.font = "bold 96px Helvetica, Arial, sans-serif";
          ctx.fillStyle = zvukyTextColor;
          const maxTitleW = layerAlign === "center" ? CW - ZVUKY_MARGIN * 2 : CW - ZVUKY_MARGIN * 2;
          const titleLines = wrapText(ctx, resolvedTitle.toUpperCase(), maxTitleW);
          titleLines.forEach((line, li) => ctx.fillText(line, textX, layerY + li * 112));
        } else if (layer.id === "website") {
          ctx.font = "38px Helvetica, Arial, sans-serif";
          ctx.fillStyle = zvukyTextColor + "99";
          ctx.fillText("VOODOO808.COM", textX, layerY);
        }
        ctx.textAlign = "center";
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voodoo808-zvuky-story-${resolvedId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const durationStr = beatDuration ? formatDur(beatDuration) : null;
  const playedStr = beatDuration ? formatDur(beatDuration * PLAYHEAD_POS) : null;

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

          {activeTab === "story" && resolvedType === "sound_kit" && (
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              {/* ZVUKY Mini Preview */}
              {(() => {
                const MINI_W = 160;
                const MINI_H = Math.round(MINI_W * 1920 / 1080);
                const ZVUKY_PREV_H = 630;
                const artSizeM = Math.round(MINI_W * 0.65);
                const artXm = Math.round((MINI_W - artSizeM) / 2);
                const artYm = Math.round((MINI_H - artSizeM) / 2 - MINI_H * 0.06);
                return (
                  <div style={{ width: `${MINI_W}px`, height: `${MINI_H}px`, flexShrink: 0, borderRadius: "6px", overflow: "hidden", border: "1px solid #2a2a2a", position: "relative", background: "#111" }}>
                    {resolvedArtwork && <img src={resolvedArtwork} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(${zvukyBgBlur}px)`, transform: "scale(1.3)" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${zvukyOverlayOpacity})` }} />
                    {resolvedArtwork && (
                      <>
                        {/* White glow beneath artwork */}
                        <div style={{ position: "absolute", left: `${artXm}px`, top: `${artYm + artSizeM * 0.72}px`, width: `${artSizeM}px`, height: `${artSizeM * 0.45}px`, background: "radial-gradient(ellipse at center top, rgba(255,255,255,0.38) 0%, transparent 70%)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", left: `${artXm}px`, top: `${artYm}px`, width: `${artSizeM}px`, height: `${artSizeM}px`, borderRadius: "4px", overflow: "hidden", background: zvukyShowArtworkBg ? "#0a0a0a" : "transparent" }}>
                          <img src={resolvedArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      </>
                    )}
                    {zvukyShowHoverCard && (
                      <div style={{ position: "absolute", left: `${artXm}px`, top: `${artYm + artSizeM + 3}px`, width: `${artSizeM}px`, boxSizing: "border-box" as const }}>
                        {/* V-arrow caret */}
                        <div style={{ width: "7px", height: "7px", background: "rgba(10,10,10,0.92)", border: "1px solid #333", borderRight: "none", borderBottom: "none", transform: "rotate(45deg)", margin: "0 auto", marginBottom: "-3px", position: "relative", zIndex: 1 }} />
                        {/* Pill body */}
                        <div style={{ background: "rgba(10,10,10,0.92)", border: "1px solid #333", borderRadius: "3px", padding: "3px 5px", position: "relative", zIndex: 2 }}>
                          <div style={{ fontSize: "3.5px", color: "#666", marginBottom: "1px" }}>{(zvukyTypeLabels[(product as any)?.type] || (product as any)?.typeLabel || "Sound Kit").toUpperCase()}</div>
                          <div style={{ fontSize: "5px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "1px" }}>{resolvedTitle}</div>
                          {zvukyHoverShowSounds
                            ? (product as any)?.number_of_sounds != null && <div style={{ fontSize: "3.5px", color: "#999" }}>{(product as any).number_of_sounds} zvuků</div>
                            : product?.price !== undefined && <div style={{ fontSize: "3.5px", color: "#999" }}>{product.price === 0 ? "ZDARMA" : `${product.price} CZK`}</div>
                          }
                        </div>
                      </div>
                    )}
                    {zvukyLayers.filter(l => l.visible).map(layer => {
                      const yPct = ((layer.y ?? 280) / ZVUKY_PREV_H) * 100;
                      const lAlign = (layer.align || "center") as "left" | "center" | "right";
                      const miniMargin = "8px";
                      const base: CSSProperties = {
                        position: "absolute",
                        top: yPct + "%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none" as const,
                        ...(lAlign === "center" ? { left: 0, right: 0, textAlign: "center" as const } :
                            lAlign === "left" ? { left: miniMargin, right: "auto", textAlign: "left" as const } :
                            { right: miniMargin, left: "auto", textAlign: "right" as const }),
                      };
                      if (layer.mode === "image" && layer.imageUrl) {
                        const imgStyle: CSSProperties = { height: "10px", width: "auto", objectFit: "contain", filter: zvukyLogoInvert ? "invert(1)" : "none", display: "block",
                          ...(lAlign === "center" ? { margin: "0 auto", maxWidth: "75%" } : lAlign === "left" ? { marginRight: "auto" } : { marginLeft: "auto" }) };
                        return <img key={layer.id} src={layer.imageUrl} alt="" style={{ ...base, ...imgStyle }} />;
                      }
                      if (layer.id === "logo") return <div key="logo" style={{ ...base, fontSize: "6px", fontWeight: "700", color: zvukyTextColor, letterSpacing: "1.5px" }}>VOODOO808.COM</div>;
                      if (layer.id === "title") return <div key="title" style={{ ...base, fontSize: "9px", fontWeight: "700", color: zvukyTextColor, letterSpacing: "0.04em", lineHeight: 1.15, wordBreak: "break-word" as const }}>{resolvedTitle.toUpperCase()}</div>;
                      if (layer.id === "website") return <div key="website" style={{ ...base, fontSize: "5px", color: zvukyTextColor + "88", letterSpacing: "0.4px" }}>VOODOO808.COM</div>;
                      return null;
                    })}
                  </div>
                );
              })()}

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "12px", color: "#555", margin: "0 0 16px 0", lineHeight: 1.6 }}>Stáhni si ZVUKY story kartu pro Instagram — sdílej sound kit jako příběh. Šablona se nastavuje v Admin → IG Stories → ZVUKY.</p>
                <button onClick={downloadZvukyStoryCard} disabled={isGenerating} style={{ width: "100%", padding: "11px", background: isGenerating ? "#222" : "#fff", color: isGenerating ? "#555" : "#000", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "600", cursor: isGenerating ? "default" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {isGenerating ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      Generuji...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Stáhnout ZVUKY Story (1080×1920)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "story" && resolvedType !== "sound_kit" && (
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              {/* Mini preview — iPhone proportions */}
              {(() => {
                const MINI_W = 160;
                const MINI_H = Math.round(MINI_W * 874 / 402);
                const CARD_MARGIN_MINI = 12;
                const cardWm = MINI_W - CARD_MARGIN_MINI * 2;
                const cardPadm = Math.round(cardPadding * (MINI_W / 216));
                const artWm = cardWm - cardPadm * 2;
                const cardHmEst = cardPadm + artWm + 40 + cardPadm;
                const centeredTopM = (MINI_H - cardHmEst) / 2 + Math.round(cardYOffset * (MINI_H / 470));
                const cardTopM = Math.max(5, centeredTopM);
                const cardRadM = Math.round(cardRadius * (MINI_W / 216));
                // Resample for mini preview (80 bars)
                const miniPeaks = (() => {
                  const raw = waveformData && waveformData.length > 0 ? waveformData : WAVE_BARS;
                  return Array.from({ length: 80 }, (_, i) => {
                    const t = i / 79;
                    const src = t * (raw.length - 1);
                    const lo = Math.floor(src);
                    const hi = Math.min(lo + 1, raw.length - 1);
                    return raw[lo] + (raw[hi] - raw[lo]) * (src - lo);
                  });
                })();
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
                        {/* Artwork */}
                        <div style={{ width: `${artWm}px`, height: `${artWm}px`, borderRadius: `${Math.max(0, cardRadM - cardPadm)}px`, overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
                          <img src={resolvedArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        </div>
                        {/* Title */}
                        <div style={{ fontSize: "4.5px", fontWeight: 700, color: "#fff", textAlign: cardTitleAlign, wordBreak: "break-word", lineHeight: 1.2, marginTop: "3px" }}>{resolvedTitle.toUpperCase()}</div>
                        {/* Brand */}
                        <div style={{ fontSize: "3.5px", color: "rgba(255,255,255,0.6)", textAlign: cardBrandAlign }}>VOODOO808.COM</div>
                        {/* Waveform — 80 bars, thinner, with playhead + comment avatar at playhead pos */}
                        <div style={{ position: "relative", height: "11px", marginTop: "3px", overflow: "visible" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: "0.3px", paddingBottom: "30%" }}>
                            {miniPeaks.map((peak, i) => {
                              const isPlayed = i / 80 < PLAYHEAD_POS;
                              return (
                                <div key={i} style={{ flexShrink: 0, width: "0.7px", height: `${Math.max(0.8, peak * 7.5)}px`, background: isPlayed ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)", borderRadius: "0.3px", alignSelf: "flex-end" }} />
                              );
                            })}
                          </div>
                          {/* Divider */}
                          <div style={{ position: "absolute", left: 0, right: 0, bottom: "30%", height: "0.5px", background: "rgba(0,0,0,0.3)" }} />
                          {/* Playhead */}
                          <div style={{ position: "absolute", left: `${PLAYHEAD_POS * 100}%`, top: 0, width: "0.7px", height: "100%", background: "rgba(255,255,255,0.9)", zIndex: 1 }} />
                          {/* User avatar at playhead */}
                          {userComment && (
                            <div style={{ position: "absolute", left: `${PLAYHEAD_POS * 100}%`, top: "50%", transform: "translate(-50%,-50%)", width: "7px", height: "7px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.75)", overflow: "hidden", zIndex: 2, flexShrink: 0 }}>
                              {userComment.avatar_url
                                ? <img src={userComment.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: "3px", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>{(userComment.username || userComment.email || "?").charAt(0).toUpperCase()}</div>
                              }
                            </div>
                          )}
                        </div>
                        {/* Time labels */}
                        <div style={{ marginTop: "1px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "3px", color: "rgba(255,255,255,0.5)" }}>{playedStr || "–:––"}</span>
                          <span style={{ fontSize: "3px", color: "rgba(255,255,255,0.35)" }}>{durationStr || "–:––"}</span>
                        </div>
                        {/* Player controls — real PNG icons, inverted to white */}
                        <div style={{ marginTop: "3px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          {/* Prev */}
                          <img src="/icons/previous.png" alt="" style={{ width: "8px", height: "8px", filter: "invert(1)", opacity: 0.75, display: "block" }} />
                          {/* Pause */}
                          <img src="/icons/pause.png" alt="" style={{ width: "6px", height: "8px", filter: "invert(1)", opacity: 1, display: "block" }} />
                          {/* Next — mirror of previous */}
                          <img src="/icons/previous.png" alt="" style={{ width: "8px", height: "8px", filter: "invert(1)", opacity: 0.75, transform: "scaleX(-1)", display: "block" }} />
                        </div>
                        {/* Volume — left: speaker only, right: speaker + 3 arcs */}
                        <div style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "2px" }}>
                          {/* Left: speaker only */}
                          <svg width="4" height="4" viewBox="0 0 20 20" fill="rgba(255,255,255,0.45)">
                            <path d="M11 3.5 L6.5 7.5 H3 Q2 7.5 2 8.5 V11.5 Q2 12.5 3 12.5 H6.5 L11 16.5 Z"/>
                          </svg>
                          <div style={{ flex: 1, height: "1.5px", background: "rgba(255,255,255,0.18)", borderRadius: "1px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "70%", background: "rgba(255,255,255,0.75)" }} />
                          </div>
                          {/* Right: speaker + 3 arcs */}
                          <svg width="5" height="4" viewBox="0 0 24 20" fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.45)" strokeLinecap="round">
                            <path d="M11 3.5 L6.5 7.5 H3 Q2 7.5 2 8.5 V11.5 Q2 12.5 3 12.5 H6.5 L11 16.5 Z" stroke="none"/>
                            <path d="M13.5 7 A4 4 0 0 1 13.5 13" fill="none" strokeWidth="1.5"/>
                            <path d="M16 5.5 A7 7 0 0 1 16 14.5" fill="none" strokeWidth="1.5"/>
                            <path d="M18.5 4 A10 10 0 0 1 18.5 16" fill="none" strokeWidth="1.5"/>
                          </svg>
                        </div>
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
