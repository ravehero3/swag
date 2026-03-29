import { useState, useEffect, useRef, useCallback } from "react";
import ShareModal from "./ShareModal.js";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  is_highlighted?: boolean;
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
}: MusicPlayerProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeLabel, setShowVolumeLabel] = useState(false);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const activeAudioRef = audioRef || internalAudioRef;

  const knobDragRef = useRef<{ dragging: boolean; startY: number; startVolume: number }>({
    dragging: false,
    startY: 0,
    startVolume: 0.8,
  });

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = clamped;
    }
  }, [activeAudioRef]);

  const onKnobMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    knobDragRef.current = { dragging: true, startY: e.clientY, startVolume: volume };
    setShowVolumeLabel(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (!knobDragRef.current.dragging) return;
      const delta = (knobDragRef.current.startY - ev.clientY) / 120;
      handleVolumeChange(knobDragRef.current.startVolume + delta);
    };

    const onMouseUp = () => {
      knobDragRef.current.dragging = false;
      setShowVolumeLabel(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [volume, handleVolumeChange]);

  useEffect(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = volume;
    }
  }, [activeAudioRef]);

  useEffect(() => {
    const audio = activeAudioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [activeAudioRef, currentBeat]);

  if (!currentBeat) return null;

  // Knob: map volume 0–1 to rotation -135° to +135°
  const knobRotation = -135 + volume * 270;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "84px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
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
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

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
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.height = "6px";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.height = "6px";
          }}
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
          {/* Scrubber thumb */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progressPercent}%`,
              transform: "translate(-50%, -50%)",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              pointerEvents: "none",
              opacity: progressPercent > 0 ? 1 : 0,
              transition: isPlaying ? "none" : "left 0.1s linear",
              boxShadow: "0 0 4px rgba(255,255,255,0.6)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, position: "relative" }}>
          <img
            src={currentBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
            alt={currentBeat.title}
            style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "2px", marginLeft: "-16px", marginRight: "0" }}
          />
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="player-title" style={{ fontWeight: "bold", fontSize: "18px" }}>{currentBeat.title}</div>
            <button
              onClick={() => onBuyClick(currentBeat)}
              className="btn-bounce buy-btn-player"
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
              padding: "16px",
            }}
            title="Loop"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              padding: "16px",
            }}
            title="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              border: "2px solid #fff",
              background: isPlaying ? "#fff" : "transparent",
              color: isPlaying ? "#000" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              padding: "0",
              margin: "16px 0",
              flexShrink: 0,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button
            onClick={onNext}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "16px",
            }}
            title="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
              padding: "16px",
            }}
            title="Shuffle"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>

          {/* Volume Knob — appears when playing */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              opacity: isPlaying ? 1 : 0,
              transform: isPlaying ? "translateX(0) scale(1)" : "translateX(16px) scale(0.85)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
              pointerEvents: isPlaying ? "auto" : "none",
              userSelect: "none",
            }}
            data-testid="volume-knob-container"
          >
            <style>{`
              @keyframes knobAppear {
                from { opacity: 0; transform: scale(0.7); }
                to { opacity: 1; transform: scale(1); }
              }
              .volume-knob-ring {
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                border: 1.5px solid #333;
              }
              .volume-knob-arc {
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                border: 1.5px solid transparent;
                border-top-color: #fff;
                border-right-color: #fff;
              }
              @media (max-width: 768px) {
                .volume-knob-container-outer { display: none !important; }
              }
            `}</style>

            <div
              className="volume-knob-container-outer"
              style={{ position: "relative", width: "44px", height: "44px" }}
              onMouseEnter={() => setShowVolumeLabel(true)}
              onMouseLeave={() => !knobDragRef.current.dragging && setShowVolumeLabel(false)}
            >
              {/* Arc track */}
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {/* Background arc */}
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="2"
                  strokeDasharray={`${(270 / 360) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                  strokeDashoffset={`${-(45 / 360) * 2 * Math.PI * 18}`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px" }}
                />
                {/* Volume fill arc */}
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeDasharray={`${volume * (270 / 360) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                  strokeDashoffset={`${-(45 / 360) * 2 * Math.PI * 18}`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px", transition: "stroke-dasharray 0.05s" }}
                />
              </svg>

              {/* Knob body */}
              <div
                onMouseDown={onKnobMouseDown}
                data-testid="volume-knob"
                style={{
                  position: "absolute",
                  inset: "5px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #3a3a3a, #111)",
                  border: "1px solid #444",
                  cursor: "ns-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                {/* Tick indicator */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transform: `rotate(${knobRotation}deg)`,
                    transition: "transform 0.05s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "2px",
                      height: "6px",
                      background: "#fff",
                      borderRadius: "1px",
                    }}
                  />
                </div>
              </div>

              {/* Volume % tooltip */}
              {showVolumeLabel && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#111",
                    border: "1px solid #333",
                    color: "#fff",
                    fontSize: "11px",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    letterSpacing: "0.02em",
                  }}
                >
                  {Math.round(volume * 100)}%
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "9px",
                color: "#555",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              }}
            >
              VOL
            </span>
          </div>

          <button
            onClick={() => {
              const element = document.createElement('a');
              element.href = currentBeat.preview_url;
              element.download = `${currentBeat.title}.mp3`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
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
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Download"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <style>{`
              @media (max-width: 768px) {
                .player-title {
                  font-size: 14px !important;
                  max-width: 120px !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  white-space: nowrap !important;
                }
                .music-player-controls {
                  display: flex !important;
                  gap: 8px !important;
                  margin-right: 80px !important;
                }
                .music-player-controls button {
                  padding: 8px !important;
                }
                .music-player-controls button:first-child,
                .music-player-controls button:last-child {
                  display: none !important;
                }
                .music-player-controls button svg {
                  width: 16px !important;
                  height: 16px !important;
                }
                .music-player-controls button:nth-child(3) {
                  width: 36px !important;
                  height: 36px !important;
                  font-size: 18px !important;
                }
                .share-btn-mobile {
                  position: absolute !important;
                  right: 8px !important;
                  bottom: 8px !important;
                  top: auto !important;
                  transform: none !important;
                  z-index: 1002 !important;
                }
                .download-btn-player {
                  position: absolute !important;
                  right: 48px !important;
                  bottom: 8px !important;
                  top: auto !important;
                  z-index: 1002 !important;
                }
                .buy-btn-player {
                  display: none !important;
                }
                .buy-btn-mobile {
                  display: none !important;
                }
                .buy-btn-mobile-new {
                  display: none !important;
                }
              }
            `}</style>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

        </div>
      </div>

      <ShareModal
        beatId={currentBeat.id}
        beatTitle={currentBeat.title}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}

export default MusicPlayer;
