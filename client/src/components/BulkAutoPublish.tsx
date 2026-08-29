import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";

interface StagedBeat {
  localId: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  fileUrl: string;
  previewUrl: string;
  errorMsg: string;
  title: string;
  bpm: string;
  key: string;
  price: string;
  isPublished: boolean;
}

interface BulkAutoPublishProps {
  onBeatsAdded?: (count: number) => void;
  onRefresh?: () => void;
}

export function BulkAutoPublish({ onBeatsAdded, onRefresh }: BulkAutoPublishProps) {
  const [stagedBeats, setStagedBeats] = useState<StagedBeat[]>([]);
  const [showZone, setShowZone] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const MUSICAL_KEYS = [
    "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
    "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gbm", "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm",
  ];

  const fileToTitle = (file: File) =>
    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();

  const handleBulkFiles = (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter(f => 
      f.type.startsWith("audio/") || /\.(mp3|wav|aiff|flac|ogg|m4a)$/i.test(f.name)
    );
    
    if (audioFiles.length === 0) return;
    
    const newStaged: StagedBeat[] = audioFiles.map(file => ({
      localId: Math.random().toString(36).slice(2),
      file,
      status: "pending" as const,
      progress: 0,
      fileUrl: "",
      previewUrl: "",
      errorMsg: "",
      title: fileToTitle(file),
      bpm: "140",
      key: "C",
      price: "5000",
      isPublished: true,
    }));
    
    setStagedBeats(prev => [...prev, ...newStaged]);
    newStaged.forEach(b => uploadStagedBeat(b.localId, b.file));
  };

  const uploadStagedBeat = async (localId: string, file: File) => {
    setStagedBeats(prev => prev.map(b => b.localId === localId ? { ...b, status: "uploading", progress: 0 } : b));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const publicUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload?type=beat-preview", true);
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setStagedBeats(prev => prev.map(b => b.localId === localId ? { ...b, progress: pct } : b));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });
      setStagedBeats(prev => prev.map(b => b.localId === localId ? { ...b, status: "done", progress: 100, fileUrl: publicUrl, previewUrl: publicUrl } : b));
    } catch (err) {
      setStagedBeats(prev => prev.map(b => b.localId === localId ? { ...b, status: "error", errorMsg: String(err) } : b));
    }
  };

  const handleBulkCreate = async () => {
    const ready = stagedBeats.filter(b => b.status === "done");
    if (ready.length === 0) return;
    
    setBulkCreating(true);
    try {
      const payload = ready.map(b => ({
        title: b.title || b.file.name,
        artist: "VOODOO808",
        bpm: b.bpm ? parseInt(b.bpm) : null,
        key: b.key || null,
        price: b.price ? parseFloat(b.price) : 0,
        previewUrl: b.previewUrl,
        fileUrl: b.previewUrl,
        isPublished: b.isPublished,
        tags: [],
      }));
      
      const res = await fetch("/api/beats/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error("Create failed");
      
      setStagedBeats(prev => prev.filter(b => b.status !== "done"));
      onBeatsAdded?.(ready.length);
      onRefresh?.();
    } catch (err) {
      alert("Chyba při vytváření beatů: " + String(err));
    } finally {
      setBulkCreating(false);
    }
  };

  const inputStyle = {
    width: "100%" as const,
    padding: "5px 8px" as const,
    background: "#0d0d0d" as const,
    border: "1px solid #2a2a2a" as const,
    color: "#fff" as const,
    fontSize: "12px" as const,
    borderRadius: "3px" as const,
    fontFamily: "inherit" as const,
  };

  const selectStyle = { ...inputStyle, cursor: "pointer" as const };

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          className="btn btn-admin"
          onClick={() => setShowZone(v => !v)}
          style={{ borderColor: "#0B99FC", color: "#0B99FC", fontSize: "13px" }}
        >
          {showZone ? "Zavřít hromadný upload" : "🚀 Hromadný upload s auto-publikací"}
        </button>
        <span style={{ fontSize: "11px", color: "#555" }}>Nahraj až 50 beatů najednou a publikuj jedním kliknutím</span>
      </div>

      {showZone && (
        <div style={{ marginBottom: "24px", padding: "20px", background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "10px" }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); handleBulkFiles(e.dataTransfer.files); }}
            onClick={() => bulkFileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${isDragOver ? "#0B99FC" : "#2a2a2a"}`,
              borderRadius: "8px",
              padding: "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragOver ? "rgba(11,153,252,0.05)" : "transparent",
              transition: "all 0.15s ease",
              marginBottom: stagedBeats.length > 0 ? "16px" : "0"
            }}
          >
            <Upload size={28} color="#444" style={{ marginBottom: "8px" }} />
            <div style={{ color: "#aaa", fontSize: "13px" }}>Přetáhněte audio soubory nebo klikněte</div>
            <div style={{ color: "#444", fontSize: "11px", marginTop: "4px" }}>MP3, WAV, AIFF, FLAC — více souborů najednou (max 50)</div>
            <input
              ref={bulkFileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.m4a"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files) handleBulkFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {stagedBeats.length > 0 && (
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e1e", color: "#444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Soubor / Název</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, width: "80px" }}>BPM</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, width: "80px" }}>Tónina</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, width: "90px" }}>Cena Kč</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, width: "70px" }}>Publik.</th>
                    <th style={{ padding: "8px 10px", width: "28px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {stagedBeats.map(b => (
                    <tr key={b.localId} style={{ borderBottom: "1px solid #111" }}>
                      <td style={{ padding: "8px 10px" }}>
                        {b.status === "uploading" || b.status === "pending" ? (
                          <div>
                            <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>{b.file.name}</div>
                            <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${b.progress}%`, background: "linear-gradient(90deg,#0B99FC,#4cc3ff)", transition: "width 200ms" }} />
                            </div>
                            <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>{b.progress}%</div>
                          </div>
                        ) : b.status === "error" ? (
                          <div>
                            <div style={{ color: "#ff5252", fontSize: "11px" }}>{b.file.name}</div>
                            <div style={{ color: "#ff5252", fontSize: "10px" }}>{b.errorMsg}</div>
                          </div>
                        ) : (
                          <input value={b.title} onChange={e => setStagedBeats(prev => prev.map(x => x.localId === b.localId ? { ...x, title: e.target.value } : x))} style={{ ...inputStyle, padding: "5px 8px", fontSize: "12px" }} placeholder="Název beatu" />
                        )}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <input value={b.bpm} onChange={e => setStagedBeats(prev => prev.map(x => x.localId === b.localId ? { ...x, bpm: e.target.value } : x))} style={{ ...inputStyle, padding: "5px 8px", fontSize: "12px" }} placeholder="BPM" type="number" disabled={b.status !== "done"} />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <select value={b.key} onChange={e => setStagedBeats(prev => prev.map(x => x.localId === b.localId ? { ...x, key: e.target.value } : x))} style={{ ...selectStyle, padding: "5px 8px", fontSize: "12px" }} disabled={b.status !== "done"}>
                          {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <input value={b.price} onChange={e => setStagedBeats(prev => prev.map(x => x.localId === b.localId ? { ...x, price: e.target.value } : x))} style={{ ...inputStyle, padding: "5px 8px", fontSize: "12px" }} placeholder="Cena" type="number" disabled={b.status !== "done"} />
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <input type="checkbox" checked={b.isPublished} onChange={e => setStagedBeats(prev => prev.map(x => x.localId === b.localId ? { ...x, isPublished: e.target.checked } : x))} disabled={b.status !== "done"} />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <button onClick={() => setStagedBeats(prev => prev.filter(x => x.localId !== b.localId))} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "15px", lineHeight: 1 }} title="Odebrat">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  className="btn btn-filled"
                  onClick={handleBulkCreate}
                  disabled={bulkCreating || stagedBeats.filter(b => b.status === "done").length === 0}
                  style={{ opacity: bulkCreating || stagedBeats.filter(b => b.status === "done").length === 0 ? 0.45 : 1, fontSize: "13px" }}
                >
                  {bulkCreating ? "Vytváří se…" : `Vytvořit ${stagedBeats.filter(b => b.status === "done").length} beatů`}
                </button>

                {stagedBeats.filter(b => b.status === "done").length > 0 && (
                  <button
                    className="btn btn-filled"
                    onClick={handleBulkCreate}
                    disabled={bulkPublishing}
                    style={{ background: "#24e053", color: "#000", fontSize: "13px" }}
                  >
                    {bulkPublishing ? "Publikuji…" : "🚀 PUBLIKOVAT VŠE"}
                  </button>
                )}

                <button className="btn btn-admin" onClick={() => setStagedBeats([])} style={{ color: "#555", borderColor: "#2a2a2a", fontSize: "13px" }}>Vymazat vše</button>
                
                {stagedBeats.some(b => b.status === "uploading" || b.status === "pending") && (
                  <span style={{ color: "#666", fontSize: "11px" }}>Nahrávám {stagedBeats.filter(b => b.status === "uploading" || b.status === "pending").length} souborů…</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
