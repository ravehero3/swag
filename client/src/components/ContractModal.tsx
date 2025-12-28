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
  { id: "exclusive_100k", name: "EXCLUSIVE RIGHTS (0 - 100k měsíčních posluchačů)", format: "MP3, WAV, STOPY (STEMS)", price: 5000 },
  { id: "exclusive_unlimited", name: "EXCLUSIVE RIGHTS (100k a víc měsíčních posluchačů)", format: "MP3, WAV, STOPY (STEMS)", price: 10000 },
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
        background: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#000",
          border: "0.5px solid #333",
          borderRadius: "4px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "none",
          margin: "auto",
          position: "relative",
          zIndex: 10000,
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
                    style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
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
                      borderRadius: "4px",
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
                className="btn-bounce"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "#fff" : "#333",
                  color: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "#000" : "#666",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                    <rect x="3" y="6" width="18" height="15" rx="2" />
                    <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                  </svg>
                  <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: selectedLicense && selectedLicense.price !== "NEGOTIATE" ? "#000" : "#666", lineHeight: "1", right: "26px", top: "-8px" }}>+</span>
                </div>
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
