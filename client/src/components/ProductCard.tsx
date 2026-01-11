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
    // Save to recently viewed
    const viewedJson = localStorage.getItem("voodoo808_recently_viewed");
    let viewed = viewedJson ? JSON.parse(viewedJson) : [];
    
    // Remove if already exists and add to front
    viewed = viewed.filter((v: any) => v.id !== id);
    viewed.unshift({ id, name, price, images, typeLabel });
    
    // Keep last 10
    localStorage.setItem("voodoo808_recently_viewed", JSON.stringify(viewed.slice(0, 10)));

    // Open in new tab
    const url = `/produkt/${type === 'beat' ? 'beat' : 'sound_kit'}/${id}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={handleProductClick}
      className="product-card-container group"
      style={{
        overflow: "visible",
        position: "relative",
        backgroundColor: "transparent",
        transition: "all 0.2s ease",
        cursor: "pointer",
        padding: "8px",
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        
        // Find the image container and apply glow
        const imgContainer = target.querySelector('.product-image-container') as HTMLDivElement;
        if (imgContainer) {
          imgContainer.style.boxShadow = "0 15px 30px 5px rgba(255, 255, 255, 0.4)";
          imgContainer.style.filter = "drop-shadow(0 10px 10px rgba(255, 255, 255, 0.2))";
        }

        // Create particles from beneath the image
        for (let i = 0; i < 12; i++) {
          const particle = document.createElement("div");
          particle.setAttribute("data-product-particle", "true");
          particle.style.position = "absolute";
          particle.style.width = "3px";
          particle.style.height = "3px";
          particle.style.background = "rgba(255, 255, 255, 0.8)";
          particle.style.borderRadius = "50%";
          particle.style.left = `${20 + Math.random() * 60}%`;
          particle.style.top = "70%";
          particle.style.pointerEvents = "none";
          particle.style.zIndex = "5";
          
          const duration = 1 + Math.random() * 2;
          const xOffset = (Math.random() - 0.5) * 100;
          const yOffset = -150 - Math.random() * 100;
          
          particle.style.transition = `all ${duration}s ease-out`;
          target.appendChild(particle);
          
          setTimeout(() => {
            particle.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            particle.style.opacity = "0";
          }, 10);
          
          setTimeout(() => particle.remove(), duration * 1000);
        }
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        
        const imgContainer = target.querySelector('.product-image-container') as HTMLDivElement;
        if (imgContainer) {
          imgContainer.style.boxShadow = "none";
          imgContainer.style.filter = "none";
        }
        
        const particles = target.querySelectorAll('div[data-product-particle="true"]');
        particles.forEach(p => p.remove());
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
        .product-card-container:hover {
          transform: scale(1.02);
          z-index: 10;
        }
        .play-button-overlay {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .product-card-container:hover .play-button-overlay {
          opacity: 1;
        }
        .product-info-pill {
          opacity: 0;
          transition: all 0.3s ease;
          transform: translateY(10px);
          position: relative;
        }
        .product-info-pill::before {
          content: "";
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 14px;
          height: 14px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(8px);
          border-left: 1px solid #333;
          border-top: 1px solid #333;
          opacity: 0;
          transition: all 0.3s ease;
          z-index: -1;
        }
        .product-card-container:hover .product-info-pill {
          opacity: 1;
          transform: translateY(0);
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid #333;
        }
        .product-card-container:hover .product-info-pill::before {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .play-button-overlay {
            opacity: 1;
          }
          .product-info-pill {
            opacity: 1;
            transform: none;
            background: transparent;
            border: none;
          }
        }
      `}</style>
      {/* Top heart icon removed - only one heart at the bottom now */}

      <div
        className="product-image-container"
        style={{
          aspectRatio: "1",
          background: "transparent",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
      >
        <img
          src={images[0] || "/uploads/artwork/metallic-logo.png"}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        {onPlayClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick();
            }}
            className="play-button-overlay"
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
          {onAddToCart && !isFree && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(id);
              }}
              className="btn-bounce"
              style={{
                padding: "8px 8px 8px 16px",
                background: "#000",
                color: "#fff",
                border: "1px solid #fff",
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
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
                overflow: "visible",
                outline: "none",
                boxShadow: "none",
                WebkitAppearance: "none",
                appearance: "none",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = "#fff";
                btn.style.color = "#000";
                btn.style.borderColor = "#000";
                btn.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
                
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
                  
                  if (!document.querySelector(`style[data-particle-style="${i}"]`)) {
                    const style = document.createElement("style");
                    style.setAttribute("data-particle-style", i.toString());
                    style.textContent = `
                      @keyframes particleFloat-${i} {
                        0% { transform: translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px)); opacity: 0.8; }
                        100% { transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)); opacity: 0; }
                      }
                    `;
                    document.head.appendChild(style);
                  }
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = "#000";
                btn.style.color = "#fff";
                btn.style.borderColor = "#fff";
                btn.style.boxShadow = "none";
                
                // Clean up particles
                const particles = btn.querySelectorAll('div[data-particle="true"]');
                particles.forEach(p => p.remove());
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
          {isFree && (
            <span style={{ fontWeight: "bold", fontSize: "14px", color: "#999" }}>
              ZDARMA
            </span>
          )}
          {!isFree && !onAddToCart && (
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>
              {price} CZK
            </span>
          )}
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
                borderRadius: "4px"
              }}
              title={isSaved ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isSaved ? "#fff" : "none"}
                stroke={isSaved ? "#fff" : "#fff"}
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
