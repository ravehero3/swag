import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp } from "../App.js";
import ShareModal from "../components/ShareModal.js";
import MiniWavePlayer from "../components/MiniWavePlayer.js";
import { BeatArtwork } from "@/components/BeatArtwork";

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
  preview_labels?: string[];
  description?: string;
  number_of_sounds?: number;
  type?: string;
  tags?: string[];
}

function ProductDetail() {
  const [, params] = useRoute("/produkt/:type/:id");
  const [, setLocation] = useLocation();
  const { addToCart, previewPlayer } = useApp() as any;
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

  const playProductPreview = (url: string) => {
    if (!product || !params) return;
    const productType = params.type === "beat" ? "beat" : "sound_kit";
    const queue = previews.map((previewUrl) => ({
      id: product.id,
      title: previews.length > 1 ? `${product.title} — ukázka ${previews.indexOf(previewUrl) + 1}` : product.title,
      artist: product.artist || typeLabels[product.type || productType] || (productType === "beat" ? "Beat" : "Sound Kit"),
      bpm: product.bpm || 0,
      key: product.key || "",
      price: Number(product.price),
      preview_url: previewUrl,
      artwork_url: product.artwork_url || "/uploads/artwork/metallic-logo.png",
      product_type: productType,
    }));
    const item = queue.find((previewItem) => previewItem.preview_url === url) || queue[0];
    previewPlayer.playPreview(item, queue);
  };

  if (loading) return null;
  if (!product) return (
    <div style={{ minHeight: "calc(100vh - 42px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      Produkt nenalezen
    </div>
  );

  // Collect all preview URLs
  const previews = Array.from(new Set([
    ...(Array.isArray(product.preview_urls) ? product.preview_urls : []),
    product.preview_url,
  ]
    .filter((url): url is string => typeof url === "string")
    .map((url) => url.trim())
    .filter(Boolean)));

  const typeLabels: Record<string, string> = {
    free: "FREE",
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
          position: relative;
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px;
          flex-shrink: 0;
          overflow: hidden;
          background: #000;
        }
        .pd-artwork-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          /* Roughly 2x the artwork-frame size, centered behind it. */
          width: min(96%, calc((100vh - 242px) * 2));
          max-width: 1040px;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .pd-artwork-bg-stars {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px);
          background-size: 80px 80px, 40px 40px, 120px 120px;
          background-position: 0 0, 20px 20px, 10px 10px;
          background-color: #000;
        }
        .pd-artwork-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          /* Vignette that fades the stars into the surrounding black on every
             edge and corner. The radial gradient handles the corners; the two
             linear gradients handle the straight edges. */
          background:
            radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.85) 80%, #000 100%),
            linear-gradient(to right,  #000 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, #000 100%),
            linear-gradient(to bottom, #000 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, #000 100%);
          pointer-events: none;
        }
        .pd-artwork-frame {
          position: relative;
          z-index: 1;
          width: min(100%, calc(100vh - 242px));
          max-width: 520px;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 4px;
        }
        .pd-artwork-frame > img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
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
            padding: 40px;
            flex-shrink: 0;
            aspect-ratio: 1 / 1;
            overflow: hidden;
          }
          .pd-artwork-frame {
            width: 100%;
            max-width: none;
            border-radius: 0;
          }
          .pd-artwork-frame > img {
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
        {/* Stars background sits behind the artwork frame, sized to ~2x the
            frame and faded into surrounding black on every edge/corner. */}
        <div className="pd-artwork-bg" aria-hidden="true">
          <div className="pd-artwork-bg-stars" />
        </div>
        <div className="pd-artwork-frame">
        <BeatArtwork
          artworkUrl={product.artwork_url}
          alt={product.title}
          width="100%"
          height="100%"
          borderRadius={0}
          applyEffects={params?.type === "beat"}
        />
        </div>
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
            <span
              aria-label={`Tagy: ${product.tags.join(", ")}`}
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0,0,0,0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              {product.tags.join(", ")}
            </span>
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
            {params?.type === "beat" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {previews.map((url, idx) => {
                  const productType = "beat";
                  const isCurrent =
                    previewPlayer.currentItem?.id === product.id &&
                    previewPlayer.currentItem?.product_type === productType &&
                    previewPlayer.currentItem?.preview_url === url;
                  return (
                    <button
                      key={url}
                      onClick={() => playProductPreview(url)}
                      className="voodoo-play-surface"
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: isCurrent && previewPlayer.isPlaying ? "#fff" : "#0d0d0d",
                        color: isCurrent && previewPlayer.isPlaying ? "#000" : "#fff",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        position: "relative",
                      }}
                      data-testid={`button-play-preview-${idx}`}
                    >
                      <span>{previews.length > 1 ? `Přehrát ukázku ${idx + 1}` : "Přehrát ukázku"}</span>
                      <span style={{ position: "relative", width: "36px", height: "36px", flexShrink: 0, display: "block" }}>
                        <span className={`voodoo-play-ring is-visible`} style={{ "--voodoo-play-size": "36px" } as any} />
                        <span className={`voodoo-play-button is-visible${isCurrent && previewPlayer.isPlaying ? " is-playing" : ""}`} style={{ "--voodoo-play-size": "36px", "--voodoo-play-font-size": "13px", paddingLeft: 0, display: "flex", alignItems: "center", justifyContent: "center" } as any}>
                          {isCurrent && previewPlayer.isPlaying ? (
                            <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor" style={{ display: "block" }}>
                              <rect x="1" y="0" width="3" height="10" />
                              <rect x="6" y="0" width="3" height="10" />
                            </svg>
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor" style={{ display: "block", marginLeft: "1px" }}>
                              <polygon points="1,0 10,5 1,10" />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {previews.map((url, idx) => (
                  <div
                    key={url}
                    style={{
                      padding: "14px 16px 12px 16px",
                      background: "#0d0d0d",
                      border: "1px solid #222",
                      borderRadius: "4px",
                    }}
                    data-testid={`waveform-preview-${idx}`}
                  >
                    {(product.preview_labels?.[idx] || previews.length > 1) && (
                      <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>
                        {product.preview_labels?.[idx] || `Ukázka ${idx + 1}`}
                      </div>
                    )}
                    <MiniWavePlayer url={url} label={product.preview_labels?.[idx] ? "" : undefined} />
                  </div>
                ))}
              </div>
            )}
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
