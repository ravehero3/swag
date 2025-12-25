import { useState, useEffect, useRef } from "react";
import ShareModal from "./ShareModal";

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
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const activeAudioRef = audioRef || internalAudioRef;

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
          background: "#111",
          borderTop: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 100,
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#222" }}>
          <div
            style={{
              height: "100%",
              background: "#fff",
              width: `${progressPercent}%`,
              transition: isPlaying ? "none" : "width 0.1s linear",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, position: "relative" }}>
          <img
            src={currentBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
            alt={currentBeat.title}
            style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "2px", marginLeft: "-16px", marginRight: "0" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: "18px" }}>{currentBeat.title}</div>
          </div>
          <button
            onClick={() => onBuyClick(currentBeat)}
            className="btn-bounce buy-btn-mobile-new"
            style={{
              padding: "8px 8px 8px 16px",
              background: "#000",
              color: "#fff",
              border: "none",
              fontSize: "12px",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 400,
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              gap: "6px",
              borderRadius: "4px",
              position: "absolute",
              left: "0 !important",
              right: "auto !important",
              top: "calc(50% + 80px)",
              transform: "translateY(-50%)",
              minWidth: "120px",
              height: "32px",
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              overflow: "visible",
              boxShadow: "inset 0 0 0 0.5px #fff",
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "#fff";
              btn.style.color = "#000";
              btn.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
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
              transform: "translateY(var(--share-btn-offset, 0))",
              transition: "transform 0.2s",
              zIndex: 1000
            }}
            title="Share"
          >
            <style>{`
              @media (max-width: 768px) {
                .share-btn-mobile {
                  --share-btn-offset: 0px !important;
                }
                .buy-btn-mobile {
                  display: none !important;
                }
                .buy-btn-mobile-new {
                  display: flex !important;
                }
                .music-player-controls {
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

          <button
            onClick={() => onBuyClick(currentBeat)}
            className="btn-bounce buy-btn-mobile"
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
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s",
              overflow: "visible",
              boxShadow: "inset 0 0 0 0.5px #fff",
              transform: "translate(var(--buy-btn-translate-x, 0), var(--buy-btn-translate-y, 0))",
              zIndex: 1000
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "#fff";
              btn.style.color = "#000";
              btn.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
              
              // Change + symbol color to black
              const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
              if (plusSymbol) plusSymbol.style.color = "#000";
              
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
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "#000";
              btn.style.color = "#fff";
              btn.style.boxShadow = "inset 0 0 0 0.5px #fff";
              
              // Change + symbol color back to white
              const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
              if (plusSymbol) plusSymbol.style.color = "#fff";
              
              // Remove only particles, not icon container
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
