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
    const valid = ["beats", "kits", "orders", "licenses", "settings", "assets", "promo", "seo"];
    return (valid.includes(p || "") ? p : "orders") as "beats" | "kits" | "orders" | "licenses" | "settings" | "assets" | "promo" | "seo";
  })();
  const [tab, setTab] = useState<"beats" | "kits" | "orders" | "licenses" | "settings" | "assets" | "promo" | "seo">(initialTab);
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
        {["beats", "kits", "orders", "licenses", "settings", "assets", "promo", "seo"].map((t) => (
          <button
            key={t}
            className={tab === t ? "btn btn-filled" : "btn btn-admin"}
            onClick={() => setTab(t as any)}
            style={tab !== t ? { borderColor: "#333", color: "#666" } : {}}
          >
            {t === "beats" ? "Beaty" : t === "kits" ? "Zvuky" : t === "orders" ? "Objednávky" : t === "licenses" ? "Licence" : t === "settings" ? "Nastavení" : t === "assets" ? "Assety" : t === "promo" ? "Promo kódy" : "SEO"}
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
        {tab === "licenses" && <LicensesTab licenses={licenses} onRefresh={loadData} />}
        {tab === "settings" && <SettingsTab settings={settings} onRefresh={refreshSettings} />}
        {tab === "assets" && <AssetsTab />}
        {tab === "promo" && <PromoCodesTab />}
        {tab === "seo" && <SEOTab settings={settings} onRefresh={refreshSettings} />}
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
    if (!uploading[type]) return null;
    const pct = uploadProgress[type] ?? 0;
    return (
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Nahrávám…</span>
          <span style={{ fontSize: "12px", color: "#aaa" }}>{pct}%</span>
        </div>
        <div style={{ height: "10px", background: "#1b1b1b", borderRadius: "999px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #0B99FC, #4cc3ff)",
              transition: "width 200ms ease",
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
                <img src={form.artworkUrl} alt="artwork preview" style={{ width: "80px", height: "80px", objectFit: "cover", marginTop: "8px", borderRadius: "3px" }} />
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
              <td style={{ padding: "8px 12px" }}>
                {beat.artwork_url ? (
                  <img
                    src={beat.artwork_url}
                    alt={beat.title}
                    style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "3px", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                  />
                ) : (
                  <div style={{ width: "40px", height: "40px", background: "#222", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "18px", color: "#444" }}>♪</span>
                  </div>
                )}
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
    if (!uploading[type]) return null;
    const pct = uploadProgress[type] ?? 0;
    return (
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Nahrávám…</span>
          <span style={{ fontSize: "12px", color: "#aaa" }}>{pct}%</span>
        </div>
        <div style={{ height: "10px", background: "#1b1b1b", borderRadius: "999px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #0B99FC, #4cc3ff)",
              transition: "width 200ms ease",
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
          {kits.map((kit: SoundKit) => (
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

function OrdersList({ orders }: { orders: any[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 90px 100px 100px", gap: "8px", padding: "8px", fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #1a1a1a" }}>
        <div>ID</div><div>Email / Kupující</div><div>Celkem</div><div>Status</div><div>Datum</div><div>Akce</div>
      </div>
      {orders.map((order: any) => {
        const isPaid = order.status === "paid" || order.status === "completed";
        const items: any[] = Array.isArray(order.items) ? order.items : [];
        const beatItems = items.filter((i: any) => i.productType === "beat");
        const isExpanded = expandedId === order.id;
        return (
          <div key={order.id} style={{ border: "1px solid #1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 90px 100px 100px", gap: "8px", padding: "10px 8px", alignItems: "center", background: isExpanded ? "#161616" : "transparent", cursor: "pointer" }}
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
              <div style={{ fontSize: "12px", color: "#555" }}>{isExpanded ? "▲" : "▼"}</div>
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

function OrdersTab({ orders }: any) {
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
        <OrdersList orders={orders} />
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

PODPISY SMLUVNÍCH STRAN
Smluvní strany prohlašují, že si tuto Smlouvu přečetly, že odpovídá jejich pravé a svobodné vůli a že ji uzavírají dobrovolně, nikoli v tísni ani za nápadně nevýhodných podmínek.

Nabyvatel licence:
Jméno: ________________________________
Datum: ________________________________
Podpis: ________________________________

Poskytovatel licence:
Vojtěch Vojkovský (VOODOO808)
Datum: ________________________________
Podpis: ________________________________`;

const PLACEHOLDER_GUIDE = [
  { ph: "{{DATUM}}", desc: "Datum uzavření smlouvy (automaticky)" },
  { ph: "{{PRAVNI_JMENO}}", desc: "Právní jméno kupujícího" },
  { ph: "{{UMELECKE_JMENO}}", desc: "Umělecké jméno kupujícího" },
  { ph: "{{ADRESA}}", desc: "Adresa kupujícího" },
  { ph: "{{BEAT_NAZEV}}", desc: "Název beatu z objednávky" },
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.85)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "4px", width: "100%", maxWidth: "820px", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #ddd", background: "#f5f5f5" }}>
              <span style={{ fontWeight: "bold", color: "#161616", fontSize: "14px" }}>Náhled smlouvy (vzorová data)</span>
              <button onClick={() => setPreviewHtml(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}>×</button>
            </div>
            <iframe srcDoc={previewHtml} style={{ flex: 1, border: "none", width: "100%" }} title="Náhled smlouvy" />
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

  return (
    <div>
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

function SettingsTab({ settings, onRefresh }: any) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async (key: string, value: string) => {
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ key, value }) });
    onRefresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {Object.entries(localSettings).map(([key, value]: [string, any]) => (
        <div key={key}>
          <label style={{ display: "block", marginBottom: "8px" }}>{key}</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={value} onChange={(e) => setLocalSettings({ ...localSettings, [key]: e.target.value })} style={{ flex: 1 }} />
            <button className="btn btn-filled" onClick={() => handleSave(key, localSettings[key])}>Uložit</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetsTab() { return <div style={{ color: "#666" }}>Asset management integration in progress...</div>; }
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

export default Admin;