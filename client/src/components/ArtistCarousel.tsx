import { useEffect, useState } from "react";

interface Artist {
  name: string;
  id: string;
  imageUrl?: string;
}

const artists: Artist[] = [
  { name: "Dollar Prync", id: "dollar-prync", imageUrl: "/uploads/artwork/dollar_prync.png" },
  { name: "Smack", id: "smack", imageUrl: "/uploads/artwork/smack.png" },
  { name: "Nik Tendo", id: "nik-tendo", imageUrl: "/uploads/artwork/nik_tendo.png" },
  { name: "Calin", id: "calin", imageUrl: "/uploads/artwork/calin.png" },
  { name: "Hugo Toxxx", id: "hugo-toxxx", imageUrl: "/uploads/artwork/hugo_toxxx.png" },
  { name: "Viktor Sheen", id: "viktor-sheen", imageUrl: "/uploads/artwork/viktor_sheen.png" },
  { name: "Yzomandias", id: "yzomandias", imageUrl: "/uploads/artwork/yzomandias.png" },
  { name: "Ektor", id: "ektor", imageUrl: "/uploads/artwork/ektor.png" },
  { name: "Ca$hanova Bulhar", id: "cashanova-bulhar", imageUrl: "/uploads/artwork/cashanova_bulhar.png" },
  { name: "Hasan", id: "hasan", imageUrl: "/uploads/artwork/hasan.png" },
  { name: "Luca Brassi10x", id: "luca-brassi10x", imageUrl: "/uploads/artwork/luca_brassi10x.png" },
  { name: "Hard Rico", id: "hard-rico", imageUrl: "/uploads/artwork/hard_rico.png" },
  { name: "Pil C", id: "pil-c", imageUrl: "/uploads/artwork/pil_c.png" },
];

const ArtistCarousel = () => {
  const [offset, setOffset] = useState(0);

  // Duplicate artists 3 times to ensure seamless scrolling
  const displayArtists = [
    ...artists,
    ...artists,
    ...artists,
  ];

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const imageWidth = isMobile ? 80 : 160;
    const gap = isMobile ? 24 : 64;
    const singleSetWidth = imageWidth * artists.length + gap * artists.length;

    const intervalId = setInterval(() => {
      setOffset((prev) => {
        const newOffset = prev - 1;
        if (newOffset <= -singleSetWidth) {
          return 0;
        }
        return newOffset;
      });
    }, 16);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        minHeight: "180px",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        marginBottom: "64px",
        marginTop: "272px",
        paddingBottom: "100px",
        padding: "40px 20px",
        zIndex: 100,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .artist-carousel-item {
            width: 80px !important;
            gap: 8px !important;
          }
          .artist-image-circle {
            width: 80px !important;
            height: 80px !important;
          }
          .artist-carousel-track {
            gap: 24px !important;
          }
          .artist-name-text {
            font-size: 10px !important;
            max-width: 80px !important;
          }
          .carousel-fade {
            width: 80px !important;
          }
          .carousel-root-container {
            min-height: 180px !important;
            margin-top: 120px !important;
            padding-bottom: 40px !important;
          }
        }
      `}</style>
      <div className="carousel-root-container" style={{ textAlign: "center", marginBottom: "24px", paddingTop: "0px" }}>
        <p style={{ fontSize: "12px", color: "#555", margin: 0, fontFamily: "Work Sans, sans-serif" }}>
          VOODOO808 dělal beaty pro
        </p>
      </div>

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
          className="artist-carousel-track"
          style={{
            display: "flex",
            gap: "64px",
            transform: `translateX(${offset}px)`,
            transition: "transform 0.05s linear",
            paddingLeft: "0px",
          }}
        >
          {displayArtists.map((artist, index) => (
            <div
              key={`${artist.id}-${index}`}
              className="artist-carousel-item"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                flexShrink: 0,
                width: "192px",
              }}
            >
              {/* Artist Image Circle */}
              <div
                className="artist-image-circle"
                style={{
                  width: "192px",
                  height: "192px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "#000",
                }}
              >
                {artist.imageUrl ? (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: `linear-gradient(135deg, hsl(${(artist.id.charCodeAt(0) * 7) % 360}, 60%, 45%), hsl(${(artist.id.charCodeAt(0) * 7 + 60) % 360}, 60%, 50%))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: "64px",
                      fontWeight: "bold",
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    }}
                  >
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Artist Name */}
              <p
                className="artist-name-text"
                style={{
                  fontSize: "12px",
                  color: "#666",
                  margin: "0",
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  textAlign: "center",
                  lineHeight: "1.2",
                  maxWidth: "160px",
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
          className="carousel-fade"
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
          className="carousel-fade"
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
