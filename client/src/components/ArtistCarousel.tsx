import { useEffect, useState } from "react";

interface Artist {
  name: string;
  id: string;
}

const artists: Artist[] = [
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

const ArtistCarousel = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setOffset((prev) => {
        const newOffset = prev - 1;
        const itemWidth = 280; // 240px image + 40px margin/padding
        const totalWidth = itemWidth * artists.length;
        return newOffset % totalWidth;
      });
    }, 60); // ~1px per 60ms = 60000ms for full loop

    return () => clearInterval(intervalId);
  }, []);

  // Generate enough duplicates for seamless scrolling
  const displayArtists = [...artists, ...artists, ...artists];

  return (
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        minHeight: "550px",
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
      {/* Title */}
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

      {/* Carousel Container */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "40px",
            transform: `translateX(${offset}px)`,
            transition: "transform 0.016s linear",
            paddingLeft: "0px",
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
              {/* Artist Image Circle */}
              <div
                style={{
                  width: "240px",
                  height: "240px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, #333 0%, #111 100%)`,
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
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                >
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Artist Name */}
              <p
                style={{
                  fontSize: "12px",
                  color: "#ccc",
                  margin: "0",
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  textAlign: "center",
                  lineHeight: "1.2",
                  maxWidth: "240px",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {artist.name}
              </p>
            </div>
          ))}
        </div>

        {/* Left Gradient Fade */}
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

        {/* Right Gradient Fade */}
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
