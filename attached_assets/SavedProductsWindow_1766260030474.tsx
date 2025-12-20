'use client';

import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSavedProductsStore } from '@/lib/saved-products-store';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface SavedProductsWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedProductsWindow({ isOpen, onClose }: SavedProductsWindowProps) {
  const savedIds = useSavedProductsStore((state) => state.savedIds);
  const removeProduct = useSavedProductsStore((state) => state.removeProduct);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && savedIds.length > 0) {
      fetchSavedProducts();
    } else if (savedIds.length === 0) {
      setProducts([]);
    }
  }, [isOpen, savedIds]);

  const fetchSavedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (productId: string, e: MouseEvent) => {
    e.preventDefault();
    removeProduct(productId);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white border-l border-black z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-header border-b border-black flex items-center justify-between px-xl">
            <h2 className="text-section-header font-bold uppercase tracking-tighter">Saved</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center border border-black hover:opacity-70 transition-opacity"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-base uppercase tracking-wider">Loading...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full px-xl">
                <p className="text-base uppercase tracking-wider text-center">No saved products</p>
              </div>
            ) : (
              <div className="p-xl space-y-lg">
                {products.map((product) => (
                  <div key={product.id} className="border border-black p-sm bg-white relative">
                    <Link
                      href={`/produkty/${product.slug}`}
                      onClick={onClose}
                      className="flex gap-sm"
                    >
                      <div className="w-24 h-32 flex-shrink-0">
                        <img
                          src={product.images[0] || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          style={{ filter: 'grayscale(1) contrast(1.2)' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold mb-xs uppercase tracking-normal line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-small">{product.price} Kč</p>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleRemove(product.id, e)}
                      className="absolute top-sm right-sm w-8 h-8 flex items-center justify-center bg-white border border-black hover:opacity-70 transition-opacity"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {products.length > 0 && (
            <div className="border-t border-black p-xl">
              <Link
                href="/ulozeno"
                onClick={onClose}
                className="block w-full bg-black text-white text-center text-small uppercase tracking-wider py-sm hover:opacity-90 transition-opacity"
              >
                View All ({products.length})
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
