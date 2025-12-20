import { useState, useEffect } from "react";
import { useApp } from "../App";
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

interface BeatLicenseFile {
  id: number;
  beat_id: number;
  license_type_id: number;
  file_url: string;
  uploaded_at: string;
  license_name: string;
  license_description: string;
}

function Admin() {
  const { user } = useApp();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"beats" | "kits" | "orders" | "licenses">("beats");
  const [beats, setBeats] = useState<Beat[]>([]);
  const [kits, setKits] = useState<SoundKit[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<LicenseType[]>([]);
  const [showBeatForm, setShowBeatForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [editingKit, setEditingKit] = useState<SoundKit | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/prihlasit-se");
      return;
    }
    loadData();
  }, [user]);

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
    <div className="fade-in">
      <h1 style={{ marginBottom: "24px" }}>Admin Panel</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {["beats", "kits", "orders", "licenses"].map((t) => (
          <button
            key={t}
            className={tab === t ? "btn btn-filled" : "btn"}
            onClick={() => setTab(t as any)}
          >
            {t === "beats" ? "Beaty" : t === "kits" ? "Zvuky" : t === "orders" ? "Objednávky" : "Licence"}
          </button>
        ))}
      </div>

      {tab === "beats" && (
        <BeatsTab
          beats={beats}
          licenses={licenses}
          showForm={showBeatForm}
          setShowForm={setShowBeatForm}
          editing={editingBeat}
          setEditing={setEditingBeat}
          onRefresh={loadData}
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
    </div>
  );
}

function BeatsTab({ beats, showForm, setShowForm, editing, setEditing, onRefresh }: any) {
  const [form, setForm] = useState({
    title: "",
    artist: "VOODOO808",
    bpm: 140,
    key: "C",
    price: 0,
    previewUrl: "",
    fileUrl: "",
    artworkUrl: "",
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
        tags: editing.tags || [],
        isPublished: editing.is_published,
        isHighlighted: editing.is_highlighted || false,
      });
      setShowForm(true);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/beats/${editing.id}` : "/api/beats";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    setShowForm(false);
    setEditing(null);
    setForm({ title: "", artist: "VOODOO808", bpm: 140, key: "C", price: 0, previewUrl: "", fileUrl: "", artworkUrl: "", tags: [], isPublished: false, isHighlighted: false });
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/beats/${id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
  };

  const uploadFile = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload?type=${type}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    return data.url;
  };

  return (
    <div>
      <button className="btn" onClick={() => { setShowForm(!showForm); setEditing(null); }} style={{ marginBottom: "16px" }}>
        {showForm ? "Zrušit" : "Přidat beat"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333" }}>
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
              <span style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}>Pouze jeden beat může být zvýrazněn</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Tagy (max 3)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Přidat tag" style={{ flex: 1 }} />
                <button type="button" className="btn" onClick={() => {
                  if (tagInput && form.tags.length < 3) {
                    setForm({ ...form, tags: [...form.tags, tagInput] });
                    setTagInput("");
                  }
                }}>+</button>
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
              <input type="file" accept="audio/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "preview");
                  setForm({ ...form, previewUrl: url });
                }
              }} style={{ width: "100%" }} />
              {form.previewUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Beat File</label>
              <input type="file" accept="audio/*,.zip,.rar" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "beat");
                  setForm({ ...form, fileUrl: url });
                }
              }} style={{ width: "100%" }} />
              {form.fileUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "artwork");
                  setForm({ ...form, artworkUrl: url });
                }
              }} style={{ width: "100%" }} />
              {form.artworkUrl && <span style={{ fontSize: "12px", color: "#666" }}>Nahráno</span>}
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
                <button className="btn" onClick={() => setEditing(beat)} style={{ marginRight: "8px" }}>Upravit</button>
                <button className="btn" onClick={() => handleDelete(beat.id)} style={{ color: "#ff4444" }}>Smazat</button>
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
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/sound-kits/${editing.id}` : "/api/sound-kits";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

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
    const res = await fetch(`/api/upload?type=${type}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    return data.url;
  };

  const addTag = () => {
    if (tagInput && form.tags.length < 10) {
      setForm({ ...form, tags: [...form.tags, tagInput] });
      setTagInput("");
    }
  };

  return (
    <div>
      <button className="btn" onClick={() => { setShowForm(!showForm); setEditing(null); }} style={{ marginBottom: "16px" }}>
        {showForm ? "Zrušit" : "Přidat zvukový kit"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333" }}>
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
              <label style={{ display: "block", marginBottom: "8px" }}>
                <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })} /> Zdarma (výměnou za email)
              </label>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Počet zvuků</label>
              <input type="number" value={form.numberOfSounds} onChange={(e) => setForm({ ...form, numberOfSounds: Number(e.target.value) })} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Publikovat</label>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Tagy (max 10)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Přidat tag" style={{ flex: 1 }} />
                <button type="button" className="btn" onClick={addTag}>+</button>
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
              <input type="file" accept="audio/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "preview");
                  setForm({ ...form, previewUrl: url });
                }
              }} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>ZIP/RAR soubor</label>
              <input type="file" accept=".zip,.rar" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "kit");
                  setForm({ ...form, fileUrl: url });
                }
              }} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>Artwork</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "artwork");
                  setForm({ ...form, artworkUrl: url });
                }
              }} style={{ width: "100%" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Legální informace</label>
              <textarea value={form.legalInfo} onChange={(e) => setForm({ ...form, legalInfo: e.target.value })} rows={2} style={{ width: "100%" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Info o autorovi</label>
              <textarea value={form.authorInfo} onChange={(e) => setForm({ ...form, authorInfo: e.target.value })} rows={2} style={{ width: "100%" }} />
            </div>
          </div>
          <button type="submit" className="btn btn-filled" style={{ marginTop: "16px" }}>
            {editing ? "Uložit změny" : "Přidat kit"}
          </button>
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
                <button className="btn" onClick={() => setEditing(kit)} style={{ marginRight: "8px" }}>Upravit</button>
                <button className="btn" onClick={() => handleDelete(kit.id)} style={{ color: "#ff4444" }}>Smazat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab({ orders, onRefresh }: any) {
  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    onRefresh();
  };

  return (
    <div>
      {orders.length === 0 ? (
        <p style={{ color: "#666" }}>Zatím nejsou žádné objednávky</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333" }}>
              <th style={{ textAlign: "left", padding: "12px" }}>ID</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Položky</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Celkem</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
              <th style={{ textAlign: "right", padding: "12px" }}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "12px" }}>#{order.id}</td>
                <td style={{ padding: "12px" }}>{order.email}</td>
                <td style={{ padding: "12px" }}>
                  {(typeof order.items === "string" ? JSON.parse(order.items) : order.items)?.map((item: any) => item.title).join(", ")}
                </td>
                <td style={{ padding: "12px" }}>{order.total} CZK</td>
                <td style={{ padding: "12px" }}>{order.status}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    style={{ padding: "8px" }}
                  >
                    <option value="pending">Čeká na platbu</option>
                    <option value="paid">Zaplaceno</option>
                    <option value="delivered">Doručeno</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LicensesTab({ licenses, onRefresh }: any) {
  return (
    <div>
      {licenses.length === 0 ? (
        <p style={{ color: "#666" }}>Zatím nejsou žádné licence</p>
      ) : (
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
                <td style={{ padding: "12px" }}>{license.is_active ? "✓ Aktivní" : "Neaktivní"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
