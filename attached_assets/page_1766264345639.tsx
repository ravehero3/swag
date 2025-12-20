'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSavedProductsStore } from '@/lib/saved-products-store';
import { useCartStore } from '@/lib/cart-store';
import AnimatedButton from '@/components/AnimatedButton';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
  color: string;
}

function AnimatedLink({ href, text }: { href: string; text: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      className="relative overflow-hidden bg-white text-black font-normal uppercase tracking-tight transition-all border border-black text-sm"
      style={{ borderRadius: '4px', padding: '11.8px 25.6px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className="block transition-all duration-200"
        style={{
          transform: isHovered ? 'translateY(-150%)' : 'translateY(0)',
          opacity: isHovered ? 0 : 1,
        }}
      >
        {text}
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-200"
        style={{
          transform: isHovered ? 'translateY(0)' : 'translateY(150%)',
          opacity: isHovered ? 1 : 0,
        }}
      >
        {text}
      </span>
    </Link>
  );
}

export default function SavedProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const removeProduct = useSavedProductsStore((state) => state.removeProduct);
  const savedProductIds = useSavedProductsStore((state) => state.savedIds);
  const setSavedIds = useSavedProductsStore((state) => state.setSavedIds);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const syncInProgressRef = useRef(false);
  const lastSyncedIdsRef = useRef<string[]>([]);
  const { addItem, items, getItemCount } = useCartStore();
  const cartItemCount = getItemCount();
  const isUlozeno = pathname === '/ulozeno';

  const arraysEqual = useCallback((a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (status === 'authenticated') {
      const hasNewIds = savedProductIds.some(id => !lastSyncedIdsRef.current.includes(id));
      const needsInitialSync = lastSyncedIdsRef.current.length === 0;
      
      if (!syncInProgressRef.current && (hasNewIds || needsInitialSync)) {
        console.log('[ULOŽENÉ PRODUKTY] Authenticated user, syncing and fetching from database');
        syncAndFetchSavedProducts();
      }
    } 
    else if (status === 'unauthenticated') {
      console.log('[ULOŽENÉ PRODUKTY] Unauthenticated user, using Zustand store. SavedIds:', savedProductIds);
      if (savedProductIds.length > 0) {
        console.log('[ULOŽENÉ PRODUKTY] Found saved products, fetching details...');
        fetchSavedProductsLocal();
      } else {
        console.log('[ULOŽENÉ PRODUKTY] No saved products in Zustand');
        setLoading(false);
      }
    } 
    else if (status === 'loading') {
      setLoading(true);
    }
    else {
      setLoading(false);
    }
  }, [status, mounted, savedProductIds]);

  const syncAndFetchSavedProducts = async () => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    
    try {
      const localIds = useSavedProductsStore.getState().savedIds;
      console.log('[ULOŽENÉ PRODUKTY] Local saved IDs:', localIds);
      
      const response = await fetch('/api/saved-products');
      if (!response.ok) {
        console.error('[ULOŽENÉ PRODUKTY] Failed to fetch from database, keeping local IDs');
        if (localIds.length > 0) {
          await fetchSavedProductsLocal();
        } else {
          setLoading(false);
        }
        return;
      }
      
      const data = await response.json();
      console.log('[ULOŽENÉ PRODUKTY] Fetched from database:', data);
      const dbProducts = data || [];
      const dbIds = dbProducts.map((p: Product) => p.id);
      
      const idsToSync = localIds.filter((id: string) => !dbIds.includes(id));
      console.log('[ULOŽENÉ PRODUKTY] IDs to sync to database:', idsToSync);
      
      const failedSyncIds: string[] = [];
      const successSyncIds: string[] = [];
      
      if (idsToSync.length > 0) {
        console.log('[ULOŽENÉ PRODUKTY] Syncing local saved products to database...');
        for (const productId of idsToSync) {
          try {
            const syncResponse = await fetch('/api/saved-products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId }),
            });
            if (!syncResponse.ok) {
              console.error('[ULOŽENÉ PRODUKTY] Failed to sync product:', productId, syncResponse.status);
              failedSyncIds.push(productId);
            } else {
              successSyncIds.push(productId);
            }
          } catch (err) {
            console.error('[ULOŽENÉ PRODUKTY] Error syncing product:', productId, err);
            failedSyncIds.push(productId);
          }
        }
      }
      
      let finalProducts = dbProducts;
      let finalDbIds = dbIds;
      
      if (successSyncIds.length > 0) {
        const refreshResponse = await fetch('/api/saved-products');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          finalProducts = refreshData || [];
          finalDbIds = finalProducts.map((p: Product) => p.id);
        }
      }
      
      const unsyncedIds = localIds.filter((id: string) => !finalDbIds.includes(id));
      if (unsyncedIds.length > 0) {
        console.log('[ULOŽENÉ PRODUKTY] Fetching product data for unsynced IDs:', unsyncedIds);
        const unsyncedProductsData = await fetchProductsByIds(unsyncedIds);
        finalProducts = [...finalProducts, ...unsyncedProductsData];
      }
      
      const mergedIds = Array.from(new Set([...finalDbIds, ...localIds]));
      console.log('[ULOŽENÉ PRODUKTY] Final merged IDs:', mergedIds);
      
      setSavedIds(mergedIds);
      setProducts(finalProducts);
      lastSyncedIdsRef.current = mergedIds;
      
      if (failedSyncIds.length > 0) {
        console.warn('[ULOŽENÉ PRODUKTY] Some products could not be synced to database:', failedSyncIds);
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
      syncInProgressRef.current = false;
    }
  };

  const fetchProductsByIds = async (ids: string[]): Promise<Product[]> => {
    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('id', id));
      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : (data.products || []);
      }
    } catch (error) {
      console.error('[ULOŽENÉ PRODUKTY] Error fetching products by IDs:', error);
    }
    return [];
  };

  const fetchSavedProducts = async () => {
    try {
      const response = await fetch('/api/saved-products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
        
        const dbIds = (data || []).map((p: Product) => p.id);
        setSavedIds(dbIds);
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProductsLocal = async () => {
    try {
      if (savedProductIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      savedProductIds.forEach(id => params.append('id', id));
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[ULOŽENÉ PRODUKTY] Fetched saved products:', data);
        const products = Array.isArray(data) ? data : (data.products || []);
        console.log('[ULOŽENÉ PRODUKTY] Retrieved saved products count:', products.length);
        setProducts(products);
      } else {
        console.error('[ULOŽENÉ PRODUKTY] API response not ok:', response.status);
      }
    } catch (error) {
      console.error('[ULOŽENÉ PRODUKTY] Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    removeProduct(productId);
    setProducts(products.filter(p => p.id !== productId));
    
    if (session?.user) {
      try {
        await fetch(`/api/saved-products?productId=${productId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error removing saved product:', error);
      }
    }
  };

  const handleMoveToCart = async (product: Product) => {
    try {
      setAddingToCart(product.id);
      
      const response = await fetch(`/api/products/${product.slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const fullProduct = await response.json();
      const sizes = (fullProduct.sizes || {}) as Record<string, number>;
      
      const availableSize = Object.entries(sizes).find(([_, stock]) => stock > 0)?.[0];
      
      if (!availableSize) {
        alert('Žádná velikost není k dispozici');
        setAddingToCart(null);
        return;
      }
      
      addItem({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        size: availableSize,
        quantity: 1,
        price: Number(product.price),
        image: product.images[0],
        color: product.color,
      });
      
      removeProduct(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      
      if (session?.user) {
        await fetch(`/api/saved-products?productId=${product.id}`, {
          method: 'DELETE',
        });
      }
      
      setAddingToCart(null);
      
    } catch (error) {
      console.error('Error moving to cart:', error);
      alert('Chyba při přidávání do košíku');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="hidden md:block" style={{position: 'absolute', left: 'calc(50vw - 350px)', top: 0, bottom: 0, width: '1px', backgroundColor: '#000', zIndex: 5, pointerEvents: 'none'}} />
        <div className="hidden md:block" style={{position: 'absolute', right: 'calc(50vw - 350px)', top: 0, bottom: 0, width: '1px', backgroundColor: '#000', zIndex: 5, pointerEvents: 'none'}} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative">
        {/* Vertical lines at 700px apart (centered) - hidden on mobile */}
        <div className="hidden md:block" style={{
          position: 'absolute',
          left: 'calc(50vw - 350px)',
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: '#000',
          zIndex: 5,
          pointerEvents: 'none'
        }} />
        <div className="hidden md:block" style={{
          position: 'absolute',
          right: 'calc(50vw - 350px)',
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: '#000',
          zIndex: 5,
          pointerEvents: 'none'
        }} />

        {/* Header - same as when products exist */}
        <div className="w-full md:w-[995px]" style={{ position: 'relative', margin: '0 auto', height: '226px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <h1 className="text-center uppercase" style={{
            fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: '22px',
            letterSpacing: '0.03em',
            fontStretch: 'condensed',
            margin: 0
          }}>
            ULOŽENÉ POLOŽKY
          </h1>
        </div>

        {/* Navigation Panel - with 700px wide top and bottom borders */}
        <div className="w-full md:w-[995px]" style={{
          position: 'relative',
          margin: '0 auto',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '0 16px',
          overflow: 'visible',
          zIndex: 10
        }}>
          {/* Top border - 700px wide to match vertical lines */}
          <div className="w-full md:w-[700px]" style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: '1px',
            backgroundColor: '#000',
            zIndex: 1
          }} />
          
          {/* Bottom border - 700px wide to match vertical lines */}
          <div className="w-full md:w-[700px]" style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: '1px',
            backgroundColor: '#000',
            zIndex: 1
          }} />
          
          <div className="group" style={{ position: 'relative', zIndex: 2 }}>
            <div
              className="whitespace-nowrap uppercase tracking-tight font-normal text-sm"
              style={{
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.6px',
                color: '#000',
                padding: '0 8px',
                display: 'block'
              }}
            >
              ULOŽENÉ POLOŽKY
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-4px',
                border: '1px solid #000000',
                borderRadius: '4px',
                opacity: 1
              }}
            />
          </div>
          <div className="group" style={{ position: 'relative', zIndex: 2 }}>
            <Link
              href="/kosik"
              className="whitespace-nowrap uppercase tracking-tight font-normal text-sm"
              style={{
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '19.6px',
                color: '#000',
                textDecoration: 'none',
                padding: '0 8px',
                display: 'block'
              }}
            >
              KOŠÍK ({cartItemCount})
            </Link>
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-4px',
                border: '1px solid #000000',
                borderRadius: '4px',
                opacity: 0
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="w-full md:w-[700px] px-4 md:px-0" style={{ position: 'relative' }}>
            <div className="flex flex-col items-center justify-center px-8 text-center" style={{ minHeight: '300px' }}>
              <p style={{
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                marginBottom: '24px'
              }}>
                Nemáte žádné uložené produkty
              </p>
              <AnimatedLink href="/" text="POKRAČOVAT V NÁKUPU" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Vertical lines at 700px apart (centered) - hidden on mobile */}
      <div className="hidden md:block" style={{
        position: 'absolute',
        left: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#000',
        zIndex: 5,
        pointerEvents: 'none'
      }} />
      <div className="hidden md:block" style={{
        position: 'absolute',
        right: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#000',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      {/* Horizontal lines at 700px intervals (starting after banner + nav) - hidden on mobile */}
      {[...Array(18)].map((_, i) => (
        <div
          key={`h-line-${i}`}
          className="hidden md:block"
          style={{
            position: 'fixed',
            left: 'calc(50vw - 350px)',
            right: 'calc(50vw - 350px)',
            top: `${2370 + i * 700}px`,
            height: '1px',
            backgroundColor: '#000',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Header - border handled by navigation panel */}
      <div className="w-full md:w-[995px]" style={{ position: 'relative', margin: '0 auto', height: '226px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <h1 className="text-center uppercase" style={{
          fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: '22px',
          letterSpacing: '0.03em',
          fontStretch: 'condensed',
          margin: 0
        }}>
          ULOŽENÉ POLOŽKY
        </h1>
      </div>

      {/* Navigation Panel - with 700px wide top and bottom borders */}
      <div className="w-full md:w-[995px]" style={{
        position: 'relative',
        margin: '0 auto',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '0 16px',
        overflow: 'visible',
        zIndex: 10
      }}>
        {/* Top border - 700px wide to match vertical lines */}
        <div className="w-full md:w-[700px]" style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: '1px',
          backgroundColor: '#000',
          zIndex: 1
        }} />
        
        {/* Bottom border - 700px wide to match vertical lines */}
        <div className="w-full md:w-[700px]" style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: '1px',
          backgroundColor: '#000',
          zIndex: 1
        }} />
        
        <div className="group" style={{ position: 'relative', zIndex: 2 }}>
          <div
            className="whitespace-nowrap uppercase tracking-tight font-normal text-sm"
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '19.6px',
              color: '#000',
              padding: '0 8px',
              display: 'block'
            }}
          >
            ULOŽENÉ POLOŽKY
          </div>
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-4px',
              border: '1px solid #000000',
              borderRadius: '4px',
              opacity: isUlozeno ? 1 : 0
            }}
          />
        </div>
        <div className="group" style={{ position: 'relative', zIndex: 2 }}>
          <Link
            href="/kosik"
            className="whitespace-nowrap uppercase tracking-tight font-normal text-sm"
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '19.6px',
              color: '#000',
              textDecoration: 'none',
              padding: '0 8px',
              display: 'block'
            }}
          >
            KOŠÍK ({cartItemCount})
          </Link>
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-4px',
              border: '1px solid #000000',
              borderRadius: '4px',
              opacity: isUlozeno ? 0 : 1
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="w-full md:w-[700px] px-4 md:px-0" style={{ position: 'relative' }}>
          {/* Login Prompt - Only for unauthenticated users */}
          {status === 'unauthenticated' && (
            <div
              style={{
                borderTop: '1px solid #000',
                borderBottom: '1px solid #000',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '270px',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  lineHeight: '19.6px',
                  letterSpacing: '0.03em',
                  fontStretch: 'condensed',
                  color: '#000'
                }}>
                  Nepřipravte se o svůj seznam přání
                </h3>
                
                <p style={{
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '19.6px',
                  color: '#000',
                  margin: 0
                }}>
                  Přihlaste se nebo si vytvořte účet a uložte si svůj seznam přání, který můžete prohlížet na jakémkoliv zařízení
                </p>
              </div>

              <AnimatedButton
                text="PŘIHLÁSIT SE"
                onClick={() => signIn()}
                variant="black"
                style={{ borderRadius: '3px', padding: '8px 48px' }}
              />
            </div>
          )}

          {products.map((product, index) => (
            <div
              key={product.id}
              style={{
                borderTop: 'none',
                borderBottom: '1px solid #000',
                padding: '16px',
                paddingBottom: '16px'
              }}
            >
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Link href={`/produkty/${product.slug}`} style={{ flexShrink: 0 }}>
                  <div className="w-full md:w-[160px] h-[200px] md:h-[192px]" style={{
                    border: '1px solid #000',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={product.images[0] || '/placeholder.png'}
                      alt={product.name}
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  </div>
                </Link>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Link
                    href={`/produkty/${product.slug}`}
                    style={{ textDecoration: 'none', color: '#000' }}
                    className="hover:opacity-60 transition-opacity"
                  >
                    <h3 style={{
                      fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      lineHeight: '19.6px',
                      letterSpacing: '0.03em',
                      fontStretch: 'condensed',
                      color: '#000'
                    }}>
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    color: '#000',
                    marginBottom: '8px'
                  }}>
                    {product.price} Kč
                  </p>

                  <p style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '17.6px',
                    color: '#000',
                    marginBottom: '4px'
                  }}>
                    Barva: {product.color || 'Černá'}
                  </p>
                </div>
              </div>

              {/* Buttons section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '8px'
              }}>
                <button
                  onClick={() => handleMoveToCart(product)}
                  disabled={addingToCart === product.id}
                  style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    color: '#000',
                    textDecoration: 'underline',
                    border: 'none',
                    background: 'none',
                    cursor: addingToCart === product.id ? 'not-allowed' : 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    opacity: addingToCart === product.id ? 0.6 : 1
                  }}
                  className="hover:opacity-60 transition-opacity"
                >
                  {addingToCart === product.id ? 'Přidávám...' : 'Přesunout do košíku'}
                </button>
                <button
                  onClick={() => handleRemove(product.id)}
                  style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    color: '#000',
                    textDecoration: 'underline',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'right'
                  }}
                  className="hover:opacity-60 transition-opacity"
                >
                  Smazat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
