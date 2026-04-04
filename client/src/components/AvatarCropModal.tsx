import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  saving?: boolean;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement("canvas");
  const SIZE = 256;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    SIZE,
    SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas to blob failed"));
    }, "image/jpeg", 0.82);
  });
}

export default function AvatarCropModal({ imageSrc, onClose, onSave, saving }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onSave(blob);
    } catch (err) {
      console.error("Crop error:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: `url('/cursors/unavailable-custom.cur'), not-allowed`,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ cursor: "default", width: "340px", maxWidth: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ color: "#ccc", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em" }}>Upravit profilovou fotku</span>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#aaa", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
          >
            Zavřít ×
          </button>
        </div>

        <div
          style={{
            position: "relative",
            width: "340px",
            maxWidth: "95vw",
            height: "340px",
            maxHeight: "95vw",
            background: "#111",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #2a2a2a",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#0a0a0a" },
              cropAreaStyle: { borderColor: "rgba(255,255,255,0.5)" },
            }}
          />
        </div>

        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#fff", cursor: "pointer" }}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 0",
              background: saving ? "#222" : "#fff",
              color: saving ? "#555" : "#000",
              border: "none",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Ukládám..." : "Uložit"}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", background: "transparent", color: "#666", border: "1px solid #2a2a2a", borderRadius: "4px", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}
