import { useLocation } from "wouter";

interface SoundKit {
  id: number;
  title: string;
  artwork_url: string;
  preview_url?: string;
}

interface DownloadModalProps {
  kit: SoundKit | null;
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

function DownloadModal({ kit, isOpen, onClose, user }: DownloadModalProps) {
  const [, setLocation] = useLocation();

  if (!isOpen || !kit) return null;

  const handleDownload = async () => {
    if (!user) {
      setLocation("/prihlasit-se");
      onClose();
      return;
    }

    try {
      const response = await fetch(`/api/sound-kits/${kit.id}/download`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${kit.title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onClose();
      }
    } catch (error) {
      console.error("Download error:", error);
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
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          aspectRatio: "1",
          borderRadius: "4px",
          overflow: "hidden",
          backgroundImage: `url(${kit.artwork_url || "/uploads/artwork/metallic-logo.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)",
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
              {kit.title}
            </h2>
          </div>

          <button
            onClick={handleDownload}
            className="btn-bounce"
            style={{
              padding: "14px 32px",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "auto",
            }}
          >
            STÁHNOUT ZDARMA
          </button>

          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(0,0,0,0.6)",
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
