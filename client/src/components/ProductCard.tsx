import React from 'react';

interface ProductCardProps {
  id: string | number;
  name: string;
  slug?: string;
  price: number;
  images: string[];
  sizes?: Record<string, number>;
  colorCount?: number;
  isSaved?: boolean;
  onToggleSave?: (id: string | number) => void;
  soundCount?: number;
  type?: string;
  isFree?: boolean;
  isPlaying?: boolean;
  onPlayClick?: () => void;
  typeLabel?: string;
}

export default function ProductCard({
  id,
  name,
  price,
  images,
  isSaved = false,
  onToggleSave,
  soundCount,
  type,
  isFree = false,
  isPlaying = false,
  onPlayClick,
  typeLabel,
}: ProductCardProps) {
  const [isHeartAnimating, setIsHeartAnimating] = React.useState(false);

  const handleHeartClick = () => {
    if (onToggleSave) {
      setIsHeartAnimating(true);
      setTimeout(() => setIsHeartAnimating(false), 300);
      onToggleSave(id);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #333",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0a0a0a",
        transition: "all 0.2s ease",
      }}
    >
      <style>{`
        @keyframes heartPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .heart-pulse {
          animation: heartPulse 0.3s ease-out;
        }
      `}</style>
      {onToggleSave && (
        <button
          onClick={() => onToggleSave(id)}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.6)";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isSaved ? "#888" : "none"}
            stroke={isSaved ? "#888" : "#fff"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}

      <div
        style={{
          aspectRatio: "1",
          background: "#111",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={images[0] || "/uploads/artwork/metallic-logo.png"}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {onPlayClick && (
          <button
            onClick={onPlayClick}
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "1px solid #fff",
              background: isPlaying ? "#fff" : "rgba(0,0,0,0.8)",
              color: isPlaying ? "#000" : "#fff",
              fontSize: "18px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        )}
      </div>

      <div style={{ padding: "16px" }}>
        {typeLabel && (
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            {typeLabel}
          </div>
        )}
        <h3 style={{ marginBottom: "8px", fontSize: "16px", fontWeight: 500 }}>
          {name}
        </h3>
        {soundCount && (
          <p style={{ fontSize: "14px", color: "#999", marginBottom: "12px" }}>
            {soundCount} zvuků
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            {isFree ? "ZDARMA" : `${price} CZK`}
          </span>
          {onToggleSave && (
            <button
              onClick={handleHeartClick}
              className={isHeartAnimating ? "heart-pulse" : ""}
              style={{
                background: "#000",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                flexShrink: 0,
                marginRight: "8px",
                borderRadius: "4px"
              }}
              title={isSaved ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isSaved ? "#888" : "none"}
                stroke={isSaved ? "#888" : "#888"}
                strokeWidth="2"
                style={{ transition: "all 0.2s ease" }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
