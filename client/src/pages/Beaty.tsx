import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useApp } from "../App.js";
import { useScrollAnimation } from "../hooks/useScrollAnimation.js";
import { useSEO } from "../hooks/useSEO.js";
import ContractModal from "../components/ContractModal.js";
import DownloadModal from "../components/DownloadModal.js";
import MusicPlayer from "../components/MusicPlayer.js";
import SoundWave from "../components/SoundWave.js";
import { preloadWaveform, seedWaveformCache } from "../lib/waveformCache.js";
import ProductsGrid from "../components/ProductsGrid.js";
import SoundKitsDock from "../components/SoundKitsDock.js";

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
  waveform_data?: number[];
  play_count?: number;
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
  const [beatsLoading, setBeatsLoading] = useState(true);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [poppingHearts, setPoppingHearts] = useState<Set<number>>(new Set());
  const [beatPlayCounts, setBeatPlayCounts] = useState<Record<number, number>>({});
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const [downloadingBeat, setDownloadingBeat] = useState<Beat | null>(null);

  const downloadPreview = async (beat: Beat) => {
    if (!beat.preview_url) return;
    try {
      const response = await fetch(beat.preview_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${beat.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = beat.preview_url;
      a.download = `${beat.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  const [sortBy, setSortBy] = useState<"bpm" | "key" | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [beatStats, setBeatStats] = useState<{ comments: number; saves: number } | null>(null);
  const [authNudge, setAuthNudge] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [isDraggingComment, setIsDraggingComment] = useState(false);
  const [draggingCommentId, setDraggingCommentId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const beatsListRef = useScrollAnimation();
  const soundKitsRef = useScrollAnimation();
  const { user, addToCart, settings, refreshSavedCount } = useApp() as any;
  useSEO("beaty");

  // Determine if we're on home page or beaty page
  const isHomePage = false;
  const beatLimit = undefined;

  // Parse URL parameters on mount and when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tagParam = searchParams.get("tag");
    
    if (tagParam) {
      setSelectedTag(tagParam);
    } else {
      setSelectedTag(null);
    }
  }, [location]);

  useEffect(() => {
    let url = "/api/beats";
    const params = new URLSearchParams();
    if (selectedTag) params.append("tag", selectedTag);
    if (params.toString()) url += "?" + params.toString();
    
    setBeatsLoading(true);

    Promise.all([
      fetch(url).then((res) => res.json()).catch(() => []),
      fetch("/api/beats/highlighted").then((res) => res.json()).catch(() => null),
    ]).then(([beatsData, highlightedData]) => {
      if (Array.isArray(beatsData)) {
        setBeats(beatsData);
        const counts: Record<number, number> = {};
        beatsData.forEach((b: Beat) => { counts[b.id] = b.play_count ?? 0; });
        if (highlightedData && !highlightedData.error) counts[highlightedData.id] = highlightedData.play_count ?? 0;
        setBeatPlayCounts(counts);
      }
      if (highlightedData && !highlightedData.error) setHighlightedBeat(highlightedData);
      setBeatsLoading(false);

      const allBeats = [
        ...(highlightedData && !highlightedData.error ? [highlightedData] : []),
        ...(Array.isArray(beatsData) ? beatsData : []),
      ];
      allBeats.forEach((beat, i) => {
        if (!beat.preview_url) return;
        if (beat.waveform_data && Array.isArray(beat.waveform_data)) {
          seedWaveformCache(beat.preview_url, beat.waveform_data);
        } else {
          setTimeout(() => preloadWaveform(beat.preview_url, beat.id), i * 120);
        }
      });
    });
  }, [selectedTag]);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowTitle(scrollPosition > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (currentBeat) {
        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else {
          audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      } else {
        const allBeats = highlightedBeat
          ? [highlightedBeat, ...beats.filter((b) => b.id !== highlightedBeat.id)]
          : beats;
        if (allBeats.length > 0) playBeat(allBeats[0]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentBeat, isPlaying, beats, highlightedBeat]);

  useEffect(() => {
    if (!currentBeat) return;
    const id = currentBeat.id;
    setComments([]);
    setBeatStats(null);
    Promise.all([
      fetch(`/api/beats/${id}/comments`).then(r => r.ok ? r.json() : []),
      fetch(`/api/beats/${id}/stats`).then(r => r.ok ? r.json() : null),
    ]).then(([commentsData, statsData]) => {
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setBeatStats(statsData);
    }).catch(console.error);
  }, [currentBeat?.id]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentBeat || !user) return;
    setSubmittingComment(true);
    const timeOffset = (audioRef.current?.duration && audioRef.current.duration > 0)
      ? audioRef.current.currentTime / audioRef.current.duration
      : 0;
    try {
      const res = await fetch(`/api/beats/${currentBeat.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: commentText.trim(), time_offset: timeOffset }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data, ...prev]);
        setCommentText("");
        setBeatStats(prev => prev ? { ...prev, comments: prev.comments + 1 } : prev);
      }
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!currentBeat) return;
    try {
      const res = await fetch(`/api/beats/${currentBeat.id}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setBeatStats(prev => prev ? { ...prev, comments: prev.comments - 1 } : prev);
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleCommentDragStart = (e: { preventDefault: () => void; stopPropagation: () => void }, comment: any) => {
    if (comment.user_id !== user?.id) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingComment(true);
    setDraggingCommentId(comment.id);
  };

  useEffect(() => {
    if (!isDraggingComment || draggingCommentId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = waveContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newOffset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setComments(prev => prev.map(c =>
        c.id === draggingCommentId ? { ...c, time_offset: newOffset } : c
      ));
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const container = waveContainerRef.current;
      let newOffset = 0;
      if (container) {
        const rect = container.getBoundingClientRect();
        newOffset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      }
      setIsDraggingComment(false);
      const commentId = draggingCommentId;
      setDraggingCommentId(null);
      if (!currentBeat) return;
      try {
        await fetch(`/api/beats/${currentBeat.id}/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ time_offset: newOffset }),
        });
      } catch (err) {
        console.error("Failed to update comment position:", err);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingComment, draggingCommentId, currentBeat?.id]);

  const playBeat = async (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (err) {
          console.error("Audio resume failed:", err);
          setIsPlaying(false);
        }
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;

      const src = beat.preview_url || "";
      if (!src) {
        console.error("Beat has no preview_url:", beat.title);
        return;
      }

      setCurrentBeat(beat);
      audio.src = src;
      audio.load();

      fetch(`/api/beats/${beat.id}/play`, { method: "POST" })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.play_count !== undefined) setBeatPlayCounts(prev => ({ ...prev, [beat.id]: data.play_count })); })
        .catch(() => {});

      try {
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve();
          };
          const onError = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            reject(new Error(`Failed to load audio: ${src}`));
          };
          audio.addEventListener("canplay", onCanPlay, { once: true });
          audio.addEventListener("error", onError, { once: true });
          // Timeout fallback — try playing anyway after 3s
          setTimeout(() => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve();
          }, 3000);
        });
        audio.volume = Math.max(0.01, audio.volume || 0.8);
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Audio play failed:", err, "| src:", src);
        setIsPlaying(false);
      }
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
        licenseTypeId: license.id ? Number(license.id) : null,
      });
    }
  };

  const toggleSave = async (beat: Beat) => {
    if (!user) {
      setAuthNudge(true);
      setTimeout(() => setAuthNudge(false), 2500);
      return;
    }

    const wasSaved = savedBeats.has(beat.id);

    // Optimistic update — show change instantly
    setSavedBeats((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(beat.id);
      else next.add(beat.id);
      return next;
    });

    // Trigger pop animation
    setPoppingHearts((prev) => new Set([...prev, beat.id]));
    setTimeout(() => {
      setPoppingHearts((prev) => {
        const next = new Set(prev);
        next.delete(beat.id);
        return next;
      });
    }, 400);

    try {
      if (wasSaved) {
        const res = await fetch(`/api/saved/beat/${beat.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          // Revert on failure
          setSavedBeats((prev) => new Set([...prev, beat.id]));
        } else {
          refreshSavedCount();
        }
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ itemId: beat.id, itemType: "beat" }),
        });
        if (!res.ok) {
          // Revert on failure
          setSavedBeats((prev) => {
            const next = new Set(prev);
            next.delete(beat.id);
            return next;
          });
        } else {
          refreshSavedCount();
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      // Revert on error
      setSavedBeats((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(beat.id);
        else next.delete(beat.id);
        return next;
      });
    }
  };

  const filteredBeats = beatLimit ? beats.slice(0, beatLimit) : beats;
  const otherBeats = filteredBeats.filter((b) => b.id !== highlightedBeat?.id);

  if (beatsLoading) {
    return (
      <div style={{ background: "#000", minHeight: "100vh" }} />
    );
  }

  if (beats.length === 0 && !highlightedBeat) {
    return (
      <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="fade-in" style={{ textAlign: "center", padding: "100px 20px" }}>
          <p style={{ opacity: 0.6, fontSize: "14px", letterSpacing: "1px" }}>Žádné beaty nebyly nalezeny.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.5); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.35s ease-out forwards; }
        @media (max-width: 768px) {
          .beat-row { gap: 8px !important; padding: 6px 8px !important; }
          .beat-title-col {
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            flex: 1 !important;
            margin-right: 0 !important;
          }
          .beat-title-col-text { font-size: 14px !important; }
          .beat-row-actions { margin-right: 4px !important; gap: 4px !important; }
          .beat-buy-btn { min-width: 70px !important; padding: 8px 4px 8px 8px !important; margin-left: 0 !important; }
          .beat-buy-price { padding-right: 4px !important; }
        }
      `}</style>
      {authNudge && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(30,30,30,0.95)", border: "1px solid #333", color: "#aaa",
          padding: "10px 20px", borderRadius: "20px", fontSize: "13px", zIndex: 1000,
          backdropFilter: "blur(8px)", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          Přihlaste se pro ukládání oblíbených
        </div>
      )}

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          console.error("Audio error: failed to load", audioRef.current?.src);
          setIsPlaying(false);
        }}
      />

      <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-42px", marginBottom: "32px", overflow: "hidden", position: "relative", background: "#000", minHeight: "600px" }}>
        <video
          key={settings?.beaty_video}
          src={settings?.beaty_video || "/uploads/beaty-video.mov"}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#000" }}
        >
          Your browser does not support the video tag.
        </video>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "166px",
            background: "linear-gradient(to bottom, rgba(13, 13, 13, 0) 0%, rgba(13, 13, 13, 1) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
      
      <div style={{ padding: "0 20px" }} className="fade-in-grid">
        {highlightedBeat && (
          <div className="fade-in-section delay-2" style={{ marginBottom: "48px", display: "flex", justifyContent: "center", marginTop: "-116px", position: "relative", zIndex: 50 }}>
            <div style={{ display: "flex", gap: "48px", alignItems: "flex-start", marginBottom: "32px", width: "1000px", position: "relative", zIndex: 50 }}>
              <div style={{ position: "relative", flexShrink: 0 }} className="highlight-artwork-container">
                <style>{`
                  @keyframes hacPlayPulse {
                    0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.28), 0 8px 32px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.15); }
                    50% { box-shadow: 0 0 0 1px rgba(255,255,255,0.45), 0 8px 40px rgba(0,0,0,0.5), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.15); }
                  }
                  .hac-play-overlay {
                    position: absolute; top: 50%; left: 50%;
                    width: 66px; height: 66px; border-radius: 50%; border: none;
                    background: transparent; backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.14);
                    color: #fff; font-size: 20px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    z-index: 4;
                    opacity: 0; transform: translate(-50%, -50%) scale(0.82);
                    transition: opacity 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
                  }
                  .highlight-artwork-container:hover .hac-play-overlay {
                    opacity: 1; transform: translate(-50%, -50%) scale(1);
                  }
                  .hac-play-overlay:hover { transform: translate(-50%, -50%) scale(1.1) !important; }
                  .hac-play-overlay:active { transform: translate(-50%, -50%) scale(0.93) !important; }
                  .hac-play-overlay.is-playing { animation: hacPlayPulse 2s ease-in-out infinite; }
                  .hac-blur-ring {
                    position: absolute; top: 50%; left: 50%;
                    width: 66px; height: 66px; border-radius: 50%;
                    transform: translate(-50%, -50%) scale(0.82); pointer-events: none;
                    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
                    -webkit-mask-image: radial-gradient(circle at center, transparent 0%, transparent 28%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 60%, black 78%, black 100%);
                    mask-image: radial-gradient(circle at center, transparent 0%, transparent 28%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 60%, black 78%, black 100%);
                    opacity: 0; z-index: 3;
                    transition: opacity 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
                  }
                  .highlight-artwork-container:hover .hac-blur-ring {
                    opacity: 1; transform: translate(-50%, -50%) scale(1);
                  }
                  @media (max-width: 768px) {
                    .hac-play-overlay { opacity: 1 !important; transform: translate(-50%, -50%) scale(1) !important; }
                    .hac-blur-ring { opacity: 1 !important; transform: translate(-50%, -50%) scale(1) !important; }
                  }
                `}</style>
                <img
                  src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={highlightedBeat.title}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  style={{ width: "200px", height: "200px", objectFit: "cover", border: "1px solid #666", borderRadius: "4px", display: "block" }}
                />
                <div className="hac-blur-ring" />
                <button
                  onClick={() => playBeat(highlightedBeat)}
                  className={`hac-play-overlay${currentBeat?.id === highlightedBeat.id && isPlaying ? " is-playing" : ""}`}
                  style={{ paddingLeft: currentBeat?.id === highlightedBeat.id && isPlaying ? "0" : "3px" }}
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
                    {highlightedBeat.bpm}BPM{highlightedBeat.key ? ` - ${highlightedBeat.key}` : ""}
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
                      onClick={() => downloadPreview(highlightedBeat)}
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
                      <div className="desktop-only" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {highlightedBeat.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: "3px 8px",
                              background: "#111111",
                              color: "#666",
                              border: "1px solid #333",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                              whiteSpace: "nowrap",
                              userSelect: "none",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => toggleSave(highlightedBeat)}
                  className="heart-btn"
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
                    className={poppingHearts.has(highlightedBeat.id) ? "heart-pop" : ""}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={savedBeats.has(highlightedBeat.id) ? "#fff" : "none"}
                    stroke="#fff"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {currentBeat && (
          <>
            {comments.length > 0 && (
              <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px 6px 16px", display: "flex", alignItems: "center", gap: "0" }}>
                {comments.slice(0, 10).map((c: any, i: number) => (
                  <div
                    key={c.id}
                    className="comment-avatar-wrap"
                    style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: 10 - i }}
                  >
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#1a1a1a", border: "1.5px solid #333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#666", overflow: "hidden", cursor: "pointer" }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "10px", color: "#888" }}>{(c.username || c.email)?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div className="comment-tooltip" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "#ccc", whiteSpace: "nowrap", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                      <span style={{ color: "#555", marginRight: "6px" }}>{c.username || c.email?.split("@")[0]}</span>
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <SoundWave
              audioRef={audioRef}
              isPlaying={isPlaying}
              audioUrl={currentBeat.preview_url}
              isDraggingComment={isDraggingComment}
              waveRef={waveContainerRef}
            >
              {comments.map((c: any) => {
                const isOwn = c.user_id === user?.id;
                const offset = typeof c.time_offset === 'number' ? c.time_offset : 0;
                return (
                  <div
                    key={c.id}
                    style={{
                      position: "absolute",
                      left: `${offset * 100}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: draggingCommentId === c.id ? 200 : 50,
                      pointerEvents: "all",
                      userSelect: "none",
                    }}
                    onMouseDown={isOwn ? (e) => { e.stopPropagation(); handleCommentDragStart(e, c); } : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="waveform-comment-avatar" style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#1a1a1a",
                      border: `1.5px solid ${isOwn ? '#888' : '#444'}`,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      color: "#888",
                      cursor: isOwn ? (draggingCommentId === c.id ? "grabbing" : "grab") : "default",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.7)",
                    }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{(c.username || c.email)?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </SoundWave>
          </>
        )}

        {currentBeat && isPlaying && (
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px", marginTop: "8px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              {beatStats && (
                <>
                  <span data-testid="text-beat-saves" style={{ fontSize: "12px", color: "#555", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#555" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    {beatStats.saves}
                  </span>
                  <span data-testid="text-beat-comments" style={{ fontSize: "12px", color: "#555", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#555" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    {beatStats.comments}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCommentSubmit(); }}
                placeholder={user ? "Napište komentář..." : "Pro komentáře se přihlaste"}
                disabled={!user || submittingComment}
                data-testid="input-beat-comment"
                style={{ flex: 1, padding: "8px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", color: "#fff", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
              />
              {user && (
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || submittingComment}
                  data-testid="button-submit-comment"
                  style={{ padding: "8px 16px", background: commentText.trim() ? "#fff" : "#222", color: commentText.trim() ? "#000" : "#555", border: "none", borderRadius: "20px", fontSize: "13px", cursor: commentText.trim() ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.2s" }}
                >
                  {submittingComment ? "..." : "Odeslat"}
                </button>
              )}
            </div>
            {comments.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                {comments.map((c: any) => (
                  <div
                    key={c.id}
                    data-testid={`comment-item-${c.id}`}
                    style={{ position: "relative", display: "inline-flex", gap: "6px", alignItems: "center", background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "4px 10px 4px 6px" }}
                    onMouseEnter={() => setHoveredCommentId(c.id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                  >
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#222", border: "1px solid #333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#666", overflow: "hidden" }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (c.username || c.email)?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div style={{ maxWidth: "220px", overflow: "hidden" }}>
                      <span style={{ fontSize: "11px", color: "#555", marginRight: "6px" }}>{c.username || c.email?.split("@")[0]}</span>
                      <span style={{ fontSize: "12px", color: "#bbb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.text}</span>
                    </div>
                    {c.user_id === user?.id && hoveredCommentId === c.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        data-testid={`button-delete-comment-${c.id}`}
                        style={{ position: "absolute", top: "-6px", right: "-6px", width: "16px", height: "16px", borderRadius: "50%", background: "#333", border: "1px solid #555", color: "#aaa", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={beatsListRef} className="scroll-fade-section" style={{ marginBottom: "48px", maxWidth: "1200px", margin: "0 auto", marginTop: "60px" }}>
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
                    background: "#111111",
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
                {/* matches the mobile-hide heart button wrapper in each row */}
                <div className="mobile-hide" style={{ width: "28px", flexShrink: 0, marginRight: "-4px" }} />
                {/* matches artwork image */}
                <div style={{ width: "48px", flexShrink: 0 }} />
                {/* NÁZEV — matches title column */}
                <div className="beat-title-col" style={{ width: "240px", minWidth: "240px", maxWidth: "240px", flexShrink: 0, marginRight: "12px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666" }}>NÁZEV</div>
                <div style={{ position: "absolute", bottom: 0, left: "80px", right: "16px", height: "1px", background: "#333" }} />
                {/* BPM — matches beat bpm column */}
                <div className="desktop-only" style={{ width: "100px", flexShrink: 0 }}><button onClick={() => { setSortBy("bpm"); setSortAsc(sortBy === "bpm" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>BPM {sortBy === "bpm" && (sortAsc ? "↑" : "↓")}</button></div>
                {/* KEY — matches beat key column */}
                <div className="desktop-only" style={{ width: "100px", flexShrink: 0 }}><button onClick={() => { setSortBy("key"); setSortAsc(sortBy === "key" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>KEY {sortBy === "key" && (sortAsc ? "↑" : "↓")}</button></div>
              </div>
              {(sortBy && sortBy === "bpm" ? [...otherBeats].sort((a, b) => sortAsc ? a.bpm - b.bpm : b.bpm - a.bpm) : sortBy && sortBy === "key" ? [...otherBeats].sort((a, b) => sortAsc ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)) : otherBeats).map((beat) => (
            <div
              key={beat.id}
              className="beat-row"
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
                target.style.boxShadow = "none";
                target.style.borderTop = "1px solid #1189ff";
                target.style.borderLeft = "1px solid #1189ff";
                target.style.borderRight = "1px solid #1189ff";
                target.style.borderBottom = "1px solid #1189ff";
                const separator = target.querySelector('[data-separator]') as HTMLElement;
                if (separator) separator.style.opacity = "0";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.boxShadow = "none";
                target.style.borderTop = "1px solid transparent";
                target.style.borderLeft = "1px solid transparent";
                target.style.borderRight = "1px solid transparent";
                target.style.borderBottom = "1px solid transparent";
                const separator = target.querySelector('[data-separator]') as HTMLElement;
                if (separator) separator.style.opacity = "1";
              }}
            >
              <div data-separator style={{ position: "absolute", bottom: 0, left: "80px", right: "16px", height: "1px", background: "#333", opacity: 1, transition: "opacity 0.15s ease" }} />
              <div className="mobile-hide" style={{ position: "relative", display: "flex", alignItems: "center", gap: "6px", marginRight: "-4px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(beat);
                  }}
                  className="heart-btn"
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
                    className={poppingHearts.has(beat.id) ? "heart-pop" : ""}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={user && savedBeats.has(beat.id) ? "#fff" : "none"}
                    stroke={user && savedBeats.has(beat.id) ? "#fff" : "#666"}
                    strokeWidth="1"
                    style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                {currentBeat?.id === beat.id && (
                  <span style={{ fontSize: "10px", color: "#555", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", minWidth: "20px", letterSpacing: "0.02em", transition: "color 0.2s" }}>
                    {(beatPlayCounts[beat.id] ?? 0).toLocaleString()}
                  </span>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                <img
                  src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={beat.title}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }}
                />
              </div>
              <div className="beat-title-col" style={{ width: "240px", minWidth: "240px", maxWidth: "240px", flexShrink: 0, marginRight: "12px", display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" }}>
                <div className="beat-title-col-text" style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{beat.title}</div>
                <div className="mobile-only-flex" style={{ display: "none", gap: "8px", alignItems: "center" }}>
                  {beat.bpm && <span style={{ fontSize: "11px", color: "#666", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{beat.bpm} BPM</span>}
                  {beat.bpm && beat.key && <span style={{ fontSize: "11px", color: "#444" }}>·</span>}
                  {beat.key && <span style={{ fontSize: "11px", color: "#666", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{beat.key}</span>}
                </div>
              </div>
              <div className="desktop-only" style={{ width: "100px", flexShrink: 0, fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", textAlign: "left" }}>
                {beat.bpm}
              </div>
              <div className="desktop-only" style={{ width: "100px", flexShrink: 0, fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", textAlign: "left" }}>
                {beat.key}
              </div>

              {beat.tags && beat.tags.length > 0 && (
                <div className="desktop-only" onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginLeft: "12px", alignItems: "center", cursor: "default" }}>
                  {beat.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "3px 8px",
                        background: "#111111",
                        color: "#666",
                        border: "1px solid #333",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        cursor: "default",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="beat-row-actions" style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", marginRight: "16px" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(beat);
                    }}
                    className="mobile-only heart-btn"
                    style={{
                      display: "none",
                      background: "#111111",
                      border: "1px solid #333",
                      cursor: "pointer",
                      padding: "6px",
                      color: savedBeats.has(beat.id) ? "#fff" : "#666",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "2px",
                    }}
                    title={savedBeats.has(beat.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg
                      className={poppingHearts.has(beat.id) ? "heart-pop" : ""}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={savedBeats.has(beat.id) ? "#fff" : "none"}
                      stroke={savedBeats.has(beat.id) ? "#fff" : "#666"}
                      strokeWidth="2"
                      style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPreview(beat);
                    }}
                    style={{
                      background: "#111111",
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
                    title="Download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>

                <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {user && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(beat);
                      }}
                      className="heart-btn"
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
                        className={poppingHearts.has(beat.id) ? "heart-pop" : ""}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={savedBeats.has(beat.id) ? "#fff" : "none"}
                        stroke={savedBeats.has(beat.id) ? "#fff" : "#888"}
                        strokeWidth="2"
                        style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPreview(beat);
                    }}
                    style={{
                      background: "#111111",
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
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: "#111111",
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
                  className="btn-bounce beat-buy-btn"
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
                  <span className="beat-buy-price" style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{Math.floor(beat.price)} CZK</span>
                </button>
              </div>
            </div>
            ))}
            </>
          )}
          
          <div className="fade-in-section delay-3" style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", marginBottom: "32px", marginLeft: "568px", position: "relative", zIndex: 9999, alignItems: "center", pointerEvents: "auto" }}>
              <button
                data-testid="button-listen-more-beats"
                onClick={() => {
                  if (beatsListRef.current) {
                    beatsListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                style={{
                  padding: "8px 20px",
                  background: "rgba(13, 13, 13, 0.7)",
                  border: "0.1px solid rgba(128, 128, 128, 0.5)",
                  borderRadius: "999px",
                  color: "#777",
                  fontSize: "12px",
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: "400",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  letterSpacing: "0.5px",
                  position: "relative",
                  zIndex: 9999,
                  overflow: "hidden",
                  appearance: "none",
                  pointerEvents: "auto",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.transform = "scale(1.04)";
                  btn.style.background = "rgba(255, 255, 255, 0.1)";
                  btn.style.borderColor = "#fff";
                  btn.style.color = "#fff";
                  
                  // Remove any existing shimmer
                  const existingShimmer = btn.querySelector("div[data-shimmer-effect]");
                  if (existingShimmer) existingShimmer.remove();
                  
                  // Create shimmer effect
                  const shimmer = document.createElement("div");
                  shimmer.setAttribute("data-shimmer-effect", "true");
                  shimmer.style.position = "absolute";
                  shimmer.style.top = "0";
                  shimmer.style.left = "-100%";
                  shimmer.style.width = "100%";
                  shimmer.style.height = "100%";
                  shimmer.style.background = "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)";
                  shimmer.style.animation = "shimmerSlide 0.5s ease-in-out forwards";
                  shimmer.style.pointerEvents = "none";
                  shimmer.style.borderRadius = "999px";
                  
                  btn.appendChild(shimmer);
                  
                  // Add keyframe animation if not already present
                  if (!document.querySelector('style[data-shimmer]')) {
                    const style = document.createElement("style");
                    style.setAttribute("data-shimmer", "true");
                    style.textContent = `
                      @keyframes shimmerSlide {
                        0% { left: -100%; }
                        100% { left: 100%; }
                      }
                      @keyframes shimmerSlideReverse {
                        0% { left: 100%; }
                        100% { left: -100%; }
                      }
                    `;
                    document.head.appendChild(style);
                  }
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.transform = "scale(1)";
                  btn.style.background = "rgba(13, 13, 13, 0.7)";
                  btn.style.borderColor = "rgba(128, 128, 128, 0.5)";
                  btn.style.color = "#777";
                  
                  // Reverse the shimmer animation
                  const shimmer = btn.querySelector("div[data-shimmer-effect]");
                  if (shimmer) {
                    (shimmer as HTMLElement).style.animation = "shimmerSlideReverse 0.5s ease-in-out forwards";
                    setTimeout(() => shimmer.remove(), 500);
                  }
                }}
              >
                Poslechnout další beaty
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="5 12 19 12"></polyline>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
          </div>
        </div>

        {isHomePage && (
          <>
            <div ref={soundKitsRef} className="fade-in-section delay-4 scroll-fade-section" style={{ marginTop: "0px", marginBottom: "0px" }}>
            {/* Background with computer image and dock */}
            <div style={{
              width: "100vw",
              marginLeft: "calc(-50vw + 50%)",
              overflow: "hidden",
              position: "relative",
              background: "#000",
            }}>
              <img
                src="/uploads/zvuky-computer-background.jpg"
                alt="Computer with sound kits"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "100px",
                  background: "linear-gradient(to bottom, rgba(13, 13, 13, 0) 0%, rgba(13, 13, 13, 0.8) 100%)",
                  pointerEvents: "none",
                }}
              />
              

              {/* Dock positioned at bottom */}
              <div style={{
                position: "absolute",
                bottom: "-4px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                zIndex: 10,
                overflow: "visible", // Added to ensure children aren't clipped
              }}>
                <SoundKitsDock
                  items={testSoundKits.map((kit) => ({
                    id: kit.id,
                    name: kit.title,
                    image: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
                    price: kit.price,
                    isFree: kit.is_free,
                    onClick: () => {
                      setLocation("/zvuky");
                    },
                  }))}
                />
              </div>
            </div>
          </div>
          </>
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
        isSaved={currentBeat ? savedBeats.has(currentBeat.id) : false}
        onToggleSave={() => currentBeat && toggleSave(currentBeat)}
      />
    </div>
  );
}

export default Beaty;
