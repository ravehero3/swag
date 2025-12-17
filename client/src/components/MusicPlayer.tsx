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
          height: "24px",
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <img
            src={currentBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
            alt={currentBeat.title}
            style={{ width: "20px", height: "20px", objectFit: "cover", borderRadius: "2px" }}
          />
          <div>
            <div style={{ fontWeight: "bold", fontSize: "10px" }}>{currentBeat.title}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onToggleLoop}
            style={{
              background: "transparent",
              border: "none",
              color: isLooping ? "#fff" : "#666",
              cursor: "pointer",
              padding: "2px",
            }}
            title="Loop"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              padding: "2px",
            }}
            title="Previous"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "1px solid #fff",
              background: isPlaying ? "#fff" : "transparent",
              color: isPlaying ? "#000" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8px",
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
              padding: "2px",
            }}
            title="Next"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
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
              padding: "2px",
            }}
            title="Shuffle"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="btn-bounce"
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "2px",
              borderRadius: "4px",
            }}
            title="Share"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              padding: "2px 8px",
              background: "#fff",
              color: "#000",
              border: "none",
              fontSize: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              borderRadius: "4px",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M8 6V4a4 4 0 0 1 8 0v2" />
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
