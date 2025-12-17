import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import ContractModal from "../components/ContractModal";
import MusicPlayer from "../components/MusicPlayer";

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

interface LicenseOption {
  id: string;
  name: string;
  format: string;
  price: number | "NEGOTIATE";
}

function Beaty() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();

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

  const otherBeats = beats.filter((b) => b.id !== highlightedBeat?.id);

  return (
    <div className="fade-in">
      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <img
          src="/uploads/artwork/metallic-logo.png"
          alt="VOODOO808"
          style={{ maxWidth: "800px", width: "100%" }}
        />
      </div>

      {highlightedBeat && (
        <div
          style={{
            marginBottom: "48px",
            padding: "24px",
            border: "1px solid #333",
            background: "#0a0a0a",
          }}
        >
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                alt={highlightedBeat.title}
                style={{ width: "200px", height: "200px", objectFit: "cover" }}
              />
              <button
                onClick={() => playBeat(highlightedBeat)}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  background: currentBeat?.id === highlightedBeat.id && isPlaying ? "#fff" : "rgba(0,0,0,0.7)",
                  color: currentBeat?.id === highlightedBeat.id && isPlaying ? "#000" : "#fff",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentBeat?.id === highlightedBeat.id && isPlaying ? "⏸" : "▶"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
              <div style={{ fontSize: "13px", fontFamily: "Work Sans, sans-serif", color: "#999", marginBottom: "16px" }}>
                Featured Track
              </div>
              <div style={{ fontSize: "13px", fontFamily: "Work Sans, sans-serif", color: "#666", marginBottom: "8px" }}>
                {highlightedBeat.bpm}BPM
              </div>
              <h2 style={{ fontSize: "16px", fontFamily: "Work Sans, sans-serif", fontWeight: "bold", marginBottom: "16px" }}>
                {highlightedBeat.title}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => openContractModal(highlightedBeat)}
                  style={{
                    padding: "10px 20px",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>+</span>
                  {highlightedBeat.price} CZK
                </button>
                {user && (
                  <button
                    onClick={() => toggleSave(highlightedBeat)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
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
          </div>
        </div>
      )}

      <div style={{ paddingBottom: currentBeat ? "80px" : "20px" }}>
        {otherBeats.length === 0 && !highlightedBeat ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            Zatím nejsou k dispozici žádné beaty
          </p>
        ) : (
          otherBeats.map((beat) => (
            <div
              key={beat.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #222",
                gap: "16px",
              }}
            >
              <button
                onClick={() => playBeat(beat)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "1px solid #fff",
                  background:
                    currentBeat?.id === beat.id && isPlaying ? "#fff" : "transparent",
                  color: currentBeat?.id === beat.id && isPlaying ? "#000" : "#fff",
                  flexShrink: 0,
                }}
              >
                {currentBeat?.id === beat.id && isPlaying ? "⏸" : "▶"}
              </button>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{beat.title}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {beat.artist} • {beat.bpm} BPM • {beat.key}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontWeight: "bold" }}>{beat.price} CZK</span>
                {user && (
                  <button
                    onClick={() => toggleSave(beat)}
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
                  onClick={() => openContractModal(beat)}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>+</span>
                </button>
              </div>
            </div>
          ))
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
