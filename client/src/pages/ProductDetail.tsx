import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp } from "../App.js";
import MiniWavePlayer from "../components/MiniWavePlayer.js";

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
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 42px)",
        backgroundColor: "#000",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Left half — artwork */}
      <div
        style={{
          width: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={product.artwork_url || "/uploads/artwork/metallic-logo.png"}
          alt={product.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png";
          }}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Center divider */}
      <div
        style={{
          width: "1px",
          backgroundColor: "#222",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />

      {/* Right half — info */}
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          padding: "48px 40px",
          overflowY: "auto",
          gap: "0",
        }}
      >
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

        {/* Description */}
        {product.description && (
          <p
            style={{
              color: "#666",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
