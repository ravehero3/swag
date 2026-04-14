import { useState, useEffect, useRef } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";

interface B2File {
  key: string;
  size: number;
  lastModified: string | undefined;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function B2FilePicker({ onSelect, onClose }: { onSelect: (key: string) => void | Promise<void>; onClose: () => void }) {
  const [files, setFiles] = useState<B2File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/upload/b2-files", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => { setFiles(data); setLoading(false); })
      .catch(err => { setError(String(err)); setLoading(false); });
  }, []);

  const filtered = files.filter(f => f.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(13,13,13,0.85)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161616", border: "1px solid #333", borderRadius: "6px",
          padding: "24px", width: "640px", maxHeight: "80vh", display: "flex",
          flexDirection: "column", gap: "16px",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>Vybrat soubor z Backblaze</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>

        <input
          autoFocus
          placeholder="Hledat soubor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: "4px" }}
        />

        <div style={{ overflowY: "auto", flex: 1, border: "1px solid #222", borderRadius: "4px" }}>
          {loading && (
            <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>Načítám soubory z B2...</div>
          )}
          {error && (
            <div style={{ padding: "24px", textAlign: "center", color: "#ff4444" }}>Chyba: {error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>
              {files.length === 0 ? "V bucketu nejsou žádné soubory. Nahrajte ZIP přímo do Backblaze." : "Žádné výsledky."}
            </div>
          )}
          {!loading && !error && filtered.map(file => (
            <div
              key={file.key}
              onClick={() => { onSelect(file.key); onClose(); }}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderBottom: "1px solid #1e1e1e",
                cursor: "pointer", transition: "background 150ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: "13px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.key}
                </div>
                {file.lastModified && (
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                    {new Date(file.lastModified).toLocaleString("cs-CZ")}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginLeft: "16px", whiteSpace: "nowrap" }}>
                {formatBytes(file.size)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "12px", color: "#555" }}>
          {!loading && !error && `${filtered.length} / ${files.length} souborů`}
        </div>
      </div>
    </div>
  );
}

interface B2VideoFile {
  key: string;
  size: number;
  lastModified: string | undefined;
  url: string;
}

function B2VideoPickerModal({ onSelect, onClose }: { onSelect: (url: string, key: string) => void; onClose: () => void }) {
  const [files, setFiles] = useState<B2VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/upload/b2-videos", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => { setFiles(data); setLoading(false); })
      .catch(err => { setError(String(err)); setLoading(false); });
  }, []);

  const filtered = files.filter(f =>
    f.key.toLowerCase().includes(search.toLowerCase())
  );

  const fileName = (key: string) => key.split("/").pop() || key;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#0e0e0e", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "24px", width: "700px", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: "14px" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", color: "#fff" }}>Videa z Backblaze</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>

        <input
          autoFocus
          placeholder="Hledat video..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
        />

        <div style={{ overflowY: "auto", flex: 1, border: "1px solid #1a1a1a", borderRadius: "4px" }}>
          {loading && <div style={{ padding: "32px", textAlign: "center", color: "#555" }}>Načítám videa z B2...</div>}
          {error && <div style={{ padding: "32px", textAlign: "center", color: "#ff4444" }}>Chyba: {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "#555" }}>
              {files.length === 0 ? "Žádná videa v bucketu. Nahrajte video přes tlačítko Nahrát video." : "Žádné výsledky."}
            </div>
          )}
          {!loading && !error && filtered.map(file => (
            <div
              key={file.key}
              style={{ borderBottom: "1px solid #181818" }}
            >
              <div
                onClick={() => { onSelect(file.url, file.key); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", cursor: "pointer", transition: "background 120ms" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#161616")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{ width: "36px", height: "36px", borderRadius: "4px", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); setPreviewKey(prev => prev === file.key ? null : file.key); }}
                  title="Přehrát náhled"
                >
                  <span style={{ fontSize: "16px" }}>{previewKey === file.key ? "⏸" : "▶"}</span>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName(file.key)}</div>
                  {file.lastModified && (
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{new Date(file.lastModified).toLocaleString("cs-CZ")} · {formatBytes(file.size)}</div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onSelect(file.url, file.key); onClose(); }}
                  style={{ background: "#1a1a1a", border: "1px solid #333", color: "#aaa", padding: "6px 12px", fontSize: "12px", borderRadius: "3px", cursor: "pointer", flexShrink: 0 }}
                >
                  Vybrat
                </button>
              </div>
              {previewKey === file.key && (
                <div style={{ padding: "0 16px 12px" }}>
                  <video
                    src={file.url}
                    controls
                    autoPlay
                    muted
                    style={{ width: "100%", maxHeight: "200px", borderRadius: "4px", background: "#000", border: "1px solid #222" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: "#444" }}>
          {!loading && !error && `${filtered.length} / ${files.length} videí`}
        </div>
      </div>
    </div>
  );
}

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  file_url: string;
  artwork_url: string;
  trackout_url?: string;
  tags: string[];
  is_published: boolean;
  is_highlighted: boolean;
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
  preview_urls: string[];
  file_url: string;
  artwork_url: string;
  legal_info: string;
  author_info: string;
  is_published: boolean;
  order_index?: number;
}

interface LicenseType {
  id: number;
  name: string;
  description: string;
  price: number;
  file_types: string[];
  terms_text: string;
  is_negotiable: boolean;
  is_active: boolean;
  contract_template: string | null;
  created_at: string;
}

function Admin() {
  const { settings, refreshSettings } = useApp() as any;
  const [, navigate] = useLocation();
  const initialTab = (() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    const valid = ["beats", "kits", "orders", "licenses", "emails", "promo", "seo", "ig_stories", "zakaznici", "komentare"];
    return (valid.includes(p || "") ? p : "orders") as "beats" | "kits" | "orders" | "licenses" | "emails" | "promo" | "seo" | "ig_stories" | "zakaznici" | "komentare";
  })();
  const [tab, setTab] = useState<"beats" | "kits" | "orders" | "licenses" | "emails" | "promo" | "seo" | "ig_stories" | "zakaznici" | "komentare">(initialTab);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [kits, setKits] = useState<SoundKit[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<LicenseType[]>([]);
  const [showBeatForm, setShowBeatForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [editingKit, setEditingKit] = useState<SoundKit | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.isAdmin) {
            setIsAdmin(true);
            setAdminChecked(true);
            await loadData();
          } else {
            navigate("/prihlasit-se");
          }
        } else {
          navigate("/prihlasit-se");
        }
      } catch (err) {
        console.error("Admin auth check failed:", err);
        navigate("/prihlasit-se");
      } finally {
        setAdminLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    setAdminError(null);
    try {
      const [beatsRes, kitsRes, ordersRes, licensesRes] = await Promise.all([
        fetch("/api/beats/all", { credentials: "include" }),
        fetch("/api/sound-kits/all", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
        fetch("/api/licenses/all", { credentials: "include" }),
      ]);

      const responses = [beatsRes, kitsRes, ordersRes, licensesRes];
      for (const res of responses) {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            navigate("/prihlasit-se");
            return;
          }
          const errorData = await res.json().catch(() => null);
          const message = errorData?.error || `Chyba serveru (${res.status})`;
          throw new Error(message);
        }
      }

      const [beatsData, kitsData, ordersData, licensesData] = await Promise.all([
        beatsRes.json(),
        kitsRes.json(),
        ordersRes.json(),
        licensesRes.json(),
      ]);

      setBeats(Array.isArray(beatsData) ? beatsData : []);
      setKits(Array.isArray(kitsData) ? kitsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setLicenses(Array.isArray(licensesData) ? licensesData : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to load admin data:", message);
      setAdminError(message);
    }
  };

  if (adminLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#000" }}>
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "16px" }}>Kontrola administrátorského přístupu...</p>
        </div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#000", padding: "24px" }}>
        <div style={{ maxWidth: "640px", textAlign: "center" }}>
          <h2 style={{ marginBottom: "16px", color: "#fff" }}>Chyba administračního panelu</h2>
          <p style={{ marginBottom: "16px", color: "#ccc" }}>{adminError}</p>
          <button className="btn btn-filled" onClick={loadData}>Zkusit znovu</button>
        </div>
      </div>
    );
  }

  if (!adminChecked || !isAdmin) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#000" }}>
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "16px" }}>Probíhá přesměrování na přihlášení...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in admin-container" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: "24px", color: "#666" }}>Admin Panel</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
        {["beats", "kits", "orders", "zakaznici", "licenses", "emails", "promo", "seo", "ig_stories", "komentare"].map((t) => (
          <button
            key={t}
            className={tab === t ? "btn btn-filled" : "btn btn-admin"}
            onClick={() => setTab(t as any)}
            style={tab !== t ? { borderColor: "#333", color: "#666" } : {}}
          >
            {t === "beats" ? "Beaty" : t === "kits" ? "Zvuky" : t === "orders" ? "Objednávky" : t === "zakaznici" ? "Zákazníci" : t === "licenses" ? "Licence" : t === "emails" ? "Emaily" : t === "promo" ? "Promo kódy" : t === "komentare" ? "Komentáře" : t === "ig_stories" ? "IG Stories" : "SEO"}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "left" }}>
        {tab === "beats" && (
          <BeatsTab
            beats={beats}
            licenses={licenses}
            showForm={showBeatForm}
            setShowForm={setShowBeatForm}
            editing={editingBeat}
            setEditing={setEditingBeat}
            onRefresh={loadData}
            loadData={loadData}
          />
        )}

        {tab === "kits" && (
          <KitsTab
            kits={kits}
            showForm={showKitForm}
            setShowForm={setShowKitForm}
            editing={editingKit}
            setEditing={setEditingKit}
            onRefresh={loadData}
          />
        )}

        {tab === "orders" && <OrdersTab orders={orders} onRefresh={loadData} />}
        {tab === "zakaznici" && <ZakazniciTab />}
        {tab === "licenses" && <LicensesTab licenses={licenses} onRefresh={loadData} />}
        {tab === "emails" && <EmailsTab />}
        {tab === "promo" && <PromoCodesTab />}
        {tab === "seo" && <SEOTab settings={settings} onRefresh={refreshSettings} />}
        {tab === "ig_stories" && <IGStoriesTab settings={settings} onRefresh={refreshSettings} />}
        {tab === "komentare" && <KomentareTab />}
      </div>
    </div>
  );
}

const PRICE_TYPES_BEAT = [
  { id: "beat", label: "Beat", sublabel: "5 000 – 10 000 Kč", price: 5000 },
  { id: "promo", label: "Promo", sublabel: "Zdarma", price: 0 },
] as const;

type BeatPriceType = typeof PRICE_TYPES_BEAT[number]["id"];

function BeatsTab({ beats, showForm, setShowForm, editing, setEditing, onRefresh, loadData }: any) {
  const [form, setForm] = useState({
    title: "",
    artist: "VOODOO808",
    bpm: 140,
    key: "C",
    price: 5000,
    priceType: "beat" as BeatPriceType,
    previewUrl: "",
    fileUrl: "",
    artworkUrl: "",
    trackoutUrl: "",
    tags: [] as string[],
    isPublished: true,
    isHighlighted: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedBeats, setSelectedBeats] = useState<number[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [b2PickerFor, setB2PickerFor] = useState<string | null>(null);
  const [hoveredBeatId, setHoveredBeatId] = useState<number | null>(null);
  const [previewBeatId, setPreviewBeatId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleBeatPreview = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!beat.preview_url) return;
    if (previewBeatId === beat.id) {
      previewAudioRef.current?.pause();
      setPreviewBeatId(null);
    } else {
      if (previewAudioRef.current) { previewAudioRef.current.pause(); }
      const audio = new Audio(beat.preview_url);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audio.onended = () => setPreviewBeatId(null);
      previewAudioRef.current = audio;
      setPreviewBeatId(beat.id);
    }
  };

  useEffect(() => {
    return () => { previewAudioRef.current?.pause(); };
  }, []);

  const handleSelectAll = () => {
    if (selectedBeats.length === beats.length) {
      setSelectedBeats([]);
    } else {
      setSelectedBeats(beats.map((b: Beat) => b.id));
    }
  };

  const handleSelectBeat = (id: number) => {
    setSelectedBeats(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedBeats.length === 0) return;
    if (!confirm(`Opravdu smazat ${selectedBeats.length} vybraných beatů?`)) return;
    
    const res = await fetch("/api/beats/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: selectedBeats }),
    });
    
    if (res.ok) {
      setSelectedBeats([]);
      onRefresh();
    } else {
      alert("Chyba při mazání beatů");
    }
  };

  useEffect(() => {
    if (editing) {
      const priceType: BeatPriceType = editing.price === 0 ? "promo" : "beat";
      setForm({
        title: editing.title,
        artist: editing.artist,
        bpm: editing.bpm,
        key: editing.key,
        price: editing.price,
        priceType,
        previewUrl: editing.preview_url || "",
        fileUrl: editing.file_url || "",
        artworkUrl: editing.artwork_url || "",
        trackoutUrl: editing.trackout_url || "",
        tags: editing.tags || [],
        isPublished: editing.is_published,
        isHighlighted: editing.is_highlighted || false,
      });
      setShowForm(true);
    }
  }, [editing, setShowForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/beats/${editing.id}` : "/api/beats";
    const method = editing ? "PUT" : "POST";
    const payload = { ...form, price: Number(form.price), bpm: Number(form.bpm) };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", artist: "VOODOO808", bpm: 140, key: "C", price: 5000, priceType: "beat", previewUrl: "", fileUrl: "", artworkUrl: "", trackoutUrl: "", tags: [], isPublished: true, isHighlighted: false });
      loadData();
    } else {
      const errorData = await res.json();
      alert(`Chyba: ${errorData.error || "Došlo k chybě při ukládání"}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/beats/${id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
  };

  const uploadFile = async (file: File, type: string) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadError(prev => ({ ...prev, [type]: "" }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    const isLargeFile = file.size > 50 * 1024 * 1024;
    const useServerUpload = isLargeFile || type === "beat" || type === "kit" || type === "trackout" || type === "artwork" || type === "preview";

    try {
      if (useServerUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/upload?type=${encodeURIComponent(type)}`, true);
        xhr.timeout = 10 * 60 * 1000;

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
            setUploadProgress(prev => ({ ...prev, [type]: pct }));
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.ontimeout = () => reject(new Error("Upload timeout"));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploadProgress(prev => ({ ...prev, [type]: 100 }));
                setUploadedNames(prev => ({ ...prev, [type]: file.name }));
                resolve(data.url);
              } catch (e) {
                reject(new Error("Invalid response"));
              }
            } else {
              reject(new Error(`Server ${xhr.status}: ${xhr.responseText}`));
            }
          };
          xhr.send(formData);
        });
      } else {
        const ext = file.name.split('.').pop() || 'zip';
        const contentType = file.type || '';

        const presignRes = await fetch(
          `/api/upload/presign?type=${encodeURIComponent(type)}&ext=${encodeURIComponent(ext)}&contentType=${encodeURIComponent(contentType)}`,
          { credentials: 'include' }
        );

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error || `Presign failed (${presignRes.status})`);
        }

        const { presignedUrl, publicUrl } = await presignRes.json();

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);
        if (contentType) xhr.setRequestHeader("Content-Type", contentType);

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
            setUploadProgress(prev => ({ ...prev, [type]: pct }));
          };

          xhr.onerror = () => reject(new Error("Upload failed (B2 CORS?)"));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(prev => ({ ...prev, [type]: 100 }));
              setUploadedNames(prev => ({ ...prev, [type]: file.name }));
              resolve(publicUrl || '');
            } else {
              reject(new Error(`B2 failed ${xhr.status}`));
            }
          };
          xhr.send(file);
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(prev => ({ ...prev, [type]: errorMsg }));
      return '';
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const UploadStatus = ({ type, url }: { type: string; url: string }) => {
    if (uploading[type]) return <span style={{ fontSize: "12px", color: "#888" }}>⏳ Nahrávám...</span>;
    if (uploadError[type]) return <span style={{ fontSize: "12px", color: "#ff4444" }}>✗ {uploadError[type]}</span>;
    if (url) return <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ {uploadedNames[type] || "Nahráno"}</span>;
    return null;
  };

  const UploadProgressBar = ({ type }: { type: string }) => {
    const pct = uploadProgress[type] ?? 0;
    const isUploading = uploading[type];
    const isDone = !isUploading && pct >= 100;
    if (!isUploading && !isDone) return null;
    return (
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          {isUploading ? (
            <>
              <span style={{ fontSize: "12px", color: "#aaa" }}>Nahrávám…</span>
              <span style={{ fontSize: "12px", color: "#aaa" }}>{pct}%</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ Nahráno – bezpečné pokračovat</span>
              <span style={{ fontSize: "12px", color: "#4caf50" }}>100%</span>
            </>
          )}
        </div>
        <div style={{ height: "10px", background: "#1b1b1b", borderRadius: "999px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isDone
                ? "linear-gradient(90deg, #2e7d32, #4caf50)"
                : "linear-gradient(90deg, #0B99FC, #4cc3ff)",
              transition: "width 200ms ease, background 300ms ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <button className="btn btn-admin" onClick={() => { setShowForm(!showForm); setEditing(null); }} style={{ marginBottom: "16px" }}>
        {showForm ? "Zrušit" : "Přidat beat"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "3px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Název</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Umělec</label>
              <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>BPM</label>
              <input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: Number(e.target.value) })} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Tónina</label>
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Typ / Cena</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {PRICE_TYPES_BEAT.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setForm({ ...form, priceType: pt.id, price: pt.price })}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: form.priceType === pt.id ? "#fff" : "#000",
                      color: form.priceType === pt.id ? "#000" : "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                      fontSize: "13px",
                      fontWeight: form.priceType === pt.id ? 600 : 400,
                      textAlign: "center",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    <div>{pt.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{pt.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Publikovat</label>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Zvýraznit (Featured)</label>
              <input type="checkbox" checked={form.isHighlighted} onChange={(e) => setForm({ ...form, isHighlighted: e.target.checked })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Tagy (max 3)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Přidat tag" style={{ flex: 1 }} />
                <button type="button" className="btn" onClick={() => { if (tagInput && form.tags.length < 3) { setForm({ ...form, tags: [...form.tags, tagInput] }); setTagInput(""); } }}>+</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                {form.tags.map((tag, i) => (
                  <span key={i} style={{ padding: "4px 8px", border: "1px solid #fff", fontSize: "12px" }}>
                    {tag} <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Preview Audio</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={uploading["preview"]}
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await uploadFile(e.target.files[0], "preview");
                      if (url) setForm(f => ({ ...f, previewUrl: url as string }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-admin"
                  onClick={() => setB2PickerFor("preview")}
                  style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                  data-testid="button-browse-b2-preview"
                >
                  Browse B2
                </button>
              </div>
              <UploadProgressBar type="preview" />
              <div style={{ marginTop: "6px" }}><UploadStatus type="preview" url={form.previewUrl} /></div>
              {form.previewUrl && (
                <audio controls src={form.previewUrl} style={{ width: "100%", marginTop: "8px", height: "36px" }} />
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploading["artwork"]}
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "artwork");
                    if (url) setForm(f => ({ ...f, artworkUrl: url as string }));
                  }
                }}
                style={{ width: "100%" }}
              />
              <UploadProgressBar type="artwork" />
              <div style={{ marginTop: "6px" }}><UploadStatus type="artwork" url={form.artworkUrl} /></div>
              {form.artworkUrl && !uploading["artwork"] && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "8px" }}>
                  <img src={form.artworkUrl} alt="artwork preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "3px" }} />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, artworkUrl: "" }))}
                    style={{ background: "none", border: "1px solid #444", color: "#888", padding: "4px 10px", borderRadius: "3px", fontSize: "12px", cursor: "pointer", marginTop: "4px" }}
                    data-testid="button-delete-artwork-beat"
                  >Smazat obrázek</button>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Trackout (ZIP)</label>
              <button
                type="button"
                className="btn btn-admin"
                onClick={() => setB2PickerFor("trackout")}
                style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                data-testid="button-browse-b2-trackout"
              >
                Browse B2
              </button>
              <div style={{ marginTop: "6px" }}>
                {form.trackoutUrl && (
                  <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ {uploadedNames["trackout"] || form.trackoutUrl}</span>
                )}
                {!form.trackoutUrl && <UploadStatus type="trackout" url={form.trackoutUrl} />}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-filled"
            style={{ marginTop: "16px" }}
            disabled={Object.values(uploading).some(Boolean)}
          >
            {editing ? "Uložit změny" : "Přidat beat"}
          </button>
          {Object.values(uploading).some(Boolean) && (
            <span style={{ marginLeft: "12px", fontSize: "13px", color: "#888" }}>Čekám na dokončení nahrávání...</span>
          )}
        </form>
      )}

      {selectedBeats.length > 0 && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#1a1a1a", borderRadius: "3px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span data-testid="text-selected-count">{selectedBeats.length} vybráno</span>
          <button 
            className="btn btn-admin" 
            onClick={handleBulkDelete} 
            style={{ color: "#ff4444", borderColor: "#ff4444" }}
            data-testid="button-bulk-delete-beats"
          >
            Smazat vybrané
          </button>
          <button 
            className="btn btn-admin" 
            onClick={() => setSelectedBeats([])}
            data-testid="button-clear-selection"
          >
            Zrušit výběr
          </button>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={{ textAlign: "left", padding: "12px", width: "40px" }}>
              <input 
                type="checkbox" 
                checked={beats.length > 0 && selectedBeats.length === beats.length}
                onChange={handleSelectAll}
                data-testid="checkbox-select-all-beats"
              />
            </th>
            <th style={{ textAlign: "left", padding: "12px", width: "56px" }}></th>
            <th style={{ textAlign: "left", padding: "12px" }}>Název</th>
            <th style={{ textAlign: "left", padding: "12px" }}>BPM</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Featured</th>
            <th style={{ textAlign: "right", padding: "12px" }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {beats.map((beat: Beat) => (
            <tr
              key={beat.id}
              style={{
                borderBottom: "1px solid #222",
                background: hoveredBeatId === beat.id ? "#161616" : "transparent",
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={() => setHoveredBeatId(beat.id)}
              onMouseLeave={() => setHoveredBeatId(null)}
              onClick={() => { setEditing(beat); setShowForm(true); }}
              data-testid={`row-beat-${beat.id}`}
            >
              <td style={{ padding: "12px" }} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedBeats.includes(beat.id)}
                  onChange={() => handleSelectBeat(beat.id)}
                  data-testid={`checkbox-beat-${beat.id}`}
                />
              </td>
              <td style={{ padding: "8px 12px" }} onClick={(e) => toggleBeatPreview(beat, e)}>
                <div style={{ position: "relative", width: "40px", height: "40px", cursor: beat.preview_url ? "pointer" : "default", flexShrink: 0 }} title={beat.preview_url ? (previewBeatId === beat.id ? "Pozastavit náhled" : "Přehrát náhled") : "Bez náhledu"}>
                  {beat.artwork_url ? (
                    <img
                      src={beat.artwork_url}
                      alt={beat.title}
                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "3px", display: "block", transition: "opacity 0.15s", opacity: previewBeatId === beat.id ? 0.55 : 1 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                    />
                  ) : (
                    <div style={{ width: "40px", height: "40px", background: "#222", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "18px", color: "#444" }}>♪</span>
                    </div>
                  )}
                  {beat.preview_url && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "3px", background: previewBeatId === beat.id ? "rgba(0,0,0,0.4)" : "transparent", transition: "background 0.15s" }}>
                      {previewBeatId === beat.id ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      ) : hoveredBeatId === beat.id ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><path d="M5 3l14 9-14 9V3z"/></svg>
                      ) : null}
                    </div>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px" }}>{beat.title}</td>
              <td style={{ padding: "12px" }}>{beat.bpm}</td>
              <td style={{ padding: "12px" }}>{beat.is_published ? "Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px" }}>{beat.is_highlighted ? "Featured" : ""}</td>
              <td style={{ padding: "12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-admin" onClick={() => { setEditing(beat); setShowForm(true); }} style={{ marginRight: "8px" }} data-testid={`button-edit-beat-${beat.id}`}>Upravit</button>
                <button className="btn btn-admin" onClick={() => handleDelete(beat.id)} style={{ color: "#333", borderColor: "#333" }} data-testid={`button-delete-beat-${beat.id}`}>Smazat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {b2PickerFor && (
        <B2FilePicker
          onSelect={async (key) => {
            if (b2PickerFor === "preview") {
              try {
                const res = await fetch(`/api/upload/public-url?key=${encodeURIComponent(key)}&type=preview`, { credentials: "include" });
                const data = await res.json();
                setForm(f => ({ ...f, previewUrl: data.url || key }));
              } catch {
                setForm(f => ({ ...f, previewUrl: key }));
              }
            }
            if (b2PickerFor === "trackout") setForm(f => ({ ...f, trackoutUrl: key }));
          }}
          onClose={() => setB2PickerFor(null)}
        />
      )}
    </div>
  );
}

const PRICE_TYPES_KIT = [
  { id: "kit", label: "Kit", sublabel: "899 Kč", price: 899, isFree: false },
  { id: "promo", label: "Promo", sublabel: "Zdarma", price: 0, isFree: true },
] as const;

type KitPriceType = typeof PRICE_TYPES_KIT[number]["id"];

function KitsTab({ kits, showForm, setShowForm, editing, setEditing, onRefresh }: any) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "drum_kit",
    price: 899,
    priceType: "kit" as KitPriceType,
    isFree: false,
    numberOfSounds: 0,
    tags: [] as string[],
    previewUrl: "",
    previewUrls: [] as string[],
    fileUrl: "",
    artworkUrl: "",
    legalInfo: "",
    authorInfo: "",
    isPublished: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedKits, setSelectedKits] = useState<number[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [b2PickerFor, setB2PickerFor] = useState<string | null>(null);
  const [hoveredKitId, setHoveredKitId] = useState<number | null>(null);

  const handleSelectAll = () => {
    if (selectedKits.length === kits.length) {
      setSelectedKits([]);
    } else {
      setSelectedKits(kits.map((k: SoundKit) => k.id));
    }
  };

  const handleSelectKit = (id: number) => {
    setSelectedKits(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedKits.length === 0) return;
    if (!confirm(`Opravdu smazat ${selectedKits.length} vybraných kitů?`)) return;
    
    const res = await fetch("/api/sound-kits/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: selectedKits }),
    });
    
    if (res.ok) {
      setSelectedKits([]);
      onRefresh();
    } else {
      alert("Chyba při mazání kitů");
    }
  };

  useEffect(() => {
    if (editing) {
      const priceType: KitPriceType = editing.is_free ? "promo" : "kit";
      setForm({
        title: editing.title,
        description: editing.description || "",
        type: editing.type,
        price: editing.is_free ? 0 : (editing.price || 899),
        priceType,
        isFree: editing.is_free,
        numberOfSounds: editing.number_of_sounds,
        tags: editing.tags || [],
        previewUrl: editing.preview_url || "",
        previewUrls: editing.preview_urls || [],
        fileUrl: editing.file_url || "",
        artworkUrl: editing.artwork_url || "",
        legalInfo: editing.legal_info || "",
        authorInfo: editing.author_info || "",
        isPublished: editing.is_published,
      });
      setShowForm(true);
    }
  }, [editing, setShowForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/sound-kits/${editing.id}` : "/api/sound-kits";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", description: "", type: "drum_kit", price: 899, priceType: "kit", isFree: false, numberOfSounds: 0, tags: [], previewUrl: "", previewUrls: [], fileUrl: "", artworkUrl: "", legalInfo: "", authorInfo: "", isPublished: true });
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/sound-kits/${id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
  };

  const handleReorderKit = async (id: number, direction: "up" | "down") => {
    const sortedKits = [...kits].sort((a: SoundKit, b: SoundKit) => (a.order_index ?? a.id) - (b.order_index ?? b.id));
    const idx = sortedKits.findIndex((k: SoundKit) => k.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedKits.length) return;
    const a = sortedKits[idx];
    const b = sortedKits[swapIdx];
    await fetch("/api/sound-kits/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ swaps: [{ id: a.id, orderIndex: b.order_index ?? b.id }, { id: b.id, orderIndex: a.order_index ?? a.id }] }),
    });
    onRefresh();
  };

  const uploadFile = async (file: File, type: string) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadError(prev => ({ ...prev, [type]: "" }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    // Large ZIPs > 50MB use server POST (streaming, reliable)
    // Artwork always uses server upload to save locally (not B2)
    const isLargeFile = file.size > 50 * 1024 * 1024;
    const useServerUpload = isLargeFile || type === "beat" || type === "kit" || type === "trackout" || type === "artwork";

    try {
      if (useServerUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/upload?type=${encodeURIComponent(type)}`, true);
        xhr.timeout = 10 * 60 * 1000; // 10min timeout

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
            setUploadProgress(prev => ({ ...prev, [type]: pct }));
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.ontimeout = () => reject(new Error("Upload timeout"));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploadProgress(prev => ({ ...prev, [type]: 100 }));
                resolve(data.url);
              } catch (e) {
                reject(new Error("Invalid response"));
              }
            } else {
              reject(new Error(`Server ${xhr.status}: ${xhr.responseText}`));
            }
          };
          xhr.send(formData);
        });
      } else {
        // Small files: direct B2 presign (existing logic)
        const ext = file.name.split('.').pop() || 'zip';
        const contentType = file.type || '';

        const presignRes = await fetch(
          `/api/upload/presign?type=${encodeURIComponent(type)}&ext=${encodeURIComponent(ext)}&contentType=${encodeURIComponent(contentType)}`,
          { credentials: 'include' }
        );

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error || `Presign failed (${presignRes.status})`);
        }

        const { presignedUrl, publicUrl } = await presignRes.json();

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);
        if (contentType) xhr.setRequestHeader("Content-Type", contentType);

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
            setUploadProgress(prev => ({ ...prev, [type]: pct }));
          };

          xhr.onerror = () => reject(new Error("Upload failed (B2 CORS?)"));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(prev => ({ ...prev, [type]: 100 }));
              resolve(publicUrl || '');
            } else {
              reject(new Error(`B2 failed ${xhr.status}`));
            }
          };
          xhr.send(file);
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(prev => ({ ...prev, [type]: errorMsg }));
      return '';
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const UploadProgressBar = ({ type }: { type: string }) => {
    const pct = uploadProgress[type] ?? 0;
    const isUploading = uploading[type];
    const isDone = !isUploading && pct >= 100;
    if (!isUploading && !isDone) return null;
    return (
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          {isUploading ? (
            <>
              <span style={{ fontSize: "12px", color: "#aaa" }}>Nahrávám…</span>
              <span style={{ fontSize: "12px", color: "#aaa" }}>{pct}%</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ Nahráno – bezpečné pokračovat</span>
              <span style={{ fontSize: "12px", color: "#4caf50" }}>100%</span>
            </>
          )}
        </div>
        <div style={{ height: "10px", background: "#1b1b1b", borderRadius: "999px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isDone
                ? "linear-gradient(90deg, #2e7d32, #4caf50)"
                : "linear-gradient(90deg, #0B99FC, #4cc3ff)",
              transition: "width 200ms ease, background 300ms ease",
            }}
          />
        </div>
        {uploadError[type] && (
          <div style={{ marginTop: "6px", color: "#ff4444", fontSize: "12px" }}>✗ {uploadError[type]}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <button className="btn btn-admin" onClick={() => { setShowForm(!showForm); setEditing(null); }} style={{ marginBottom: "16px" }}>
        {showForm ? "Zrušit" : "Přidat zvukový kit"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "3px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Název</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Typ</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "12px" }}>
                <option value="drum_kit">Drum Kit</option>
                <option value="one_shot_kit">One Shot Kit</option>
                <option value="loop_kit">Loop Kit</option>
                <option value="one_shot_bundle">One Shot Bundle</option>
                <option value="drum_kit_bundle">Drum Kit Bundle</option>
                <option value="gross_beat_bank">Gross Beat Bank</option>
                <option value="loopy">Loopy</option>
                <option value="vyhodny_bundle">Výhodný Bundle</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Popis</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Typ / Cena</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {PRICE_TYPES_KIT.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setForm({ ...form, priceType: pt.id, price: pt.price, isFree: pt.isFree })}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: form.priceType === pt.id ? "#fff" : "#000",
                      color: form.priceType === pt.id ? "#000" : "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                      fontSize: "13px",
                      fontWeight: form.priceType === pt.id ? 600 : 400,
                      textAlign: "center",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    <div>{pt.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{pt.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Počet zvuků</label>
              <input type="number" value={form.numberOfSounds} onChange={(e) => setForm({ ...form, numberOfSounds: Number(e.target.value) })} style={{ width: "100%" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Tagy (max 10)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Přidat tag" style={{ flex: 1 }} />
                <button type="button" className="btn" onClick={() => { if (tagInput && form.tags.length < 10) { setForm({ ...form, tags: [...form.tags, tagInput] }); setTagInput(""); } }}>+</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                {form.tags.map((tag, i) => (
                  <span key={i} style={{ padding: "4px 8px", border: "1px solid #fff", fontSize: "12px" }}>
                    {tag} <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Preview Audio (lze přidat více)</label>
              {form.previewUrls.map((url, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <audio controls src={url} style={{ flex: 1, height: "36px" }} />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, previewUrls: f.previewUrls.filter((_, i) => i !== idx) }))}
                    style={{ background: "none", border: "1px solid #666", color: "#fff", padding: "4px 10px", cursor: "pointer", borderRadius: "2px", fontSize: "14px" }}
                  >×</button>
                </div>
              ))}
              <input type="file" accept="audio/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "preview");
                  if (url) setForm(f => ({ ...f, previewUrls: [...f.previewUrls, url as string] }));
                }
              }} style={{ width: "100%" }} />
              <UploadProgressBar type="preview" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>ZIP/RAR soubor</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="file" accept=".zip,.rar" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "kit"); setForm({ ...form, fileUrl: url as string }); } }} style={{ flex: 1 }} />
                <button
                  type="button"
                  className="btn btn-admin"
                  onClick={() => setB2PickerFor("kit")}
                  style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                  data-testid="button-browse-b2-kit"
                >
                  Browse B2
                </button>
              </div>
              <UploadProgressBar type="kit" />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 6px" }}>
                <div style={{ flex: 1, height: "1px", background: "#333" }} />
                <span style={{ fontSize: "11px", color: "#555", whiteSpace: "nowrap" }}>nebo Google Drive URL</span>
                <div style={{ flex: 1, height: "1px", background: "#333" }} />
              </div>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={form.fileUrl?.startsWith("https://") || form.fileUrl?.startsWith("http://") ? form.fileUrl : ""}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "3px", fontSize: "13px", boxSizing: "border-box" }}
                data-testid="input-gdrive-url"
              />
              <p style={{ fontSize: "11px", color: "#555", marginTop: "5px" }}>
                Nastav sdílení složky: Sdílet → Kdokoli se odkazem → Prohlížeč
              </p>
              {form.fileUrl && !uploading["kit"] && (
                <div style={{ marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ {form.fileUrl}</span>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "artwork"); setForm({ ...form, artworkUrl: url as string }); } }} style={{ width: "100%" }} />
              <UploadProgressBar type="artwork" />
              {form.artworkUrl && !uploading["artwork"] && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "8px" }}>
                  <img src={form.artworkUrl} alt="artwork preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "3px" }} />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, artworkUrl: "" }))}
                    style={{ background: "none", border: "1px solid #444", color: "#888", padding: "4px 10px", borderRadius: "3px", fontSize: "12px", cursor: "pointer", marginTop: "4px" }}
                    data-testid="button-delete-artwork-kit"
                  >Smazat obrázek</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
            <button type="submit" className="btn btn-filled">{editing ? "Uložit změny" : "Přidat kit"}</button>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> <span>Publikovat</span></label>
          </div>
        </form>
      )}

      {selectedKits.length > 0 && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#1a1a1a", borderRadius: "3px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span data-testid="text-selected-kits-count">{selectedKits.length} vybráno</span>
          <button 
            className="btn btn-admin" 
            onClick={handleBulkDelete} 
            style={{ color: "#ff4444", borderColor: "#ff4444" }}
            data-testid="button-bulk-delete-kits"
          >
            Smazat vybrané
          </button>
          <button 
            className="btn btn-admin" 
            onClick={() => setSelectedKits([])}
            data-testid="button-clear-kits-selection"
          >
            Zrušit výběr
          </button>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={{ textAlign: "left", padding: "12px", width: "40px" }}>
              <input 
                type="checkbox" 
                checked={kits.length > 0 && selectedKits.length === kits.length}
                onChange={handleSelectAll}
                data-testid="checkbox-select-all-kits"
              />
            </th>
            <th style={{ padding: "12px", width: "56px" }}></th>
            <th style={{ textAlign: "left", padding: "12px" }}>Název</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Typ</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Cena</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
            <th style={{ textAlign: "right", padding: "12px" }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {[...kits].sort((a: SoundKit, b: SoundKit) => (a.order_index ?? a.id) - (b.order_index ?? b.id)).map((kit: SoundKit, rowIdx: number, sortedArr: SoundKit[]) => (
            <tr
              key={kit.id}
              style={{
                borderBottom: "1px solid #222",
                background: hoveredKitId === kit.id ? "#161616" : "transparent",
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={() => setHoveredKitId(kit.id)}
              onMouseLeave={() => setHoveredKitId(null)}
              onClick={() => { setEditing(kit); setShowForm(true); }}
              data-testid={`row-kit-${kit.id}`}
            >
              <td style={{ padding: "12px" }} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedKits.includes(kit.id)}
                  onChange={() => handleSelectKit(kit.id)}
                  data-testid={`checkbox-kit-${kit.id}`}
                />
              </td>
              <td style={{ padding: "8px 12px" }}>
                {kit.artwork_url ? (
                  <img
                    src={kit.artwork_url}
                    alt={kit.title}
                    style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "3px", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  />
                ) : (
                  <div style={{ width: "40px", height: "40px", background: "#222", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "18px", color: "#444" }}>◈</span>
                  </div>
                )}
              </td>
              <td style={{ padding: "12px" }}>{kit.title}</td>
              <td style={{ padding: "12px" }}>{kit.type}</td>
              <td style={{ padding: "12px" }}>{kit.is_free ? "Zdarma" : `${kit.price} CZK`}</td>
              <td style={{ padding: "12px" }}>{kit.is_published ? "Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleReorderKit(kit.id, "up")}
                  disabled={rowIdx === 0}
                  title="Posunout nahoru"
                  style={{ background: "transparent", border: "1px solid #333", color: rowIdx === 0 ? "#333" : "#888", cursor: rowIdx === 0 ? "default" : "pointer", padding: "4px 7px", borderRadius: "3px", marginRight: "4px", fontSize: "12px" }}
                >▲</button>
                <button
                  onClick={() => handleReorderKit(kit.id, "down")}
                  disabled={rowIdx === sortedArr.length - 1}
                  title="Posunout dolů"
                  style={{ background: "transparent", border: "1px solid #333", color: rowIdx === sortedArr.length - 1 ? "#333" : "#888", cursor: rowIdx === sortedArr.length - 1 ? "default" : "pointer", padding: "4px 7px", borderRadius: "3px", marginRight: "8px", fontSize: "12px" }}
                >▼</button>
                <button className="btn btn-admin" onClick={() => { setEditing(kit); setShowForm(true); }} style={{ marginRight: "8px" }} data-testid={`button-edit-kit-${kit.id}`}>Upravit</button>
                <button className="btn btn-admin" onClick={() => handleDelete(kit.id)} style={{ color: "#333", borderColor: "#333" }} data-testid={`button-delete-kit-${kit.id}`}>Smazat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {b2PickerFor && (
        <B2FilePicker
          onSelect={(key) => {
            if (b2PickerFor === "kit") setForm(f => ({ ...f, fileUrl: key }));
          }}
          onClose={() => setB2PickerFor(null)}
        />
      )}
    </div>
  );
}

function RevenueChart({ orders }: { orders: any[] }) {
  const DAYS = 30;
  const W = 700, H = 220, PAD_L = 64, PAD_R = 16, PAD_T = 16, PAD_B = 48;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Build day buckets for last N days
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const days: { label: string; date: string; revenue: number; count: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ label: i % 5 === 0 ? `${d.getDate()}.${d.getMonth() + 1}.` : "", date: key, revenue: 0, count: 0 });
  }

  for (const o of orders) {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    const slot = days.find(d => d.date === key);
    if (slot) { slot.revenue += Number(o.total) || 0; slot.count += 1; }
  }

  const maxRev = Math.max(...days.map(d => d.revenue), 1);
  const maxCount = Math.max(...days.map(d => d.count), 1);

  // Revenue line points
  const revPoints = days.map((d, i) => {
    const x = PAD_L + (i / (DAYS - 1)) * chartW;
    const y = PAD_T + chartH - (d.revenue / maxRev) * chartH;
    return `${x},${y}`;
  }).join(" ");

  // Order count bars
  const barW = chartW / DAYS * 0.55;

  // Y axis ticks (revenue)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ y: PAD_T + chartH - f * chartH, val: Math.round(f * maxRev) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <line key={i} x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="#222" strokeWidth="1" />
      ))}
      {/* Y axis labels */}
      {yTicks.map((t, i) => (
        <text key={i} x={PAD_L - 6} y={t.y + 4} textAnchor="end" fill="#666" fontSize="10" fontFamily="Helvetica Neue, sans-serif">
          {t.val >= 1000 ? `${Math.round(t.val / 1000)}k` : t.val}
        </text>
      ))}
      {/* Count bars (light grey, behind) */}
      {days.map((d, i) => {
        const x = PAD_L + (i / (DAYS - 1)) * chartW;
        const barH = (d.count / maxCount) * chartH;
        return <rect key={i} x={x - barW / 2} y={PAD_T + chartH - barH} width={barW} height={barH} fill="#1a1a1a" rx="1" />;
      })}
      {/* Revenue area fill */}
      <polyline
        points={`${PAD_L},${PAD_T + chartH} ${revPoints} ${W - PAD_R},${PAD_T + chartH}`}
        fill="rgba(255,255,255,0.04)"
        stroke="none"
      />
      {/* Revenue line */}
      <polyline points={revPoints} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data point dots */}
      {days.map((d, i) => {
        if (d.revenue === 0) return null;
        const x = PAD_L + (i / (DAYS - 1)) * chartW;
        const y = PAD_T + chartH - (d.revenue / maxRev) * chartH;
        return <circle key={i} cx={x} cy={y} r="3" fill="#fff" />;
      })}
      {/* X axis labels */}
      {days.map((d, i) => d.label ? (
        <text key={i} x={PAD_L + (i / (DAYS - 1)) * chartW} y={H - 8} textAnchor="middle" fill="#555" fontSize="9" fontFamily="Helvetica Neue, sans-serif">
          {d.label}
        </text>
      ) : null)}
      {/* Axes */}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + chartH} stroke="#333" strokeWidth="1" />
      <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="#333" strokeWidth="1" />
    </svg>
  );
}

function OrdersList({ orders, onRefresh }: { orders: any[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(`Opravdu smazat objednávku #${id}?`)) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 90px 100px 120px", gap: "8px", padding: "8px", fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #1a1a1a" }}>
        <div>ID</div><div>Email / Kupující</div><div>Celkem</div><div>Status</div><div>Datum</div><div>Akce</div>
      </div>
      {orders.map((order: any) => {
        const isPaid = order.status === "paid" || order.status === "completed";
        const items: any[] = Array.isArray(order.items) ? order.items : [];
        const beatItems = items.filter((i: any) => i.productType === "beat");
        const isExpanded = expandedId === order.id;
        return (
          <div key={order.id} style={{ border: "1px solid #1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 90px 100px 120px", gap: "8px", padding: "10px 8px", alignItems: "center", background: isExpanded ? "#161616" : "transparent", cursor: "pointer" }}
              onClick={() => setExpandedId(isExpanded ? null : order.id)}>
              <div style={{ fontSize: "12px", color: "#666" }}>#{order.id}</div>
              <div>
                <div style={{ fontSize: "13px" }}>{order.email}</div>
                {order.buyer_legal_name && <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{order.buyer_legal_name}{order.buyer_artist_name ? ` · ${order.buyer_artist_name}` : ""}</div>}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{Number(order.total).toLocaleString("cs-CZ")} Kč</div>
              <div>
                <span style={{ fontSize: "11px", padding: "3px 7px", borderRadius: "3px", background: isPaid ? "rgba(36,224,83,0.12)" : "rgba(255,255,255,0.05)", color: isPaid ? "#24e053" : "#888", border: `1px solid ${isPaid ? "rgba(36,224,83,0.3)" : "#2a2a2a"}` }}>
                  {order.status}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#555" }}>{isExpanded ? "▲" : "▼"}</span>
                <button
                  onClick={(e) => handleDelete(e, order.id)}
                  data-testid={`button-delete-order-${order.id}`}
                  style={{ background: "none", border: "1px solid #3a1a1a", borderRadius: "3px", color: "#884444", fontSize: "11px", padding: "2px 8px", cursor: "pointer" }}
                  title="Smazat objednávku"
                >
                  Smazat
                </button>
              </div>
            </div>
            {isExpanded && (
              <div style={{ borderTop: "1px solid #1a1a1a", padding: "14px 12px", background: "#090909" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Právní jméno</div>
                    <div style={{ fontSize: "13px" }}>{order.buyer_legal_name || <span style={{ color: "#444" }}>—</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Umělecké jméno</div>
                    <div style={{ fontSize: "13px" }}>{order.buyer_artist_name || <span style={{ color: "#444" }}>—</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Adresa</div>
                    <div style={{ fontSize: "13px" }}>{order.buyer_address || <span style={{ color: "#444" }}>—</span>}</div>
                  </div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Položky objednávky</div>
                  {items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #141414", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "13px" }}>{item.title}</span>
                        <span style={{ fontSize: "11px", color: "#555", marginLeft: "8px" }}>{item.productType}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px" }}>{Number(item.price).toLocaleString("cs-CZ")} Kč</span>
                        {item.productType === "beat" && (
                          <a
                            href={`/api/admin/orders/${order.id}/contract/${idx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "11px", color: "#aaa", border: "1px solid #2a2a2a", borderRadius: "3px", padding: "3px 8px", textDecoration: "none", background: "#161616" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            📄 Smlouva
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {beatItems.length > 0 && !order.buyer_legal_name && (
                  <div style={{ fontSize: "11px", color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "3px", padding: "8px 10px" }}>
                    ⚠ Kupující nevyplnil právní jméno a adresu — smlouva bude obsahovat pouze email.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab({ orders, onRefresh }: any) {
  const totalRevenue = orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
  const paidOrders = orders.filter((o: any) => o.status === "paid" || o.status === "completed");
  const avgOrder = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  const statCard = (label: string, value: string, sub?: string) => (
    <div style={{ flex: 1, padding: "20px", border: "1px solid #222", borderRadius: "4px", textAlign: "left", minWidth: 0 }}>
      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#555", marginTop: "6px" }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {statCard("Celkové tržby", `${totalRevenue.toLocaleString("cs-CZ")} Kč`, `${orders.length} objednávek celkem`)}
        {statCard("Zaplaceno", `${paidOrders.length}`, `z ${orders.length} objednávek`)}
        {statCard("Průměrná objednávka", avgOrder > 0 ? `${avgOrder.toLocaleString("cs-CZ")} Kč` : "—", "zaplacené objednávky")}
      </div>

      {/* Chart */}
      <div style={{ border: "1px solid #222", borderRadius: "4px", padding: "20px 12px 8px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingLeft: "52px" }}>
          <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tržby – posledních 30 dní (Kč)</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: 20, height: 2, background: "#fff", borderRadius: 1 }} />
              Tržby
            </span>
            <span style={{ fontSize: "11px", color: "#555", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#1a1a1a", border: "1px solid #333", borderRadius: 2 }} />
              Objednávky
            </span>
          </div>
        </div>
        {orders.length === 0 ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "13px" }}>
            Zatím žádné objednávky
          </div>
        ) : (
          <RevenueChart orders={orders} />
        )}
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#444", fontSize: "13px" }}>Žádné objednávky</div>
      ) : (
        <OrdersList orders={orders} onRefresh={onRefresh} />
      )}
    </div>
  );
}

const DEFAULT_CONTRACT_TEMPLATE = `SMLUVNÍ STRANY
Tato licenční smlouva (dále jen „Smlouva") je uzavřena dne {{DATUM}} (dále jen „Den účinnosti") mezi těmito stranami:

Nabyvatel licence: {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}}, s bydlištěm na adrese {{ADRESA}}, Česká republika (dále jen „Nabyvatel").

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, s bydlištěm na adrese Bedovická č. 193, Třebechovice pod Orebem, 503 46, Česká republika (dále jen „Poskytovatel").

Tato Smlouva se řídí zákonem č. 89/2012 Sb., občanský zákoník (dále jen „OZ"), a zákonem č. 121/2000 Sb., o právu autorském (dále jen „AZ").

PŘEDMĚT SMLOUVY
Poskytovatel prohlašuje, že je nositelem majetkových autorských práv k hudebnímu dílu s názvem {{BEAT_NAZEV}} (dále jen „Dílo") ve smyslu § 12 a násl. AZ. Dílo bylo vytvořeno Vojtěchem Vojkovským („Autor") v rámci činnosti Poskytovatele.

Dle § 46 AZ udělá Poskytovatel Nabyvateli níže specifikované oprávnění k výkonu práva Dílo užít.

1. PRÁVO NA POŘÍZENÍ ZVUKOVÉHO ZÁZNAMU
Poskytovatel udělí Nabyvateli exkluzivní licenci k zaznamenání vokální složky synchronizované s Dílem, zčásti nebo v celém rozsahu a v podstatě v jeho původní formě (dále jen „Zvukový záznam").

2. PRÁVO NA ROZMNOŽOVÁNÍ A ROZŠIŘOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při rozmnožování, výrobě a rozšiřování ve formě gramofonových desek, kazet, CD, digitálních stažení, jiných zvukových nosičů a digitálních záznamů (souhrnně „Záznamy") po celém světě v neomezeném počtu kopií.

Toto právo odpovídá § 13 a § 14 AZ (právo na rozmnožování a rozšiřování rozmnoženin díla).

3. PRÁVO NA SDĚLOVÁNÍ VEŘEJNOSTI A STREAMOVÁNÍ
Nabyvateli je uděleno oprávnění ke sdělování Zvukového záznamu veřejnosti prostřednictvím internetu bez omezení počtu stažení či streamů - jak bezplatných, tak pro komerční účely (např. Spotify, Apple Music a podobné platformy).

Toto právo vychází z § 18 AZ (právo na sdělování díla veřejnosti).

4. SYNCHRONIZAČNÍ PRÁVA
Poskytovatel udělí Nabyvateli neomezená synchronizační práva k užití Díla v hudebních videích šířených online (YouTube, Vimeo apod.) bez omezení počtu přehrání.

Neomezená synchronizační práva jsou rovněž udělena pro distribuci prostřednictvím televizního vysílání, filmů nebo počítačových her.

5. PRÁVO NA VEŘEJNÉ PROVOZOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při neomezeném počtu nevýdělečných i výdělečných vystoupení, show a koncertů. Nabyvatel je oprávněn přijímat odměnu z vystoupení realizovaných na základě této licence.

Toto právo odpovídá § 20 AZ (provozování díla ze záznamu a přenos provozování díla).

6. PRÁVO NA VYSÍLÁNÍ
Poskytovatel udělí Nabyvateli právo na vysílání Zvukového záznamu neomezeným počtem rozhlasových stanic.

Toto právo odpovídá § 19 a § 21 AZ (vysílání díla rozhlasem nebo televizí).

7. UVEDENÍ AUTORSTVÍ
Nabyvatel je povinen v souladu s § 11 odst. 2 AZ uvádět původní autorství Díla přiměřeným způsobem ve všech médiích a formátech pod jménem „VOODOO808" – písemně kde je to možné, jinak ústně.

8. ODMĚNA ZA LICENCI
Jako protiplnění za práva udělená touto Smlouvou je Nabyvatel povinen zaplatit Poskytovateli jednorázovou odměnu ve výši {{CENA}}, splatnou Vojtěchu Vojkovskému, přičemž převzetí tohoto plnění je tímto potvrzeno.

Pokud Nabyvatel nesplní povinnost platby, nedostojí jiným závazkům dle této Smlouvy nebo bude-li mít nedostatečný zůstatek na bankovním účtu, je Poskytovatel oprávněn Smlouvu vypovědět písemným oznámením doručeným Nabyvateli dle § 2001 a násl. OZ.

Taková výpověď způsobí, že rozmnožování, výroba a/nebo distribuce Záznamů, za něž nebylo zaplaceno, bude posuzována jako porušení autorských práv dle AZ.

Dle § 2 odst. 1 OZ a § 46 odst. 3 AZ musí být výpověď licence provedena písemnou formou. Licence zaniká uplynutím výpovědní doby, která činí 30 dní od doručení výpovědi.

9. PŘEDÁNÍ DÍLA
Dílo bude Nabyvateli předáno ve formě souboru ve vysoké kvalitě (WAV + stems) prostřednictvím e-mailu na adresu, kterou Nabyvatel Poskytovateli sdělí. Nabyvatel obdrží e-mail s přílohou nebo odkazem ke stažení Díla.

10. ZVUKOVÉ VZORKY (SAMPLESY)
Zajištění clearance práv třetích stran k případným zvukovým vzorkům obsaženým v Dílu je výlučnou odpovědností Nabyvatele.

11. OMEZENÍ A NEPŘEVODITELNOST
Tato licence je nepřevoditelná a vztahuje se výhradně na specifikované Dílo. Tato Smlouva představuje úplnou dohodu mezi Poskytovatelem a Nabyvatelem týkající se Díla a je závazná pro obě smluvní strany, jakož i pro jejich právní nástupce a zástupce.

Dle § 48 AZ nelze licenci bez souhlasu autora postoupit třetí osobě, ledaže je licence převedena spolu s podnikem nebo jeho částí.

12. AUTORSKÝ PODÍL A NAKLADATELSKÁ PRÁVA
Ohledně nakladatelských práv a vlastnictví k podkladovému Dílu vtělenému do Zvukového záznamu smluvní strany sjednávají tento podíl:
• Poskytovatel vlastní a spravuje 50 % tzv. „autorského podílu" (Writer's Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 50 % tzv. „nakladatelského podílu" (Publisher's Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 3 % tzv. „licenčních poplatků z masteru" (Master Royalties), vypočtených z čistého zisku po odečtení všech nákladů Nabyvatele.

Rozdělení autorských podílů je v souladu s § 100 a násl. AZ. Strany mohou smluvně sjednat rozdělení výnosu z kolektivní správy práv (OSA, INTERGRAM apod.).

13. ROZHODNÉ PRÁVO A ŘEŠENÍ SPORŮ
Tato Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 121/2000 Sb., autorský zákon, v jejich platném znění.

Veškeré spory vzniklé z této Smlouvy budou strany řešit přednostně smírnou cestou. Nebude-li dosaženo dohody, rozhodne věcně a místně příslušný soud České republiky.

ELEKTRONICKÉ PŘIJETÍ PODMÍNEK
Tato Smlouva nabývá platnosti a účinnosti okamžikem dokončení platby za licenci prostřednictvím platformy VOODOO808. Nabyvatel — {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}} — dokončením nákupu výslovně potvrzuje, že:

• si tuto Smlouvu přečetl/a a porozuměl/a jejímu obsahu v plném rozsahu,
• souhlasí se všemi podmínkami zde uvedenými,
• tato Smlouva odpovídá jeho/její pravé a svobodné vůli a je uzavírána dobrovolně, nikoli v tísni ani za nápadně nevýhodných podmínek.

Elektronické potvrzení nákupu (platební transakce) nahrazuje vlastnoruční podpis ve smyslu § 562 zákona č. 89/2012 Sb., občanský zákoník, a má stejné právní účinky jako podpis listinný. Datum uzavření Smlouvy je {{DATUM}}.

Tato Smlouva je vyhotovena a doručena Nabyvateli elektronicky prostřednictvím e-mailu. Fyzický výtisk ani vlastnoruční podpisy nejsou k platnosti a účinnosti Smlouvy vyžadovány.

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, potvrzuje uzavření Smlouvy vydáním potvrzení o přijetí platby a odesláním licenčních souborů Nabyvateli.`;

const PLACEHOLDER_GUIDE = [
  { ph: "{{DATUM}}", desc: "Datum uzavření smlouvy (automaticky)" },
  { ph: "{{PRAVNI_JMENO}}", desc: "Právní jméno kupujícího" },
  { ph: "{{UMELECKE_JMENO}}", desc: "Umělecké jméno kupujícího" },
  { ph: "{{ADRESA}}", desc: "Adresa kupujícího" },
  { ph: "{{BEAT_NAZEV}}", desc: "Název beatu nebo sound kitu z objednávky" },
  { ph: "{{CENA}}", desc: "Cena licence (automaticky)" },
];

function LicensesTab({ licenses, onRefresh }: any) {
  const emptyForm = { name: "", description: "", price: 0, file_types: [] as string[], terms_text: "", is_negotiable: false, is_active: true, contract_template: DEFAULT_CONTRACT_TEMPLATE };
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const fieldStyle: React.CSSProperties = { width: "100%", background: "#111111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", fontSize: "13px", borderRadius: "3px", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          price: createForm.price,
          fileTypes: createForm.file_types,
          termsText: createForm.terms_text,
          isNegotiable: createForm.is_negotiable,
          isActive: createForm.is_active,
          contractTemplate: createForm.contract_template,
        }),
      });
      setShowCreate(false);
      setCreateForm(emptyForm);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (license: LicenseType) => {
    setEditId(license.id);
    setEditForm({
      name: license.name,
      description: license.description || "",
      price: license.price,
      file_types: license.file_types || [],
      terms_text: license.terms_text || "",
      is_negotiable: license.is_negotiable,
      is_active: license.is_active,
      contract_template: license.contract_template || DEFAULT_CONTRACT_TEMPLATE,
    });
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/licenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          fileTypes: editForm.file_types,
          termsText: editForm.terms_text,
          isNegotiable: editForm.is_negotiable,
          isActive: editForm.is_active,
          contractTemplate: editForm.contract_template,
        }),
      });
      setEditId(null);
      setEditForm(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat tuto licenci?")) return;
    await fetch(`/api/admin/licenses/${id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
  };

  const previewContract = async (template: string) => {
    try {
      const res = await fetch("/api/admin/contracts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ template }),
      });
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml("<p style='padding:40px;color:#666'>Chyba při načítání náhledu.</p>");
    }
  };

  const renderContractForm = (form: any, setForm: (f: any) => void) => (
    <div style={{ marginTop: "20px", borderTop: "1px solid #1f1f1f", paddingTop: "16px" }}>
      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Šablona smlouvy</div>
      <div style={{ marginBottom: "12px", padding: "12px", background: "#080808", border: "1px solid #1a1a1a", borderRadius: "3px" }}>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>Dostupné proměnné (automaticky doplněny při nákupu):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {PLACEHOLDER_GUIDE.map(({ ph, desc }) => (
            <div key={ph} style={{ fontSize: "10px", background: "#161616", border: "1px solid #222", borderRadius: "3px", padding: "3px 7px" }} title={desc}>
              <span style={{ color: "#aaa", fontFamily: "monospace" }}>{ph}</span>
              <span style={{ color: "#555", marginLeft: "6px" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
      <textarea
        value={form.contract_template || ""}
        onChange={(e) => setForm({ ...form, contract_template: e.target.value })}
        style={{ ...fieldStyle, minHeight: "320px", resize: "vertical", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.6" }}
        placeholder="Vložte text smlouvy s proměnnými jako {{DATUM}}, {{PRAVNI_JMENO}} atd."
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button type="button" className="btn btn-admin" style={{ fontSize: "12px", padding: "6px 12px" }}
          onClick={() => setForm({ ...form, contract_template: DEFAULT_CONTRACT_TEMPLATE })}>
          Načíst výchozí šablonu
        </button>
        <button type="button" className="btn btn-admin" style={{ fontSize: "12px", padding: "6px 12px" }}
          onClick={() => previewContract(form.contract_template || DEFAULT_CONTRACT_TEMPLATE)}>
          Náhled smlouvy
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {previewHtml && (
        <div
          onClick={() => setPreviewHtml(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.92)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: "24px 16px 48px" }}
        >
          {/* Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "794px", marginBottom: "16px", flexShrink: 0 }}
          >
            <span style={{ fontWeight: "600", color: "#ddd", fontSize: "13px", letterSpacing: "0.04em" }}>Náhled smlouvy (vzorová data)</span>
            <button onClick={() => setPreviewHtml(null)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", fontSize: "13px", cursor: "pointer", color: "#ccc", padding: "4px 12px" }}>Zavřít ×</button>
          </div>
          {/* A4 paper */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "794px",
              minHeight: "1123px",
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              borderRadius: "2px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <iframe
              srcDoc={previewHtml}
              style={{ width: "100%", height: "1123px", border: "none", display: "block" }}
              title="Náhled smlouvy"
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", color: "#666" }}>Celkem licencí: {licenses.length}</div>
        <button className="btn btn-admin" data-testid="button-add-license" onClick={() => { setShowCreate(!showCreate); setEditId(null); }}>
          {showCreate ? "Zrušit" : "+ Přidat licenci"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ marginBottom: "24px", padding: "20px", border: "1px solid #2a2a2a", borderRadius: "4px", background: "#111111" }}>
          <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Nová licence</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Název *</label>
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required style={fieldStyle} placeholder="např. Exkluzivní licence" />
            </div>
            <div>
              <label style={labelStyle}>Cena (CZK) *</label>
              <input type="number" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) })} style={fieldStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Popis</label>
              <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} style={{ ...fieldStyle, minHeight: "64px" }} />
            </div>
            <div>
              <label style={labelStyle}>Typy souborů (oddělte čárkou)</label>
              <input value={(createForm.file_types || []).join(", ")} onChange={(e) => setCreateForm({ ...createForm, file_types: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} style={fieldStyle} placeholder="WAV, MP3, Stems" />
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" checked={createForm.is_active} onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })} /> Aktivní
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" checked={createForm.is_negotiable} onChange={(e) => setCreateForm({ ...createForm, is_negotiable: e.target.checked })} /> Na vyžádání
              </label>
            </div>
          </div>
          {renderContractForm(createForm, setCreateForm)}
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <button type="submit" className="btn btn-filled" disabled={saving}>{saving ? "Ukládám..." : "Uložit licenci"}</button>
            <button type="button" className="btn btn-admin" onClick={() => setShowCreate(false)}>Zrušit</button>
          </div>
        </form>
      )}

      {licenses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#555" }}>Žádné licence. Přidejte první licenci tlačítkem výše.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {licenses.map((license: LicenseType) => (
            <div key={license.id} style={{ border: "1px solid #1f1f1f", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", background: expandedId === license.id ? "#161616" : "#111111" }}
                onClick={() => setExpandedId(expandedId === license.id ? null : license.id)}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{license.name}</span>
                  {license.description && <span style={{ color: "#555", fontSize: "12px", marginLeft: "10px" }}>{license.description}</span>}
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{Number(license.price).toLocaleString("cs-CZ")} CZK</span>
                  {(license.file_types || []).map((ft: string) => (
                    <span key={ft} style={{ fontSize: "10px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "3px", padding: "2px 6px", color: "#aaa" }}>{ft.toUpperCase()}</span>
                  ))}
                  <span style={{ fontSize: "11px", color: license.is_active ? "#4caf50" : "#888" }}>{license.is_active ? "Aktivní" : "Neaktivní"}</span>
                  <span style={{ fontSize: "11px", color: license.contract_template ? "#4caf50" : "#ff6b6b" }}>{license.contract_template ? "✓ Smlouva" : "✗ Bez smlouvy"}</span>
                  <span style={{ color: "#555", fontSize: "16px" }}>{expandedId === license.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedId === license.id && (
                <div style={{ borderTop: "1px solid #1a1a1a", padding: "16px", background: "#080808" }}>
                  {editId === license.id ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={labelStyle}>Název *</label>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={fieldStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Cena (CZK)</label>
                          <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} style={fieldStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={labelStyle}>Popis</label>
                          <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ ...fieldStyle, minHeight: "56px" }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Typy souborů (oddělte čárkou)</label>
                          <input value={(editForm.file_types || []).join(", ")} onChange={(e) => setEditForm({ ...editForm, file_types: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} style={fieldStyle} />
                        </div>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} /> Aktivní
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                            <input type="checkbox" checked={editForm.is_negotiable} onChange={(e) => setEditForm({ ...editForm, is_negotiable: e.target.checked })} /> Na vyžádání
                          </label>
                        </div>
                      </div>
                      {renderContractForm(editForm, setEditForm)}
                      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                        <button className="btn btn-filled" onClick={() => handleSaveEdit(license.id)} disabled={saving}>{saving ? "Ukládám..." : "Uložit"}</button>
                        <button className="btn btn-admin" onClick={() => { setEditId(null); setEditForm(null); }}>Zrušit</button>
                        <button className="btn" style={{ marginLeft: "auto", color: "#ff4444", border: "1px solid #ff4444" }} onClick={() => handleDelete(license.id)}>Smazat</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>Cena</div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{Number(license.price).toLocaleString("cs-CZ")} CZK</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>Soubory</div>
                          <div style={{ fontSize: "13px" }}>{(license.file_types || []).join(", ") || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>Smlouva</div>
                          <div style={{ fontSize: "13px", color: license.contract_template ? "#4caf50" : "#ff6b6b" }}>
                            {license.contract_template ? "Šablona nastavena" : "Není nastavena"}
                          </div>
                        </div>
                      </div>
                      {license.contract_template && (
                        <div style={{ marginBottom: "12px", padding: "10px 14px", background: "#111111", border: "1px solid #1a1a1a", borderRadius: "3px", fontSize: "11px", color: "#555", fontFamily: "monospace", maxHeight: "80px", overflow: "hidden", whiteSpace: "pre-wrap" }}>
                          {license.contract_template.slice(0, 200)}...
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-admin" data-testid={`button-edit-license-${license.id}`} onClick={() => handleEdit(license)}>Upravit</button>
                        {license.contract_template && (
                          <button className="btn btn-admin" onClick={() => previewContract(license.contract_template!)}>Náhled smlouvy</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CharCounter({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const len = value.length;
  const color = len >= ideal[0] && len <= ideal[1] ? "#4caf50" : len > 0 && len <= max ? "#f59e0b" : len > max ? "#ef4444" : "#555";
  return (
    <span style={{ fontSize: "11px", color, marginLeft: "6px" }}>
      {len}/{max}
    </span>
  );
}

function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayTitle = title.length > 65 ? title.slice(0, 62) + "..." : title;
  const displayDesc = description.length > 165 ? description.slice(0, 162) + "..." : description;
  return (
    <div style={{ background: "#fff", borderRadius: "8px", padding: "16px 20px", maxWidth: "600px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "12px", color: "#fff", fontWeight: "bold" }}>V</span>
        </div>
        <div>
          <div style={{ fontSize: "14px", color: "#202124", fontWeight: 500 }}>VOODOO808</div>
          <div style={{ fontSize: "12px", color: "#5f6368" }}>{url}</div>
        </div>
      </div>
      <div style={{ fontSize: "20px", color: "#1a0dab", lineHeight: "1.3", marginBottom: "4px", cursor: "pointer" }}>
        {displayTitle || <span style={{ color: "#ccc" }}>Nadpis stránky...</span>}
      </div>
      <div style={{ fontSize: "14px", color: "#4d5156", lineHeight: "1.5" }}>
        {displayDesc || <span style={{ color: "#ccc" }}>Popis stránky...</span>}
      </div>
    </div>
  );
}

function SEOSection({
  label, url, titleKey, descKey, keywordsKey, values, onChange, onSave, saving, saved,
}: {
  label: string; url: string; titleKey: string; descKey: string; keywordsKey: string;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const title = values[titleKey] || "";
  const description = values[descKey] || "";
  const keywords = values[keywordsKey] || "";
  const fieldStyle: React.CSSProperties = { width: "100%", background: "#111111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", fontSize: "13px", borderRadius: "3px", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" };

  return (
    <div style={{ border: "1px solid #1f1f1f", borderRadius: "4px", padding: "20px", marginBottom: "16px" }}>
      <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", borderBottom: "1px solid #1a1a1a", paddingBottom: "10px" }}>
        {label}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>
              Titulek stránky
              <CharCounter value={title} ideal={[50, 65]} max={70} />
            </label>
            <input
              value={title}
              onChange={(e) => onChange(titleKey, e.target.value)}
              placeholder="Titulek pro Google..."
              style={fieldStyle}
              data-testid={`input-seo-title-${titleKey}`}
            />
            <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>Ideálně 50–65 znaků</div>
          </div>

          <div>
            <label style={labelStyle}>
              Meta popis
              <CharCounter value={description} ideal={[140, 165]} max={180} />
            </label>
            <textarea
              value={description}
              onChange={(e) => onChange(descKey, e.target.value)}
              placeholder="Krátký popis stránky pro Google..."
              rows={3}
              style={{ ...fieldStyle, resize: "vertical", lineHeight: "1.5" }}
              data-testid={`textarea-seo-desc-${descKey}`}
            />
            <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>Ideálně 140–165 znaků</div>
          </div>

          <div>
            <label style={labelStyle}>Klíčová slova (oddělená čárkou)</label>
            <input
              value={keywords}
              onChange={(e) => onChange(keywordsKey, e.target.value)}
              placeholder="slovo, fráze, další slovo..."
              style={fieldStyle}
              data-testid={`input-seo-keywords-${keywordsKey}`}
            />
          </div>

          <button
            className="btn btn-filled"
            onClick={onSave}
            disabled={saving}
            style={{ alignSelf: "flex-start", opacity: saving ? 0.6 : 1 }}
            data-testid={`button-save-seo-${titleKey}`}
          >
            {saved ? "✓ Uloženo" : saving ? "Ukládám..." : "Uložit"}
          </button>
        </div>

        <div>
          <label style={{ ...labelStyle, marginBottom: "10px" }}>Náhled ve výsledcích Google</label>
          <GooglePreview title={title} description={description} url={url} />
        </div>
      </div>
    </div>
  );
}

function SEOTab({ settings, onRefresh }: any) {
  const [values, setValues] = useState<Record<string, string>>({
    home_video: settings.home_video || "",
    beaty_video: settings.beaty_video || "",
    seo_site_name: settings.seo_site_name || "VOODOO808",
    seo_og_image: settings.seo_og_image || "",
    seo_home_title: settings.seo_home_title || "",
    seo_home_description: settings.seo_home_description || "",
    seo_home_keywords: settings.seo_home_keywords || "",
    seo_beaty_title: settings.seo_beaty_title || "",
    seo_beaty_description: settings.seo_beaty_description || "",
    seo_beaty_keywords: settings.seo_beaty_keywords || "",
    seo_zvuky_title: settings.seo_zvuky_title || "",
    seo_zvuky_description: settings.seo_zvuky_description || "",
    seo_zvuky_keywords: settings.seo_zvuky_keywords || "",
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [ogImageUploading, setOgImageUploading] = useState(false);
  const ogImageInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState<Record<string, boolean>>({});
  const [videoUploadProgress, setVideoUploadProgress] = useState<Record<string, number>>({});
  const [videoUploadError, setVideoUploadError] = useState<Record<string, string>>({});
  const [b2VideoPickerFor, setB2VideoPickerFor] = useState<string | null>(null);
  const homeVideoInputRef = useRef<HTMLInputElement>(null);
  const beatyVideoInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = async (file: File, field: string) => {
    setVideoUploading(prev => ({ ...prev, [field]: true }));
    setVideoUploadError(prev => ({ ...prev, [field]: "" }));
    setVideoUploadProgress(prev => ({ ...prev, [field]: 0 }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload?type=video", true);
      xhr.timeout = 20 * 60 * 1000;
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          setVideoUploadProgress(prev => ({ ...prev, [field]: Math.round((evt.loaded / evt.total) * 100) }));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Upload timeout"));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            handleChange(field, data.url);
            setVideoUploadProgress(prev => ({ ...prev, [field]: 100 }));
            resolve();
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.send(formData);
      });
    } catch (err) {
      setVideoUploadError(prev => ({ ...prev, [field]: err instanceof Error ? err.message : "Upload failed" }));
    } finally {
      setVideoUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const uploadOgImage = async (file: File) => {
    setOgImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?type=artwork", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      handleChange("seo_og_image", data.url);
    } catch {
    } finally {
      setOgImageUploading(false);
    }
  };

  const handleChange = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const saveKeys = async (sectionId: string, keys: string[]) => {
    setSaving(prev => ({ ...prev, [sectionId]: true }));
    try {
      await Promise.all(keys.map(key =>
        fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ key, value: values[key] }),
        })
      ));
      setSaved(prev => ({ ...prev, [sectionId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [sectionId]: false })), 2500);
      onRefresh();
    } finally {
      setSaving(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const fieldStyle: React.CSSProperties = { width: "100%", background: "#111111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", fontSize: "13px", borderRadius: "3px", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" };

  const VideoField = ({ field, label, hint, inputRef }: { field: string; label: string; hint: string; inputRef: React.RefObject<HTMLInputElement> }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
        <input
          value={values[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder="https://..."
          style={{ ...fieldStyle, flex: 1 }}
          data-testid={`input-${field}`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={videoUploading[field]}
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", padding: "0 10px", fontSize: "11px", borderRadius: "3px", cursor: "pointer", whiteSpace: "nowrap", opacity: videoUploading[field] ? 0.6 : 1 }}
          data-testid={`button-upload-${field}`}
        >
          {videoUploading[field] ? `${videoUploadProgress[field] ?? 0}%` : "Nahrát"}
        </button>
        <button
          type="button"
          onClick={() => setB2VideoPickerFor(field)}
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", padding: "0 10px", fontSize: "11px", borderRadius: "3px", cursor: "pointer", whiteSpace: "nowrap" }}
          data-testid={`button-b2-${field}`}
        >
          Knihovna B2
        </button>
      </div>
      {videoUploading[field] && (
        <div style={{ height: "4px", background: "#1b1b1b", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{ height: "100%", width: `${videoUploadProgress[field] ?? 0}%`, background: "linear-gradient(90deg,#0B99FC,#4cc3ff)", transition: "width 200ms ease" }} />
        </div>
      )}
      {videoUploadError[field] && <div style={{ fontSize: "11px", color: "#ff4444", marginBottom: "4px" }}>✗ {videoUploadError[field]}</div>}
      {values[field] && !videoUploading[field] && (
        <video src={values[field]} muted preload="metadata" style={{ width: "100%", maxHeight: "80px", objectFit: "cover", borderRadius: "3px", border: "1px solid #1e1e1e", display: "block", marginBottom: "4px" }} />
      )}
      <div style={{ fontSize: "11px", color: "#444" }}>{hint}</div>
      <input ref={inputRef} type="file" accept="video/*,.mp4,.mov,.webm" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f, field); e.target.value = ""; }} />
    </div>
  );

  return (
    <div>
      {b2VideoPickerFor && (
        <B2VideoPickerModal
          onSelect={(url) => { handleChange(b2VideoPickerFor, url); setB2VideoPickerFor(null); }}
          onClose={() => setB2VideoPickerFor(null)}
        />
      )}

      <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #1f1f1f", borderRadius: "4px" }}>
        <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", borderBottom: "1px solid #1a1a1a", paddingBottom: "10px" }}>
          Videa
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
          <VideoField field="home_video" label="Video – Domovská stránka" hint="Přehrává se na pozadí úvodní stránky" inputRef={homeVideoInputRef} />
          <VideoField field="beaty_video" label="Video – Beaty stránka" hint="Přehrává se na pozadí stránky s beaty" inputRef={beatyVideoInputRef} />
        </div>
        <button
          className="btn btn-filled"
          onClick={() => saveKeys("videos", ["home_video", "beaty_video"])}
          disabled={saving["videos"]}
          style={{ opacity: saving["videos"] ? 0.6 : 1 }}
          data-testid="button-save-videos"
        >
          {saved["videos"] ? "✓ Uloženo" : saving["videos"] ? "Ukládám..." : "Uložit videa"}
        </button>
      </div>

      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7", marginBottom: "24px", padding: "14px", border: "1px solid #1a1a1a", borderRadius: "3px", background: "#111111" }}>
        Zde nastavíš, jak se tvůj web zobrazuje ve výsledcích Google. Titulek a popis vidí zákazník dřív než klikne na stránku — dobře napsané SEO přivede víc návštěvníků.
      </div>

      <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #1f1f1f", borderRadius: "4px" }}>
        <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", borderBottom: "1px solid #1a1a1a", paddingBottom: "10px" }}>
          Globální nastavení
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Název webu</label>
            <input value={values.seo_site_name} onChange={(e) => handleChange("seo_site_name", e.target.value)} style={fieldStyle} data-testid="input-seo-site-name" />
          </div>
          <div>
            <label style={labelStyle}>OG obrázek (URL sdílení na sociálních sítích)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input value={values.seo_og_image} onChange={(e) => handleChange("seo_og_image", e.target.value)} placeholder="https://..." style={{ ...fieldStyle, flex: 1 }} data-testid="input-seo-og-image" />
              <input
                ref={ogImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOgImage(f); }}
                data-testid="input-seo-og-image-file"
              />
              <button
                onClick={() => ogImageInputRef.current?.click()}
                disabled={ogImageUploading}
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", padding: "8px 12px", fontSize: "12px", cursor: "pointer", borderRadius: "3px", whiteSpace: "nowrap", opacity: ogImageUploading ? 0.6 : 1 }}
                data-testid="button-upload-og-image"
              >
                {ogImageUploading ? "Nahrávám..." : "Nahrát"}
              </button>
            </div>
            {values.seo_og_image && (
              <img src={values.seo_og_image} alt="OG preview" style={{ marginTop: "8px", maxHeight: "60px", maxWidth: "120px", objectFit: "cover", borderRadius: "3px", border: "1px solid #2a2a2a" }} />
            )}
          </div>
        </div>
        <button
          className="btn btn-filled"
          onClick={() => saveKeys("global", ["seo_site_name", "seo_og_image"])}
          disabled={saving["global"]}
          style={{ opacity: saving["global"] ? 0.6 : 1 }}
          data-testid="button-save-seo-global"
        >
          {saved["global"] ? "✓ Uloženo" : saving["global"] ? "Ukládám..." : "Uložit"}
        </button>
      </div>

      <SEOSection
        label="Domovská stránka (voodoo808.com/)"
        url="voodoo808.com"
        titleKey="seo_home_title"
        descKey="seo_home_description"
        keywordsKey="seo_home_keywords"
        values={values}
        onChange={handleChange}
        onSave={() => saveKeys("home", ["seo_home_title", "seo_home_description", "seo_home_keywords"])}
        saving={!!saving["home"]}
        saved={!!saved["home"]}
      />

      <SEOSection
        label="Beaty (voodoo808.com/beaty)"
        url="voodoo808.com › beaty"
        titleKey="seo_beaty_title"
        descKey="seo_beaty_description"
        keywordsKey="seo_beaty_keywords"
        values={values}
        onChange={handleChange}
        onSave={() => saveKeys("beaty", ["seo_beaty_title", "seo_beaty_description", "seo_beaty_keywords"])}
        saving={!!saving["beaty"]}
        saved={!!saved["beaty"]}
      />

      <SEOSection
        label="Zvuky (voodoo808.com/zvuky)"
        url="voodoo808.com › zvuky"
        titleKey="seo_zvuky_title"
        descKey="seo_zvuky_description"
        keywordsKey="seo_zvuky_keywords"
        values={values}
        onChange={handleChange}
        onSave={() => saveKeys("zvuky", ["seo_zvuky_title", "seo_zvuky_description", "seo_zvuky_keywords"])}
        saving={!!saving["zvuky"]}
        saved={!!saved["zvuky"]}
      />

    </div>
  );
}

type IGLayer = { id: string; visible: boolean; y: number; mode: "text" | "image"; imageUrl: string | null; align?: "left" | "center" | "right" };

const IG_STORY_DEFAULT_LAYERS: IGLayer[] = [
  { id: "logo",      visible: true, y: 42,  mode: "text", imageUrl: null },
  { id: "listening", visible: true, y: 58,  mode: "text", imageUrl: null },
  { id: "title",     visible: true, y: 70,  mode: "text", imageUrl: null },
  { id: "website",   visible: true, y: 340, mode: "text", imageUrl: null },
];

const IG_LAYER_LABELS: Record<string, string> = {
  logo: "Logo VOODOO808",
  listening: "Text nad názvem",
  title: "Název beatu / kitu",
  website: "Text webu",
};

const ZVUKY_PREV_H = 630;

const IG_ZVUKY_DEFAULT_LAYERS: IGLayer[] = [
  { id: "logo",    visible: true, y: 40,  mode: "text", imageUrl: null, align: "center" },
  { id: "title",   visible: true, y: 450, mode: "text", imageUrl: null, align: "center" },
  { id: "website", visible: true, y: 480, mode: "text", imageUrl: null, align: "center" },
];

const IG_ZVUKY_LAYER_LABELS: Record<string, string> = {
  logo: "Logo",
  title: "Název sound kitu",
  website: "Text webu (VOODOO808.COM)",
};

// Deterministic waveform bar heights for visual preview (0–1) — 60 bars, organic hip-hop shape
const WAVE_BARS = [
  0.38,0.55,0.72,0.48,0.91,0.63,0.44,0.78,0.95,0.67,
  0.52,0.41,0.69,0.85,0.73,0.56,0.38,0.80,1.00,0.88,
  0.70,0.59,0.43,0.66,0.79,0.92,0.61,0.47,0.74,0.88,
  0.95,0.77,0.62,0.50,0.83,0.97,0.72,0.58,0.41,0.69,
  0.84,0.75,0.91,0.63,0.50,0.78,1.00,0.86,0.68,0.55,
  0.43,0.72,0.89,0.76,0.60,0.45,0.66,0.82,0.58,0.40,
];
const PLAYHEAD_FRACTION = 2 / 3;

// Matches the SoundWave.tsx dual-axis design: tall top bars + shorter bottom reflection
function IGWaveformPreview({ width }: { width: number }) {
  const barCount = WAVE_BARS.length;
  const gap = 0.8;
  const barW = Math.max(1, (width - gap * (barCount - 1)) / barCount);
  const h = 28;
  const divY = h * 0.70;
  const topMaxAmp = divY * 0.90;
  const botMaxAmp = (h - divY) * 0.90;
  const radius = Math.min(barW / 2, 1.5);
  return (
    <svg width={width} height={h} style={{ display: "block" }}>
      {WAVE_BARS.map((v, i) => {
        const x = i * (barW + gap);
        const played = (i / barCount) < PLAYHEAD_FRACTION;
        const isHead = Math.abs(i / barCount - PLAYHEAD_FRACTION) < (1 / barCount) * 0.8;
        const topAmp = Math.max(v * topMaxAmp, 1.2);
        const botAmp = Math.max(v * botMaxAmp, 0.5);
        if (isHead) {
          return <rect key={i} x={x} y={divY - topAmp} width={barW} height={topAmp + botAmp} rx={radius} fill="rgba(255,255,255,1)" />;
        }
        return (
          <g key={i}>
            <rect x={x} y={divY - topAmp} width={barW} height={topAmp} rx={radius}
              fill={played ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)"} />
            <rect x={x} y={divY} width={barW} height={botAmp} rx={radius}
              fill={played ? "rgba(255,255,255,0.61)" : "rgba(255,255,255,0.13)"} />
          </g>
        );
      })}
      {/* Center dividing line (like SoundWave) */}
      <rect x={0} y={divY} width={width} height={0.75} fill="rgba(0,0,0,0.6)" />
      {/* Vertical playhead */}
      <rect x={PLAYHEAD_FRACTION * width - 0.75} y={0} width={1.5} height={h} fill="rgba(255,255,255,0.95)" rx={0.75} />
    </svg>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function IGStoriesTab({ settings, onRefresh }: any) {
  const [values, setValues] = useState<Record<string, string>>({
    ig_story_bg_color: settings.ig_story_bg_color || "#000000",
    ig_story_text_color: settings.ig_story_text_color || "#ffffff",
    ig_story_accent_color: settings.ig_story_accent_color || "#aaaaaa",
    ig_story_overlay_opacity: settings.ig_story_overlay_opacity || "0.45",
    ig_story_listening_text: settings.ig_story_listening_text || "právě poslouchám",
    ig_story_website_text: settings.ig_story_website_text || "NA VOODOO808.COM",
    ig_story_bg_mode: settings.ig_story_bg_mode || "artwork",
    ig_story_blur: settings.ig_story_blur || "20",
    ig_story_layers: settings.ig_story_layers || JSON.stringify(IG_STORY_DEFAULT_LAYERS),
    ig_story_card_show: settings.ig_story_card_show ?? "true",
    ig_story_card_radius: settings.ig_story_card_radius || "24",
    ig_story_card_blur: settings.ig_story_card_blur || "14",
    ig_story_card_brightness: settings.ig_story_card_brightness || "0.18",
    ig_story_card_shadow: settings.ig_story_card_shadow ?? "true",
    ig_story_card_shadow_amount: settings.ig_story_card_shadow_amount || "24",
    ig_story_card_padding: settings.ig_story_card_padding || "16",
    ig_story_card_title_line_height: settings.ig_story_card_title_line_height || "1.2",
    ig_story_card_y_offset: settings.ig_story_card_y_offset || "0",
    ig_story_card_title_align: settings.ig_story_card_title_align || "center",
    ig_story_card_brand_align: settings.ig_story_card_brand_align || "right",
    ig_story_logo_url: settings.ig_story_logo_url || "",
    ig_story_logo_invert: settings.ig_story_logo_invert || "false",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewBeat, setPreviewBeat] = useState<any>(null);
  const [previewBeatDuration, setPreviewBeatDuration] = useState<number | null>(null);
  const [previewComment, setPreviewComment] = useState<{ text: string; email: string; avatar_url?: string | null; username?: string | null } | null>(null);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [storySubTab, setStorySubTab] = useState<"beaty" | "zvuky">("beaty");

  const [zvukyValues, setZvukyValues] = useState<Record<string, string>>({
    ig_zvuky_bg_blur: settings.ig_zvuky_bg_blur || "20",
    ig_zvuky_overlay_opacity: settings.ig_zvuky_overlay_opacity || "0.5",
    ig_zvuky_text_color: settings.ig_zvuky_text_color || "#ffffff",
    ig_zvuky_layers: settings.ig_zvuky_layers || JSON.stringify(IG_ZVUKY_DEFAULT_LAYERS),
    ig_zvuky_show_hover_card: settings.ig_zvuky_show_hover_card || "false",
    ig_zvuky_hover_show_sounds: settings.ig_zvuky_hover_show_sounds || "false",
    ig_zvuky_show_artwork_bg: settings.ig_zvuky_show_artwork_bg || "false",
    ig_zvuky_logo_url: settings.ig_zvuky_logo_url || "",
    ig_zvuky_logo_invert: settings.ig_zvuky_logo_invert || "false",
  });
  const [zvukySaving, setZvukySaving] = useState(false);
  const [zvukySaved, setZvukySaved] = useState(false);
  const [previewKit, setPreviewKit] = useState<any>(null);
  const [zvukyLogoUploading, setZvukyLogoUploading] = useState(false);
  const [zvukyLayerUploading, setZvukyLayerUploading] = useState<Record<number, boolean>>({});
  const zvukyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const zvukyFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/sound-kits", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(kits => { if (Array.isArray(kits) && kits.length > 0) setPreviewKit(kits[0]); })
      .catch(() => {});
  }, []);

  const handleZvukyChange = (key: string, val: string) => setZvukyValues(prev => ({ ...prev, [key]: val }));

  const zvukyLayers: IGLayer[] = (() => {
    try {
      const parsed = JSON.parse(zvukyValues.ig_zvuky_layers);
      return parsed.map((l: any) => ({
        id: l.id,
        visible: l.visible ?? true,
        y: typeof l.y === "number" ? l.y : (IG_ZVUKY_DEFAULT_LAYERS.find((d: IGLayer) => d.id === l.id)?.y ?? 60),
        mode: l.mode ?? "text",
        imageUrl: l.imageUrl ?? null,
        align: l.align ?? "center",
      }));
    } catch { return IG_ZVUKY_DEFAULT_LAYERS; }
  })();

  const setZvukyLayers = (nl: IGLayer[]) => handleZvukyChange("ig_zvuky_layers", JSON.stringify(nl));
  const updateZvukyLayer = (i: number, patch: Partial<IGLayer>) => setZvukyLayers(zvukyLayers.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const moveZvukyLayerY = (i: number, dir: "up" | "down") => updateZvukyLayer(i, { y: zvukyLayers[i].y + (dir === "up" ? -20 : 20) });

  const handleZvukyLogoUpload = async (file: File) => {
    setZvukyLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload?type=artwork", { method: "POST", credentials: "include", body: form });
      if (res.ok) { const data = await res.json(); handleZvukyChange("ig_zvuky_logo_url", data.url); }
    } finally { setZvukyLogoUploading(false); }
  };

  const handleZvukyLayerImageUpload = async (i: number, file: File) => {
    setZvukyLayerUploading(prev => ({ ...prev, [i]: true }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload?type=artwork", { method: "POST", credentials: "include", body: form });
      if (res.ok) { const data = await res.json(); updateZvukyLayer(i, { imageUrl: data.url, mode: "image" }); }
    } finally { setZvukyLayerUploading(prev => ({ ...prev, [i]: false })); }
  };

  const handleZvukySave = async () => {
    setZvukySaving(true);
    try {
      await Promise.all(Object.keys(zvukyValues).map(key =>
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ key, value: zvukyValues[key] }) })
      ));
      setZvukySaved(true);
      setTimeout(() => setZvukySaved(false), 2500);
      onRefresh();
    } finally { setZvukySaving(false); }
  };

  useEffect(() => {
    fetch("/api/beats", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(beats => {
        if (Array.isArray(beats) && beats.length > 0) {
          const beat = beats[0];
          setPreviewBeat(beat);
          fetch(`/api/beats/${beat.id}/comments`, { credentials: "include" })
            .then(r => r.ok ? r.json() : [])
            .then((comments: any[]) => {
              if (Array.isArray(comments) && comments.length > 0) {
                const c = comments[0];
                setPreviewComment({ text: c.text, email: c.email, avatar_url: c.avatar_url, username: c.username });
              } else {
                setPreviewComment(null);
              }
            })
            .catch(() => setPreviewComment(null));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!previewBeat?.preview_url) { setPreviewBeatDuration(null); return; }
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = `/api/audio-proxy?url=${encodeURIComponent(previewBeat.preview_url)}`;
    audio.onloadedmetadata = () => { setPreviewBeatDuration(audio.duration); };
    audio.onerror = () => { setPreviewBeatDuration(null); };
  }, [previewBeat?.preview_url]);

  const handleChange = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const layers: IGLayer[] = (() => {
    try {
      const parsed = JSON.parse(values.ig_story_layers);
      return parsed.map((l: any) => ({
        id: l.id,
        visible: l.visible ?? true,
        y: typeof l.y === "number" ? l.y : (IG_STORY_DEFAULT_LAYERS.find(d => d.id === l.id)?.y ?? 60),
        mode: l.mode ?? "text",
        imageUrl: l.imageUrl ?? null,
      }));
    } catch { return IG_STORY_DEFAULT_LAYERS; }
  })();

  const setLayers = (nl: IGLayer[]) => handleChange("ig_story_layers", JSON.stringify(nl));
  const updateLayer = (i: number, patch: Partial<IGLayer>) => setLayers(layers.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const moveLayerY = (i: number, dir: "up" | "down") => updateLayer(i, { y: layers[i].y + (dir === "up" ? -5 : 5) });

  const handleImageUpload = async (i: number, file: File) => {
    setUploading(prev => ({ ...prev, [i]: true }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload?type=artwork", { method: "POST", credentials: "include", body: form });
      if (res.ok) {
        const data = await res.json();
        updateLayer(i, { imageUrl: data.url, mode: "image" });
      }
    } finally {
      setUploading(prev => ({ ...prev, [i]: false }));
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload?type=artwork", { method: "POST", credentials: "include", body: form });
      if (res.ok) {
        const data = await res.json();
        handleChange("ig_story_logo_url", data.url);
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.keys(values).map(key =>
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ key, value: values[key] }) })
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onRefresh();
    } finally { setSaving(false); }
  };

  const bgMode = values.ig_story_bg_mode;
  const bgColor = values.ig_story_bg_color;
  const textColor = values.ig_story_text_color;
  const overlayOpacity = parseFloat(values.ig_story_overlay_opacity);
  const blurVal = parseFloat(values.ig_story_blur);
  const listeningText = values.ig_story_listening_text;
  const websiteText = values.ig_story_website_text;
  const previewArtwork = previewBeat?.artwork_url;
  const previewTitle = previewBeat?.title || "BEAT NÁZEV";
  const previewArtist = previewBeat?.artist || "VOODOO808.COM";
  const titleLineHeight = parseFloat(values.ig_story_card_title_line_height);

  // Card settings
  const cardShow = values.ig_story_card_show !== "false";
  const cardRadius = parseFloat(values.ig_story_card_radius);
  const cardBlur = parseFloat(values.ig_story_card_blur);
  const cardBrightness = parseFloat(values.ig_story_card_brightness);
  const cardShadow = values.ig_story_card_shadow !== "false";
  const cardShadowAmount = parseFloat(values.ig_story_card_shadow_amount);
  const cardPadding = parseFloat(values.ig_story_card_padding);
  const cardYOffset = parseInt(values.ig_story_card_y_offset || "0", 10);
  const cardTitleAlign = (values.ig_story_card_title_align || "center") as "left" | "center" | "right";
  const cardBrandAlign = (values.ig_story_card_brand_align || "right") as "left" | "right";
  const logoUrl = values.ig_story_logo_url || "";
  const logoInvert = values.ig_story_logo_invert === "true";

  // Duration display
  const durationStr = previewBeatDuration !== null ? formatDuration(previewBeatDuration) : "–:––";
  const playedStr = previewBeatDuration !== null ? formatDuration(previewBeatDuration * PLAYHEAD_FRACTION) : "–:––";

  // Preview card — iPhone 16 Pro proportions (402×874 pt → ratio 2.174)
  const PREVIEW_W = 290;
  const PREVIEW_H = Math.round(PREVIEW_W * 874 / 402); // ≈ 470px
  const CARD_MARGIN = 24;
  const cardW = PREVIEW_W - CARD_MARGIN * 2;           // 168px
  const artworkW = cardW - cardPadding * 2;             // inner artwork size
  const cardGlassBg = `rgba(255,255,255,${cardBrightness})`;
  const cardBoxShadow = cardShadow ? `0 ${cardShadowAmount * 0.5}px ${cardShadowAmount}px rgba(0,0,0,0.55)` : "none";

  const labelStyle = { fontSize: "11px", color: "#666", marginBottom: "6px", display: "block", letterSpacing: "0.05em", textTransform: "uppercase" as const };
  const fieldStyle = { width: "100%", padding: "9px 12px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#fff", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const };
  const modeBtnStyle = (active: boolean) => ({ padding: "4px 10px", background: active ? "#fff" : "transparent", color: active ? "#000" : "#555", border: "1px solid " + (active ? "#fff" : "#333"), borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" });
  const sectionHeadStyle = { fontSize: "10px", color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.1em", borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "14px" };

  const renderLayerPreview = (layer: IGLayer) => {
    if (!layer.visible) return null;
    const style: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: layer.y + "px", textAlign: "center", pointerEvents: "none" };
    if (layer.mode === "image" && layer.imageUrl) {
      return <img key={layer.id} src={layer.imageUrl} alt="" style={{ ...style, height: "16px", width: "auto", maxWidth: "80%", margin: "0 auto", display: "block", objectFit: "contain" }} />;
    }
    if (layer.id === "logo") return <div key="logo" style={{ ...style, fontSize: "10px", fontWeight: 700, color: textColor, letterSpacing: "3px" }}>VOODOO808.COM</div>;
    if (layer.id === "listening") return <div key="listening" style={{ ...style, fontSize: "7px", color: textColor + "88", fontStyle: "italic" }}>{listeningText}</div>;
    if (layer.id === "title") return <div key="title" style={{ ...style, fontSize: "13px", fontWeight: 700, color: textColor, letterSpacing: "0.05em", lineHeight: 1.2 }}>{previewTitle.toUpperCase()}</div>;
    if (layer.id === "website") return <div key="website" style={{ ...style, fontSize: "6px", color: textColor + "66", letterSpacing: "1px" }}>{websiteText}</div>;
    return null;
  };

  // Compute card top position so it sits centered in the iPhone 16 Pro preview
  // Card height: padding + artworkW + 10 (name gap) + 14 (name) + 3 (brand gap) + 7 (brand) + 10 (wave gap) + 28 (wave) + 3 (time) + 6 (time labels) + 8 (controls gap) + 18 (controls) + 10 (volume gap) + 6 (volume) + [comment: 8+20 if present] + padding
  const waveW = artworkW;
  const commentRowH = previewComment ? 28 : 0;
  const estimatedCardH = cardPadding + artworkW + 10 + 14 + 3 + 7 + 10 + 28 + 3 + 6 + 8 + 18 + 10 + 6 + commentRowH + cardPadding;
  const centeredCardTop = (PREVIEW_H - estimatedCardH) / 2;
  const cardTop = Math.max(10, centeredCardTop + cardYOffset);

  const zvukyBgBlur = parseFloat(zvukyValues.ig_zvuky_bg_blur);
  const zvukyOverlay = parseFloat(zvukyValues.ig_zvuky_overlay_opacity);
  const zvukyTextColor = zvukyValues.ig_zvuky_text_color;
  const zvukyShowHoverCard = zvukyValues.ig_zvuky_show_hover_card === "true";
  const zvukyHoverShowSounds = zvukyValues.ig_zvuky_hover_show_sounds !== "false";
  const zvukyShowArtworkBg = zvukyValues.ig_zvuky_show_artwork_bg === "true";
  const zvukyLogoUrl = zvukyValues.ig_zvuky_logo_url;
  const zvukyLogoInvert = zvukyValues.ig_zvuky_logo_invert === "true";
  const zvukyPreviewArtwork = previewKit?.artwork_url || "";
  const zvukyPreviewTitle = previewKit?.title || "SOUND KIT NÁZEV";
  const ZVUKY_PREV_H_DISPLAY = 470;
  const ZVUKY_PREV_W_DISPLAY = Math.round(ZVUKY_PREV_H_DISPLAY * 1080 / 1920);

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", borderBottom: "1px solid #1a1a1a", paddingBottom: "12px" }}>
        Instagram Stories šablona
      </div>
      <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid #1a1a1a" }}>
        {(["beaty", "zvuky"] as const).map(t => (
          <button key={t} onClick={() => setStorySubTab(t)} style={{ padding: "9px 22px", background: "transparent", border: "none", borderBottom: storySubTab === t ? "2px solid #fff" : "2px solid transparent", color: storySubTab === t ? "#fff" : "#555", fontSize: "13px", fontWeight: storySubTab === t ? 600 : 400, cursor: "pointer", fontFamily: "inherit", marginBottom: "-1px" }}>
            {t === "beaty" ? "BEATY" : "ZVUKY"}
          </button>
        ))}
      </div>

      {storySubTab === "beaty" && <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>

        {/* ───── Preview card ───── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Náhled{previewBeat ? ` — ${previewBeat.title}` : ""}
          </div>
          <div style={{ width: `${PREVIEW_W}px`, height: `${PREVIEW_H}px`, position: "relative", overflow: "hidden", borderRadius: "8px", border: "1px solid #2a2a2a", background: bgMode === "color" ? bgColor : "#111" }}>
            {/* Background */}
            {bgMode === "artwork" && previewArtwork && (
              <img src={previewArtwork} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(${blurVal}px)`, transform: "scale(1.3)" }} />
            )}
            {bgMode === "artwork" && !previewArtwork && (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #333 0%, #111 100%)" }} />
            )}
            {/* Dark overlay */}
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />

            {/* Text layers */}
            {layers.map(layer => renderLayerPreview(layer))}

            {/* ── Glassmorphism player card ── */}
            {cardShow && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: `${cardTop}px`,
                  width: `${cardW}px`,
                  borderRadius: `${cardRadius}px`,
                  backdropFilter: `blur(${cardBlur}px)`,
                  WebkitBackdropFilter: `blur(${cardBlur}px)`,
                  background: cardGlassBg,
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: cardBoxShadow,
                  padding: `${cardPadding}px`,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0",
                }}
              >
                {/* Artwork */}
                <div style={{ width: `${artworkW}px`, height: `${artworkW}px`, borderRadius: `${Math.max(0, cardRadius - cardPadding)}px`, overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
                  {previewArtwork
                    ? <img src={previewArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2a2a2a,#111)" }} />
                  }
                </div>

                {/* Beat name */}
                <div style={{ marginTop: "10px", fontSize: "9px", fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textAlign: cardTitleAlign, width: "100%", wordBreak: "break-word", lineHeight: titleLineHeight, overflowWrap: "break-word", fontFamily: "Inter, sans-serif" }}>
                  {previewTitle.toUpperCase()}
                </div>
                {/* Artist / brand */}
                <div style={{ marginTop: "3px", fontSize: "7px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em", textAlign: cardBrandAlign, width: "100%", fontFamily: "Inter, sans-serif" }}>
                  VOODOO808.COM
                </div>

                {/* Waveform timeline — mirrors SoundWave.tsx dual-axis design */}
                <div style={{ marginTop: "10px", width: "100%" }}>
                  <IGWaveformPreview width={waveW} />
                  {/* Time labels */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                    <span style={{ fontSize: "5px", color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif" }}>{playedStr}</span>
                    <span style={{ fontSize: "5px", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>{durationStr}</span>
                  </div>
                </div>

                {/* Player controls */}
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", width: "100%" }}>
                  {/* Prev — two filled left-pointing arrows touching, 2px radius corners */}
                  <svg width="13" height="10" viewBox="0 0 14 10" fill="rgba(255,255,255,0.75)">
                    <path d="M6.5,2 L6.5,8 Q6.5,10 5,10 L0.5,5.6 Q0,5 0.5,4.4 L5,0 Q6.5,0 6.5,2 Z"/>
                    <path d="M13.5,2 L13.5,8 Q13.5,10 12,10 L7.5,5.6 Q7,5 7.5,4.4 L12,0 Q13.5,0 13.5,2 Z"/>
                  </svg>
                  {/* Pause — two white rounded bars, no circle */}
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="#fff">
                    <rect x="0.5" y="0.5" width="3" height="11" rx="2"/>
                    <rect x="6.5" y="0.5" width="3" height="11" rx="2"/>
                  </svg>
                  {/* Next — two filled right-pointing arrows touching, 2px radius corners */}
                  <svg width="13" height="10" viewBox="0 0 14 10" fill="rgba(255,255,255,0.75)">
                    <path d="M0,2 L0,8 Q0,10 1.5,10 L6,5.6 Q6.5,5 6,4.4 L1.5,0 Q0,0 0,2 Z"/>
                    <path d="M7,2 L7,8 Q7,10 8.5,10 L13,5.6 Q13.5,5 13,4.4 L8.5,0 Q7,0 7,2 Z"/>
                  </svg>
                </div>

                {/* Volume bar */}
                <div style={{ marginTop: "10px", width: "100%", display: "flex", alignItems: "center", gap: "5px" }}>
                  {/* Volume low — filled speaker body + filled small wave */}
                  <svg width="8" height="8" viewBox="0 0 20 20" fill="rgba(255,255,255,0.45)">
                    <path d="M10 3.5 L5.5 7.5 H2 Q1 7.5 1 8.5 V11.5 Q1 12.5 2 12.5 H5.5 L10 16.5 Z"/>
                    <path d="M12.5 7 Q15.5 10 12.5 13 L11.5 12 Q14 10 11.5 8 Z"/>
                  </svg>
                  <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.18)", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "70%", background: "rgba(255,255,255,0.75)", borderRadius: "2px" }} />
                  </div>
                  {/* Volume high — filled speaker + two filled waves */}
                  <svg width="8" height="8" viewBox="0 0 20 20" fill="rgba(255,255,255,0.45)">
                    <path d="M10 3.5 L5.5 7.5 H2 Q1 7.5 1 8.5 V11.5 Q1 12.5 2 12.5 H5.5 L10 16.5 Z"/>
                    <path d="M12.5 7 Q15.5 10 12.5 13 L11.5 12 Q14 10 11.5 8 Z"/>
                    <path d="M14.5 5 Q19 10 14.5 15 L13.5 14 Q17.5 10 13.5 6 Z"/>
                  </svg>
                </div>

                {/* Comment bubble — only shown if a comment exists */}
                {previewComment && (
                  <div style={{ marginTop: "8px", width: "100%", display: "flex", alignItems: "flex-start", gap: "5px" }}>
                    {/* Avatar */}
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "rgba(255,255,255,0.18)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {previewComment.avatar_url
                        ? <img src={previewComment.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "5px", color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif", fontWeight: 700 }}>
                            {(previewComment.username || previewComment.email || "?").charAt(0).toUpperCase()}
                          </span>
                      }
                    </div>
                    {/* Bubble */}
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "6px", padding: "3px 5px", minWidth: 0 }}>
                      <div style={{ fontSize: "5px", color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", marginBottom: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {previewComment.username || previewComment.email?.split("@")[0] || "user"}
                      </div>
                      <div style={{ fontSize: "5.5px", color: "rgba(255,255,255,0.85)", fontFamily: "Inter,sans-serif", lineHeight: 1.3, wordBreak: "break-word" }}>
                        {previewComment.text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ───── Settings panel ───── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>

          {/* Background mode */}
          <div>
            <div style={sectionHeadStyle}>Pozadí</div>
            <label style={labelStyle}>Typ pozadí</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {([["artwork", "Artwork + blur"], ["color", "Plná barva"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => handleChange("ig_story_bg_mode", val)} style={{ flex: 1, padding: "9px", background: bgMode === val ? "#fff" : "#0d0d0d", color: bgMode === val ? "#000" : "#666", border: "1px solid " + (bgMode === val ? "#fff" : "#2a2a2a"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                  {label}
                </button>
              ))}
            </div>

            {bgMode === "artwork" && (
              <>
                <label style={labelStyle}>Rozmazání pozadí — {values.ig_story_blur}px</label>
                <input type="range" min="0" max="40" step="1" value={blurVal} onChange={(e) => handleChange("ig_story_blur", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
              </>
            )}

            {bgMode === "color" && (
              <>
                <label style={labelStyle}>Barva pozadí</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={bgColor} onChange={(e) => handleChange("ig_story_bg_color", e.target.value)} style={{ width: "36px", height: "36px", padding: "2px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", cursor: "pointer" }} />
                  <input type="text" value={bgColor} onChange={(e) => handleChange("ig_story_bg_color", e.target.value)} style={{ ...fieldStyle, width: "90px" }} />
                </div>
              </>
            )}
          </div>

          {/* Colors + overlay */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Barva textu</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="color" value={textColor} onChange={(e) => handleChange("ig_story_text_color", e.target.value)} style={{ width: "36px", height: "36px", padding: "2px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", cursor: "pointer" }} />
                <input type="text" value={textColor} onChange={(e) => handleChange("ig_story_text_color", e.target.value)} style={{ ...fieldStyle, width: "90px" }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Překryv — {Math.round(overlayOpacity * 100)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={(e) => handleChange("ig_story_overlay_opacity", e.target.value)} style={{ width: "100%", accentColor: "#fff", marginTop: "10px" }} />
            </div>
          </div>

          {/* ── Glassmorphism card settings ── */}
          <div>
            <div style={sectionHeadStyle}>Player karta (glassmorphism)</div>

            {/* Show/hide toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <button
                onClick={() => handleChange("ig_story_card_show", cardShow ? "false" : "true")}
                style={{ padding: "6px 14px", background: cardShow ? "#fff" : "#0d0d0d", color: cardShow ? "#000" : "#555", border: "1px solid " + (cardShow ? "#fff" : "#333"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {cardShow ? "✓ Zobrazit kartu" : "Skrýt kartu"}
              </button>
            </div>

            {cardShow && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Radius + Padding row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Zaoblení rohů — {values.ig_story_card_radius}px</label>
                    <input type="range" min="0" max="40" step="1" value={cardRadius} onChange={(e) => handleChange("ig_story_card_radius", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Vnitřní padding — {values.ig_story_card_padding}px</label>
                    <input type="range" min="8" max="32" step="1" value={cardPadding} onChange={(e) => handleChange("ig_story_card_padding", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                  </div>
                </div>

                {/* Title line height */}
                <div>
                  <label style={labelStyle}>Výška řádku názvu — {values.ig_story_card_title_line_height}</label>
                  <input type="range" min="1.0" max="2.0" step="0.05" value={titleLineHeight} onChange={(e) => handleChange("ig_story_card_title_line_height", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                </div>

                {/* Glass blur + brightness row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Rozmazání skla — {values.ig_story_card_blur}px</label>
                    <input type="range" min="0" max="40" step="1" value={cardBlur} onChange={(e) => handleChange("ig_story_card_blur", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Světlost skla — {Math.round(cardBrightness * 100)}%</label>
                    <input type="range" min="0" max="0.6" step="0.01" value={cardBrightness} onChange={(e) => handleChange("ig_story_card_brightness", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                  </div>
                </div>

                {/* Shadow */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "end" }}>
                  <div>
                    <label style={labelStyle}>Stín</label>
                    <button
                      onClick={() => handleChange("ig_story_card_shadow", cardShadow ? "false" : "true")}
                      style={{ width: "100%", padding: "9px", background: cardShadow ? "#fff" : "#0d0d0d", color: cardShadow ? "#000" : "#555", border: "1px solid " + (cardShadow ? "#fff" : "#333"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {cardShadow ? "✓ Stín zapnut" : "Stín vypnut"}
                    </button>
                  </div>
                  {cardShadow && (
                    <div>
                      <label style={labelStyle}>Intenzita stínu — {values.ig_story_card_shadow_amount}px</label>
                      <input type="range" min="0" max="60" step="2" value={cardShadowAmount} onChange={(e) => handleChange("ig_story_card_shadow_amount", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
                    </div>
                  )}
                </div>

                {/* Vertical position */}
                <div>
                  <label style={labelStyle}>Vertikální pozice — {cardYOffset >= 0 ? "+" : ""}{cardYOffset}px</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => handleChange("ig_story_card_y_offset", String(cardYOffset - 5))} style={{ padding: "5px 12px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#ccc", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", lineHeight: 1 }}>▲</button>
                    <button onClick={() => handleChange("ig_story_card_y_offset", String(cardYOffset + 5))} style={{ padding: "5px 12px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#ccc", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", lineHeight: 1 }}>▼</button>
                    <button onClick={() => handleChange("ig_story_card_y_offset", "0")} style={{ padding: "5px 10px", background: "transparent", border: "1px solid #222", borderRadius: "3px", color: "#555", cursor: "pointer", fontSize: "11px", fontFamily: "inherit" }}>Reset</button>
                    <span style={{ fontSize: "11px", color: "#444" }}>vycentrováno ± posun</span>
                  </div>
                </div>

                {/* Title alignment */}
                <div>
                  <label style={labelStyle}>Zarovnání názvu</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["left", "center", "right"] as const).map(a => (
                      <button key={a} onClick={() => handleChange("ig_story_card_title_align", a)} style={{ flex: 1, padding: "6px", background: cardTitleAlign === a ? "#fff" : "#0d0d0d", color: cardTitleAlign === a ? "#000" : "#555", border: "1px solid " + (cardTitleAlign === a ? "#fff" : "#2a2a2a"), borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                        {a === "left" ? "← Vlevo" : a === "center" ? "― Střed" : "→ Vpravo"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand text alignment */}
                <div>
                  <label style={labelStyle}>Zarovnání VOODOO808.COM</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["left", "right"] as const).map(a => (
                      <button key={a} onClick={() => handleChange("ig_story_card_brand_align", a)} style={{ flex: 1, padding: "6px", background: cardBrandAlign === a ? "#fff" : "#0d0d0d", color: cardBrandAlign === a ? "#000" : "#555", border: "1px solid " + (cardBrandAlign === a ? "#fff" : "#2a2a2a"), borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                        {a === "left" ? "← Vlevo" : "→ Vpravo"}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Logo upload */}
          <div>
            <div style={sectionHeadStyle}>Logo</div>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => logoInputRef.current?.click()} style={{ padding: "7px 14px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#ccc", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                {logoUploading ? "Nahrávám…" : logoUrl ? "Změnit logo" : "Nahrát logo"}
              </button>
              {logoUrl && (
                <>
                  <img src={logoUrl} alt="logo" style={{ height: "28px", maxWidth: "100px", objectFit: "contain", filter: logoInvert ? "invert(1)" : "none", background: logoInvert ? "#222" : "transparent", borderRadius: "3px", padding: "2px" }} />
                  <button onClick={() => handleChange("ig_story_logo_invert", logoInvert ? "false" : "true")} style={{ padding: "6px 12px", background: logoInvert ? "#fff" : "#0d0d0d", color: logoInvert ? "#000" : "#666", border: "1px solid " + (logoInvert ? "#fff" : "#2a2a2a"), borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                    {logoInvert ? "✓ Invertováno" : "Invertovat"}
                  </button>
                  <button onClick={() => handleChange("ig_story_logo_url", "")} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} title="Odebrat logo">×</button>
                </>
              )}
            </div>
            {logoUrl && (
              <p style={{ fontSize: "11px", color: "#555", marginTop: "8px" }}>Logo bude zobrazeno v exportu story. Invertovat změní bílé logo na černé a naopak.</p>
            )}
          </div>

          {/* Text layers */}
          <div>
            <div style={sectionHeadStyle}>Textové vrstvy</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {layers.map((layer, i) => (
                <div key={layer.id} style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ flex: 1, fontSize: "12px", color: layer.visible ? "#ccc" : "#444", textDecoration: layer.visible ? "none" : "line-through" }}>{IG_LAYER_LABELS[layer.id]}</span>
                    <span style={{ fontSize: "10px", color: "#444", whiteSpace: "nowrap" }}>Y: {layer.y}px</span>
                    <button onClick={() => moveLayerY(i, "up")} title="Posunout nahoru" style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#666", cursor: "pointer", padding: "2px 7px", fontSize: "10px", lineHeight: 1.4, fontFamily: "inherit" }}>▲</button>
                    <button onClick={() => moveLayerY(i, "down")} title="Posunout dolů" style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#666", cursor: "pointer", padding: "2px 7px", fontSize: "10px", lineHeight: 1.4, fontFamily: "inherit" }}>▼</button>
                    <button onClick={() => updateLayer(i, { visible: !layer.visible })} title={layer.visible ? "Skrýt" : "Zobrazit"} style={{ background: "transparent", border: "none", color: layer.visible ? "#aaa" : "#3a3a3a", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                      {layer.visible ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => updateLayer(i, { mode: "text" })} style={modeBtnStyle(layer.mode === "text")}>Aa Text</button>
                    <button onClick={() => fileInputRefs.current[i]?.click()} style={modeBtnStyle(layer.mode === "image")}>
                      {uploading[i] ? "Nahrávám…" : layer.mode === "image" && layer.imageUrl ? "🖼 Změnit logo" : "🖼 Nahrát logo"}
                    </button>
                    <input
                      ref={el => { fileInputRefs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f); e.target.value = ""; }}
                    />
                    {layer.mode === "image" && layer.imageUrl && (
                      <>
                        <img src={layer.imageUrl} alt="" style={{ height: "20px", borderRadius: "2px", border: "1px solid #333" }} />
                        <button onClick={() => updateLayer(i, { mode: "text", imageUrl: null })} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 4px" }} title="Odebrat logo">×</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editable texts */}
          <div>
            <div style={sectionHeadStyle}>Texty</div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Text nad názvem</label>
              <input type="text" value={listeningText} onChange={(e) => handleChange("ig_story_listening_text", e.target.value)} placeholder="právě poslouchám" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Text webu</label>
              <input type="text" value={websiteText} onChange={(e) => handleChange("ig_story_website_text", e.target.value)} placeholder="NA VOODOO808.COM" style={fieldStyle} />
            </div>
          </div>

          <button className="btn btn-filled" onClick={handleSave} disabled={saving} style={{ alignSelf: "flex-start", opacity: saving ? 0.6 : 1 }}>
            {saved ? "✓ Uloženo" : saving ? "Ukládám…" : "Uložit šablonu"}
          </button>
        </div>
      </div>}

      {storySubTab === "zvuky" && (
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* ── ZVUKY Preview ── */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Náhled{previewKit ? ` — ${previewKit.title}` : ""}
            </div>
            <div style={{ width: `${ZVUKY_PREV_W_DISPLAY}px`, height: `${ZVUKY_PREV_H_DISPLAY}px`, position: "relative", overflow: "hidden", borderRadius: "8px", border: "1px solid #2a2a2a", background: "#111" }}>
              {zvukyPreviewArtwork && (
                <img src={zvukyPreviewArtwork} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(${zvukyBgBlur}px)`, transform: "scale(1.3)" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${zvukyOverlay})` }} />
              {zvukyPreviewArtwork && (() => {
                const artSide = Math.round(ZVUKY_PREV_W_DISPLAY * 0.7);
                const ax = (ZVUKY_PREV_W_DISPLAY - artSide) / 2;
                const ay = (ZVUKY_PREV_H_DISPLAY - artSide) / 2 - Math.round(ZVUKY_PREV_H_DISPLAY * 0.06);
                return (
                  <>
                    {/* White glow beneath artwork */}
                    <div style={{ position: "absolute", left: `${ax}px`, top: `${ay + artSide * 0.7}px`, width: `${artSide}px`, height: `${artSide * 0.5}px`, background: "radial-gradient(ellipse at center top, rgba(255,255,255,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", left: `${ax}px`, top: `${ay}px`, width: `${artSide}px`, height: `${artSide}px`, borderRadius: "6px", overflow: "hidden", background: zvukyShowArtworkBg ? "#0a0a0a" : "transparent" }}>
                      <img src={zvukyPreviewArtwork} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  </>
                );
              })()}
              {zvukyShowHoverCard && zvukyPreviewArtwork && (() => {
                const artSide = Math.round(ZVUKY_PREV_W_DISPLAY * 0.7);
                const ax = (ZVUKY_PREV_W_DISPLAY - artSide) / 2;
                const ay = (ZVUKY_PREV_H_DISPLAY - artSide) / 2 - Math.round(ZVUKY_PREV_H_DISPLAY * 0.06);
                const pillTop = ay + artSide + 6;
                const pillLeft = ax;
                return (
                  <div style={{ position: "absolute", left: `${pillLeft}px`, top: `${pillTop}px`, width: `${artSide}px`, boxSizing: "border-box" }}>
                    {/* V-arrow caret */}
                    <div style={{ position: "relative", width: "10px", height: "10px", background: "rgba(10,10,10,0.92)", border: "1px solid #333", borderRight: "none", borderBottom: "none", transform: "rotate(45deg)", margin: "0 auto", marginBottom: "-5px", zIndex: 1 }} />
                    {/* Pill body */}
                    <div style={{ background: "rgba(10,10,10,0.92)", border: "1px solid #333", borderRadius: "5px", padding: "5px 7px", backdropFilter: "blur(8px)", position: "relative", zIndex: 2 }}>
                      {(() => {
                        const kitTypeLabels: Record<string, string> = { drum_kit: "Drum Kit", one_shot_kit: "One Shot Kit", loop_kit: "Loop Kit", one_shot_bundle: "One Shot Bundle", drum_kit_bundle: "Drum Kit Bundle" };
                        return <div style={{ fontSize: "5px", color: "#666", marginBottom: "2px" }}>{(kitTypeLabels[previewKit?.type] || "Sound Kit").toUpperCase()}</div>;
                      })()}
                      <div style={{ fontSize: "7px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{zvukyPreviewTitle}</div>
                      {zvukyHoverShowSounds
                        ? previewKit?.number_of_sounds != null && <div style={{ fontSize: "5.5px", color: "#999" }}>{previewKit.number_of_sounds} zvuků</div>
                        : previewKit?.price !== undefined && <div style={{ fontSize: "5.5px", color: "#999" }}>{previewKit.is_free ? "ZDARMA" : `${previewKit.price} CZK`}</div>
                      }
                    </div>
                  </div>
                );
              })()}
              {zvukyLayers.map(layer => {
                if (!layer.visible) return null;
                const lAlign = (layer.align ?? "center") as "left" | "center" | "right";
                const adminMargin = "8px";
                const style: React.CSSProperties = {
                  position: "absolute",
                  top: `${(layer.y ?? 280) * ZVUKY_PREV_H_DISPLAY / ZVUKY_PREV_H}px`,
                  pointerEvents: "none",
                  transform: "translateY(-50%)",
                  ...(lAlign === "center" ? { left: 0, right: 0, textAlign: "center" as const } :
                      lAlign === "left" ? { left: adminMargin, right: "auto", textAlign: "left" as const } :
                      { right: adminMargin, left: "auto", textAlign: "right" as const }),
                };
                if (layer.mode === "image" && layer.imageUrl) {
                  const imgStyle: React.CSSProperties = { height: "14px", width: "auto", objectFit: "contain" as const, display: "block", filter: zvukyLogoInvert ? "invert(1)" : "none",
                    ...(lAlign === "center" ? { margin: "0 auto", maxWidth: "80%" } : lAlign === "left" ? { marginRight: "auto" } : { marginLeft: "auto" }) };
                  return <img key={layer.id} src={layer.imageUrl} alt="" style={{ ...style, ...imgStyle }} />;
                }
                if (layer.id === "logo") return <div key="logo" style={{ ...style, fontSize: "9px", fontWeight: 700, color: zvukyTextColor, letterSpacing: "2px" }}>VOODOO808.COM</div>;
                if (layer.id === "title") return <div key="title" style={{ ...style, fontSize: "14px", fontWeight: 700, color: zvukyTextColor, letterSpacing: "0.04em", lineHeight: 1.2, wordBreak: "break-word" as const }}>{zvukyPreviewTitle.toUpperCase()}</div>;
                if (layer.id === "website") return <div key="website" style={{ ...style, fontSize: "7px", color: zvukyTextColor + "88" }}>VOODOO808.COM</div>;
                return null;
              })}
            </div>
          </div>

          {/* ── ZVUKY Settings ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>

            {/* Background */}
            <div>
              <div style={sectionHeadStyle}>Pozadí</div>
              <label style={labelStyle}>Rozmazání pozadí — {zvukyValues.ig_zvuky_bg_blur}px</label>
              <input type="range" min="0" max="40" step="1" value={zvukyBgBlur} onChange={(e) => handleZvukyChange("ig_zvuky_bg_blur", e.target.value)} style={{ width: "100%", accentColor: "#fff" }} />
            </div>

            {/* Colors + overlay */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Barva textu</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={zvukyTextColor} onChange={(e) => handleZvukyChange("ig_zvuky_text_color", e.target.value)} style={{ width: "36px", height: "36px", padding: "2px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", cursor: "pointer" }} />
                  <input type="text" value={zvukyTextColor} onChange={(e) => handleZvukyChange("ig_zvuky_text_color", e.target.value)} style={{ ...fieldStyle, width: "90px" }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Překryv — {Math.round(zvukyOverlay * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={zvukyOverlay} onChange={(e) => handleZvukyChange("ig_zvuky_overlay_opacity", e.target.value)} style={{ width: "100%", accentColor: "#fff", marginTop: "10px" }} />
              </div>
            </div>

            {/* Artwork bg + glow */}
            <div>
              <div style={sectionHeadStyle}>Artwork</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleZvukyChange("ig_zvuky_show_artwork_bg", zvukyShowArtworkBg ? "false" : "true")}
                  style={{ padding: "6px 14px", background: zvukyShowArtworkBg ? "#fff" : "#0d0d0d", color: zvukyShowArtworkBg ? "#000" : "#555", border: "1px solid " + (zvukyShowArtworkBg ? "#fff" : "#333"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {zvukyShowArtworkBg ? "✓ Tmavé pozadí artwork" : "Tmavé pozadí artwork"}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "#444", marginTop: "8px" }}>Vypněte pro průhledné pozadí za artworkem (bíle záře pod ním zůstane).</p>
            </div>

            {/* Hover card */}
            <div>
              <div style={sectionHeadStyle}>Hover karta produktu</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleZvukyChange("ig_zvuky_show_hover_card", zvukyShowHoverCard ? "false" : "true")}
                  style={{ padding: "6px 14px", background: zvukyShowHoverCard ? "#fff" : "#0d0d0d", color: zvukyShowHoverCard ? "#000" : "#555", border: "1px solid " + (zvukyShowHoverCard ? "#fff" : "#333"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {zvukyShowHoverCard ? "✓ Zobrazit kartu" : "Skrýt kartu"}
                </button>
                {zvukyShowHoverCard && (
                  <button
                    onClick={() => handleZvukyChange("ig_zvuky_hover_show_sounds", zvukyHoverShowSounds ? "false" : "true")}
                    style={{ padding: "6px 14px", background: zvukyHoverShowSounds ? "#fff" : "#0d0d0d", color: zvukyHoverShowSounds ? "#000" : "#555", border: "1px solid " + (zvukyHoverShowSounds ? "#fff" : "#333"), borderRadius: "3px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {zvukyHoverShowSounds ? "✓ Počet zvuků" : "Zobrazit počet zvuků"}
                  </button>
                )}
              </div>
              <p style={{ fontSize: "11px", color: "#444", marginTop: "8px" }}>Karta pod artworkem se šipkou — stejný design jako na webu. Přepněte mezi cenou a počtem zvuků.</p>
            </div>

            {/* Logo */}
            <div>
              <div style={sectionHeadStyle}>Logo</div>
              <input ref={zvukyLogoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZvukyLogoUpload(f); e.target.value = ""; }} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => zvukyLogoInputRef.current?.click()} style={{ padding: "7px 14px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#ccc", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                  {zvukyLogoUploading ? "Nahrávám…" : zvukyLogoUrl ? "Změnit logo" : "Nahrát logo"}
                </button>
                {zvukyLogoUrl && (
                  <>
                    <img src={zvukyLogoUrl} alt="logo" style={{ height: "28px", maxWidth: "100px", objectFit: "contain", filter: zvukyLogoInvert ? "invert(1)" : "none", background: zvukyLogoInvert ? "#222" : "transparent", borderRadius: "3px", padding: "2px" }} />
                    <button onClick={() => handleZvukyChange("ig_zvuky_logo_invert", zvukyLogoInvert ? "false" : "true")} style={{ padding: "6px 12px", background: zvukyLogoInvert ? "#fff" : "#0d0d0d", color: zvukyLogoInvert ? "#000" : "#666", border: "1px solid " + (zvukyLogoInvert ? "#fff" : "#2a2a2a"), borderRadius: "3px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                      {zvukyLogoInvert ? "✓ Invertováno" : "Invertovat"}
                    </button>
                    <button onClick={() => handleZvukyChange("ig_zvuky_logo_url", "")} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} title="Odebrat logo">×</button>
                  </>
                )}
              </div>
            </div>

            {/* Text layers */}
            <div>
              <div style={sectionHeadStyle}>Textové vrstvy</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {zvukyLayers.map((layer, i) => (
                  <div key={layer.id} style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ flex: 1, fontSize: "12px", color: layer.visible ? "#ccc" : "#444", textDecoration: layer.visible ? "none" : "line-through" }}>{IG_ZVUKY_LAYER_LABELS[layer.id]}</span>
                      <span style={{ fontSize: "10px", color: "#444", whiteSpace: "nowrap" }}>Y: {layer.y}px</span>
                      <button onClick={() => moveZvukyLayerY(i, "up")} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#666", cursor: "pointer", padding: "2px 7px", fontSize: "10px", lineHeight: 1.4, fontFamily: "inherit" }}>▲</button>
                      <button onClick={() => moveZvukyLayerY(i, "down")} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#666", cursor: "pointer", padding: "2px 7px", fontSize: "10px", lineHeight: 1.4, fontFamily: "inherit" }}>▼</button>
                      {(["left", "center", "right"] as const).map(al => (
                        <button key={al} onClick={() => updateZvukyLayer(i, { align: al })} title={al === "left" ? "Vlevo" : al === "center" ? "Na střed" : "Vpravo"} style={{ background: (layer.align ?? "center") === al ? "#222" : "transparent", border: "1px solid " + ((layer.align ?? "center") === al ? "#555" : "#2a2a2a"), borderRadius: "3px", color: (layer.align ?? "center") === al ? "#ccc" : "#444", cursor: "pointer", padding: "2px 5px", fontSize: "9px", lineHeight: 1.4, fontFamily: "inherit" }}>
                          {al === "left" ? "◁" : al === "center" ? "◇" : "▷"}
                        </button>
                      ))}
                      <button onClick={() => updateZvukyLayer(i, { visible: !layer.visible })} style={{ background: "transparent", border: "none", color: layer.visible ? "#aaa" : "#3a3a3a", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                        {layer.visible ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        )}
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => updateZvukyLayer(i, { mode: "text" })} style={modeBtnStyle(layer.mode === "text")}>Aa Text</button>
                      <button onClick={() => zvukyFileInputRefs.current[i]?.click()} style={modeBtnStyle(layer.mode === "image")}>
                        {zvukyLayerUploading[i] ? "Nahrávám…" : layer.mode === "image" && layer.imageUrl ? "🖼 Změnit logo" : "🖼 Nahrát logo"}
                      </button>
                      <input
                        ref={el => { zvukyFileInputRefs.current[i] = el; }}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZvukyLayerImageUpload(i, f); e.target.value = ""; }}
                      />
                      {layer.mode === "image" && layer.imageUrl && (
                        <>
                          <img src={layer.imageUrl} alt="" style={{ height: "20px", borderRadius: "2px", border: "1px solid #333" }} />
                          <button onClick={() => updateZvukyLayer(i, { mode: "text", imageUrl: null })} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 4px" }} title="Odebrat logo">×</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-filled" onClick={handleZvukySave} disabled={zvukySaving} style={{ alignSelf: "flex-start", opacity: zvukySaving ? 0.6 : 1 }}>
              {zvukySaved ? "✓ Uloženo" : zvukySaving ? "Ukládám…" : "Uložit ZVUKY šablonu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function downloadCsv(rows: string[][], filename: string) {
  const content = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ZakazniciTab() {
  const [section, setSection] = useState<"customers" | "leads" | "registered">("customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingRegistered, setLoadingRegistered] = useState(true);

  useEffect(() => {
    fetch("/api/leads/admin/customers", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCustomers(data); setLoadingCustomers(false); })
      .catch(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    fetch("/api/leads/admin", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setLeads(data); setLoadingLeads(false); })
      .catch(() => setLoadingLeads(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/admin/users", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setRegisteredUsers(data); setLoadingRegistered(false); })
      .catch(() => setLoadingRegistered(false));
  }, []);

  const exportCustomerEmails = () => {
    const rows = [["Email", "ID objednávky", "Datum"]];
    customers.forEach(c => rows.push([c.email, String(c.id), new Date(c.created_at).toLocaleDateString("cs-CZ")]));
    downloadCsv(rows, "zakaznici-emaily.csv");
  };

  const exportLeadEmails = () => {
    const rows = [["Email", "Soubory", "Datum"]];
    leads.forEach(l => {
      const items = Array.isArray(l.items) ? l.items.map((i: any) => i.title).join(", ") : "";
      rows.push([l.email, items, new Date(l.created_at).toLocaleDateString("cs-CZ")]);
    });
    downloadCsv(rows, "zdarma-emaily.csv");
  };

  const cellStyle: any = { padding: "12px 10px", borderBottom: "1px solid #1e1e1e", verticalAlign: "middle" };

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setSection("customers")}
            className={section === "customers" ? "btn btn-filled" : "btn"}
            style={{ borderRadius: "4px", ...(section !== "customers" ? { borderColor: "#333", color: "#666" } : {}) }}
          >
            Zákazníci ({customers.length})
          </button>
          <button
            onClick={() => setSection("leads")}
            className={section === "leads" ? "btn btn-filled" : "btn"}
            style={{ borderRadius: "4px", ...(section !== "leads" ? { borderColor: "#333", color: "#666" } : {}) }}
          >
            Zájemci o free ({leads.length})
          </button>
          <button
            onClick={() => setSection("registered")}
            className={section === "registered" ? "btn btn-filled" : "btn"}
            style={{ borderRadius: "4px", ...(section !== "registered" ? { borderColor: "#333", color: "#666" } : {}) }}
            data-testid="button-tab-registered"
          >
            Registrovaní uživatelé ({registeredUsers.length})
          </button>
        </div>
        <button
          onClick={section === "customers" ? exportCustomerEmails : exportLeadEmails}
          className="btn"
          style={{ borderRadius: "4px", borderColor: "#444", color: "#aaa", fontSize: "12px" }}
          data-testid="button-export-csv"
        >
          ↓ Stáhnout CSV
        </button>
      </div>

      {section === "customers" && (
        <div>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "16px" }}>
            Lidé, kteří úspěšně zaplatili alespoň jednu objednávku. Zobrazena poslední objednávka na email.
          </p>
          {loadingCustomers ? (
            <div style={{ color: "#666", padding: "24px" }}>Načítám...</div>
          ) : customers.length === 0 ? (
            <div style={{ color: "#444", padding: "24px" }}>Zatím žádní zákazníci.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Objednávka</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Datum</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Celkem</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...cellStyle, color: "#fff", fontWeight: 500 }} data-testid={`text-customer-email-${i}`}>{c.email}</td>
                    <td style={{ ...cellStyle, color: "#888", fontSize: "13px" }}>#{c.id}</td>
                    <td style={{ ...cellStyle, color: "#666", fontSize: "12px" }}>{new Date(c.created_at).toLocaleDateString("cs-CZ")}</td>
                    <td style={{ ...cellStyle, color: "#aaa", fontSize: "13px" }}>{Number(c.total).toLocaleString("cs-CZ")} CZK</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {section === "leads" && (
        <div>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "16px" }}>
            Lidé, kteří si stáhli soubory zdarma. Tyto záznamy se nezobrazují v objednávkách.
          </p>
          {loadingLeads ? (
            <div style={{ color: "#666", padding: "24px" }}>Načítám...</div>
          ) : leads.length === 0 ? (
            <div style={{ color: "#444", padding: "24px" }}>Zatím žádné free downloady.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Soubory</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => {
                  const items = Array.isArray(l.items) ? l.items : [];
                  return (
                    <tr key={i}>
                      <td style={{ ...cellStyle, color: "#fff", fontWeight: 500 }} data-testid={`text-lead-email-${i}`}>{l.email}</td>
                      <td style={{ ...cellStyle, color: "#888", fontSize: "12px" }}>
                        {items.map((item: any) => item.title).join(", ") || "—"}
                      </td>
                      <td style={{ ...cellStyle, color: "#666", fontSize: "12px" }}>{new Date(l.created_at).toLocaleDateString("cs-CZ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {section === "registered" && (
        <div>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "16px" }}>
            Všichni registrovaní uživatelé — včetně těch, kteří ještě nic nekoupili.
          </p>
          {loadingRegistered ? (
            <div style={{ color: "#666", padding: "24px" }}>Načítám...</div>
          ) : registeredUsers.length === 0 ? (
            <div style={{ color: "#444", padding: "24px" }}>Žádní registrovaní uživatelé.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Uživatelské jméno</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</th>
                  <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Registrace</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((u, i) => (
                  <tr key={i}>
                    <td style={{ ...cellStyle, color: "#fff", fontWeight: 500 }} data-testid={`text-user-email-${i}`}>{u.email}</td>
                    <td style={{ ...cellStyle, color: "#888", fontSize: "13px" }}>{u.username || <span style={{ color: "#444" }}>—</span>}</td>
                    <td style={{ ...cellStyle }}>
                      {u.is_admin ? (
                        <span style={{ fontSize: "11px", color: "#e8304a", background: "rgba(232,48,74,0.1)", padding: "2px 8px", borderRadius: "3px", border: "1px solid rgba(232,48,74,0.3)" }}>Admin</span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#555" }}>Uživatel</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: "#666", fontSize: "12px" }}>{new Date(u.created_at).toLocaleDateString("cs-CZ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const EMAIL_SCENARIOS: { key: string; label: string; description: string }[] = [
  { key: "beat_single", label: "Beat – 1 kus", description: "Zákazník kupuje jeden beat" },
  { key: "beats_multiple", label: "Beaty – více kusů", description: "Zákazník kupuje více beatů" },
  { key: "kit_single", label: "Sound Kit – 1 kus", description: "Zákazník kupuje jeden sound kit" },
  { key: "kits_multiple", label: "Sound Kity – více kusů", description: "Zákazník kupuje více sound kitů" },
  { key: "free_download", label: "Stažení zdarma", description: "Zákazník stahuje zdarma (cena = 0 CZK)" },
  { key: "mixed", label: "Mix (beaty + kity + zdarma)", description: "Zákazník kupuje kombinaci beatů, kitů a/nebo zdarma souborů" },
];

function EmailsTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", intro_text: "" });
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleEmailPreview = async () => {
    if (!editingKey) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${editingKey}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ intro_text: editForm.intro_text }),
      });
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      alert("Chyba při načítání náhledu.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates", { credentials: "include" });
      if (!res.ok) throw new Error();
      setTemplates(await res.json());
    } catch {
      setError("Nepodařilo se načíst šablony.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (tpl: any) => {
    setEditingKey(tpl.key);
    setEditForm({ subject: tpl.subject, intro_text: tpl.intro_text });
    setSaveOk(false);
  };

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    setSaveOk(false);
    try {
      const res = await fetch(`/api/admin/email-templates/${editingKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      await load();
      setSaveOk(true);
      setTimeout(() => { setEditingKey(null); setSaveOk(false); }, 1200);
    } catch {
      alert("Chyba při ukládání.");
    } finally {
      setSaving(false);
    }
  };

  const tplByKey = (key: string) => templates.find(t => t.key === key);

  const cellStyle: any = { padding: "14px 12px", borderBottom: "1px solid #1e1e1e", verticalAlign: "top" };

  if (loading) return <div style={{ color: "#666", padding: "24px" }}>Načítám...</div>;
  if (error) return <div style={{ color: "#ff4444", padding: "24px" }}>{error}</div>;

  if (editingKey) {
    const scenario = EMAIL_SCENARIOS.find(s => s.key === editingKey);
    return (
      <div style={{ maxWidth: "640px" }}>
        {previewHtml && (
          <div
            onClick={() => setPreviewHtml(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.92)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: "24px 16px 48px" }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "640px", marginBottom: "16px", flexShrink: 0 }}>
              <span style={{ fontWeight: "600", color: "#ddd", fontSize: "13px", letterSpacing: "0.04em" }}>Náhled emailu – {scenario?.label}</span>
              <button onClick={() => setPreviewHtml(null)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", fontSize: "13px", cursor: "pointer", color: "#ccc", padding: "4px 12px" }}>Zavřít ×</button>
            </div>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "640px", maxWidth: "100%", background: "#0a0a0a", borderRadius: "4px", overflow: "hidden", border: "1px solid #222" }}>
              <iframe srcDoc={previewHtml} style={{ width: "100%", height: "700px", border: "none", display: "block" }} title="Náhled emailu" />
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button
            onClick={() => setEditingKey(null)}
            style={{ background: "none", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Zpět
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px" }}>{scenario?.label}</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>{scenario?.description}</p>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "#999" }}>Předmět emailu</label>
          <input
            value={editForm.subject}
            onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: "4px", fontFamily: "inherit", fontSize: "13px" }}
          />
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#555" }}>Placeholdery: &#123;id&#125; = číslo objednávky, &#123;datum&#125; = datum</p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "#999" }}>Úvodní text emailu</label>
          <textarea
            value={editForm.intro_text}
            onChange={e => setEditForm(f => ({ ...f, intro_text: e.target.value }))}
            rows={5}
            style={{ width: "100%", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: "4px", fontFamily: "inherit", fontSize: "13px", resize: "vertical" }}
          />
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#555" }}>Tento text se zobrazí zákazníkovi hned po pozdravu. Placeholdery: &#123;id&#125;, &#123;datum&#125;</p>
        </div>

        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "18px 22px", marginBottom: "24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Náhled emailu</p>
          <div style={{ background: "#0a0a0a", padding: "16px", borderRadius: "4px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#666" }}>Předmět: <span style={{ color: "#aaa" }}>{editForm.subject.replace("{id}", "1234").replace("{datum}", "1. ledna 2026")}</span></p>
            <hr style={{ border: "none", borderTop: "1px solid #222", margin: "10px 0" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "#aaa", lineHeight: "1.6" }}>
              {editForm.intro_text.replace("{id}", "1234").replace("{datum}", "1. ledna 2026")}
            </p>
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#555" }}>[... odkaz ke stažení ...]</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-filled"
            style={{ borderRadius: "4px" }}
          >
            {saving ? "Ukládám..." : saveOk ? "Uloženo ✓" : "Uložit šablonu"}
          </button>
          <button
            onClick={handleEmailPreview}
            disabled={loadingPreview}
            className="btn btn-admin"
            style={{ borderRadius: "4px" }}
          >
            {loadingPreview ? "Načítám..." : "Náhled emailu"}
          </button>
          <button
            onClick={() => setEditingKey(null)}
            className="btn"
            style={{ borderRadius: "4px" }}
          >
            Zrušit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>
        Šablony emailů, které zákazníci obdrží po dokončení objednávky. Předmět a úvodní text lze upravit, zbytek (odkaz ke stažení, smlouva) se generuje automaticky.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scénář</th>
            <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>Předmět</th>
            <th style={{ ...cellStyle, color: "#555", fontSize: "11px", fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {EMAIL_SCENARIOS.map(scenario => {
            const tpl = tplByKey(scenario.key);
            return (
              <tr key={scenario.key}>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#fff", marginBottom: "2px" }}>{scenario.label}</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>{scenario.description}</div>
                </td>
                <td style={{ ...cellStyle, fontSize: "13px", color: "#aaa", maxWidth: "260px" }}>
                  {tpl ? <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>{tpl.subject}</span> : <span style={{ color: "#444" }}>Nenačteno</span>}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {tpl && (
                    <button
                      onClick={() => startEdit(tpl)}
                      style={{ background: "transparent", border: "1px solid #333", color: "#aaa", padding: "4px 14px", fontSize: "12px", borderRadius: "3px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Upravit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PromoCodesTab() {
  const [codes, setCodes] = useState<{ id: number; code: string; discount_percent: number; is_active: boolean; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", discountPercent: 10, isActive: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promo-codes", { credentials: "include" });
      if (!res.ok) throw new Error();
      setCodes(await res.json());
    } catch {
      setError("Nepodařilo se načíst promo kódy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.code.trim()) { setFormError("Kód je povinný."); return; }
    if (form.discountPercent < 1 || form.discountPercent > 100) { setFormError("Sleva musí být 1–100 %."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: form.code.trim().toUpperCase(), discountPercent: form.discountPercent, isActive: form.isActive }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || "Chyba při ukládání."); return; }
      setForm({ code: "", discountPercent: 10, isActive: true });
      await load();
    } catch {
      setFormError("Chyba při ukládání.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error();
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    } catch {
      alert("Nepodařilo se aktualizovat stav.");
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Smazat kód „${code}"?`)) return;
    try {
      await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE", credentials: "include" });
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch {
      alert("Nepodařilo se smazat kód.");
    }
  };

  const cellStyle: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid #1a1a1a", fontSize: "13px", verticalAlign: "middle" };
  const headStyle: React.CSSProperties = { ...cellStyle, color: "#666", fontWeight: 400, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222" };

  return (
    <div>
      {/* Add form */}
      <form onSubmit={handleAdd} style={{ marginBottom: "28px", padding: "16px", border: "1px solid #222", borderRadius: "3px", background: "#111111" }}>
        <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>Nový promo kód</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#666", marginBottom: "4px" }}>KÓD</label>
            <input
              data-testid="input-promo-code"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="napr. LETO2025"
              style={{ width: "100%", background: "#161616", border: "1px solid #333", color: "#fff", padding: "8px 10px", fontSize: "13px", borderRadius: "2px", fontFamily: "inherit", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: "0 0 120px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#666", marginBottom: "4px" }}>SLEVA (%)</label>
            <input
              data-testid="input-promo-discount"
              type="number"
              min={1}
              max={100}
              value={form.discountPercent}
              onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
              style={{ width: "100%", background: "#161616", border: "1px solid #333", color: "#fff", padding: "8px 10px", fontSize: "13px", borderRadius: "2px", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "8px", paddingBottom: "2px" }}>
            <input
              data-testid="checkbox-promo-active"
              type="checkbox"
              id="promo-active"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              style={{ accentColor: "#fff", width: "14px", height: "14px" }}
            />
            <label htmlFor="promo-active" style={{ fontSize: "12px", color: "#999", cursor: "pointer" }}>Aktivní</label>
          </div>
          <button
            data-testid="button-add-promo"
            type="submit"
            disabled={saving}
            style={{ flex: "0 0 auto", padding: "8px 20px", background: saving ? "#222" : "#fff", color: saving ? "#666" : "#000", border: "none", borderRadius: "2px", fontSize: "12px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }}
          >
            {saving ? "Ukládám…" : "Přidat kód"}
          </button>
        </div>
        {formError && <div style={{ marginTop: "8px", color: "#ff4444", fontSize: "12px" }}>{formError}</div>}
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#555", fontSize: "13px" }}>Načítám…</div>
      ) : error ? (
        <div style={{ color: "#ff4444", fontSize: "13px" }}>{error}</div>
      ) : codes.length === 0 ? (
        <div style={{ color: "#555", fontSize: "13px" }}>Žádné promo kódy.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...headStyle, textAlign: "left" }}>Kód</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Sleva</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Stav</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Vytvořeno</th>
              <th style={{ ...headStyle, textAlign: "right" }}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} style={{ background: "transparent" }}>
                <td style={{ ...cellStyle, fontFamily: "monospace", fontSize: "14px", letterSpacing: "0.06em", color: "#fff" }} data-testid={`text-promo-code-${c.id}`}>{c.code}</td>
                <td style={{ ...cellStyle, color: "#ccc" }} data-testid={`text-promo-discount-${c.id}`}>{c.discount_percent} %</td>
                <td style={cellStyle}>
                  <button
                    data-testid={`button-toggle-promo-${c.id}`}
                    onClick={() => toggleActive(c.id, c.is_active)}
                    style={{
                      padding: "3px 10px",
                      fontSize: "11px",
                      border: `1px solid ${c.is_active ? "#3a3" : "#444"}`,
                      borderRadius: "2px",
                      background: c.is_active ? "rgba(50,170,50,0.12)" : "transparent",
                      color: c.is_active ? "#4d4" : "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {c.is_active ? "Aktivní" : "Neaktivní"}
                  </button>
                </td>
                <td style={{ ...cellStyle, color: "#555", fontSize: "12px" }}>
                  {new Date(c.created_at).toLocaleDateString("cs-CZ")}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  <button
                    data-testid={`button-delete-promo-${c.id}`}
                    onClick={() => handleDelete(c.id, c.code)}
                    style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: "3px 10px", fontSize: "11px", borderRadius: "2px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KomentareTab() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/comments", { credentials: "include" });
      if (!res.ok) throw new Error("Nepodařilo se načíst komentáře");
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, []);

  const handleDelete = async (beatId: number, commentId: number) => {
    if (!confirm("Smazat tento komentář?")) return;
    setDeleting(commentId);
    try {
      const res = await fetch(`/api/beats/${beatId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const headStyle = { padding: "8px 12px", fontSize: "11px", color: "#555", fontWeight: 400 as const, borderBottom: "1px solid #222", textTransform: "uppercase" as const, letterSpacing: "0.08em" };
  const cellStyle = { padding: "8px 12px", borderBottom: "1px solid #1a1a1a", verticalAlign: "top" as const };

  return (
    <div style={{ color: "#fff" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 400, marginBottom: "20px", color: "#888" }}>Komentáře</h2>
      {loading ? (
        <div style={{ color: "#555", fontSize: "13px" }}>Načítám…</div>
      ) : error ? (
        <div style={{ color: "#ff4444", fontSize: "13px" }}>{error}</div>
      ) : comments.length === 0 ? (
        <div style={{ color: "#555", fontSize: "13px" }}>Žádné komentáře.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...headStyle, textAlign: "left" }}>Beat</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Uživatel</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Komentář</th>
              <th style={{ ...headStyle, textAlign: "left" }}>Datum</th>
              <th style={{ ...headStyle, textAlign: "right" }}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(c => (
              <tr key={c.id} data-testid={`row-comment-${c.id}`}>
                <td style={{ ...cellStyle, color: "#aaa", fontSize: "13px" }}>{c.beat_title}</td>
                <td style={{ ...cellStyle, color: "#888", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {c.avatar_url && <img src={c.avatar_url} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />}
                    {c.email?.split("@")[0]}
                  </div>
                </td>
                <td style={{ ...cellStyle, color: "#ccc", fontSize: "13px", maxWidth: "280px", wordBreak: "break-word" }}>{c.text}</td>
                <td style={{ ...cellStyle, color: "#555", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {new Date(c.created_at).toLocaleDateString("cs-CZ")}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  <button
                    data-testid={`button-delete-comment-${c.id}`}
                    onClick={() => handleDelete(c.beat_id, c.id)}
                    disabled={deleting === c.id}
                    style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: "3px 10px", fontSize: "11px", borderRadius: "2px", cursor: deleting === c.id ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    {deleting === c.id ? "…" : "Smazat"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;