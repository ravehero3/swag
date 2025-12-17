import { useState } from "react";
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
}: MusicPlayerProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  if (!currentBeat) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
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

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <img
            src={currentBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
            alt={currentBeat.title}
            style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "4px" }}
          />
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{currentBeat.title}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>VOODOO808</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onToggleLoop}
            style={{
              background: "transparent",
              border: "none",
              color: isLooping ? "#fff" : "#666",
              cursor: "pointer",
              padding: "8px",
            }}
            title="Loop"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              padding: "8px",
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
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid #fff",
              background: isPlaying ? "#fff" : "transparent",
              color: isPlaying ? "#000" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
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
              padding: "8px",
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
              padding: "8px",
            }}
            title="Shuffle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-bounce"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
            }}
            title="Share"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>

          <button
            onClick={() => onBuyClick(currentBeat)}
            className="btn-bounce"
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#000",
              border: "none",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "4px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {currentBeat.price} CZK
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
