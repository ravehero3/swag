import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, Image as ImageIcon, CheckCircle2, Search, Rocket } from "lucide-react";
import { DESIGN_SYSTEM } from "../constants/designSystem";

const DS = DESIGN_SYSTEM.colors;

interface OracleBeat {
  filename: string;
  url: string;
  beatCode: string;
  size: number;
  modified: string;
  isPublished: boolean;
  publishedBeatId: number | null;
  artworkUrl?: string;
}

interface GalleryImage {
  url: string;
  filename: string;
  size?: number;
}

interface OracleBeatsModalProps {
  visible: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

export default function OracleBeatsModal({ visible, onClose, onPublished }: OracleBeatsModalProps) {
  const [beats, setBeats] = useState<OracleBeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Mini player state
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingBeat = beats.find(b => b.url === playingUrl);

  // Gallery (artwork picker) state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (visible) loadBeats();
    else {
      setSearch("");
      setSelected(new Set());
      stopAudio();
    }
  }, [visible]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setPlayingUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const loadBeats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beat-files/oracle/all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setBeats(json.beats || []);
    } catch {
      showToast("Nepodařilo se načíst Oracle beats", "err");
    } finally {
      setLoading(false);
    }
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/kit-artworks", { credentials: "include" });
      const data = await res.json();
      setGalleryImages(data || []);
    } catch {
      showToast("Nepodařilo se načíst galerii", "err");
    } finally {
      setGalleryLoading(false);
    }
  };

  const handlePlayBeat = useCallback((beat: OracleBeat) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingUrl === beat.url) {
      if (isPlaying) { audio.pause(); } else { audio.play().catch(() => {}); }
      return;
    }
    audio.pause();
    audio.src = beat.url;
    audio.load();
    audio.play().catch(() => {});
    setPlayingUrl(beat.url);
    setCurrentTime(0);
    setDuration(0);
  }, [playingUrl, isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = parseFloat(e.target.value);
  };

  const handleDeleteBeat = async (filename: string) => {
    if (!confirm(`Smazat beat "${filename}" z databáze i ze serveru?`)) return;
    setDeletingFile(filename);
    try {
      const beat = beats.find(b => b.filename === filename);
      if (beat?.publishedBeatId) {
        await fetch(`/api/beats/${beat.publishedBeatId}`, { method: "DELETE", credentials: "include" });
      }
      await fetch(`/api/beat-files/${encodeURIComponent(filename)}`, { method: "DELETE", credentials: "include" });
      if (playingUrl === beat?.url) stopAudio();
      setBeats(prev => prev.filter(b => b.filename !== filename));
      setSelected(prev => { const n = new Set(prev); n.delete(filename); return n; });
      showToast("Beat smazán");
    } catch {
      showToast("Nepodařilo se smazat beat", "err");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleOpenArtworkPicker = (filename: string) => {
    setGalleryTarget(filename);
    setGallerySearch("");
    setGalleryOpen(true);
    loadGallery();
  };

  const handleSelectArtwork = (img: GalleryImage) => {
    if (!galleryTarget) return;
    setBeats(prev => prev.map(b =>
      b.filename === galleryTarget ? { ...b, artworkUrl: img.url } : b
    ));
    setGalleryOpen(false);
    setGalleryTarget(null);
    showToast("Artwork přiřazen ✓");
  };

  const handleRemoveArtwork = (filename: string) => {
    setBeats(prev => prev.map(b =>
      b.filename === filename ? { ...b, artworkUrl: undefined } : b
    ));
  };

  const publishBeat = async (beat: OracleBeat) => {
    const res = await fetch("/api/beats/publish-from-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: beat.beatCode,
        previewUrl: beat.url,
        bpm: null,
        key: null,
        artworkUrl: beat.artworkUrl || null,
        fileUrl: beat.url,
        tags: [],
      }),
    });
    if (!res.ok) throw new Error("Failed");
  };

  const handlePublishSelected = async () => {
    if (selected.size === 0) { showToast("Vyberte alespoň jeden beat", "err"); return; }
    setPublishing(true);
    let ok = 0, fail = 0;
    for (const filename of Array.from(selected)) {
      const beat = beats.find(b => b.filename === filename);
      if (!beat || beat.isPublished) continue;
      try { await publishBeat(beat); ok++; } catch { fail++; }
    }
    setPublishing(false);
    if (ok > 0) {
      showToast(`${ok} beat${ok !== 1 ? "y" : ""} zveřejněn${ok !== 1 ? "y" : ""}! 🎉`);
      setSelected(new Set());
      await loadBeats();
      onPublished?.();
    }
    if (fail > 0) showToast(`${fail} beatů se nepodařilo zveřejnit`, "err");
  };

  const filtered = beats.filter(b =>
    b.beatCode.toLowerCase().includes(search.toLowerCase()) ||
    b.filename.toLowerCase().includes(search.toLowerCase())
  );

  const published = beats.filter(b => b.isPublished).length;
  const unpublished = beats.filter(b => !b.isPublished).length;
  const selectedBeats = beats.filter(b => selected.has(b.filename));
  const canPublish = selectedBeats.some(b => !b.isPublished);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const fmtSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const filteredGallery = galleryImages.filter(img =>
    img.filename.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  if (!visible) return null;

  return (
    <>
      <audio ref={audioRef} />
      <style>{`
        @keyframes oracle-fade-in { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes oracle-toast { 0%,100%{opacity:0;transform:translateY(8px)} 10%,85%{opacity:1;transform:translateY(0)} }
        .oracle-row:hover { background: ${DS.tertiary} !important; }
        .oracle-artwork-btn:hover { border-color: #555 !important; }
        .oracle-progress::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#fff; cursor:pointer; }
        .oracle-progress::-moz-range-thumb { width:12px; height:12px; border-radius:50%; background:#fff; cursor:pointer; border:none; }
        .oracle-del-btn:hover { color: #ef4444 !important; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", zIndex:9000 }} />

      {/* Modal */}
      <div style={{ position:"fixed", inset:0, zIndex:9001, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", pointerEvents:"none" }}>
        <div style={{
          pointerEvents:"all", width:"100%", maxWidth:"1100px", maxHeight:"90vh",
          background:DS.background, border:`1px solid ${DS.border}`, borderRadius:"12px",
          display:"flex", flexDirection:"column",
          boxShadow:"0 32px 80px rgba(0,0,0,0.8)", animation:"oracle-fade-in 0.2s ease-out", overflow:"hidden",
          fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
          {/* Header */}
          <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${DS.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"20px", fontWeight:700, color:DS.textPrimary, letterSpacing:"-0.5px" }}>🎛️ ORACLE BEATS</span>
                <div style={{ display:"flex", gap:"6px" }}>
                  <span style={{ fontSize:"11px", background:"rgba(16,185,129,0.12)", color:"#10b981", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"10px", padding:"2px 8px", fontWeight:600 }}>{published} live</span>
                  <span style={{ fontSize:"11px", background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"10px", padding:"2px 8px", fontWeight:600 }}>{unpublished} nepub.</span>
                  <span style={{ fontSize:"11px", background:DS.inputs, color:DS.textSecondary, border:`1px solid ${DS.border}`, borderRadius:"10px", padding:"2px 8px" }}>{beats.length} total</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background:"none", border:"none", color:DS.textSecondary, cursor:"pointer", padding:"4px", display:"flex", borderRadius:"6px" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <div style={{ flex:1, position:"relative" }}>
                <Search size={14} style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:DS.textTertiary }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat beat..."
                  style={{ width:"100%", background:DS.inputs, border:`1px solid ${DS.border}`, borderRadius:"8px", padding:"8px 10px 8px 32px", fontSize:"13px", color:DS.textPrimary, outline:"none", boxSizing:"border-box" as const }} />
              </div>
              {selected.size > 0 && <span style={{ fontSize:"12px", color:DS.textSecondary }}>{selected.size} vybráno</span>}
              <button onClick={handlePublishSelected} disabled={publishing || !canPublish}
                style={{ display:"flex", alignItems:"center", gap:"6px", background:canPublish ? "#0055FF" : DS.inputs, color:canPublish ? "#fff" : DS.textTertiary, border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"13px", fontWeight:600, cursor:canPublish ? "pointer" : "not-allowed", opacity:publishing ? 0.6 : 1, flexShrink:0 }}>
                <Rocket size={14} />
                {publishing ? "Zveřejňuji..." : "Zveřejnit vybrané live"}
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div style={{ display:"grid", gridTemplateColumns:"32px 40px 1fr 72px 64px 72px 52px 32px", gap:"8px", padding:"8px 24px", fontSize:"10px", fontWeight:600, color:DS.textTertiary, textTransform:"uppercase" as const, letterSpacing:"0.08em", borderBottom:`1px solid ${DS.border}`, flexShrink:0 }}>
            <div />
            <div></div>
            <div>Název</div>
            <div>Artwork</div>
            <div>Vel.</div>
            <div>Status</div>
            <div></div>
            <div></div>
          </div>

          {/* List */}
          <div style={{ flex:1, overflowY:"auto", padding:"6px 16px" }}>
            {loading ? (
              <div style={{ padding:"40px", textAlign:"center", color:DS.textTertiary, fontSize:"13px" }}>Načítám...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"40px", textAlign:"center", color:DS.textTertiary, fontSize:"13px" }}>Žádné beaty</div>
            ) : filtered.map(beat => {
              const isSel = selected.has(beat.filename);
              const isThisPlaying = playingUrl === beat.url && isPlaying;
              const isDel = deletingFile === beat.filename;
              return (
                <div key={beat.filename} className="oracle-row"
                  style={{ display:"grid", gridTemplateColumns:"32px 40px 1fr 72px 64px 72px 52px 32px", gap:"8px", alignItems:"center", padding:"7px 8px", marginBottom:"2px", borderRadius:"6px", border:`1px solid ${isSel ? "rgba(0,85,255,0.35)" : "transparent"}`, background:isSel ? "rgba(0,85,255,0.06)" : "transparent", transition:"all 0.1s", opacity:isDel ? 0.4 : 1 }}>
                  
                  <input type="checkbox" checked={isSel} onChange={e => { const n = new Set(selected); if (e.target.checked) n.add(beat.filename); else n.delete(beat.filename); setSelected(n); }}
                    style={{ width:"14px", height:"14px", accentColor:"#0055FF", cursor:"pointer" }} />

                  <button onClick={() => handlePlayBeat(beat)} title="Přehrát"
                    style={{ width:"34px", height:"34px", borderRadius:"50%", background:isThisPlaying ? "#0055FF" : DS.inputs, border:`1px solid ${isThisPlaying ? "#0055FF" : DS.border}`, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                    {isThisPlaying ? <Pause size={13} /> : <Play size={13} />}
                  </button>

                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:"13px", fontWeight:600, color:DS.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {beat.beatCode}
                      {beat.isPublished && <CheckCircle2 size={11} style={{ color:"#10b981", marginLeft:"5px", verticalAlign:"middle" }} />}
                    </div>
                    <div style={{ fontSize:"10px", color:DS.textTertiary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{beat.filename}</div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {beat.artworkUrl ? (
                      <div style={{ position:"relative" }}>
                        <img src={beat.artworkUrl} alt="art" onClick={() => handleOpenArtworkPicker(beat.filename)} title="Změnit artwork"
                          style={{ width:"34px", height:"34px", borderRadius:"4px", objectFit:"cover", display:"block", cursor:"pointer", border:`1px solid ${DS.border}` }} />
                        <button onClick={() => handleRemoveArtwork(beat.filename)}
                          style={{ position:"absolute", top:"-4px", right:"-4px", background:"#ef4444", border:"none", borderRadius:"50%", width:"14px", height:"14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", padding:0, fontSize:"9px" }}>×</button>
                      </div>
                    ) : (
                      <button className="oracle-artwork-btn" onClick={() => handleOpenArtworkPicker(beat.filename)} title="Přidat artwork"
                        style={{ width:"34px", height:"34px", borderRadius:"4px", background:DS.inputs, border:`1px solid ${DS.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:DS.textTertiary, transition:"border-color 0.15s" }}>
                        <ImageIcon size={13} />
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize:"11px", color:DS.textTertiary, textAlign:"right" as const }}>{fmtSize(beat.size)}</div>

                  <div>
                    {beat.isPublished ? (
                      <span style={{ fontSize:"10px", fontWeight:600, background:"rgba(16,185,129,0.12)", color:"#10b981", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"8px", padding:"2px 7px" }}>Live</span>
                    ) : (
                      <span style={{ fontSize:"10px", color:DS.textTertiary, background:DS.inputs, border:`1px solid ${DS.border}`, borderRadius:"8px", padding:"2px 7px" }}>Nepub.</span>
                    )}
                  </div>

                  <div>
                    {!beat.isPublished && (
                      <button onClick={async () => { setPublishing(true); try { await publishBeat(beat); showToast(`"${beat.beatCode}" zveřejněn! 🎉`); await loadBeats(); onPublished?.(); } catch { showToast("Chyba", "err"); } finally { setPublishing(false); } }} disabled={publishing}
                        title="Zveřejnit live"
                        style={{ fontSize:"10px", fontWeight:600, background:"rgba(0,85,255,0.12)", color:"#4d88ff", border:"1px solid rgba(0,85,255,0.25)", borderRadius:"6px", padding:"3px 7px", cursor:"pointer", whiteSpace:"nowrap" as const }}>
                        Pub.
                      </button>
                    )}
                  </div>

                  <button className="oracle-del-btn" onClick={() => handleDeleteBeat(beat.filename)} disabled={isDel} title="Smazat beat"
                    style={{ background:"none", border:"none", color:"#666", cursor:isDel ? "not-allowed" : "pointer", padding:"3px", display:"flex", alignItems:"center", borderRadius:"4px", transition:"color 0.15s" }}>
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Mini Player */}
          {playingUrl && playingBeat && (
            <div style={{ padding:"12px 24px", borderTop:`1px solid ${DS.border}`, background:DS.elevated, display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
              {playingBeat.artworkUrl ? (
                <img src={playingBeat.artworkUrl} alt="" style={{ width:"36px", height:"36px", borderRadius:"4px", objectFit:"cover", flexShrink:0 }} />
              ) : (
                <div style={{ width:"36px", height:"36px", borderRadius:"4px", background:DS.inputs, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <ImageIcon size={16} color={DS.textTertiary} />
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"12px", fontWeight:600, color:DS.textPrimary, marginBottom:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{playingBeat.beatCode}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"10px", color:DS.textTertiary, flexShrink:0 }}>{fmt(currentTime)}</span>
                  <input type="range" className="oracle-progress" min={0} max={duration || 100} value={currentTime} onChange={handleSeek}
                    style={{ flex:1, appearance:"none" as any, height:"3px", borderRadius:"2px", background:`linear-gradient(to right, #fff ${duration ? (currentTime/duration*100) : 0}%, ${DS.border} 0%)`, cursor:"pointer", outline:"none" }} />
                  <span style={{ fontSize:"10px", color:DS.textTertiary, flexShrink:0 }}>{fmt(duration)}</span>
                </div>
              </div>
              <button onClick={() => { const a = audioRef.current; if (!a) return; if (isPlaying) a.pause(); else a.play().catch(() => {}); }}
                style={{ width:"36px", height:"36px", borderRadius:"50%", background:"#0055FF", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={stopAudio} style={{ background:"none", border:"none", color:DS.textTertiary, cursor:"pointer", padding:"4px", display:"flex", borderRadius:"4px" }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Artwork Gallery Modal */}
      {galleryOpen && (
        <>
          <div onClick={() => { setGalleryOpen(false); setGalleryTarget(null); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9100 }} />
          <div style={{ position:"fixed", inset:0, zIndex:9101, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
            <div style={{ width:"100%", maxWidth:"800px", maxHeight:"80vh", background:DS.background, border:`1px solid ${DS.border}`, borderRadius:"12px", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.8)", animation:"oracle-fade-in 0.15s ease-out", overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:`1px solid ${DS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                <span style={{ fontSize:"15px", fontWeight:600, color:DS.textPrimary }}>Vybrat artwork — Složka s obrázky</span>
                <button onClick={() => { setGalleryOpen(false); setGalleryTarget(null); }} style={{ background:"none", border:"none", color:DS.textSecondary, cursor:"pointer" }}><X size={16} /></button>
              </div>
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${DS.border}`, flexShrink:0 }}>
                <div style={{ position:"relative" }}>
                  <Search size={13} style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:DS.textTertiary }} />
                  <input value={gallerySearch} onChange={e => setGallerySearch(e.target.value)} placeholder="Hledat obrázek..."
                    style={{ width:"100%", background:DS.inputs, border:`1px solid ${DS.border}`, borderRadius:"6px", padding:"7px 10px 7px 30px", fontSize:"12px", color:DS.textPrimary, outline:"none", boxSizing:"border-box" as const }} />
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
                {galleryLoading ? (
                  <div style={{ textAlign:"center", color:DS.textTertiary, padding:"32px", fontSize:"13px" }}>Načítám...</div>
                ) : filteredGallery.length === 0 ? (
                  <div style={{ textAlign:"center", color:DS.textTertiary, padding:"32px", fontSize:"13px" }}>Žádné obrázky</div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))", gap:"8px" }}>
                    {filteredGallery.map(img => (
                      <div key={img.url} onClick={() => handleSelectArtwork(img)} title={img.filename}
                        style={{ cursor:"pointer", borderRadius:"6px", overflow:"hidden", border:`1px solid ${DS.border}`, transition:"border-color 0.15s, transform 0.15s", aspectRatio:"1" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0055FF"; (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = DS.border; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
                        <img src={img.url} alt={img.filename} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", zIndex:9999, background:toast.type === "err" ? "#ef4444" : "#10b981", color:"#fff", padding:"10px 20px", borderRadius:"8px", fontSize:"13px", fontWeight:500, boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"oracle-toast 3s ease forwards", whiteSpace:"nowrap" as const }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
