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

function B2FilePicker({ onSelect, onClose }: { onSelect: (key: string) => void; onClose: () => void }) {
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
  const { user, settings, refreshSettings } = useApp() as any;
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"beats" | "kits" | "orders" | "licenses" | "settings" | "assets" | "promo">("beats");
  const [itbeats, setBeats] = useState<Beat[]>([]);
  const [kits, setKits] = useState<SoundKit[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<LicenseType[]>([]);
  const [showBeatForm, setShowBeatForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [editingKit, setEditingKit] = useState<SoundKit | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.isAdmin) {
            loadData();
          } else {
            navigate("/prihlasit-se");
          }
        } else {
          navigate("/prihlasit-se");
        }
      } catch (err) {
        navigate("/prihlasit-se");
      }
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [beatsRes, kitsRes, ordersRes, licensesRes] = await Promise.all([
        fetch("/api/beats/all", { credentials: "include" }),
        fetch("/api/sound-kits/all", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
        fetch("/api/licenses/all", { credentials: "include" }),
      ]);
      setBeats(await beatsRes.json());
      setKits(await kitsRes.json());
      setOrders(await ordersRes.json());
      setLicenses(await licensesRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.isAdmin) return null;

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
            {t === "beats" ? "Beaty" : t === "kits" ? "Zvuky" : t === "orders" ? "Objednávky" : t === "licenses" ? "Licence" : t === "settings" ? "Nastavení" : t === "assets" ? "Assety (Ikony/Carousel)" : "Promo kódy"}
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

function BeatsTab({ beats, showForm, setShowForm, editing, setEditing, onRefresh, loadData }: any) {
  const [form, setForm] = useState({
    title: "",
    artist: "VOODOO808",
    bpm: 140,
    key: "C",
    price: 0,
    previewUrl: "",
    fileUrl: "",
    artworkUrl: "",
    trackoutUrl: "",
    tags: [] as string[],
    isPublished: false,
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
      setForm({
        title: editing.title,
        artist: editing.artist,
        bpm: editing.bpm,
        key: editing.key,
        price: editing.price,
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
      setForm({ title: "", artist: "VOODOO808", bpm: 140, key: "C", price: 0, previewUrl: "", fileUrl: "", artworkUrl: "", trackoutUrl: "", tags: [], isPublished: false, isHighlighted: false });
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
    const useServerUpload = isLargeFile || type === "beat" || type === "kit" || type === "trackout";

    try {
      if (useServerUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
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
              <label style={{ display: "block", marginBottom: "8px" }}>Cena (CZK)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} style={{ width: "100%" }} />
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
              <input
                type="file"
                accept="audio/*"
                disabled={uploading["preview"]}
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "preview");
                    if (url) setForm(f => ({ ...f, previewUrl: url }));
                  }
                }}
                style={{ width: "100%" }}
              />
              <UploadProgressBar type="preview" />
              <div style={{ marginTop: "6px" }}><UploadStatus type="preview" url={form.previewUrl} /></div>
              {form.previewUrl && !uploading["preview"] && (
                <audio controls src={form.previewUrl} style={{ width: "100%", marginTop: "8px", height: "36px" }} />
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Beat File (ZIP / WAV / MP3)</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="file"
                  accept="audio/*,.zip,.rar"
                  disabled={uploading["beat"]}
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await uploadFile(e.target.files[0], "beat");
                      if (url) setForm(f => ({ ...f, fileUrl: url }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-admin"
                  onClick={() => setB2PickerFor("beat")}
                  style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                  data-testid="button-browse-b2-beat"
                >
                  Browse B2
                </button>
              </div>
              <UploadProgressBar type="beat" />
              <div style={{ marginTop: "6px" }}>
                {form.fileUrl && !uploading["beat"] && (
                  <span style={{ fontSize: "12px", color: "#4caf50" }}>✓ {uploadedNames["beat"] || form.fileUrl}</span>
                )}
                {!form.fileUrl && <UploadStatus type="beat" url={form.fileUrl} />}
              </div>
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
                    if (url) setForm(f => ({ ...f, artworkUrl: url }));
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
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="file"
                  accept=".zip"
                  disabled={uploading["trackout"]}
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await uploadFile(e.target.files[0], "trackout");
                      if (url) setForm(f => ({ ...f, trackoutUrl: url }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-admin"
                  onClick={() => setB2PickerFor("trackout")}
                  style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                  data-testid="button-browse-b2-trackout"
                >
                  Browse B2
                </button>
              </div>
              <UploadProgressBar type="trackout" />
              <div style={{ marginTop: "6px" }}>
                {form.trackoutUrl && !uploading["trackout"] && (
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
          onSelect={(key) => {
            if (b2PickerFor === "beat") setForm(f => ({ ...f, fileUrl: key }));
            if (b2PickerFor === "trackout") setForm(f => ({ ...f, trackoutUrl: key }));
          }}
          onClose={() => setB2PickerFor(null)}
        />
      )}
    </div>
  );
}

function KitsTab({ kits, showForm, setShowForm, editing, setEditing, onRefresh }: any) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "drum_kit",
    price: 0,
    isFree: false,
    numberOfSounds: 0,
    tags: [] as string[],
    previewUrl: "",
    fileUrl: "",
    artworkUrl: "",
    legalInfo: "",
    authorInfo: "",
    isPublished: false,
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
      setForm({
        title: editing.title,
        description: editing.description || "",
        type: editing.type,
        price: editing.price,
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
    // Small previews/art use fast B2 presign
    const isLargeFile = file.size > 50 * 1024 * 1024;
    const useServerUpload = isLargeFile || type === "beat" || type === "kit" || type === "trackout";

    try {
      if (useServerUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
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
              <label style={{ display: "block", marginBottom: "8px" }}>Cena (CZK)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} disabled={form.isFree} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}><input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })} /> Zdarma</label>
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
              <input type="file" accept="audio/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "preview"); setForm({ ...form, previewUrl: url }); } }} style={{ width: "100%" }} />
              <UploadProgressBar type="preview" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>ZIP/RAR soubor</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="file" accept=".zip,.rar" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "kit"); setForm({ ...form, fileUrl: url }); } }} style={{ flex: 1 }} />
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
              <input type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "artwork"); setForm({ ...form, artworkUrl: url }); } }} style={{ width: "100%" }} />
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

function OrdersTab({ orders }: any) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #333" }}>
          <th style={{ textAlign: "left", padding: "12px" }}>ID</th>
          <th style={{ textAlign: "left", padding: "12px" }}>Email</th>
          <th style={{ textAlign: "left", padding: "12px" }}>Total</th>
          <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
          <th style={{ textAlign: "left", padding: "12px" }}>Datum</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order: any) => (
          <tr key={order.id} style={{ borderBottom: "1px solid #222" }}>
            <td style={{ padding: "12px" }}>#{order.id}</td>
            <td style={{ padding: "12px" }}>{order.email}</td>
            <td style={{ padding: "12px" }}>{order.total} CZK</td>
            <td style={{ padding: "12px" }}>{order.status}</td>
            <td style={{ padding: "12px" }}>{new Date(order.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
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