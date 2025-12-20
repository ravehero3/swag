'use client';

import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  sizes?: Record<string, number>;
  color?: string;
  colorCount?: number;
}

interface ProductsGridProps {
  products: Product[];
  savedProducts?: string[];
  onToggleSave?: (id: string) => void;
  initialCount?: number;
}

export default function ProductsGrid({ products, savedProducts = [], onToggleSave, initialCount }: ProductsGridProps) {
  const displayProducts = initialCount ? products.slice(0, initialCount) : products;

  if (products.length === 0) {
    return (
      <div className="py-2xl text-center">
        <p className="text-product-name uppercase">Nebyly nalezeny žádné produkty</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
          />
        ))}
      </div>
    </div>
  );
}
