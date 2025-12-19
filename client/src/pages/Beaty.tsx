import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App";
import ContractModal from "../components/ContractModal";
import MusicPlayer from "../components/MusicPlayer";
import SoundWave from "../components/SoundWave";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  is_highlighted?: boolean;
}

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

interface LicenseOption {
  id: string;
  name: string;
  format: string;
  price: number | "NEGOTIATE";
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

function Beaty() {
  const [location] = useLocation();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const [soundKits, setSoundKits] = useState<SoundKit[]>([]);
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const [currentKit, setCurrentKit] = useState<SoundKit | null>(null);
  const [isKitPlaying, setIsKitPlaying] = useState(false);
  const [sortBy, setSortBy] = useState<"bpm" | "key" | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const kitAudioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();
  
  // Determine if we're on home page or beaty page
  const isHomePage = location === "/" || location === "";
  const beatLimit = isHomePage ? 10 : undefined;

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => res.json())
      .then(setBeats)
      .catch(console.error);

    fetch("/api/beats/highlighted")
      .then((res) => res.json())
      .then((beat) => {
        if (beat) setHighlightedBeat(beat);
      })
      .catch(console.error);

    fetch("/api/sound-kits")
      .then((res) => res.json())
      .then(setSoundKits)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => {
          const beatIds = items
            .filter((item: { item_type: string }) => item.item_type === "beat")
            .map((item: { item_id: number }) => item.item_id);
          setSavedBeats(new Set(beatIds));

          const kitIds = items
            .filter((item: { item_type: string }) => item.item_type === "sound_kit")
            .map((item: { item_id: number }) => item.item_id);
          setSavedKits(new Set(kitIds));
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
    if (kitAudioRef.current) {
      kitAudioRef.current.pause();
      setIsKitPlaying(false);
    }

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

  const playKitPreview = (kit: SoundKit) => {
    if (!kit.preview_url) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (currentKit?.id === kit.id) {
      if (isKitPlaying) {
        kitAudioRef.current?.pause();
        setIsKitPlaying(false);
      } else {
        kitAudioRef.current?.play();
        setIsKitPlaying(true);
      }
    } else {
      setCurrentKit(kit);
      setIsKitPlaying(true);
      setTimeout(() => kitAudioRef.current?.play(), 100);
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

  const handleAddKitToCart = (kit: SoundKit) => {
    if (kit.is_free) return;
    addToCart({
      productId: kit.id,
      productType: "sound_kit",
      title: kit.title,
      price: Number(kit.price),
      artworkUrl: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
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

  const toggleSaveKit = async (kit: SoundKit) => {
    if (!user) return;

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
      <audio
        ref={kitAudioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsKitPlaying(false)}
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
          <div style={{ marginBottom: "48px", display: "flex", justifyContent: "center", marginTop: "-100px", position: "relative", zIndex: 50 }}>
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
                  <button
                    onClick={() => openContractModal(highlightedBeat)}
                    className="btn-bounce"
                    style={{
                      padding: "8px 16px",
                      background: "#fff",
                      color: "#000",
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
                    }}
                  >
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-4px" }}>
                        <rect x="3" y="6" width="18" height="15" rx="2" />
                        <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                      </svg>
                      <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#000", lineHeight: "1", right: "-8px", top: "-4px" }}>+</span>
                    </div>
                    <span style={{ marginLeft: "24px", fontWeight: 500 }}>{Math.floor(highlightedBeat.price)} CZK</span>
                  </button>
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
          {otherBeats.length === 0 && !highlightedBeat ? (
            <p style={{ textAlign: "center", color: "#666" }}>
              Zatím nejsou k dispozici žádné beaty
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 8px 16px", gap: "16px", borderBottom: "1px solid #333", marginTop: "16px" }}>
                <div style={{ width: "48px", height: "48px", flexShrink: 0 }} />
                <div style={{ width: "25%", minWidth: "200px", marginRight: "12px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666" }}>NÁZEV</div>
                <button onClick={() => { setSortBy(sortBy === "bpm" ? "bpm" : "bpm"); setSortAsc(sortBy === "bpm" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, marginLeft: "64px" }}>BPM {sortBy === "bpm" && (sortAsc ? "↑" : "↓")}</button>
                <button onClick={() => { setSortBy(sortBy === "key" ? "key" : "key"); setSortAsc(sortBy === "key" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, marginLeft: "64px" }}>KEY {sortBy === "key" && (sortAsc ? "↑" : "↓")}</button>
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
                borderBottom: "1px solid #333",
                boxShadow: "none",
                position: "relative",
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.5)";
                e.currentTarget.style.borderTop = "1px solid #3b82f6";
                e.currentTarget.style.borderLeft = "1px solid #3b82f6";
                e.currentTarget.style.borderRight = "1px solid #3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderTop = "1px solid transparent";
                e.currentTarget.style.borderLeft = "1px solid transparent";
                e.currentTarget.style.borderRight = "1px solid transparent";
              }}
            >
              <img
                src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                alt={beat.title}
                style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
              />
              <div style={{ width: "25%", minWidth: "200px", marginRight: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "20px" }}>{beat.title}</div>
              </div>
              <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", minWidth: "80px", marginLeft: "64px" }}>
                {beat.bpm}
              </div>
              <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", minWidth: "80px", marginLeft: "48px" }}>
                {beat.key}
              </div>

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
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={savedBeats.has(beat.id) ? "#ff4444" : "none"}
                      stroke={savedBeats.has(beat.id) ? "#ff4444" : "#fff"}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#666",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "8px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#999";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#666";
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
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#666",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#999";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#666";
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
                    padding: "8px 16px",
                    background: "#fff",
                    color: "#000",
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
                    marginLeft: "8px",
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-4px" }}>
                      <rect x="3" y="6" width="18" height="15" rx="2" />
                      <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                    </svg>
                    <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#000", lineHeight: "1", right: "-8px", top: "-4px" }}>+</span>
                  </div>
                  <span style={{ marginLeft: "24px", fontWeight: 500 }}>{Math.floor(beat.price)} CZK</span>
                </button>
              </div>
            </div>
            ))}
            </>
          )}
        </div>


        {isHomePage && (
        <div style={{ paddingBottom: currentBeat ? "80px" : "20px", textAlign: "center", marginTop: "64px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "24px", fontWeight: "bold", fontFamily: "Helvetica Neue Condensed, Helvetica, Arial, sans-serif" }}>ZVUKY A PRESETY</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px", maxWidth: "1000px", margin: "0 auto 48px" }}>
            {[
              { label: "DRUM KIT" },
              { label: "ONE SHOT KIT" },
              { label: "GROSS BEAT BANK" },
            ].map((item, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1",
                    width: "100%",
                    border: "1px solid #666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0a",
                  }}
                >
                  <span style={{ color: "#666", fontSize: "14px" }}>Empty Slot</span>
                </div>
                <span style={{ color: "#999", fontSize: "12px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

        {soundKits.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
            Zatím nejsou k dispozici žádné zvukové kity
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {soundKits.map((kit) => (
              <div
                key={kit.id}
                style={{
                  border: "1px solid #333",
                  overflow: "hidden",
                  position: "relative",
                  borderRadius: "4px",
                }}
              >
                {user && (
                  <button
                    onClick={() => toggleSaveKit(kit)}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={savedKits.has(kit.id) ? "#ff4444" : "none"}
                      stroke={savedKits.has(kit.id) ? "#ff4444" : "#fff"}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}

                <div
                  style={{
                    aspectRatio: "1",
                    background: "#111",
                    position: "relative",
                  }}
                >
                  <img
                    src={kit.artwork_url || "/uploads/artwork/metallic-logo.png"}
                    alt={kit.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                  {kit.preview_url && (
                    <button
                      onClick={() => playKitPreview(kit)}
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "1px solid #fff",
                        background: currentKit?.id === kit.id && isKitPlaying ? "#fff" : "rgba(0,0,0,0.8)",
                        color: currentKit?.id === kit.id && isKitPlaying ? "#000" : "#fff",
                        fontSize: "18px",
                      }}
                    >
                      {currentKit?.id === kit.id && isKitPlaying ? "⏸" : "▶"}
                    </button>
                  )}
                </div>

                <div style={{ padding: "16px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                    {typeLabels[kit.type] || kit.type}
                  </div>
                  <h3 style={{ marginBottom: "8px" }}>{kit.title}</h3>
                  <p style={{ fontSize: "14px", color: "#999", marginBottom: "12px" }}>
                    {kit.number_of_sounds} zvuků
                  </p>

                  {kit.tags && kit.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                      {kit.tags.slice(0, 5).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            border: "1px solid #444",
                            borderRadius: "4px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold" }}>
                      {kit.is_free ? "ZDARMA" : `${kit.price} CZK`}
                    </span>
                    <button
                      onClick={() => handleAddKitToCart(kit)}
                      className="btn-bounce"
                      style={{
                        padding: "8px 16px",
                        background: "#fff",
                        color: "#000",
                        border: "none",
                        fontSize: "12px",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        fontWeight: 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {!kit.is_free && (
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span style={{ position: "absolute", top: "-4px", right: "-8px", fontSize: "16px", fontWeight: "400", color: "#000", lineHeight: "1" }}>+</span>
                        </div>
                      )}
                      <span style={{ fontWeight: 500 }}>{kit.is_free ? "STÁHNOUT" : `${kit.price} CZK`}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      </div>

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
      />
    </div>
  );
}

export default Beaty;
