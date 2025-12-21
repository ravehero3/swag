import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App";
import ContractModal from "../components/ContractModal";
import DownloadModal from "../components/DownloadModal";
import MusicPlayer from "../components/MusicPlayer";
import SoundWave from "../components/SoundWave";
import ProductsGrid from "../components/ProductsGrid";
import SoundKitsDock from "../components/SoundKitsDock";

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


function Beaty() {
  const [location, setLocation] = useLocation();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const [downloadingBeat, setDownloadingBeat] = useState<Beat | null>(null);
  const [sortBy, setSortBy] = useState<"bpm" | "key" | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();
  
  // Determine if we're on home page or beaty page
  const isHomePage = location === "/" || location === "";
  const beatLimit = isHomePage ? 10 : undefined;

  // Parse URL parameters on mount and when location changes
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
    }
  }, [user]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const playBeat = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentBeat(beat);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handlePlayPause = () => {
    if (currentBeat) {
      playBeat(currentBeat);
    }
  };

  const handlePrevious = () => {
    if (!currentBeat) return;
    const allBeats = highlightedBeat ? [highlightedBeat, ...beats.filter(b => b.id !== highlightedBeat.id)] : beats;
    const currentIndex = allBeats.findIndex(b => b.id === currentBeat.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allBeats.length - 1;
    playBeat(allBeats[prevIndex]);
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

  const handleAudioEnded = () => {
    if (!isLooping) {
      handleNext();
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
    if (!user) return;

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
  };

  const filteredBeats = beatLimit ? beats.slice(0, beatLimit) : beats;
  const otherBeats = filteredBeats.filter((b) => b.id !== highlightedBeat?.id);

  return (
    <div className="fade-in">
      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-42px", marginBottom: "32px", overflow: "hidden", position: "relative" }}>
        <video
          src="/uploads/voodoo808-video.mov"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "166px",
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
      
      <div style={{ padding: "0 20px" }}>
        {highlightedBeat && (
          <div style={{ marginBottom: "48px", display: "flex", justifyContent: "center", marginTop: "-116px", position: "relative", zIndex: 50 }}>
            <div style={{ display: "flex", gap: "48px", alignItems: "flex-start", marginBottom: "32px", width: "1000px", position: "relative", zIndex: 50 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={highlightedBeat.title}
                  style={{ width: "200px", height: "200px", objectFit: "cover", border: "1px solid #666", borderRadius: "4px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backdropFilter: "blur(10px) brightness(1.2)",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    pointerEvents: "none",
                  }}
                />
                <button
                  onClick={() => playBeat(highlightedBeat)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    background: currentBeat?.id === highlightedBeat.id && isPlaying ? "#fff" : "rgba(0,0,0,0.7)",
                    color: currentBeat?.id === highlightedBeat.id && isPlaying ? "#000" : "#fff",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    padding: "8px",
                  }}
                >
                  {currentBeat?.id === highlightedBeat.id && isPlaying ? "⏸" : "▶"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#999" }}>
                    Beat týdne
                  </span>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#666" }}>•</span>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#666" }}>
                    {highlightedBeat.bpm}BPM
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <h2 style={{ fontSize: "30px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: "400", lineHeight: "1.1", position: "relative", zIndex: 10, margin: 0 }}>
                    {highlightedBeat.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => openContractModal(highlightedBeat)}
                      className="btn-bounce"
                      style={{
                        padding: "8px 8px 8px 16px",
                        background: "#000",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        fontWeight: 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "4px",
                        position: "relative",
                        minWidth: "120px",
                        height: "32px",
                        transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                        overflow: "visible",
                        boxShadow: "inset 0 0 0 0.5px #fff",
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "#fff";
                        btn.style.color = "#000";
                        btn.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
                        
                        // Change + symbol color to black
                        const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                        if (plusSymbol) plusSymbol.style.color = "#000";
                        
                        // Create particles
                        for (let i = 0; i < 7; i++) {
                          const particle = document.createElement("div");
                          particle.setAttribute("data-particle", "true");
                          const angle = (i / 7) * Math.PI * 2;
                          particle.style.position = "absolute";
                          particle.style.width = "4px";
                          particle.style.height = "4px";
                          particle.style.background = "#fff";
                          particle.style.borderRadius = "50%";
                          particle.style.left = "50%";
                          particle.style.top = "50%";
                          particle.style.pointerEvents = "none";
                          particle.style.transform = "translate(-50%, -50%)";
                          particle.style.opacity = "0.8";
                          
                          const distance = 35;
                          const startX = Math.cos(angle) * distance;
                          const startY = Math.sin(angle) * distance;
                          const endX = Math.cos(angle) * (distance + 40);
                          const endY = Math.sin(angle) * (distance + 40);
                          
                          particle.style.animation = `particleFloat-${i} 3s ease-out forwards`;
                          
                          btn.appendChild(particle);
                          
                          const style = document.createElement("style");
                          style.textContent = `
                            @keyframes particleFloat-${i} {
                              0% { transform: translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px)); opacity: 0.8; }
                              100% { transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)); opacity: 0; }
                            }
                          `;
                          document.head.appendChild(style);
                        }
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = "#000";
                        btn.style.color = "#fff";
                        btn.style.boxShadow = "inset 0 0 0 0.5px #fff";
                        
                        // Change + symbol color back to white
                        const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                        if (plusSymbol) plusSymbol.style.color = "#fff";
                        
                        // Remove only particles, not icon container
                        const particles = btn.querySelectorAll("div[data-particle='true']");
                        particles.forEach((p) => p.remove());
                      }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                          <rect x="3" y="6" width="18" height="15" rx="2" />
                          <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                        </svg>
                        <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#fff", lineHeight: "1", right: "-10px", top: "-5px" }}>+</span>
                      </div>
                      <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{Math.floor(highlightedBeat.price)} CZK</span>
                    </button>
                    <button
                      style={{
                        padding: "8px",
                        background: "#000",
                        border: "1px solid #666",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                        marginLeft: "2px",
                        minHeight: "32px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#000")}
                      title="Download"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      style={{
                        padding: "8px",
                        background: "#000",
                        border: "1px solid #666",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                        marginLeft: "2px",
                        minHeight: "32px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#000")}
                      title="Share"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                    {highlightedBeat.tags && highlightedBeat.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {highlightedBeat.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setLocation(`/beaty?tag=${encodeURIComponent(tag)}`)}
                            style={{
                              padding: "3px 8px",
                              background: "#0d0d0d",
                              color: "#666",
                              border: "1px solid #333",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                              cursor: "pointer",
                              transition: "transform 0.15s ease, border-color 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              const btn = e.currentTarget as HTMLButtonElement;
                              btn.style.transform = "scale(1.02)";
                              btn.style.borderColor = "#555";
                            }}
                            onMouseLeave={(e) => {
                              const btn = e.currentTarget as HTMLButtonElement;
                              btn.style.transform = "scale(1)";
                              btn.style.borderColor = "#333";
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => toggleSave(highlightedBeat)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    alignSelf: "flex-start",
                    marginTop: "0px",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={savedBeats.has(highlightedBeat.id) ? "#ff4444" : "none"}
                    stroke={savedBeats.has(highlightedBeat.id) ? "#ff4444" : "#fff"}
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {isPlaying && currentBeat && (
          <SoundWave audioRef={audioRef} isPlaying={isPlaying} />
        )}

        <div style={{ marginBottom: "48px", maxWidth: "1200px", margin: "0 auto", marginTop: "60px" }}>
          {!isHomePage && (
            <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Hledat..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedTag(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "14px",
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                }}
              />
              {selectedTag && (
                <button
                  onClick={() => {
                    setLocation("/beaty");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#333",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  }}
                >
                  ✕ Vymazat filtr
                </button>
              )}
            </div>
          )}
          {selectedTag && (
            <div style={{ marginBottom: "16px", padding: "8px 16px", background: "#1a1a1a", borderRadius: "4px", fontSize: "12px", color: "#999" }}>
              Filtrováno podle tagu: <strong>{selectedTag}</strong>
            </div>
          )}
          {otherBeats.length === 0 && !highlightedBeat ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              {Array(4).fill(null).map((_, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 16px",
                    gap: "16px",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    background: "#0a0a0a",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    height: "48px",
                  }}
                >
                  <div style={{ width: "48px", height: "48px", background: "#222", borderRadius: "4px", flexShrink: 0 }} />
                  <div style={{ width: "25%", minWidth: "200px", height: "16px", background: "#222", borderRadius: "2px" }} />
                  <div style={{ flex: 1, height: "16px", background: "#222", borderRadius: "2px", marginLeft: "64px" }} />
                  <div style={{ width: "80px", height: "16px", background: "#222", borderRadius: "2px", marginLeft: "48px" }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 8px 16px", gap: "16px", marginTop: "16px", position: "relative" }}>
                <div style={{ width: "48px", height: "48px", flexShrink: 0 }} />
                <div style={{ width: "25%", minWidth: "200px", marginRight: "12px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666" }}>NÁZEV</div>
                <div style={{ position: "absolute", bottom: 0, left: "80px", right: 0, height: "1px", background: "#333" }} />
                <button onClick={() => { setSortBy(sortBy === "bpm" ? "bpm" : "bpm"); setSortAsc(sortBy === "bpm" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, marginLeft: "64px" }}>BPM {sortBy === "bpm" && (sortAsc ? "↑" : "↓")}</button>
                <button onClick={() => { setSortBy(sortBy === "key" ? "key" : "key"); setSortAsc(sortBy === "key" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, marginLeft: "104px" }}>KEY {sortBy === "key" && (sortAsc ? "↑" : "↓")}</button>
              </div>
              {(sortBy && sortBy === "bpm" ? [...otherBeats].sort((a, b) => sortAsc ? a.bpm - b.bpm : b.bpm - a.bpm) : sortBy && sortBy === "key" ? [...otherBeats].sort((a, b) => sortAsc ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)) : otherBeats).map((beat) => (
            <div
              key={beat.id}
              onClick={() => playBeat(beat)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                gap: "16px",
                border: "1px solid transparent",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                justifyContent: "flex-start",
                boxShadow: "none",
                position: "relative",
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.boxShadow = "0 0 0 1px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.5)";
                target.style.borderTop = "1px solid #3b82f6";
                target.style.borderLeft = "1px solid #3b82f6";
                target.style.borderRight = "1px solid #3b82f6";
                const separator = target.querySelector('[data-separator]') as HTMLElement;
                if (separator) separator.style.opacity = "0.5";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.boxShadow = "none";
                target.style.borderTop = "1px solid transparent";
                target.style.borderLeft = "1px solid transparent";
                target.style.borderRight = "1px solid transparent";
                const separator = target.querySelector('[data-separator]') as HTMLElement;
                if (separator) separator.style.opacity = "1";
              }}
            >
              <div data-separator style={{ position: "absolute", bottom: 0, left: "80px", right: 0, height: "1px", background: "#333", opacity: 1, transition: "opacity 0.15s ease" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px", marginRight: "-4px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user) toggleSave(beat);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s ease",
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.transform = "scale(1)";
                  }}
                  title={user ? (savedBeats.has(beat.id) ? "Remove from favorites" : "Add to favorites") : "Log in to save"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={user && savedBeats.has(beat.id) ? "#ff4444" : "none"}
                    stroke={user && savedBeats.has(beat.id) ? "#ff4444" : "#666"}
                    strokeWidth="1"
                    style={{ transition: "all 0.3s ease" }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <img
                  src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={beat.title}
                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                />
              </div>
              <div style={{ width: "25%", minWidth: "200px", marginRight: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "20px" }}>{beat.title}</div>
              </div>
              <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", minWidth: "80px", marginLeft: "64px" }}>
                {beat.bpm}
              </div>
              <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", minWidth: "80px", marginLeft: "48px" }}>
                {beat.key}
              </div>

              {beat.tags && beat.tags.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginLeft: "12px", alignItems: "center" }}>
                  {beat.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/beaty?tag=${encodeURIComponent(tag)}`);
                      }}
                      style={{
                        padding: "3px 8px",
                        background: "#0d0d0d",
                        color: "#666",
                        border: "1px solid #333",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, border-color 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.transform = "scale(1.02)";
                        btn.style.borderColor = "#555";
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.transform = "scale(1)";
                        btn.style.borderColor = "#333";
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", marginRight: "16px" }}>
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(beat);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      marginRight: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={savedBeats.has(beat.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={savedBeats.has(beat.id) ? "#ff4444" : "none"}
                      stroke={savedBeats.has(beat.id) ? "#ff4444" : "#888"}
                      strokeWidth="2"
                      style={{ transition: "all 0.3s ease" }}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDownloadingBeat(beat);
                  }}
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#666",
                    transition: "all 0.2s ease, border-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "8px",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#333";
                  }}
                  title="Download"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#666",
                    transition: "all 0.2s ease, border-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.borderColor = "#333";
                  }}
                  title="Share"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openContractModal(beat);
                  }}
                  className="btn-bounce"
                  style={{
                    padding: "8px 8px 8px 16px",
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "4px",
                    position: "relative",
                    minWidth: "120px",
                    height: "32px",
                    marginLeft: "8px",
                    transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                    overflow: "visible",
                    boxShadow: "inset 0 0 0 0.5px #fff",
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.background = "#fff";
                    btn.style.color = "#000";
                    btn.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.8), inset 0 0 0 0.5px #000, inset 0 0 10px rgba(255, 255, 255, 0.3)";
                    
                    // Change + symbol color to black
                    const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                    if (plusSymbol) plusSymbol.style.color = "#000";
                    
                    // Create particles
                    for (let i = 0; i < 7; i++) {
                      const particle = document.createElement("div");
                      particle.setAttribute("data-particle", "true");
                      const angle = (i / 7) * Math.PI * 2;
                      particle.style.position = "absolute";
                      particle.style.width = "4px";
                      particle.style.height = "4px";
                      particle.style.background = "#fff";
                      particle.style.borderRadius = "50%";
                      particle.style.left = "50%";
                      particle.style.top = "50%";
                      particle.style.pointerEvents = "none";
                      particle.style.transform = "translate(-50%, -50%)";
                      particle.style.opacity = "0.8";
                      
                      const distance = 35;
                      const startX = Math.cos(angle) * distance;
                      const startY = Math.sin(angle) * distance;
                      const endX = Math.cos(angle) * (distance + 40);
                      const endY = Math.sin(angle) * (distance + 40);
                      
                      particle.style.animation = `particleFloat-${i} 3s ease-out forwards`;
                      
                      btn.appendChild(particle);
                      
                      const style = document.createElement("style");
                      style.textContent = `
                        @keyframes particleFloat-${i} {
                          0% { transform: translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px)); opacity: 0.8; }
                          100% { transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)); opacity: 0; }
                        }
                      `;
                      document.head.appendChild(style);
                    }
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.background = "#000";
                    btn.style.color = "#fff";
                    btn.style.boxShadow = "inset 0 0 0 0.5px #fff";
                    
                    // Change + symbol color back to white
                    const plusSymbol = btn.querySelector("span[style*='position: absolute']") as HTMLElement;
                    if (plusSymbol) plusSymbol.style.color = "#fff";
                    
                    // Remove only particles, not icon container
                    const particles = btn.querySelectorAll("div[data-particle='true']");
                    particles.forEach((p) => p.remove());
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                      <rect x="3" y="6" width="18" height="15" rx="2" />
                      <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                    </svg>
                    <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#fff", lineHeight: "1", right: "-10px", top: "-5px" }}>+</span>
                  </div>
                  <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{Math.floor(beat.price)} CZK</span>
                </button>
              </div>
            </div>
            ))}
            </>
          )}
        </div>

        {isHomePage && (
          <div style={{ marginTop: "64px", marginBottom: "100px" }}>
            <h2 style={{ fontSize: "24px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: "400", marginBottom: "32px", marginTop: 0, paddingLeft: "20px" }}>
              ZVUKY
            </h2>
            <SoundKitsDock
              items={testSoundKits.map((kit) => ({
                id: kit.id,
                name: kit.title,
                image: kit.artwork_url,
                price: kit.price,
                isFree: kit.is_free,
                onClick: () => {
                  setLocation("/zvuky");
                },
              }))}
            />
          </div>
        )}

      </div>

      <DownloadModal
        item={downloadingBeat}
        isOpen={!!downloadingBeat}
        onClose={() => setDownloadingBeat(null)}
        user={user}
      />

      {contractModalBeat && (
        <ContractModal
          beat={contractModalBeat}
          isOpen={!!contractModalBeat}
          onClose={() => setContractModalBeat(null)}
          onAddToCart={handleAddToCartWithLicense}
          onPlay={() => playBeat(contractModalBeat)}
          isPlaying={currentBeat?.id === contractModalBeat.id && isPlaying}
        />
      )}

      <MusicPlayer
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        isLooping={isLooping}
        isShuffling={isShuffling}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleShuffle={() => setIsShuffling(!isShuffling)}
        onBuyClick={openContractModal}
        audioRef={audioRef}
      />
    </div>
  );
}

export default Beaty;
