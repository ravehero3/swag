import { useState } from "react";
import { useLocation } from "wouter";

interface Item {
  id: number;
  title: string;
  artwork_url: string;
  preview_url?: string;
}

interface DownloadModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

function DownloadModal({ item, isOpen, onClose, user }: DownloadModalProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const isSoundKit = 'number_of_sounds' in item;

  const handleDownload = async () => {
    if (!user) {
      setLocation("/prihlasit-se");
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isSoundKit
        ? `/api/sound-kits/${item.id}/download`
        : `/api/beats/${item.id}/download`;

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          const a = document.createElement("a");
          a.href = data.downloadUrl;
          a.download = item.title;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          onClose();
        }
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err.error || "Stažení se nezdařilo. Zkuste to znovu.");
      }
    } catch {
      setError("Stažení se nezdařilo. Zkuste to znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 13, 13, 0.9)",
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
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          aspectRatio: "1",
          borderRadius: "4px",
          overflow: "hidden",
          backgroundImage: `url(${item.artwork_url || "/uploads/artwork/metallic-logo.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "0.5px solid #666",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.5) 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
              ZDARMA STÁHNOUT BEAT K POSLECHU
            </p>
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#fff", lineHeight: "1.2" }}>
              {item.title}
            </h2>
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: "#ff6b6b", marginBottom: "12px" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleDownload}
            disabled={isLoading}
            data-testid="button-download-free"
            className="btn-bounce"
            style={{
              padding: "14px 32px",
              background: isLoading ? "#ccc" : "#fff",
              color: "#0D0D0D",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "auto",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "STAHOVÁNÍ..." : "STÁHNOUT ZDARMA"}
          </button>

          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(13,13,13,0.6)",
              border: "none",
              color: "#fff",
              fontSize: "24px",
              cursor: "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
