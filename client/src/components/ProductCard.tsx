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
  onAddToCart?: (id: string | number) => void;
  compactArtwork?: boolean;
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
  onAddToCart,
  compactArtwork = false,
}: ProductCardProps) {
  const [isHeartAnimating, setIsHeartAnimating] = React.useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) {
      setIsHeartAnimating(true);
      setTimeout(() => setIsHeartAnimating(false), 300);
      onToggleSave(id);
    }
  };

  const handleProductClick = () => {
    const viewedJson = localStorage.getItem("voodoo808_recently_viewed");
    let viewed = viewedJson ? JSON.parse(viewedJson) : [];
    viewed = viewed.filter((v: any) => v.id !== id);
    viewed.unshift({ id, name, price, images, typeLabel, type });
    localStorage.setItem("voodoo808_recently_viewed", JSON.stringify(viewed.slice(0, 10)));
    const url = `/produkt/${type === 'beat' ? 'beat' : 'sound_kit'}/${id}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={handleProductClick}
      className="product-card-container"
      style={{
        overflow: "visible",
        position: "relative",
        backgroundColor: "transparent",
        cursor: "pointer",
        padding: compactArtwork ? "2px" : "8px",
      }}
    >
      <style>{`
        @keyframes heartPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .heart-pulse { animation: heartPulse 0.3s ease-out; }

        /* Card container — promoted to its own GPU layer from the start */
        .product-card-container {
          will-change: transform;
          transform: translateZ(0);
          transition: transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card-container:hover {
          transform: translateZ(0) scale(1.02);
          z-index: 10;
        }

        /* Artwork glow — GPU-only (filter on its own layer) */
        .product-image-container {
          will-change: filter;
          transform: translateZ(0);
          transition: filter 0.22s ease;
        }
        .product-card-container:hover .product-image-container {
          filter: drop-shadow(0 16px 24px rgba(255,255,255,0.35));
        }

        /* Info pill — opacity + transform only (no backdrop-filter anywhere) */
        .product-info-pill {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.22s ease, transform 0.22s ease;
          will-change: transform, opacity;
          position: relative;
          background: rgba(10, 10, 10, 0);
        }
        .product-card-container:hover .product-info-pill {
          opacity: 1;
          transform: translateY(0);
          background: rgba(14, 14, 14, 0.92);
          border: 1px solid #2a2a2a;
        }

        /* Add-to-cart button — CSS-only hover, no JS needed */
        .add-to-cart-btn {
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
        }
        .add-to-cart-btn:hover {
          background: #fff !important;
          color: #000 !important;
          box-shadow: 0 0 18px rgba(255,255,255,0.5), inset 0 0 0 0.5px #000 !important;
        }

        .mobile-play-btn {
          display: none;
        }
        @media (max-width: 768px) {
          .play-button-overlay {
            display: none !important;
          }
          .product-info-pill {
            opacity: 1 !important;
            transform: none !important;
            background: transparent !important;
            border: none !important;
          }
          .mobile-play-btn {
            display: flex !important;
          }
        }
      `}</style>

      <div
        className="product-image-container voodoo-play-surface"
        style={{
          aspectRatio: "1",
          background: "transparent",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: compactArtwork ? "0" : "40px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <img
          src={images[0] || "/uploads/artwork/metallic-logo.png"}
          alt={name}
          referrerPolicy="no-referrer"
          decoding="async"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src.indexOf("/uploads/artwork/metallic-logo.png") === -1) {
              img.src = "/uploads/artwork/metallic-logo.png";
            }
          }}
          style={{ width: "100%", height: "100%", objectFit: compactArtwork ? "cover" : "contain", objectPosition: "center", borderRadius: compactArtwork ? "4px" : 0 }}
        />

        {onPlayClick && (
          <>
            <div className={`voodoo-play-ring${isPlaying ? " is-visible" : ""}`} />
            <button
              onClick={(e) => { e.stopPropagation(); onPlayClick(); }}
              className={`play-button-overlay voodoo-play-button${isPlaying ? " is-playing is-visible" : ""}`}
              data-testid={`button-play-product-${id}`}
              style={{ paddingLeft: isPlaying ? "0" : "3px" }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
          </>
        )}
      </div>

      <div className="product-info-pill" style={{ padding: "16px", borderRadius: "8px", marginTop: "12px" }}>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          {onPlayClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlayClick(); }}
              className={`mobile-play-btn${isPlaying ? " is-playing" : ""}`}
              data-testid={`mobile-play-button-${id}`}
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: isPlaying ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "12px",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          )}
          {onAddToCart && !isFree && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(id); }}
              className="add-to-cart-btn"
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
                outline: "none",
                boxShadow: "inset 0 0 0 0.5px #fff",
                WebkitAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                  <rect x="3" y="6" width="18" height="15" rx="2" />
                  <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                </svg>
                <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "inherit", lineHeight: "1", right: "-10px", top: "-5px" }}>+</span>
              </div>
              <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{price} CZK</span>
            </button>
          )}
          {isFree && onAddToCart && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(id); }}
              className="add-to-cart-btn"
              data-testid={`button-download-free-${id}`}
              style={{
                padding: "8px 16px",
                background: "#000",
                color: "#24e053",
                border: "none",
                fontSize: "12px",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "4px",
                height: "32px",
                outline: "none",
                boxShadow: "inset 0 0 0 0.5px #24e053",
                WebkitAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
              }}
            >
              STÁHNOUT
            </button>
          )}
          {isFree && !onAddToCart && (
            <span style={{ fontWeight: "bold", fontSize: "14px", color: "#999" }}>ZDARMA</span>
          )}
          {!isFree && !onAddToCart && (
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{price} CZK</span>
          )}
          {onToggleSave && (
            <button
              onClick={handleHeartClick}
              className={`heart-btn${isHeartAnimating ? " heart-pulse" : ""}`}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                flexShrink: 0,
                borderRadius: "4px",
              }}
              title={isSaved ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={isSaved ? "#e8304a" : "none"}
                stroke={isSaved ? "#e8304a" : "rgba(255,255,255,0.7)"}
                strokeWidth="2"
                style={{
                  transition: "fill 0.2s ease, stroke 0.2s ease",
                  transform: isHeartAnimating ? "scale(1.35)" : "scale(1)",
                }}
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
