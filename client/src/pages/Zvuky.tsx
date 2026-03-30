import { useState, useEffect, useRef } from "react";
import { useApp } from "../App.js";
import ProductsGrid from "../components/ProductsGrid.js";
import { useSEO } from "../hooks/useSEO.js";

interface SoundKit {
  id: number;
  title: string;
  description: string;
  type: string;
  price: number;
  is_free: boolean;
  number_of_sounds: number;
  tags: string[];
  preview_url: string;
  artwork_url: string;
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

const testKits: SoundKit[] = [
  {
    id: 1,
    title: "Analog Drums Vol. 1",
    description: "Classic analog drum kit",
    type: "drum_kit",
    price: 2999,
    is_free: false,
    number_of_sounds: 25,
    tags: ["drums", "analog", "vintage"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_1.png",
  },
  {
    id: 2,
    title: "Urban Beats Collection",
    description: "Modern urban production sounds",
    type: "one_shot_kit",
    price: 1999,
    is_free: false,
    number_of_sounds: 45,
    tags: ["urban", "hip-hop", "beats"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_ghosts_1.png",
  },
  {
    id: 3,
    title: "Cinematic Loops",
    description: "Epic cinematic loop pack",
    type: "loop_kit",
    price: 3499,
    is_free: false,
    number_of_sounds: 30,
    tags: ["cinematic", "loops", "film"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/one_shot_kit_1.png",
  },
  {
    id: 4,
    title: "Free Starter Pack",
    description: "Free sounds to get started",
    type: "one_shot_kit",
    price: 0,
    is_free: true,
    number_of_sounds: 20,
    tags: ["free", "starter", "samples"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_3.png",
  },
  {
    id: 5,
    title: "Electronic Synth Sounds",
    description: "Futuristic electronic synth pack",
    type: "drum_kit",
    price: 2499,
    is_free: false,
    number_of_sounds: 35,
    tags: ["synth", "electronic", "future"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/white_magic_3.png",
  },
  {
    id: 6,
    title: "Jazz Drums Bundle",
    description: "Professional jazz drum sounds",
    type: "drum_kit_bundle",
    price: 4999,
    is_free: false,
    number_of_sounds: 60,
    tags: ["jazz", "drums", "professional"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_cover.png",
  },
  {
    id: 7,
    title: "Ambient One Shots",
    description: "Atmospheric sound effects",
    type: "one_shot_kit",
    price: 1499,
    is_free: false,
    number_of_sounds: 18,
    tags: ["ambient", "atmosphere", "sfx"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_ghosts_2.png",
  },
  {
    id: 8,
    title: "Trap Essentials",
    description: "Essential trap production kit",
    type: "one_shot_bundle",
    price: 3299,
    is_free: false,
    number_of_sounds: 50,
    tags: ["trap", "hip-hop", "production"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_ghosts_3.png",
  },
  {
    id: 9,
    title: "Vintage Vinyl Loops",
    description: "Warm vintage vinyl loop collection",
    type: "loop_kit",
    price: 2799,
    is_free: false,
    number_of_sounds: 28,
    tags: ["vintage", "vinyl", "loops"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_4.png",
  },
  {
    id: 10,
    title: "Deep House Drums",
    description: "Deep house drum patterns",
    type: "drum_kit",
    price: 1999,
    is_free: false,
    number_of_sounds: 22,
    tags: ["house", "deep", "electronic"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_2.png",
  },
  {
    id: 11,
    title: "Percussion Masters",
    description: "World percussion collection",
    type: "one_shot_bundle",
    price: 3799,
    is_free: false,
    number_of_sounds: 55,
    tags: ["percussion", "world", "drums"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_ghosts_main.png",
  },
  {
    id: 12,
    title: "Retro 80s Pack",
    description: "Authentic 80s synth and drum sounds",
    type: "drum_kit_bundle",
    price: 4299,
    is_free: false,
    number_of_sounds: 48,
    tags: ["retro", "80s", "synth"],
    preview_url: "",
    artwork_url: "/assets/sound_kits/friendly_aliens_1.png",
  },
];

function Zvuky() {
  const [kits, setKits] = useState<SoundKit[]>(testKits);
  const [currentKit, setCurrentKit] = useState<SoundKit | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart, settings } = useApp();
  useSEO("zvuky");

  useEffect(() => {
    fetch("/api/sound-kits")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setKits(data);
        } else {
          setKits([]); // Changed from testKits to empty array for production
        }
      })
      .catch(() => setKits([])); // Changed from testKits to empty array for production
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => {
          const kitIds = items
            .filter((item: { item_type: string }) => item.item_type === "sound_kit")
            .map((item: { item_id: number }) => item.item_id);
          setSavedKits(new Set(kitIds));
        })
        .catch(console.error);
    } else {
      // Load saved kits from localStorage for non-logged-in users
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      setSavedKits(new Set(savedKits.map((k: any) => k.id)));
    }
  }, [user]);

  const playPreview = (kit: SoundKit) => {
    if (!kit.preview_url) return;
    
    if (currentKit?.id === kit.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentKit(kit);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handleAddToCart = (kit: SoundKit) => {
    if (kit.is_free) return;
    addToCart({
      productId: kit.id,
      productType: "sound_kit",
      title: kit.title,
      price: Number(kit.price),
      artworkUrl: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
  };

  const toggleSave = async (kit: SoundKit) => {
    if (user) {
      try {
        if (savedKits.has(kit.id)) {
          const res = await fetch(`/api/saved/sound_kit/${kit.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            setSavedKits((prev) => {
              const next = new Set(prev);
              next.delete(kit.id);
              return next;
            });
          }
        } else {
          const res = await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ itemId: kit.id, itemType: "sound_kit" }),
          });
          if (res.ok) {
            setSavedKits((prev) => new Set([...prev, kit.id]));
          }
        }
      } catch (error) {
        console.error("Error toggling save:", error);
      }
    } else {
      // Handle non-logged-in users with localStorage
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      
      if (savedKits.find((k: any) => k.id === kit.id)) {
        const filtered = savedKits.filter((k: any) => k.id !== kit.id);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(filtered));
        setSavedKits((prev) => {
          const next = new Set(prev);
          next.delete(kit.id);
          return next;
        });
      } else {
        savedKits.push(kit);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(savedKits));
        setSavedKits((prev) => new Set([...prev, kit.id]));
      }
    }
  };

  const products = kits.map((kit) => ({
    id: kit.id,
    name: kit.title,
    price: kit.price,
    images: [kit.artwork_url || "/uploads/artwork/metallic-logo.png"],
    soundCount: kit.number_of_sounds,
    type: kit.type,
    isFree: kit.is_free,
    typeLabel: typeLabels[kit.type] || kit.type,
  }));

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background Wall with Vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(/attached_assets/wall_background_1768155050336.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.9) 85%, black 100%)',
          }}
        />
      </div>

      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />
      
      <style>{`
        .zvuky-video-container {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-top: -42px;
          margin-bottom: 32px;
          overflow: hidden;
          position: relative;
          min-height: 300px;
          background: transparent;
          z-index: 1;
        }
        .zvuky-video-overlay-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 300px;
          background: linear-gradient(to bottom, transparent, black);
          pointer-events: none;
          z-index: 2;
        }
        .zvuky-content-wrapper {
          position: relative;
          z-index: 10;
        }
      `}</style>
      
      <div className="zvuky-content-wrapper">
        <div className="zvuky-video-container" style={{ marginTop: "-242px" }}>
          <video
            key={settings?.zvuky_video}
            src={settings?.zvuky_video || "/uploads/hrad-na-web.mov"}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="zvuky-video-overlay-fade" />
        </div>
        

        {kits.length > 0 ? (
          <div style={{ width: "100%", marginBottom: "48px", marginTop: "-100px" }}>
            <ProductsGrid
              products={products}
              savedProducts={Array.from(savedKits)}
              onToggleSave={(id) => toggleSave(kits.find((k) => k.id === id)!)}
              onPlayClick={(id) => playPreview(kits.find((k) => k.id === id)!)}
              isPlaying={isPlaying}
              currentPlayingId={currentKit?.id}
              onAddToCart={(id) => handleAddToCart(kits.find((k) => k.id === id)!)}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#fff" }}>
             <p style={{ opacity: 0.6, fontSize: "14px", letterSpacing: "1px" }}>Žádné zvukové kity nebyly nalezeny.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Zvuky;
