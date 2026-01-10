import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";

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
  const [beats, setBeats] = useState<Beat[]>([]);
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
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload?type=${type}`, { method: "POST", credentials: "include", body: formData });
    const data = await res.json();
    return data.url;
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
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Preview Audio</label>
              <input type="file" accept="audio/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "preview"); setForm({ ...form, previewUrl: url }); } }} style={{ width: "100%" }} />
              {form.previewUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Beat File</label>
              <input type="file" accept="audio/*,.zip,.rar" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "beat"); setForm({ ...form, fileUrl: url }); } }} style={{ width: "100%" }} />
              {form.fileUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "artwork"); setForm({ ...form, artworkUrl: url }); } }} style={{ width: "100%" }} />
              {form.artworkUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Trackout (ZIP)</label>
              <input type="file" accept=".zip" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "trackout"); setForm({ ...form, trackoutUrl: url }); } }} style={{ width: "100%" }} />
              {form.trackoutUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-filled" style={{ marginTop: "16px" }}>
            {editing ? "Uložit změny" : "Přidat beat"}
          </button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
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
              <td style={{ padding: "12px" }}>{beat.title}</td>
              <td style={{ padding: "12px" }}>{beat.bpm}</td>
              <td style={{ padding: "12px" }}>{beat.price} CZK</td>
              <td style={{ padding: "12px" }}>{beat.is_published ? "✓ Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px" }}>{beat.is_highlighted ? "⭐" : ""}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button className="btn btn-admin" onClick={() => setEditing(beat)} style={{ marginRight: "8px" }}>Upravit</button>
                <button className="btn btn-admin" onClick={() => handleDelete(beat.id)} style={{ color: "#333", borderColor: "#333" }}>Smazat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload?type=${type}`, { method: "POST", credentials: "include", body: formData });
    const data = await res.json();
    return data.url;
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
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>ZIP/RAR soubor</label>
              <input type="file" accept=".zip,.rar" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "kit"); setForm({ ...form, fileUrl: url }); } }} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { const url = await uploadFile(e.target.files[0], "artwork"); setForm({ ...form, artworkUrl: url }); } }} style={{ width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
            <button type="submit" className="btn btn-filled">{editing ? "Uložit změny" : "Přidat kit"}</button>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> <span>Publikovat</span></label>
          </div>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
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
              <td style={{ padding: "12px" }}>{kit.title}</td>
              <td style={{ padding: "12px" }}>{kit.type}</td>
              <td style={{ padding: "12px" }}>{kit.is_free ? "Zdarma" : `${kit.price} CZK`}</td>
              <td style={{ padding: "12px" }}>{kit.is_published ? "✓ Publikováno" : "Skryto"}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button className="btn btn-admin" onClick={() => setEditing(kit)} style={{ marginRight: "8px" }}>Upravit</button>
                <button className="btn btn-admin" onClick={() => handleDelete(kit.id)} style={{ color: "#333", borderColor: "#333" }}>Smazat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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