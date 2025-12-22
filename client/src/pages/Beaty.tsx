import { useEffect, useState } from "react";

export interface Artist {
  name: string;
  id: string;
}

interface Props {
  artists?: Artist[];
  isEditable?: boolean;
  onUpdate?: (artists: Artist[]) => void;
}

const defaultArtists: Artist[] = [
  { name: "Calin", id: "calin" },
  { name: "Viktor Sheen", id: "viktor-sheen" },
  { name: "Hugo Toxxx", id: "hugo-toxxx" },
  { name: "Yzomandias", id: "yzomandias" },
  { name: "Ektor", id: "ektor" },
  { name: "Nik Tendo", id: "nik-tendo" },
  { name: "Cashanova Bulhar", id: "cashanova-bulhar" },
  { name: "Icy L", id: "icy-l" },
  { name: "Smack", id: "smack" },
  { name: "Hasan", id: "hasan" },
  { name: "Hard Rico", id: "hard-rico" },
  { name: "Pil C", id: "pil-c" },
  { name: "Luisa", id: "luisa" },
  { name: "Dollar Prync", id: "dollar-prync" },
  { name: "Saul", id: "saul" },
];

const ArtistCarousel = ({ artists = defaultArtists, isEditable = false, onUpdate }: Props) => {
  const [offset, setOffset] = useState(0);
  const [localArtists, setLocalArtists] = useState<Artist[]>(artists);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setOffset((prev) => {
        const newOffset = prev - 1;
        const itemWidth = 280;
        const totalWidth = itemWidth * localArtists.length;
        return newOffset % totalWidth;
      });
    }, 60);

    return () => clearInterval(intervalId);
  }, [localArtists.length]);

  const handleArtistNameChange = (index: number, newName: string) => {
    const updated = [...localArtists];
    updated[index].name = newName;
    setLocalArtists(updated);
    if (onUpdate) onUpdate(updated);
  };

  const displayArtists = [...localArtists, ...localArtists, ...localArtists];

  return (
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        minHeight: "600px",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        marginBottom: "64px",
        marginTop: "600px",
        padding: "40px 20px",
      }}
    >
      <h2
        style={{
          color: "#fff",
          fontSize: "28px",
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: "700",
          margin: "0 0 60px 0",
          letterSpacing: "1px",
        }}
      >
        Voodoo808 Produkoval Beaty Pro
      </h2>

      <div
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "40px",
            transform: `translateX(${offset}px)`,
            transition: "transform 0.016s linear",
          }}
        >
          {displayArtists.map((artist, index) => (
            <div
              key={`${artist.id}-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                flexShrink: 0,
                width: "240px",
              }}
            >
              <div
                style={{
                  width: "240px",
                  height: "240px",
                  borderRadius: "50%",
                  border: "3px solid #444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, hsl(${(artist.id.charCodeAt(0) * 7) % 360}, 60%, 45%), hsl(${(artist.id.charCodeAt(0) * 7 + 60) % 360}, 60%, 50%))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "96px",
                    fontWeight: "bold",
                  }}
                >
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {isEditable ? (
                <input
                  type="text"
                  value={artist.name}
                  onChange={(e) => handleArtistNameChange(index % localArtists.length, e.target.value)}
                  style={{
                    fontSize: "12px",
                    color: "#ccc",
                    background: "#1a1a1a",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    width: "220px",
                    textAlign: "center",
                  }}
                />
              ) : (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#ccc",
                    margin: "0",
                    textAlign: "center",
                    maxWidth: "240px",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  {artist.name}
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "250px",
            height: "100%",
            background: "linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "250px",
            height: "100%",
            background: "linear-gradient(to left, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
};

export default ArtistCarousel;
