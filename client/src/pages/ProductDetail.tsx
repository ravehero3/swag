import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp } from "../App.js";

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
  const [, params] = useRoute("/produkt/:type/:id");
  const [, setLocation] = useLocation();
  const { addToCart } = useApp() as any;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback data for test kits if API fails or returns nothing
  const testKits: Record<number, ProductData> = {
    1: { id: 1, title: "Analog Drums Vol. 1", price: 2999, artwork_url: "/assets/sound_kits/friendly_aliens_1.png", type: "drum_kit" },
    2: { id: 2, title: "Urban Beats Collection", price: 1999, artwork_url: "/assets/sound_kits/friendly_ghosts_1.png", type: "one_shot_kit" },
    3: { id: 3, title: "Cinematic Loops", price: 3499, artwork_url: "/assets/sound_kits/one_shot_kit_1.png", type: "loop_kit" },
    4: { id: 4, title: "Free Starter Pack", price: 0, artwork_url: "/assets/sound_kits/friendly_aliens_3.png", type: "one_shot_kit" },
    5: { id: 5, title: "Electronic Synth Sounds", price: 2499, artwork_url: "/assets/sound_kits/white_magic_3.png", type: "drum_kit" },
    6: { id: 6, title: "Jazz Drums Bundle", price: 4999, artwork_url: "/assets/sound_kits/friendly_aliens_cover.png", type: "drum_kit_bundle" },
    7: { id: 7, title: "Ambient One Shots", price: 1499, artwork_url: "/assets/sound_kits/friendly_ghosts_2.png", type: "one_shot_kit" },
    8: { id: 8, title: "Trap Essentials", price: 3299, artwork_url: "/assets/sound_kits/friendly_ghosts_3.png", type: "one_shot_bundle" },
    9: { id: 9, title: "Vintage Vinyl Loops", price: 2799, artwork_url: "/assets/sound_kits/friendly_aliens_4.png", type: "loop_kit" },
    10: { id: 10, title: "Deep House Drums", price: 1999, artwork_url: "/assets/sound_kits/friendly_aliens_2.png", type: "drum_kit" },
    11: { id: 11, title: "Percussion Masters", price: 3799, artwork_url: "/assets/sound_kits/friendly_ghosts_main.png", type: "one_shot_bundle" },
    12: { id: 12, title: "Retro 80s Pack", price: 4299, artwork_url: "/assets/sound_kits/friendly_aliens_1.png", type: "drum_kit_bundle" },
  };

  useEffect(() => {
    if (params) {
      const endpoint = params.type === "beat" ? `/api/beats/${params.id}` : `/api/sound-kits/${params.id}`;
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setProduct(data);
          } else if (params.type === "sound_kit") {
            // Fallback to test kits for sound kits if API doesn't find the kit
            setProduct(testKits[Number(params.id)] || null);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          if (params.type === "sound_kit") {
            setProduct(testKits[Number(params.id)] || null);
          }
          setLoading(false);
        });
    }
  }, [params]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Product not found</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center relative overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col items-center px-4 text-center relative z-10" style={{ paddingTop: '64px', paddingBottom: '120px' }}>
        {/* Product Image - Centered and large */}
        <div className="p-4 flex items-center justify-center relative mb-[64px]" style={{ width: '400px', height: '400px', maxWidth: '100%' }}>
          <img 
            src={product.artwork_url || "/uploads/artwork/metallic-logo.png"} 
            alt={product.title} 
            className="w-full h-full object-contain relative z-20"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/uploads/artwork/metallic-logo.png";
            }}
          />
          {/* Subtle Glow underneath the image */}
          <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full z-0 pointer-events-none transform translate-y-10" />
        </div>

        {/* Product Info - Centered */}
        <div className="flex flex-col items-center space-y-4 max-w-lg mb-[64px]">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest">
            {product.title}
          </h1>
          
          <div className="text-[#666] text-xs flex flex-wrap justify-center gap-4 uppercase">
            {product.artist && <span>Artist: {product.artist}</span>}
            {product.bpm && <span>BPM: {product.bpm}</span>}
            {product.key && <span>Key: {product.key}</span>}
            {product.number_of_sounds && <span>Sounds: {product.number_of_sounds}</span>}
            {product.type && <span>Type: {product.type.replace('_', ' ')}</span>}
          </div>

          <div className="border-t border-b border-[#333] py-6 w-full">
             <div className="text-3xl font-bold mb-6">{product.price} CZK</div>
             
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
            className="text-xs uppercase tracking-widest text-[#666] hover:text-white transition-colors"
          >
            ← Zpět do obchodu
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
