import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import { Link } from "wouter";

interface SavedItem {
  id: number;
  item_id: number;
  item_type: string;
  item_data: {
    id: number;
    title: string;
    artist?: string;
    bpm?: number;
    key?: string;
    price: number;
    preview_url?: string;
    artwork_url?: string;
    type?: string;
    number_of_sounds?: number;
    is_free?: boolean;
  };
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

function AnimatedLink({ href, text }: { href: string; text: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      className="relative overflow-hidden bg-white text-black font-normal uppercase tracking-tight transition-all border border-black text-sm"
      style={{ borderRadius: '4px', padding: '11.8px 25.6px', display: 'inline-block', textDecoration: 'none' }}
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

function Ulozeno() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SavedItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then(setSavedItems)
        .catch(console.error);
    } else {
      const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      
      const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      
      const combined = [
        ...savedBeats.map((beat: any, idx: number) => ({
          id: -(idx + 1),
          item_id: beat.id,
          item_type: "beat",
          item_data: beat,
        })),
        ...savedKits.map((kit: any, idx: number) => ({
          id: -1000 - (idx + 1),
          item_id: kit.id,
          item_type: "sound_kit",
          item_data: kit,
        })),
      ];
      setSavedItems(combined);
    }
  }, [user]);

  const playPreview = (item: SavedItem) => {
    if (!item.item_data.preview_url) return;
    
    if (currentItem?.id === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentItem(item);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handleRemove = async (item: SavedItem) => {
    if (user) {
      await fetch(`/api/saved/${item.item_type}/${item.item_id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } else {
      if (item.item_type === "beat") {
        const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
        const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
        const filtered = savedBeats.filter((b: any) => b.id !== item.item_id);
        localStorage.setItem("voodoo808_saved_beats", JSON.stringify(filtered));
      } else {
        const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
        const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
        const filtered = savedKits.filter((k: any) => k.id !== item.item_id);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(filtered));
      }
    }
    setSavedItems(savedItems.filter((s) => s.id !== item.id));
  };

  const handleAddToCart = (item: SavedItem) => {
    if (item.item_data.is_free) return;
    addToCart({
      productId: item.item_data.id,
      productType: item.item_type as "beat" | "sound_kit",
      title: item.item_data.title,
      price: Number(item.item_data.price),
      artworkUrl: item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
  };

  const beats = savedItems.filter((item) => item.item_type === "beat");
  const soundKits = savedItems.filter((item) => item.item_type === "sound_kit");
  const isTemporary = !user;

  return (
    <div className="min-h-screen bg-black text-white relative fade-in">
      <audio
        ref={audioRef}
        src={currentItem?.item_data.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Vertical lines effect */}
      <div className="hidden md:block" style={{
        position: 'absolute',
        left: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#222',
        zIndex: 5,
        pointerEvents: 'none'
      }} />
      <div className="hidden md:block" style={{
        position: 'absolute',
        right: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#222',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      <div className="max-w-[700px] mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16">
          <h1 className="uppercase tracking-[0.2em] font-bold text-3xl mb-4">
            Uložené položky
          </h1>
          {isTemporary && (
            <p className="text-[#888] text-xs uppercase tracking-widest">
              (Dočasné uložení - přihlaste se pro trvalé uložení)
            </p>
          )}
        </div>

        {savedItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#666] mb-12 uppercase tracking-widest">
              Zatím nemáte žádné uložené položky
            </p>
            <AnimatedLink href="/zvuky" text="PROCHÁZET BEATY" />
          </div>
        ) : (
          <div className="space-y-16">
            {beats.length > 0 && (
              <div>
                <h2 className="text-[#999] uppercase text-sm tracking-[0.2em] mb-8 border-b border-[#222] pb-2">
                  Beaty
                </h2>
                <div className="space-y-4">
                  {beats.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 border border-[#222] hover:border-white transition-colors rounded-sm"
                    >
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => playPreview(item)}
                          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                            currentItem?.id === item.id && isPlaying 
                              ? "bg-white border-white text-black" 
                              : "bg-transparent border-[#444] text-white hover:border-white"
                          }`}
                        >
                          {currentItem?.id === item.id && isPlaying ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z"/></svg>
                          )}
                        </button>
                        <div>
                          <h3 className="font-bold uppercase tracking-tight">{item.item_data.title}</h3>
                          <p className="text-xs text-[#666] uppercase mt-1">
                            {item.item_data.artist} • {item.item_data.bpm} BPM • {item.item_data.key}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="font-bold text-sm whitespace-nowrap">{item.item_data.price} CZK</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-2 text-[#666] hover:text-red-500 transition-colors"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-sm hover:bg-[#eee] transition-colors uppercase tracking-widest"
                          >
                            DO KOŠÍKU
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soundKits.length > 0 && (
              <div>
                <h2 className="text-[#999] uppercase text-sm tracking-[0.2em] mb-8 border-b border-[#222] pb-2">
                  Zvukové kity
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {soundKits.map((item) => (
                    <div
                      key={item.id}
                      className="group relative border border-[#222] hover:border-white transition-all rounded-sm overflow-hidden"
                    >
                      <div className="aspect-square relative overflow-hidden bg-[#111]">
                        <img
                          src={item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png"}
                          alt={item.item_data.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          {item.item_data.preview_url && (
                            <button
                              onClick={() => playPreview(item)}
                              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                                currentItem?.id === item.id && isPlaying 
                                  ? "bg-white border-white text-black" 
                                  : "bg-transparent border-white text-white hover:bg-white hover:text-black"
                              }`}
                            >
                              {currentItem?.id === item.id && isPlaying ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z"/></svg>
                              )}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item)}
                          className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-red-500 hover:bg-black transition-colors z-20"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="text-[10px] text-[#666] uppercase tracking-widest mb-2">
                          {typeLabels[item.item_data.type || ""] || item.item_data.type}
                        </div>
                        <h3 className="font-bold uppercase tracking-tight mb-1">{item.item_data.title}</h3>
                        <p className="text-xs text-[#444] uppercase mb-4">
                          {item.item_data.number_of_sounds} ZVUKŮ
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#222]">
                          <span className="font-bold text-sm">
                            {item.item_data.is_free ? "ZDARMA" : `${item.item_data.price} CZK`}
                          </span>
                          <button 
                            onClick={() => handleAddToCart(item)}
                            className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-sm hover:bg-[#eee] transition-colors uppercase tracking-widest"
                          >
                            {item.item_data.is_free ? "STÁHNOUT" : "DO KOŠÍKU"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Ulozeno;
