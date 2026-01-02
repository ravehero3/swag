import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useApp } from "../App";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import ContractModal from "../components/ContractModal";
import DownloadModal from "../components/DownloadModal";
import MusicPlayer from "../components/MusicPlayer";
import SoundWave from "../components/SoundWave";
import ProductsGrid from "../components/ProductsGrid";
import SoundKitsDock from "../components/SoundKitsDock";
import ArtistCarousel from "../components/ArtistCarousel";
import MobileCarousel from "../components/MobileCarousel";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  tags?: string[];
  is_highlighted?: boolean;
}

interface LicenseOption {
  id: string;
  name: string;
  format: string;
  price: number | "NEGOTIATE";
}

interface SoundKit {
  id: number;
  title: string;
  type: string;
  price: number;
  is_free: boolean;
  number_of_sounds: number;
  artwork_url: string;
}

const testSoundKits: SoundKit[] = [
  {
    id: 101,
    title: "Friendly Ghosts",
    type: "drum_kit",
    price: 2999,
    is_free: false,
    number_of_sounds: 25,
    artwork_url: "/uploads/artwork/friendly-ghosts.png",
  },
  {
    id: 102,
    title: "One Shot Kit",
    type: "one_shot_kit",
    price: 1999,
    is_free: false,
    number_of_sounds: 45,
    artwork_url: "/uploads/artwork/friendly-aliens.png",
  },
  {
    id: 103,
    title: "Friendly Aliens",
    type: "loop_kit",
    price: 3499,
    is_free: false,
    number_of_sounds: 30,
    artwork_url: "/uploads/artwork/friendly-aliens-3.png",
  },
  {
    id: 104,
    title: "Friendly Ghosts 3",
    type: "one_shot_kit",
    price: 2499,
    is_free: false,
    number_of_sounds: 20,
    artwork_url: "/uploads/artwork/friendly-ghosts-3.png",
  },
  {
    id: 105,
    title: "Friendly Aliens 2",
    type: "drum_kit",
    price: 2999,
    is_free: false,
    number_of_sounds: 35,
    artwork_url: "/uploads/artwork/friendly-aliens-2.png",
  },
  {
    id: 106,
    title: "Friendly Ghosts Vol 1",
    type: "drum_kit",
    price: 2999,
    is_free: false,
    number_of_sounds: 28,
    artwork_url: "/uploads/artwork/kit-friendly-ghosts-1.png",
  },
  {
    id: 107,
    title: "One Shot Hostile",
    type: "one_shot_kit",
    price: 1999,
    is_free: false,
    number_of_sounds: 40,
    artwork_url: "/uploads/artwork/kit-one-shot-hostile.png",
  },
  {
    id: 108,
    title: "Friendly Aliens Vol 1",
    type: "one_shot_kit",
    price: 2499,
    is_free: false,
    number_of_sounds: 35,
    artwork_url: "/uploads/artwork/kit-friendly-aliens-1.png",
  },
  {
    id: 109,
    title: "Drum Kit Friendly Ghosts",
    type: "drum_kit",
    price: 3299,
    is_free: false,
    number_of_sounds: 50,
    artwork_url: "/uploads/artwork/kit-drum-friendly-ghosts.png",
  },
  {
    id: 110,
    title: "White Magic 3",
    type: "drum_kit",
    price: 2799,
    is_free: false,
    number_of_sounds: 32,
    artwork_url: "/uploads/artwork/kit-white-magic.png",
  },
  {
    id: 111,
    title: "Friendly Aliens Cover",
    type: "loop_kit",
    price: 3199,
    is_free: false,
    number_of_sounds: 28,
    artwork_url: "/uploads/artwork/friendly-aliens-3.png",
  },
];

interface BeatyProps {
  showOnlyDock?: boolean;
}

function Beaty({ showOnlyDock = false }: BeatyProps) {
  const [location, setLocation] = useLocation();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const [downloadingBeat, setDownloadingBeat] = useState<Beat | null>(null);
  const [sortBy, setSortBy] = useState<"bpm" | "key" | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const beatsListRef = useScrollAnimation();
  const soundKitsRef = useScrollAnimation();
  const artistCarouselRef = useScrollAnimation();
  const { user, addToCart, cart, currentBeat, setCurrentBeat, isPlaying, setIsPlaying, isLooping, setIsLooping, isShuffling, setIsShuffling, settings } = useApp();
  
  const dockIcons = assets.filter((a: any) => a.type === "dock_icon");
  const desktopCarousel = assets.filter((a: any) => a.type === "carousel_desktop");
  const mobileCarousel = assets.filter((a: any) => a.type === "carousel_mobile");

  useEffect(() => {
    fetch("/api/assets")
      .then(res => res.json())
      .then(setAssets)
      .catch(console.error);
  }, []);

  const isHomePage = location === "/" || location === "";
  const beatLimit = isHomePage ? 10 : undefined;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tagParam = searchParams.get("tag");
    const searchParam = searchParams.get("search");
    
    if (tagParam) {
      setSelectedTag(tagParam);
      setSearchQuery("");
    } else if (searchParam) {
      setSearchQuery(searchParam);
      setSelectedTag(null);
    } else {
      setSelectedTag(null);
      setSearchQuery("");
    }
  }, [location]);

  useEffect(() => {
    let url = "/api/beats";
    const params = new URLSearchParams();
    if (selectedTag) params.append("tag", selectedTag);
    if (searchQuery) params.append("search", searchQuery);
    if (params.toString()) url += "?" + params.toString();
    
    fetch(url)
      .then((res) => res.json())
      .then(setBeats)
      .catch(console.error);

    fetch("/api/beats/highlighted")
      .then((res) => res.json())
      .then((beat) => {
        if (beat) setHighlightedBeat(beat);
      })
      .catch(console.error);
  }, [selectedTag, searchQuery]);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => {
          const beatIds = items
            .filter((item: { item_type: string }) => item.item_type === "beat")
            .map((item: { item_id: number }) => item.item_id);
          setSavedBeats(new Set(beatIds));
        })
        .catch(console.error);
    } else {
      const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
      const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
      const beatIds = savedBeats.map((beat: any) => beat.id);
      setSavedBeats(new Set(beatIds));
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowTitle(scrollPosition > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const playBeat = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentBeat(beat);
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    if (!isLooping && typeof handleNext === 'function') {
      handleNext();
    }
  };

  const handleNext = () => {
    if (!currentBeat) return;
    const allBeats = highlightedBeat ? [highlightedBeat, ...beats.filter(b => b.id !== highlightedBeat.id)] : beats;
    const currentIndex = allBeats.findIndex(b => b.id === currentBeat.id);
    
    if (isShuffling) {
      const randomIndex = Math.floor(Math.random() * allBeats.length);
      playBeat(allBeats[randomIndex]);
    } else {
      const nextIndex = currentIndex < allBeats.length - 1 ? currentIndex + 1 : 0;
      playBeat(allBeats[nextIndex]);
    }
  };

  const openContractModal = (beat: Beat) => {
    setContractModalBeat(beat);
  };

  const handleAddToCartWithLicense = (beat: Beat, license: LicenseOption) => {
    if (license.price !== "NEGOTIATE") {
      addToCart({
        productId: beat.id,
        productType: "beat",
        title: `${beat.title} (${license.name})`,
        price: license.price,
        artworkUrl: beat.artwork_url || "/uploads/artwork/metallic-logo.png",
      });
    }
  };

  const toggleSave = async (beat: Beat) => {
    if (user) {
      try {
        if (savedBeats.has(beat.id)) {
          const res = await fetch(`/api/saved/beat/${beat.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            setSavedBeats((prev) => {
              const next = new Set(prev);
              next.delete(beat.id);
              return next;
            });
          }
        } else {
          const res = await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ itemId: beat.id, itemType: "beat" }),
          });
          if (res.ok) {
            setSavedBeats((prev) => new Set([...prev, beat.id]));
          }
        }
      } catch (error) {
        console.error("Error toggling save:", error);
      }
    } else {
      const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
      const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
      if (savedBeats.some((b: any) => b.id === beat.id)) {
        const filtered = savedBeats.filter((b: any) => b.id !== beat.id);
        localStorage.setItem("voodoo808_saved_beats", JSON.stringify(filtered));
        setSavedBeats((prev) => {
          const next = new Set(prev);
          next.delete(beat.id);
          return next;
        });
      } else {
        const updated = [...savedBeats, beat];
        localStorage.setItem("voodoo808_saved_beats", JSON.stringify(updated));
        setSavedBeats((prev) => new Set([...prev, beat.id]));
      }
    }
  };

  const filteredBeats = beatLimit ? beats.slice(0, beatLimit) : beats;
  const otherBeats = filteredBeats.filter((b) => b.id !== highlightedBeat?.id);

  if (showOnlyDock) {
    return (
      <div 
        className="sound-kits-dock-wrapper" 
        style={{ 
          position: "fixed",
          bottom: "200px",
          left: 0,
          width: "100%", 
          display: "flex", 
          justifyContent: "center",
          zIndex: 99999,
          pointerEvents: "none"
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          {dockIcons.length > 0 && (
            <SoundKitsDock 
              items={dockIcons.map(icon => ({
                id: icon.id,
                name: icon.name,
                image: icon.url,
                price: 0,
                isFree: true,
                onClick: () => {}
              }))} 
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-section delay-1">
      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <style>{`
        .beat-tags-container-mobile { display: none; }
        .beat-tags-container-desktop-row { display: flex; }
        @media (max-width: 768px) {
          .beat-tags-container-mobile { display: flex !important; }
          .beat-tags-container-desktop-row { display: none !important; }
          .desktop-only { display: none !important; }
          .featured-beat-tags { display: none !important; }
          .featured-beat-image { border: none !important; }
          .video-container { margin-bottom: 0 !important; margin-top: 0 !important; }
          .mobile-cart-btn { padding: 8px !important; min-width: 32px !important; width: 32px !important; height: 32px !important; justify-content: center !important; }
          .mobile-cart-btn span { display: none !important; }
          .mobile-cart-btn div svg { margin-left: 0 !important; }
          .mobile-cart-btn div span { display: block !important; top: -2px !important; right: -6px !important; }
          .playlist-container { padding: 0 2px !important; width: 100% !important; box-sizing: border-box !important; }
          .beat-track { width: calc(100% - 4px) !important; margin: 0 2px !important; box-sizing: border-box !important; border-radius: 0 !important; }
          .beat-track:hover { background: rgba(0, 0, 255, 0.1) !important; }
          .featured-track-container { margin-top: -116px; }
          @media (max-width: 768px) {
            .featured-track-container { margin-top: -52px !important; }
            .featured-buttons-container { gap: 4px !important; }
            .featured-plus-symbol { top: -29px !important; }
          }
        }
      `}</style>
      <div className="video-container" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-42px", marginBottom: "32px", overflow: "hidden", position: "relative", minHeight: "300px", background: "#000" }}>
        <video
          key={isHomePage ? "analog7" : "beaty_video"}
          src={isHomePage ? "/attached_assets/ANALOG_7_1767042864282.mov" : (settings.beaty_video_main || "/uploads/artwork/voodoo808-video.mp4")}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        <div className="video-overlay-fade" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 5 }} />
        <style>{`
          .video-overlay-fade { background: linear-gradient(to bottom, transparent calc(100% - 147px), black 100%); }
        `}</style>
      </div>
      
      <div style={{ padding: "0 2px" }} className="fade-in-grid">
        {highlightedBeat && (
          <div className="fade-in-section delay-2 featured-track-container" style={{ marginBottom: "48px", display: "flex", justifyContent: "center", position: "relative", zIndex: 50 }}>
            <div style={{ display: "flex", gap: "48px", alignItems: "flex-start", marginBottom: "32px", width: "100%", maxWidth: "1000px", position: "relative", zIndex: 50, padding: "0 18px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img className="featured-beat-image" src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"} alt={highlightedBeat.title} style={{ width: "200px", height: "200px", objectFit: "cover", border: "1px solid #666", borderRadius: "4px" }} />
                <button onClick={() => playBeat(highlightedBeat)} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #fff", background: currentBeat?.id === highlightedBeat.id && isPlaying ? "#fff" : "rgba(0,0,0,0.7)", color: currentBeat?.id === highlightedBeat.id && isPlaying ? "#000" : "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  {currentBeat?.id === highlightedBeat.id && isPlaying ? "⏸" : "▶"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#999" }}>Beat týdne</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>•</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>{highlightedBeat.bpm}BPM</span>
                </div>
                <h2 style={{ fontSize: "30px", margin: 0 }}>{highlightedBeat.title}</h2>
              </div>
            </div>
          </div>
        )}

        <div ref={beatsListRef} className="scroll-fade-section beats-list-container" style={{ marginBottom: "48px", maxWidth: "1200px", margin: "0 auto", marginTop: "60px", position: "relative", zIndex: 60 }}>
          {otherBeats.map((beat) => (
            <div key={beat.id} onClick={() => playBeat(beat)} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid #333", cursor: "pointer" }}>
              <img src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"} alt={beat.title} style={{ width: "40px", height: "40px", marginRight: "12px" }} />
              <div>{beat.title}</div>
            </div>
          ))}
        </div>
      </div>

      <DownloadModal item={downloadingBeat} isOpen={!!downloadingBeat} onClose={() => setDownloadingBeat(null)} user={user} />
      {contractModalBeat && (
        <ContractModal beat={contractModalBeat} isOpen={!!contractModalBeat} onClose={() => setContractModalBeat(null)} onAddToCart={handleAddToCartWithLicense} onPlay={() => playBeat(contractModalBeat)} isPlaying={currentBeat?.id === contractModalBeat.id && isPlaying} />
      )}
    </div>
  );
}

export default Beaty;
