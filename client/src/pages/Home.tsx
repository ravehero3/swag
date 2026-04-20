import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App.js";
import { useScrollAnimation } from "../hooks/useScrollAnimation.js";
import { useSEO } from "../hooks/useSEO.js";
import ContractModal from "../components/ContractModal.js";
import SoundWave from "../components/SoundWave.js";
import SoundKitsDock from "../components/SoundKitsDock.js";
import ShareModal from "../components/ShareModal.js";

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


function Home() {
  const [location, setLocation] = useLocation();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [beatsLoading, setBeatsLoading] = useState(true);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const [poppingHearts, setPoppingHearts] = useState<Set<number>>(new Set());
  const [contractModalBeat, setContractModalBeat] = useState<Beat | null>(null);
  const [sortBy, setSortBy] = useState<"bpm" | "key" | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [beatStats, setBeatStats] = useState<{ comments: number; saves: number; plays: number } | null>(null);
  const [shareBeat, setShareBeat] = useState<Beat | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [draggingComment, setDraggingComment] = useState<{ id: number; xPct: number } | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const waveRef = useRef<HTMLDivElement>(null);
  const commentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggeredCommentRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const beatsListRef = useScrollAnimation();
  const soundKitsRef = useScrollAnimation();
  const { user, setUser, addToCart, settings, refreshSavedCount, previewPlayer } = useApp() as any;
  const audioRef = previewPlayer.audioRef;
  const isPlaying = previewPlayer.isPlaying;
  const isLooping = previewPlayer.isLooping;
  const isShuffling = previewPlayer.isShuffling;
  useSEO("home");

  // Determine if we're on home page or beaty page
  const isHomePage = location === "/" || location === "";
  const beatLimit = isHomePage ? 10 : undefined;

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
      if (Array.isArray(beatsData)) setBeats(beatsData);
      if (highlightedData && !highlightedData.error) setHighlightedBeat(highlightedData);
      setBeatsLoading(false);
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
    const globalItem = previewPlayer.currentItem;
    if (!globalItem || globalItem.product_type !== "beat") {
      return;
    }
    const found = beats.find(b => b.id === globalItem.id) ?? highlightedBeat ?? null;
    setCurrentBeat(prev => {
      if (prev?.id === globalItem.id) return prev;
      return found;
    });
  }, [previewPlayer.currentItem]);

  useEffect(() => {
    if (!currentBeat) return;
    const isSaved = savedBeats.has(currentBeat.id);
    previewPlayer.setPreviewMeta(isSaved, () => {
      toggleSave(currentBeat);
    });
  }, [currentBeat, savedBeats]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowTitle(scrollPosition > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
    const onLoaded = () => setAudioDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    if (audio.duration) setAudioDuration(audio.duration);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [currentBeat]);

  useEffect(() => {
    if (audioDuration <= 0 || comments.length === 0) return;
    const TRIGGER_WINDOW = 0.5;
    const triggered = comments.find((c: any) => {
      const t = parseFloat(c.time_offset) || 0;
      return audioCurrentTime >= t && audioCurrentTime < t + TRIGGER_WINDOW;
    });
    if (triggered && triggered.id !== lastTriggeredCommentRef.current) {
      if (commentTimerRef.current) clearTimeout(commentTimerRef.current);
      lastTriggeredCommentRef.current = triggered.id;
      setActiveCommentId(triggered.id);
      commentTimerRef.current = setTimeout(() => {
        setActiveCommentId(null);
        lastTriggeredCommentRef.current = null;
      }, 10000);
    }
  }, [audioCurrentTime, comments, audioDuration]);

  useEffect(() => {
    lastTriggeredCommentRef.current = null;
    if (commentTimerRef.current) clearTimeout(commentTimerRef.current);
    setActiveCommentId(null);
  }, [currentBeat?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, [settings?.home_video]);

  useEffect(() => {
    if (!draggingComment) return;
    const onMove = (e: MouseEvent) => {
      const rect = waveRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xPct = Math.max(1, Math.min(98, (e.clientX - rect.left) / rect.width * 100));
      setDraggingComment(prev => prev ? { ...prev, xPct } : null);
    };
    const onUp = async (e: MouseEvent) => {
      if (!currentBeat) return;
      const rect = waveRef.current?.getBoundingClientRect();
      const finalXPct = rect
        ? Math.max(1, Math.min(98, (e.clientX - rect.left) / rect.width * 100))
        : draggingComment.xPct;
      const newOffset = finalXPct / 100 * audioDuration;
      const id = draggingComment.id;
      setDraggingComment(null);
      setComments(prev => prev.map(c => c.id === id ? { ...c, time_offset: newOffset } : c));
      await fetch(`/api/beats/${currentBeat.id}/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ time_offset: newOffset }),
      });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [draggingComment, currentBeat, audioDuration]);

  const handleSaveUsername = async () => {
    if (!usernameInput.trim() || !user) return;
    setSavingUsername(true);
    try {
      const res = await fetch("/api/auth/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, username: data.username });
        setUsernameInput("");
      }
    } finally {
      setSavingUsername(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentBeat || !user) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/beats/${currentBeat.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: commentText.trim(), time_offset: audioRef.current?.currentTime || 0 }),
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

  const getBeatsQueue = () => {
    const allBeats = highlightedBeat
      ? [highlightedBeat, ...beats.filter(b => b.id !== highlightedBeat.id)]
      : beats;
    return allBeats.map(b => ({
      id: b.id,
      title: b.title,
      price: b.price,
      preview_url: b.preview_url || "",
      artwork_url: b.artwork_url || "",
      product_type: "beat" as const,
    }));
  };

  const playBeat = async (beat: Beat) => {
    const item = {
      id: beat.id,
      title: beat.title,
      price: beat.price,
      preview_url: beat.preview_url || "",
      artwork_url: beat.artwork_url || "",
      product_type: "beat" as const,
    };
    setCurrentBeat(beat);
    await previewPlayer.playPreview(item, getBeatsQueue());
    fetch(`/api/beats/${beat.id}/play`, { method: "POST" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.play_count != null) {
          setBeatStats(prev => prev ? { ...prev, plays: data.play_count } : prev);
        }
      })
      .catch(() => {});
  };

  const handlePlayPause = () => {
    previewPlayer.handlePlayPause();
  };

  const handlePrevious = () => {
    previewPlayer.handlePrevious();
  };

  const handleNext = () => {
    previewPlayer.handleNext();
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

  const downloadPreview = async (beat: Beat) => {
    if (!beat.preview_url) return;
    try {
      const response = await fetch(beat.preview_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${beat.title} (VOODOO808.COM).mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = beat.preview_url;
      a.download = `${beat.title} (VOODOO808.COM).mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleSave = async (beat: Beat) => {
    if (!user) return;

    const wasSaved = savedBeats.has(beat.id);

    // Optimistic update — show change instantly
    setSavedBeats((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(beat.id);
      else next.add(beat.id);
      return next;
    });

    // Optimistically update beatStats saves counter for the current beat
    if (currentBeat?.id === beat.id) {
      setBeatStats((prev) => prev ? { ...prev, saves: Math.max(0, prev.saves + (wasSaved ? -1 : 1)) } : prev);
    }

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
          setSavedBeats((prev) => new Set([...prev, beat.id]));
          if (currentBeat?.id === beat.id) {
            setBeatStats((prev) => prev ? { ...prev, saves: prev.saves + 1 } : prev);
          }
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
          setSavedBeats((prev) => {
            const next = new Set(prev);
            next.delete(beat.id);
            return next;
          });
          if (currentBeat?.id === beat.id) {
            setBeatStats((prev) => prev ? { ...prev, saves: Math.max(0, prev.saves - 1) } : prev);
          }
        } else {
          refreshSavedCount();
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setSavedBeats((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(beat.id);
        else next.delete(beat.id);
        return next;
      });
      if (currentBeat?.id === beat.id) {
        setBeatStats((prev) => prev ? { ...prev, saves: prev.saves + (wasSaved ? 1 : -1) } : prev);
      }
    }
  };

  const filteredBeats = beatLimit ? beats.slice(0, beatLimit) : beats;
  const displayedHighlight = currentBeat ?? highlightedBeat;
  const otherBeats = (() => {
    const base = filteredBeats.filter((b) => b.id !== displayedHighlight?.id);
    if (currentBeat && highlightedBeat && currentBeat.id !== highlightedBeat.id) {
      return [highlightedBeat, ...base.filter(b => b.id !== highlightedBeat.id)];
    }
    return base;
  })();

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
        .comment-avatar-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
        .comment-avatar-wrap > div:first-child { transition: transform 0.2s ease; }
        .comment-avatar-wrap:hover { z-index: 999 !important; }
        .comment-avatar-wrap:hover > div:first-child { transform: scale(2); }
        .comment-avatar-wrap .comment-tooltip { opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
        .comment-avatar-wrap:hover .comment-tooltip { opacity: 1 !important; }
        @media (max-width: 768px) {
          .mobile-hide-dock { display: none !important; }
          .mobile-video-container { min-height: 320px !important; max-height: 60vh; }
          .mobile-only-video-section { display: block !important; }
          .desktop-main-video { display: none !important; }
          .mobile-hide { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .mobile-only-flex { display: flex !important; }
          .home-featured-section { margin-top: -72px !important; margin-bottom: 32px !important; }
          .home-featured-inner { width: 100% !important; flex-direction: column !important; gap: 16px !important; align-items: stretch !important; margin-bottom: 16px !important; }
          .home-featured-artwork { width: min(72vw, 280px) !important; margin: 0 auto !important; }
          .home-featured-artwork img { width: 100% !important; height: auto !important; aspect-ratio: 1 / 1 !important; }
          .home-featured-info { width: 100% !important; min-width: 0 !important; }
          .home-featured-info h2 { font-size: 24px !important; max-width: 100% !important; overflow-wrap: anywhere !important; }
          .home-featured-actions { flex-wrap: wrap !important; gap: 8px !important; }
          .home-beats-list { margin-top: 32px !important; margin-bottom: 36px !important; }
          .home-beat-list-header { padding: 8px 8px 6px 8px !important; gap: 10px !important; margin-top: 0 !important; }
          .home-beat-header-title { width: auto !important; flex: 1 !important; min-width: 0 !important; margin-right: 0 !important; }
          .home-beat-header-separator { left: 64px !important; right: 8px !important; }
          .home-beat-row { min-height: 64px !important; padding: 8px !important; gap: 10px !important; align-items: center !important; }
          .home-beat-row-separator { left: 64px !important; right: 8px !important; }
          .home-beat-artwork img { width: 44px !important; height: 44px !important; }
          .home-beat-title-col { width: auto !important; flex: 1 1 auto !important; min-width: 0 !important; max-width: none !important; margin-right: 0 !important; gap: 3px !important; overflow: hidden !important; }
          .home-beat-title-col > div:first-child { font-size: 13px !important; line-height: 1.2 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 100% !important; }
          .home-beat-row-actions { margin-left: 4px !important; margin-right: 0 !important; gap: 4px !important; flex-shrink: 0 !important; }
          .home-beat-dl-btn, .home-beat-share-btn { display: flex !important; }
          .home-beat-row-actions .mobile-only { width: 30px !important; height: 30px !important; padding: 5px !important; flex-shrink: 0 !important; }
          .home-beat-buy-btn { min-width: 0 !important; width: 32px !important; height: 32px !important; padding: 0 !important; margin-left: 0 !important; justify-content: center !important; font-size: 11px !important; overflow: hidden !important; }
          .home-beat-buy-btn > div { display: flex !important; margin-left: 0 !important; }
          .home-beat-buy-btn > div svg { margin-left: 0 !important; }
          .home-beat-buy-btn > div > span { display: none !important; }
          .home-beat-buy-btn > span { display: none !important; }
          .home-beat-header-title { width: auto !important; flex: 1 !important; }
        }
        @media (min-width: 769px) {
          .mobile-only-video-section { display: none !important; }
        }
      `}</style>

      <div className="mobile-video-container desktop-main-video" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-42px", marginBottom: "32px", overflow: "hidden", position: "relative", background: "#000", minHeight: "600px" }}>
        <video
          ref={videoRef}
          key={settings?.home_video}
          src={settings?.home_video || "/uploads/voodoo808-video.mov"}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={(e) => { (e.target as HTMLVideoElement).play().catch(() => {}); }}
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
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Mobile-only video — shown only on screens ≤768px */}
      <div className="mobile-only-video-section" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginBottom: "24px", overflow: "hidden", position: "relative", background: "#000" }}>
        <video
          src="/uploads/mobile-home-video.mov"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", display: "block", objectFit: "cover", background: "#000" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "80px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
      
      <div style={{ padding: "0 20px" }} className="fade-in-grid">
        {displayedHighlight && (
          <div className="fade-in-section delay-2 home-featured-section" style={{ marginBottom: "48px", display: "flex", justifyContent: "center", marginTop: "-116px", position: "relative", zIndex: 50 }}>
            <div className="home-featured-inner" style={{ display: "flex", gap: "48px", alignItems: "flex-start", marginBottom: "32px", width: "1000px", position: "relative", zIndex: 50 }}>
              <div style={{ position: "relative", flexShrink: 0 }} className="highlight-artwork-container home-featured-artwork">
                <style>{`
                  @keyframes hacPlayPulse {
                    0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.32), 0 8px 32px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.15); }
                    50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.50), 0 8px 40px rgba(0,0,0,0.5), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.15); }
                  }
                  .hac-play-overlay {
                    position: absolute; top: 50%; left: 50%;
                    width: 66px; height: 66px; border-radius: 50%; border: none;
                    background: transparent; backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.20);
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
                  src={displayedHighlight.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={displayedHighlight.title}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  style={{ width: "200px", height: "200px", objectFit: "cover", border: "1px solid #666", borderRadius: "4px", display: "block" }}
                />
                <div className="hac-blur-ring" />
                <button
                  onClick={() => playBeat(displayedHighlight)}
                  className={`hac-play-overlay${currentBeat?.id === displayedHighlight.id && isPlaying ? " is-playing" : ""}`}
                  style={{ paddingLeft: currentBeat?.id === displayedHighlight.id && isPlaying ? "0" : "3px" }}
                >
                  {currentBeat?.id === displayedHighlight.id && isPlaying ? "⏸" : "▶"}
                </button>
              </div>

              <div className="home-featured-info" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#999" }}>
                    {currentBeat && currentBeat.id === displayedHighlight.id && isPlaying ? "Nyní hraje" : currentBeat ? "Naposledy hrán" : "Beat týdne"}
                  </span>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#666" }}>•</span>
                  <span style={{ fontSize: "12px", fontFamily: "Work Sans, sans-serif", color: "#666" }}>
                    {displayedHighlight.bpm}BPM{displayedHighlight.key ? ` - ${displayedHighlight.key}` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <h2 style={{ fontSize: "30px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: "400", lineHeight: "1.1", position: "relative", zIndex: 10, margin: 0 }}>
                    {displayedHighlight.title}
                  </h2>
                  <div className="home-featured-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => openContractModal(displayedHighlight)}
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
                      <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>{Math.floor(displayedHighlight.price)} CZK</span>
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
                      onClick={() => setShareBeat(displayedHighlight)}
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
                    {displayedHighlight.tags && displayedHighlight.tags.length > 0 && (
                      <div className="desktop-only" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {displayedHighlight.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setLocation(`/beaty?tag=${encodeURIComponent(tag)}`)}
                            style={{
                              padding: "3px 8px",
                              background: "#111111",
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
                  onClick={() => toggleSave(displayedHighlight)}
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
                    className={poppingHearts.has(displayedHighlight.id) ? "heart-pop" : ""}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={savedBeats.has(displayedHighlight.id) ? "#fff" : "none"}
                    stroke="#fff"
                    strokeWidth="2"
                    style={{ transition: "fill 0.2s ease" }}
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
            <SoundWave audioRef={audioRef} isPlaying={isPlaying} audioUrl={currentBeat.preview_url} isDraggingComment={!!draggingComment} waveRef={waveRef}>
              {comments.slice(0, 20).map((c: any) => {
                const baseXPct = audioDuration > 0 ? Math.min(98, Math.max(1, (parseFloat(c.time_offset) || 0) / audioDuration * 100)) : 2;
                const xPct = (draggingComment && draggingComment.id === c.id) ? draggingComment.xPct : baseXPct;
                const isHovered = hoveredCommentId === c.id;
                const isActive = activeCommentId === c.id || isHovered;
                const isDragging = draggingComment?.id === c.id;
                const isOwnComment = user && c.user_id === user.id;
                return (
                  <div
                    key={c.id}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setHoveredCommentId(c.id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                    style={{ position: "absolute", left: `calc(${xPct}% - 9px)`, top: "47px", zIndex: isDragging ? 30 : 20, cursor: isOwnComment ? (isDragging ? "grabbing" : "grab") : "default", userSelect: "none" }}
                  >
                    <div
                      onMouseDown={isOwnComment ? (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = waveRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const initXPct = Math.max(1, Math.min(98, (e.clientX - rect.left) / rect.width * 100));
                        setDraggingComment({ id: c.id, xPct: initXPct });
                      } : undefined}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#1a1a1a",
                        border: isActive || isDragging ? "1.5px solid #fff" : "1.5px solid #444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        transition: "transform 0.15s ease, border-color 0.15s ease",
                        transform: isHovered || isDragging ? "scale(2.2)" : "scale(1)",
                        transformOrigin: "center center",
                      }}
                    >
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "8px", color: "#888" }}>{(c.username || c.email)?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    {isOwnComment && isHovered && !isDragging && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!currentBeat) return;
                          fetch(`/api/beats/${currentBeat.id}/comments/${c.id}`, { method: "DELETE", credentials: "include" })
                            .then(r => r.ok ? r.json() : null)
                            .then(() => {
                              setComments(prev => prev.filter(cm => cm.id !== c.id));
                              setBeatStats(prev => prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev);
                            });
                        }}
                        style={{ position: "absolute", top: "-7px", right: "-7px", width: "13px", height: "13px", background: "#2a2a2a", border: "1px solid #555", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 40, color: "#bbb", fontSize: "9px", lineHeight: 1 }}
                      >
                        ×
                      </div>
                    )}
                    {isActive && !isDragging && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "#ccc", whiteSpace: "normal", width: "max-content", maxWidth: "280px", wordBreak: "break-word", zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.6)", pointerEvents: "none", display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span style={{ color: "#555", fontSize: "10px", lineHeight: "1.2" }}>{c.username || c.email?.split("@")[0]}</span>
                        <span style={{ lineHeight: "1.4" }}>{c.text}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </SoundWave>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px", marginTop: "8px", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                <button
                  onClick={() => currentBeat && toggleSave(currentBeat)}
                  style={{ background: "none", border: "none", padding: 0, cursor: currentBeat ? "pointer" : "default", fontSize: "12px", color: currentBeat && savedBeats.has(currentBeat.id) ? "#fff" : "#777", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit", transition: "color 0.15s ease" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={currentBeat && savedBeats.has(currentBeat.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  {beatStats?.saves ?? 0}
                </button>
                <span style={{ fontSize: "12px", color: "#777", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#777" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {beatStats?.comments ?? 0}
                </span>
                <span style={{ fontSize: "12px", color: "#777", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#777" }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  {(beatStats?.plays ?? 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCommentSubmit(); }}
                  placeholder={user ? "dej koment bro…" : "Pro komentáře se přihlaste"}
                  disabled={!user || submittingComment}
                  maxLength={200}
                  style={{ flex: 1, padding: "8px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: "20px", color: "#fff", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                />
                {user && (
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || submittingComment}
                    style={{ padding: "8px 16px", background: commentText.trim() ? "#fff" : "#222", color: commentText.trim() ? "#000" : "#555", border: "none", borderRadius: "20px", fontSize: "13px", cursor: commentText.trim() ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.2s" }}
                  >
                    {submittingComment ? "..." : "Odeslat"}
                  </button>
                )}
              </div>
              {commentText.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px", paddingRight: "4px" }}>
                  <span style={{ fontSize: "11px", color: commentText.length >= 180 ? (commentText.length >= 200 ? "#e55" : "#a87a30") : "#444" }}>
                    {commentText.length}/200
                  </span>
                </div>
              )}
            </div>
          </>
        )}


        <div ref={beatsListRef} className="scroll-fade-section home-beats-list" style={{ marginBottom: "48px", maxWidth: "1200px", margin: "0 auto", marginTop: "60px" }}>
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
              <div className="home-beat-list-header" style={{ display: "flex", alignItems: "center", padding: "16px 16px 8px 16px", gap: "16px", marginTop: "16px", position: "relative" }}>
                {/* matches the mobile-hide heart button wrapper in each row */}
                <div className="mobile-hide" style={{ width: "28px", flexShrink: 0, marginRight: "-4px" }} />
                {/* matches artwork image */}
                <div style={{ width: "48px", flexShrink: 0 }} />
                {/* NÁZEV — matches title column */}
                <div className="home-beat-header-title" style={{ width: "240px", minWidth: "240px", maxWidth: "240px", flexShrink: 0, marginRight: "12px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666" }}>NÁZEV</div>
                <div className="home-beat-header-separator" style={{ position: "absolute", bottom: 0, left: "80px", right: "16px", height: "1px", background: "#333" }} />
                {/* BPM — matches beat bpm column */}
                <div className="desktop-only" style={{ width: "100px", flexShrink: 0 }}><button onClick={() => { setSortBy(sortBy === "bpm" ? "bpm" : "bpm"); setSortAsc(sortBy === "bpm" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>BPM {sortBy === "bpm" && (sortAsc ? "↑" : "↓")}</button></div>
                {/* KEY — matches beat key column */}
                <div className="desktop-only" style={{ width: "100px", flexShrink: 0 }}><button onClick={() => { setSortBy(sortBy === "key" ? "key" : "key"); setSortAsc(sortBy === "key" ? !sortAsc : false); }} style={{ background: "none", border: "none", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>KEY {sortBy === "key" && (sortAsc ? "↑" : "↓")}</button></div>
                {/* TAGY — matches tags column */}
                <div className="desktop-only" style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "12px", color: "#666", marginLeft: "12px" }}>TAGY</div>
              </div>
              {(sortBy && sortBy === "bpm" ? [...otherBeats].sort((a, b) => sortAsc ? a.bpm - b.bpm : b.bpm - a.bpm) : sortBy && sortBy === "key" ? [...otherBeats].sort((a, b) => sortAsc ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)) : otherBeats).map((beat) => (
            <div
              key={beat.id}
              className="home-beat-row"
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
              <div data-separator className="home-beat-row-separator" style={{ position: "absolute", bottom: 0, left: "144px", right: "16px", height: "1px", background: "#333", opacity: 1, transition: "opacity 0.15s ease" }} />
              <div className="mobile-hide" style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px", marginRight: "-4px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(beat);
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
              </div>
              <div className="home-beat-artwork" style={{ flexShrink: 0 }}>
                <img
                  src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={beat.title}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }}
                />
              </div>
              <div className="home-beat-title-col" style={{ width: "240px", marginRight: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "20px" }}>{beat.title}</div>
                <div className="mobile-only-flex" style={{ display: "none", gap: "8px", alignItems: "center" }}>
                  {beat.bpm && <span style={{ fontSize: "11px", color: "#666", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{beat.bpm} BPM</span>}
                  {beat.bpm && beat.key && <span style={{ fontSize: "11px", color: "#444" }}>·</span>}
                  {beat.key && <span style={{ fontSize: "11px", color: "#666", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{beat.key}</span>}
                </div>
              </div>
              <div className="desktop-only" style={{ width: "100px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", textAlign: "left" }}>
                {beat.bpm}
              </div>
              <div className="desktop-only" style={{ width: "100px", fontWeight: "400", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", color: "#666", fontSize: "16px", textAlign: "left" }}>
                {beat.key}
              </div>

              {beat.tags && beat.tags.length > 0 && (
                <div className="desktop-only" style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginLeft: "12px", alignItems: "center" }}>
                  {beat.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/beaty?tag=${encodeURIComponent(tag)}`);
                      }}
                      style={{
                        padding: "3px 8px",
                        background: "#111111",
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

              <div className="home-beat-row-actions" style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", marginRight: "16px" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(beat);
                    }}
                    className="mobile-only"
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
                    className="home-beat-dl-btn"
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareBeat(beat);
                  }}
                  className="home-beat-share-btn"
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
                  className="btn-bounce home-beat-buy-btn"
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
          
          <div className="fade-in-section delay-3" style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", marginBottom: "32px", position: "relative", zIndex: 9999, alignItems: "center", pointerEvents: "auto" }}>
              <button
                data-testid="button-listen-more-beats"
                onClick={() => setLocation("/beaty")}
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
          <div className="mobile-hide-dock" style={{ 
            backgroundImage: "url(/uploads/artwork/dock-bg-computer.jpg)", 
            backgroundSize: "100% auto", 
            backgroundPosition: "bottom center", 
            backgroundRepeat: "no-repeat",
            width: "100vw",
            marginLeft: "calc(-50vw + 50%)",
            marginTop: "100px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            position: "relative"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "260px", background: "linear-gradient(to bottom, #000 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />
            <div style={{
              width: "100%",
              textAlign: "center",
              zIndex: 20,
              opacity: showTitle ? 1 : 0,
              transform: showTitle ? "translateY(0)" : "translateY(28px)",
              transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
              marginTop: "-10px"
            }}>
                  <h2 style={{
                    color: "#fff",
                    fontSize: "42px",
                    fontFamily: "'Clash Display', sans-serif",
                    fontWeight: "600",
                    letterSpacing: "0",
                    margin: 0,
                    lineHeight: "1.1",
                    textTransform: "uppercase",
                    transition: "all 0.3s ease",
                  }}>
                    PRO VŠECHNY<br />
                    HUDEBNÍ PRODUCENTY<br />
                  </h2>
                </div>

                <div ref={soundKitsRef} className="fade-in-section delay-4 scroll-fade-section" style={{ marginTop: "42px", marginBottom: "0px", width: "100%", display: "flex", justifyContent: "center", position: "relative", zIndex: 5, pointerEvents: "auto" }}>
                  <div style={{ 
                    width: "100%", 
                    height: "1000px", 
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: "-15px"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "center",
                      width: "100%",
                      padding: "0 20px"
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


      {shareBeat && (
        <ShareModal
          product={{ id: shareBeat.id, title: shareBeat.title, price: shareBeat.price, artwork_url: shareBeat.artwork_url, preview_url: shareBeat.preview_url }}
          productType="beat"
          beatId={shareBeat.id}
          beatTitle={shareBeat.title}
          isOpen={true}
          onClose={() => setShareBeat(null)}
        />
      )}

      <div style={{ height: "100px" }} />
    </div>
  );
}

export default Home;
