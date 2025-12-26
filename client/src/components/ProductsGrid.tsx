import ProductCard from './ProductCard';

interface Product {
  id: string | number;
  name: string;
  slug?: string;
  price: number;
  images: string[];
  sizes?: Record<string, number>;
  color?: string;
  colorCount?: number;
  soundCount?: number;
  type?: string;
  isFree?: boolean;
  typeLabel?: string;
}

interface ProductsGridProps {
  products: Product[];
  savedProducts?: (string | number)[];
  onToggleSave?: (id: string | number) => void;
  initialCount?: number;
  onPlayClick?: (productId: string | number) => void;
  isPlaying?: boolean;
  currentPlayingId?: string | number;
  onAddToCart?: (id: string | number) => void;
}

export default function ProductsGrid({
  products,
  savedProducts = [],
  onToggleSave,
  initialCount,
  onPlayClick,
  isPlaying = false,
  currentPlayingId,
  onAddToCart,
}: ProductsGridProps) {
  const displayProducts = initialCount ? products.slice(0, initialCount) : products;

  if (products.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#999", textTransform: "uppercase" }}>
          Nebyly nalezeny žádné produkty
        </p>
      </div>
    );
  }

  return (
    <div
      className="fade-in-stagger"
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0",
          maxWidth: "1200px",
          width: "100%",
        }}
      >
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={Number(product.price)}
            images={product.images}
            sizes={product.sizes}
            colorCount={product.colorCount || 1}
            isSaved={savedProducts.includes(product.id)}
            onToggleSave={onToggleSave}
            soundCount={product.soundCount}
            type={product.type}
            isFree={product.isFree}
            isPlaying={currentPlayingId === product.id && isPlaying}
            onPlayClick={onPlayClick ? () => onPlayClick(product.id) : undefined}
            typeLabel={product.typeLabel}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
