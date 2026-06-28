import { useState, useEffect, useRef, useCallback } from "react";
import ShareModal from "./ShareModal.js";
import { toAudioProxyUrl } from "../lib/audioProxy.js";
import { BeatArtwork } from "./BeatArtwork.js";
import type { Beat } from "../types/beat.js";

interface QueueItem {
  id: number;
  title: string;
  artwork_url: string;
  price: number;
  product_type?: string;
}

interface MusicPlayerProps {
  currentBeat: Beat | null;
  isPlaying: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onBuyClick: (beat: Beat) => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
  isSaved?: boolean;
  onToggleSave?: () => void;
  queue?: QueueItem[];
}

function MusicPlayer({
  currentBeat,
  isPlaying,
  isLooping,
  isShuffling,
  onPlayPause,
  onPrevious,
  onNext,
  onToggleLoop,
  onToggleShuffle,
  onBuyClick,
  audioRef,
  isSaved = false,
  onToggleSave,
  queue = [],
}: MusicPlayerProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMobileQueue, setShowMobileQueue] = useState(false);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const activeAudioRef = audioRef || internalAudioRef;

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = clamped;
    }
  }, [activeAudioRef]);

  const handleToggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      const restore = prevVolume > 0 ? prevVolume : 0.8;
      setVolume(restore);
      setIsMuted(false);
      if (activeAudioRef.current) activeAudioRef.current.volume = restore;
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
      if (activeAudioRef.current) activeAudioRef.current.volume = 0;
    }
  }, [isMuted, volume, prevVolume, activeAudioRef]);

  const handleDownload = useCallback(async () => {
    if (!currentBeat?.preview_url) return;
    try {
      const response = await fetch(toAudioProxyUrl(currentBeat.preview_url));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentBeat.title} (VOODOO808.COM).mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = toAudioProxyUrl(currentBeat.preview_url);
      a.download = `${currentBeat.title} (VOODOO808.COM).mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [currentBeat]);

  useEffect(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = volume;
    }
  }, [activeAudioRef]);

  useEffect(() => {
    const audio = activeAudioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);

    // Sync immediately — loadedmetadata may have already fired before this effect ran
    updateDuration();
    updateTime();

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
    };
  }, [activeAudioRef, currentBeat]);

  if (!currentBeat) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div
        className="music-player-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "84px",
          backgroundColor: "rgba(13, 13, 13, 0.3)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 10000,
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {/* Clickable timeline */}
        <div
          data-testid="timeline-bar"
          onClick={(e) => {
            const bar = e.currentTarget as HTMLDivElement;
            const rect = bar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            const audio = activeAudioRef.current;
            if (audio && audio.duration) {
              audio.currentTime = pct * audio.duration;
              setCurrentTime(audio.currentTime);
            }
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#222",
            cursor: "pointer",
            zIndex: 100,
          }}
          onMouseEnter={() => setIsHoveringTimeline(true)}
          onMouseLeave={() => setIsHoveringTimeline(false)}
        >
          <div
            style={{
              height: "100%",
              background: "#fff",
              width: `${progressPercent}%`,
              transition: isPlaying ? "none" : "width 0.1s linear",
              pointerEvents: "none",
            }}
          />
          {/* Scrubber thumb — only visible on hover */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progressPercent}%`,
              transform: "translate(-50%, -50%)",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#fff",
              pointerEvents: "none",
              opacity: isHoveringTimeline && progressPercent >= 0 ? 1 : 0,
              transition: isPlaying ? "opacity 0.15s ease" : "left 0.1s linear, opacity 0.15s ease",
              boxShadow: "0 0 6px rgba(255,255,255,0.7)",
            }}
          />
        </div>

        <div className="player-left-section" style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, position: "relative" }}>
          <BeatArtwork
            artworkUrl={currentBeat.artwork_url}
            alt={currentBeat.title}
            width={84}
            height={84}
            borderRadius={2}
            loading="eager"
            style={{ marginLeft: "-16px", marginRight: "0", flexShrink: 0 }}
          />
          <div className="player-info-wrap" style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="player-title" style={{ fontWeight: "bold", fontSize: "18px", lineHeight: "1.1" }}>{currentBeat.title}</div>
              {(currentBeat.bpm || currentBeat.key) && (
                <div className="player-beat-meta" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {currentBeat.bpm && (
                    <span style={{ fontSize: "11px", color: "#555", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "0.02em" }}>{currentBeat.bpm} BPM</span>
                  )}
                  {currentBeat.bpm && currentBeat.key && (
                    <span style={{ fontSize: "11px", color: "#333" }}>·</span>
                  )}
                  {currentBeat.key && (
                    <span style={{ fontSize: "11px", color: "#555", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "0.02em" }}>{currentBeat.key}</span>
                  )}
                </div>
              )}
            </div>
            {onToggleSave && (
              <button
                onClick={onToggleSave}
                title={isSaved ? "Remove from favorites" : "Add to favorites"}
                className="player-save-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "#fff" : "none"} stroke="#fff" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onBuyClick(currentBeat)}
              className="btn-bounce buy-btn-player player-buy-btn"
              style={{
                padding: "8px 8px 8px 16px",
                background: "#000",
                color: "#fff",
                border: "none",
                fontSize: "12px",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "4px",
                position: "relative",
                minWidth: "120px",
                height: "32px",
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                overflow: "visible",
                boxShadow: "inset 0 0 0 0.5px #fff",
                zIndex: 100
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = "#fff";
                btn.style.color = "#000";
                btn.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
                
                // Create particles
                for (let i = 0; i < 7; i++) {
                  const particle = document.createElement("div");
                  particle.setAttribute("data-particle", "true");
                  const angle = (i / 7) * Math.PI * 2;
                  particle.style.position = "absolute";
                  particle.style.width = "4px";
                  particle.style.height = "4px";
                  particle.style.background = "#fff";
                  particle.style.borderRadius = "50%";
                  particle.style.left = "50%";
                  particle.style.top = "50%";
                  particle.style.pointerEvents = "none";
                  particle.style.transform = "translate(-50%, -50%)";
                  particle.style.opacity = "0.8";
                  
                  const distance = 35;
                  const startX = Math.cos(angle) * distance;
                  const startY = Math.sin(angle) * distance;
                  const endX = Math.cos(angle) * (distance + 40);
                  const endY = Math.sin(angle) * (distance + 40);
                  
                  particle.style.animation = `particleFloat-${i} 3s ease-out forwards`;
                  
                  btn.appendChild(particle);
                  
                  const style = document.createElement("style");
                  style.textContent = `
                    @keyframes particleFloat-${i} {
                      0% { transform: translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px)); opacity: 0.8; }
                      100% { transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)); opacity: 0; }
                    }
                  `;
                  document.head.appendChild(style);
                }
                
                const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                if (plusSymbol) plusSymbol.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = "#000";
                btn.style.color = "#fff";
                btn.style.boxShadow = "inset 0 0 0 0.5px #fff";
                
                const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                if (plusSymbol) plusSymbol.style.color = "#fff";
                
                const particles = btn.querySelectorAll("div[data-particle='true']");
                particles.forEach((p) => p.remove());
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                  <rect x="3" y="6" width="18" height="15" rx="2" />
                  <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                </svg>
                <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#fff", lineHeight: "1", right: "-10px", top: "-5px" }}>+</span>
              </div>
              <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{Math.floor(currentBeat.price)} CZK</span>
            </button>
          </div>
        </div>

        <div className="music-player-controls" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onToggleLoop}
            style={{
              background: "transparent",
              border: "none",
              color: isLooping ? "#fff" : "#666",
              cursor: "pointer",
              padding: "10px",
            }}
            title="Loop"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>

          <button
            onClick={onPrevious}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "10px",
            }}
            title="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "2px solid #fff",
              background: isPlaying ? "#fff" : "transparent",
              color: isPlaying ? "#000" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              padding: "0",
              margin: "12px 0",
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor" style={{ display: "block" }}>
                <rect x="1" y="0" width="3" height="10" />
                <rect x="6" y="0" width="3" height="10" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor" style={{ display: "block", marginLeft: "1px" }}>
                <polygon points="1,0 10,5 1,10" />
              </svg>
            )}
          </button>

          <button
            onClick={onNext}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "10px",
            }}
            title="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            onClick={onToggleShuffle}
            style={{
              background: "transparent",
              border: "none",
              color: isShuffling ? "#fff" : "#666",
              cursor: "pointer",
              padding: "10px",
            }}
            title="Shuffle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
        </div>

        <div className="player-right-section" style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>

          {/* Time display */}
          {duration > 0 && (
            <div
              className="player-time-display"
              style={{
                fontSize: "11px",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                color: "#555",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                userSelect: "none",
                minWidth: "80px",
                textAlign: "right",
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}

          {/* Volume Control */}
          <div
            className="volume-slider-wrapper"
            data-testid="volume-slider-container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              userSelect: "none",
            }}
          >
            <style>{`
              @media (max-width: 768px) {
                .volume-slider-wrapper { display: none !important; }
                .player-beat-meta { display: none !important; }
                .player-time-display { display: none !important; }
                .mobile-queue-btn { display: flex !important; }
              }
              .volume-slider {
                -webkit-appearance: none;
                appearance: none;
                width: 90px;
                height: 3px;
                background: linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%);
                border-radius: 3px;
                outline: none;
                cursor: pointer;
                max-width: 0;
                opacity: 0;
                pointer-events: none;
                transition: max-width 0.25s ease, opacity 0.2s ease, height 0.15s ease, background 0.05s;
              }
              .volume-slider-wrapper:hover .volume-slider {
                max-width: 90px;
                opacity: 1;
                pointer-events: auto;
              }
              .volume-slider:hover {
                height: 4px;
              }
              .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #fff;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(13,13,13,0.5);
                transition: transform 0.1s ease, box-shadow 0.1s ease;
              }
              .volume-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 0 8px rgba(255,255,255,0.5);
              }
              .volume-slider::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #fff;
                cursor: pointer;
                border: none;
                box-shadow: 0 1px 4px rgba(13,13,13,0.5);
              }
              .volume-slider::-moz-range-track {
                height: 3px;
                border-radius: 3px;
                background: rgba(255,255,255,0.15);
              }
              .volume-slider::-moz-range-progress {
                height: 3px;
                border-radius: 3px;
                background: #fff;
              }
              .volume-icon-btn {
                background: transparent;
                border: none;
                color: #aaa;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: color 0.15s ease;
                flex-shrink: 0;
              }
              .volume-icon-btn:hover {
                color: #fff;
              }
            `}</style>
            {/* Speaker icon — click to mute/unmute */}
            <button
              className="volume-icon-btn"
              onClick={handleToggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              data-testid="volume-mute-btn"
            >
              {(isMuted || volume === 0) ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.4 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              data-testid="volume-slider"
              style={{
                background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
              }}
            />
          </div>

          <button
            onClick={handleDownload}
            className="btn-bounce download-btn-player"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              transition: "all 0.2s",
              zIndex: 1000,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Download preview"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="btn-bounce share-btn-mobile"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              transition: "all 0.2s",
              zIndex: 1000,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Share"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

          {/* Mobile queue toggle button — only visible on mobile */}
          {queue.length > 1 && (
            <button
              onClick={() => setShowMobileQueue((v) => !v)}
              className="mobile-queue-btn"
              data-testid="button-mobile-queue"
              title="Fronta"
              style={{
                background: showMobileQueue ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          )}

        </div>
      </div>

      {/* Mobile queue drawer */}
      {showMobileQueue && queue.length > 1 && (
        <div
          className="mobile-queue-drawer"
          style={{
            position: "fixed",
            bottom: "84px",
            left: 0,
            right: 0,
            background: "rgba(10,10,10,0.97)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid #222",
            zIndex: 9999,
            maxHeight: "55vh",
            overflowY: "auto",
            animation: "queueSlideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) forwards",
          }}
        >
          <style>{`
            @keyframes queueSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .mobile-queue-drawer::-webkit-scrollbar { width: 3px; }
            .mobile-queue-drawer::-webkit-scrollbar-track { background: transparent; }
            .mobile-queue-drawer::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
            .queue-track-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #111; transition: background 0.15s; cursor: default; }
            .queue-track-row.active { background: rgba(255,255,255,0.05); }
            .queue-track-row:last-child { border-bottom: none; }
          `}</style>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fronta ({queue.length})</span>
            <button onClick={() => setShowMobileQueue(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {queue.map((item, idx) => {
            const isActive = item.id === currentBeat?.id && item.product_type === (currentBeat as any)?.product_type;
            return (
              <div key={`${item.id}-${idx}`} className={`queue-track-row${isActive ? " active" : ""}`}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {item.artwork_url ? (
                    <img src={item.artwork_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "#1a1a1a" }} />
                  )}
                  {isActive && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", borderRadius: "4px" }}>
                      <svg width="14" height="14" viewBox="0 0 10 10" fill="#fff"><rect x="1" y="0" width="3" height="10"/><rect x="6" y="0" width="3" height="10"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? "#fff" : "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                    {Math.floor(item.price)} CZK
                  </div>
                </div>
                {isActive && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <ShareModal
        product={{ id: currentBeat.id, title: currentBeat.title, price: currentBeat.price, artwork_url: currentBeat.artwork_url, preview_url: currentBeat.preview_url }}
        productType={currentBeat.product_type === "sound_kit" ? "sound_kit" : "beat"}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}

export default MusicPlayer;
