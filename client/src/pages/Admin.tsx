import { useState, useEffect } from "react";
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
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#111", border: "1px solid #333", borderRadius: "6px",
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
  created_at: string;
}

function Admin() {
  const { settings, refreshSettings } = useApp() as any;
  const [, navigate] = useLocation();
  const initialTab = (() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    const valid = ["beats", "kits", "orders", "licenses", "settings", "assets", "promo"];
    return (valid.includes(p || "") ? p : "orders") as "beats" | "kits" | "orders" | "licenses" | "settings" | "assets" | "promo";
  })();
  const [tab, setTab] = useState<"beats" | "kits" | "orders" | "licenses" | "settings" | "assets" | "promo">(initialTab);
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
        {["beats", "kits", "orders", "licenses", "settings", "assets", "promo"].map((t) => (
          <button
            key={t}
            className={tab === t ? "btn btn-filled" : "btn btn-admin"}
            onClick={() => setTab(t as any)}
            style={tab !== t ? { borderColor: "#333", color: "#666" } : {}}
          >
            {t === "beats" ? "Beaty" : t === "kits" ? "Zvuky" : t === "orders" ? "Objednávky" : t === "licenses" ? "Licence" : t === "settings" ? "Nastavení" : t === "assets" ? "Assety" : "Promo kódy"}
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
            <th style={{ textAlign: "left", padding: "12px" }}>Cena</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Featured</th>
            <th style={{ textAlign: "right", padding: "12px" }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {beats.map((beat: Beat) => (
            <tr key={beat.id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "12px" }}>
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
                  />
                ) : (
                  <div style={{ width: "40px", height: "40px", background: "#222", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "18px", color: "#444" }}>♪</span>
                  </div>
                )}
              </td>
              <td style={{ padding: "12px" }}>{beat.title}</td>
              <td style={{ padding: "12px" }}>{beat.bpm}</td>
              <td style={{ padding: "12px" }}>{beat.price} CZK</td>
              <td style={{ padding: "12px" }}>{beat.is_published ? "Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px" }}>{beat.is_highlighted ? "Featured" : ""}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button className="btn btn-admin" onClick={() => setEditing(beat)} style={{ marginRight: "8px" }} data-testid={`button-edit-beat-${beat.id}`}>Upravit</button>
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
    setForm({ title: "", description: "", type: "drum_kit", price: 899, priceType: "kit", isFree: false, numberOfSounds: 0, tags: [], previewUrl: "", fileUrl: "", artworkUrl: "", legalInfo: "", authorInfo: "", isPublished: true });
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
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Preview Audio</label>
              <input type="file" accept="audio/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "preview"); setForm({ ...form, previewUrl: url as string }); } }} style={{ width: "100%" }} />
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
            <th style={{ textAlign: "left", padding: "12px" }}>Název</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Typ</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Cena</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
            <th style={{ textAlign: "right", padding: "12px" }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {kits.map((kit: SoundKit) => (
            <tr key={kit.id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "12px" }}>
                <input 
                  type="checkbox" 
                  checked={selectedKits.includes(kit.id)}
                  onChange={() => handleSelectKit(kit.id)}
                  data-testid={`checkbox-kit-${kit.id}`}
                />
              </td>
              <td style={{ padding: "12px" }}>{kit.title}</td>
              <td style={{ padding: "12px" }}>{kit.type}</td>
              <td style={{ padding: "12px" }}>{kit.is_free ? "Zdarma" : `${kit.price} CZK`}</td>
              <td style={{ padding: "12px" }}>{kit.is_published ? "Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button className="btn btn-admin" onClick={() => setEditing(kit)} style={{ marginRight: "8px" }} data-testid={`button-edit-kit-${kit.id}`}>Upravit</button>
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

      {/* Orders table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>ID</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>Email</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>Celkem</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>Status</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400 }}>Datum</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "32px 8px", color: "#444", fontSize: "13px", textAlign: "center" }}>Žádné objednávky</td></tr>
          )}
          {orders.map((order: any) => (
            <tr key={order.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <td style={{ padding: "12px 8px", color: "#666", fontSize: "13px" }}>#{order.id}</td>
              <td style={{ padding: "12px 8px", fontSize: "13px" }}>{order.email}</td>
              <td style={{ padding: "12px 8px", fontSize: "13px", fontWeight: 600 }}>{Number(order.total).toLocaleString("cs-CZ")} Kč</td>
              <td style={{ padding: "12px 8px" }}>
                <span style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  background: order.status === "paid" || order.status === "completed" ? "rgba(36,224,83,0.12)" : "rgba(255,255,255,0.06)",
                  color: order.status === "paid" || order.status === "completed" ? "#24e053" : "#888",
                  border: `1px solid ${order.status === "paid" || order.status === "completed" ? "rgba(36,224,83,0.3)" : "#333"}`,
                }}>
                  {order.status}
                </span>
              </td>
              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#888" }}>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LicensesTab({ licenses, onRefresh }: any) {
  const [form, setForm] = useState({ name: "", description: "", price: 0, file_types: [] as string[], terms_text: "", is_negotiable: false, is_active: true });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/licenses", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
    setShowForm(false);
    onRefresh();
  };

  return (
    <div>
      <button className="btn btn-admin" onClick={() => setShowForm(!showForm)} style={{ marginBottom: "16px" }}>{showForm ? "Zrušit" : "Přidat licenci"}</button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "3px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><label>Název</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: "100%" }} /></div>
            <div><label>Cena (CZK)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} style={{ width: "100%" }} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label>Popis</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%" }} /></div>
          </div>
          <button type="submit" className="btn btn-filled" style={{ marginTop: "16px" }}>Uložit licenci</button>
        </form>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={{ textAlign: "left", padding: "12px" }}>Název</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Cena</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((license: LicenseType) => (
            <tr key={license.id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "12px" }}>{license.name}</td>
              <td style={{ padding: "12px" }}>{license.price} CZK</td>
              <td style={{ padding: "12px" }}>{license.is_active ? "Aktivní" : "Neaktivní"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ settings, onRefresh }: any) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async (key: string, value: string) => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ key, value }) });
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
function PromoCodesTab() { return <div style={{ color: "#666" }}>Promo codes management integration in progress...</div>; }

export default Admin;