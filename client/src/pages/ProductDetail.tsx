import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp } from "../App";

interface ProductData {
  id: number;
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  price: number;
  artwork_url: string;
  preview_url?: string;
  description?: string;
  number_of_sounds?: number;
  type?: string;
}

function ProductDetail() {
  const [match, params] = useRoute("/produkt/:type/:id");
  const [, setLocation] = useLocation();
  const { addToCart } = useApp();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params) {
      const endpoint = params.type === "beat" ? `/api/beats/${params.id}` : `/api/sound-kits/${params.id}`;
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          setProduct(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [params]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Product not found</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
        {/* Left: Product Image */}
        <div className="border border-[#333] p-4 bg-[#050505] flex items-center justify-center aspect-square overflow-hidden">
          <img 
            src={product.artwork_url || "/uploads/artwork/metallic-logo.png"} 
            alt={product.title} 
            className="w-full h-full object-contain"
            style={{ transform: 'scale(1.1)' }}
          />
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest mb-4">
            {product.title}
          </h1>
          
          <div className="text-[#666] text-sm mb-6 flex flex-wrap gap-4 uppercase">
            {product.artist && <span>Artist: {product.artist}</span>}
            {product.bpm && <span>BPM: {product.bpm}</span>}
            {product.key && <span>Key: {product.key}</span>}
            {product.number_of_sounds && <span>Sounds: {product.number_of_sounds}</span>}
            {product.type && <span>Type: {product.type.replace('_', ' ')}</span>}
          </div>

          <div className="border-t border-b border-[#333] py-8 my-6">
             <div className="text-3xl font-bold mb-8">{product.price} CZK</div>
             
             <button
               onClick={() => addToCart({
                 productId: product.id,
                 productType: params?.type as any,
                 title: product.title,
                 price: product.price,
                 artworkUrl: product.artwork_url || "/uploads/artwork/metallic-logo.png"
               })}
               className="w-full py-4 bg-white text-black font-bold uppercase tracking-wider rounded-sm hover:bg-gray-200 transition-colors"
             >
               DO KOŠÍKU
             </button>
          </div>

          <div className="text-gray-400 text-sm leading-relaxed">
            {product.description || "Tento digitální produkt je připraven k okamžitému stažení po zakoupení. Obsahuje vysoce kvalitní audio soubory pro vaši hudební produkci."}
          </div>
          
          <button 
            onClick={() => setLocation(params?.type === 'beat' ? '/beaty' : '/zvuky')}
            className="mt-12 text-xs uppercase tracking-widest text-[#666] hover:text-white transition-colors self-start"
          >
            ← Zpět do obchodu
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
