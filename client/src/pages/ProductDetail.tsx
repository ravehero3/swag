import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp } from "../App.js";
import MiniWavePlayer from "../components/MiniWavePlayer.js";
import ShareModal from "../components/ShareModal.js";

interface ProductData {
  id: number;
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  price: number;
  artwork_url: string;
  preview_url?: string;
  preview_urls?: string[];
  description?: string;
  number_of_sounds?: number;
  type?: string;
  tags?: string[];
}

function ProductDetail() {
  const [, params] = useRoute("/produkt/:type/:id");
  const [, setLocation] = useLocation();
  const { addToCart } = useApp() as any;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (params) {
      const endpoint = params.type === "beat"
        ? `/api/beats/${params.id}`
        : `/api/sound-kits/${params.id}`;
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) setProduct(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [params]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      productType: params?.type as any,
      title: product.title,
      price: product.price,
      artworkUrl: product.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return null;
  if (!product) return (
    <div style={{ minHeight: "calc(100vh - 42px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      Produkt nenalezen
    </div>
  );

  // Collect all preview URLs
  const previews: string[] = [];
  if (product.preview_urls && product.preview_urls.length > 0) {
    previews.push(...product.preview_urls);
  } else if (product.preview_url) {
    previews.push(product.preview_url);
  }

  const typeLabels: Record<string, string> = {
    drum_kit: "Drum Kit",
    one_shot_kit: "One Shot Kit",
    loop_kit: "Loop Kit",
    one_shot_bundle: "One Shot Bundle",
    drum_kit_bundle: "Drum Kit Bundle",
    beat: "Beat",
  };

  return (
    <div className="pd-container">
      <style>{`
        .pd-container {
          display: flex;
          height: calc(100vh - 42px);
          background-color: #000;
          color: #fff;
          overflow: hidden;
        }
        .pd-artwork {
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .pd-artwork img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
        }
        .pd-divider {
          width: 1px;
          background-color: #222;
          flex-shrink: 0;
          align-self: stretch;
        }
        .pd-info {
          width: 50%;
          display: flex;
          flex-direction: column;
          padding: 48px 40px;
          overflow-y: auto;
          gap: 0;
        }
        @media (max-width: 768px) {
          .pd-container {
            flex-direction: column;
            height: auto;
            min-height: calc(100vh - 42px);
            overflow-y: auto;
          }
          .pd-artwork {
            width: 100%;
            padding: 0;
            flex-shrink: 0;
            aspect-ratio: 1 / 1;
            overflow: hidden;
          }
          .pd-artwork img {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            object-fit: cover;
            border-radius: 0;
          }
          .pd-divider {
            display: none;
          }
          .pd-info {
            width: 100%;
            padding: 28px 20px 40px 20px;
            overflow-y: visible;
          }
        }
      `}</style>

      {/* Left half — artwork */}
      <div className="pd-artwork">
        <img
          src={product.artwork_url || "/uploads/artwork/metallic-logo.png"}
          alt={product.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png";
          }}
        />
      </div>

      {/* Center divider */}
      <div className="pd-divider" />

      {/* Right half — info */}
      <div className="pd-info">
        {/* Back link */}
        <button
          onClick={() => setLocation(params?.type === "beat" ? "/beaty" : "/zvuky")}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontSize: "11px",
            letterSpacing: "0.1em",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
            textTransform: "uppercase",
            marginBottom: "32px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
        >
          ← Zpět do obchodu
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(20px, 3vw, 32px)",
            fontWeight: "bold",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "16px",
            lineHeight: 1.1,
          }}
        >
          {product.title}
        </h1>

        {/* Metadata */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            color: "#666",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          {product.artist && <span>Artist: {product.artist}</span>}
          {product.bpm && <span>BPM: {product.bpm}</span>}
          {product.key && <span>Key: {product.key}</span>}
          {product.number_of_sounds ? <span>Zvuků: {product.number_of_sounds}</span> : null}
          {product.type && <span>{typeLabels[product.type] || product.type}</span>}
          {product.tags && product.tags.length > 0 && (
            <span>{product.tags.join(", ")}</span>
          )}
        </div>

        {/* Audio previews */}
        {previews.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#555",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              {previews.length > 1 ? "Ukázky" : "Ukázka"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {previews.map((url, idx) => (
                <MiniWavePlayer key={idx} url={url} />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#222", marginBottom: "28px" }} />

        {/* Price */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "16px",
            letterSpacing: "0.05em",
          }}
        >
          {Number(product.price).toLocaleString("cs-CZ")} CZK
        </div>

        {/* Add to cart */}
        {!product.price || product.price === 0 ? (
          <button
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#24e053",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: "32px",
            }}
          >
            ZDARMA
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: addedToCart ? "#24e053" : "#fff",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: "32px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!addedToCart) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e0e0e0";
            }}
            onMouseLeave={(e) => {
              if (!addedToCart) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
            }}
          >
            {addedToCart ? "✓ PŘIDÁNO DO KOŠÍKU" : "DO KOŠÍKU"}
          </button>
        )}

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: "#555",
            border: "1px solid #2a2a2a",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            marginBottom: "24px",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.borderColor = "#555";
            btn.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.borderColor = "#2a2a2a";
            btn.style.color = "#555";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Sdílet
        </button>

        {/* Description */}
        {product.description && (
          <div style={{ color: "#666", fontSize: "13px", lineHeight: 1.7 }}>
            {product.description.split("\n").map((line, i) =>
              line.trim() ? (
                <p key={i} style={{ margin: "0 0 10px 0" }}>{line}</p>
              ) : (
                <br key={i} />
              )
            )}
          </div>
        )}
      </div>

      <ShareModal
        product={{ id: product.id, title: product.title, price: product.price, artwork_url: product.artwork_url, preview_url: product.preview_url }}
        productType={params?.type === "beat" ? "beat" : "sound_kit"}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

export default ProductDetail;
