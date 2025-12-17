import { useState, useEffect } from "react";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  is_highlighted?: boolean;
}

interface LicenseOption {
  id: string;
  name: string;
  format: string;
  price: number | "NEGOTIATE";
}

interface ContractModalProps {
  beat: Beat;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (beat: Beat, license: LicenseOption) => void;
  onPlay: () => void;
  isPlaying: boolean;
}

const licenseOptions: LicenseOption[] = [
  { id: "mp3_lease", name: "MP3 Lease", format: "MP3", price: 299 },
  { id: "wav_lease", name: "WAV Lease", format: "WAV & MP3", price: 499 },
  { id: "track_stems", name: "Track Stems", format: "WAV, MP3 & STEMS", price: 999 },
  { id: "mp3_unlimited", name: "Mp3 Unlimited Lease", format: "MP3", price: 1499 },
  { id: "wav_unlimited_stems", name: "WAV Unlimited + Stems (Premium)", format: "MP3, WAV & STEMS", price: 2999 },
  { id: "exclusive", name: "EXCLUSIVE RIGHTS", format: "NEGOTIATE", price: "NEGOTIATE" },
];

function ContractModal({ beat, isOpen, onClose, onAddToCart, onPlay, isPlaying }: ContractModalProps) {
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<LicenseOption | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedLicense(null);
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (selectedLicense && selectedLicense.price !== "NEGOTIATE") {
      onAddToCart(beat, selectedLicense);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div
            style={{
              padding: "80px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #333",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#999", fontSize: "14px" }}>Načítá se</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "24px", borderBottom: "1px solid #333" }}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={beat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                    alt={beat.title}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <button
                    onClick={onPlay}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                      background: isPlaying ? "#fff" : "rgba(0,0,0,0.7)",
                      color: isPlaying ? "#000" : "#fff",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>
                    {beat.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "#999" }}>
                    {beat.artist} • {beat.bpm} BPM
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: "13px", color: "#999", marginBottom: "16px" }}>
                Vyberte typ licence
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {licenseOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedLicense(option)}
                    style={{
                      padding: "16px",
                      border: selectedLicense?.id === option.id ? "1px solid #fff" : "1px solid #333",
                      background: selectedLicense?.id === option.id ? "rgba(255,255,255,0.05)" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                          {option.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {option.format}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                          {option.price === "NEGOTIATE" ? "NEGOTIATE" : `${option.price} CZK`}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Usage terms would be shown here");
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#666",
                            fontSize: "11px",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                        >
                          Show usage terms
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #333" }}>
              <button
                onClick={handleAddToCart}
                disabled={!selectedLicense || selectedLicense.price === "NEGOTIATE"}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "#fff" : "#333",
                  color: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "#000" : "#666",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>+</span>
                {selectedLicense ? (
                  selectedLicense.price === "NEGOTIATE" ? "KONTAKTUJTE NÁS" : `${selectedLicense.price} CZK`
                ) : "VYBERTE LICENCI"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ContractModal;
