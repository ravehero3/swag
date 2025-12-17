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
  const audioRef = useRef<HTMLAudioElement>(null);
  const kitAudioRef = useRef<HTMLAudioElement>(null);
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

  const otherBeats = beats.filter((b) => b.id !== highlightedBeat?.id);

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

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <video
          src="/uploads/artwork/voodoo808-video.mp4"
          autoPlay
          loop
          muted
          playsInline
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
            borderRadius: "4px",
          }}
        >
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                alt={highlightedBeat.title}
                style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "4px" }}
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
                  className="btn-bounce"
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
                    borderRadius: "4px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
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

      <div style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "24px", fontWeight: "bold" }}>BEATY</h2>
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
                  className="btn-bounce"
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
                    borderRadius: "4px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>+</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ paddingBottom: currentBeat ? "80px" : "20px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "24px", fontWeight: "bold" }}>ZVUKY</h2>
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
                      className="btn btn-bounce"
                      onClick={() => handleAddKitToCart(kit)}
                      style={{ borderRadius: "4px" }}
                    >
                      {kit.is_free ? "STÁHNOUT" : "DO KOŠÍKU"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
