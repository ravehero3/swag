import { useApp } from "../App.js";

// Site-wide artwork configuration. Stored as a single JSON blob in the
// `settings` table under key `artwork_config`. Loaded once into AppContext
// (settings) and read here so every beat-artwork render stays in sync.
export interface ArtworkConfig {
  defaultArtworkUrl: string;
  overlay: {
    enabled: boolean;
    color: string;       // hex like "#ff00ff"
    opacity: number;     // 0–100
    blendMode: BlendMode;
  };
  filter: {
    grayscale: number;   // 0–100
    sepia: number;       // 0–100
    saturate: number;    // 0–200 (100 = unchanged)
    brightness: number;  // 0–200 (100 = unchanged)
    contrast: number;    // 0–200 (100 = unchanged)
    hueRotate: number;   // 0–360 deg
    blur: number;        // 0–20 px
    invert: number;      // 0–100
  };
}

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export const DEFAULT_ARTWORK_FALLBACK = "/uploads/artwork/metallic-logo.png";

export const DEFAULT_ARTWORK_CONFIG: ArtworkConfig = {
  defaultArtworkUrl: DEFAULT_ARTWORK_FALLBACK,
  overlay: { enabled: false, color: "#000000", opacity: 30, blendMode: "multiply" },
  filter: {
    grayscale: 0,
    sepia: 0,
    saturate: 100,
    brightness: 100,
    contrast: 100,
    hueRotate: 0,
    blur: 0,
    invert: 0,
  },
};

// Parse the raw string from the settings record back into a typed config.
// Tolerates corrupted/missing fields by falling back per-property to defaults.
export function parseArtworkConfig(raw: string | undefined | null): ArtworkConfig {
  if (!raw) return DEFAULT_ARTWORK_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    return {
      defaultArtworkUrl: parsed?.defaultArtworkUrl || DEFAULT_ARTWORK_FALLBACK,
      overlay: { ...DEFAULT_ARTWORK_CONFIG.overlay, ...(parsed?.overlay || {}) },
      filter: { ...DEFAULT_ARTWORK_CONFIG.filter, ...(parsed?.filter || {}) },
    };
  } catch {
    return DEFAULT_ARTWORK_CONFIG;
  }
}

// Build the CSS `filter` shorthand string from the config. Skipping no-op
// values keeps the resulting style short and predictable.
export function buildFilterString(filter: ArtworkConfig["filter"]): string {
  const parts: string[] = [];
  if (filter.grayscale > 0) parts.push(`grayscale(${filter.grayscale}%)`);
  if (filter.sepia > 0) parts.push(`sepia(${filter.sepia}%)`);
  if (filter.saturate !== 100) parts.push(`saturate(${filter.saturate}%)`);
  if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness}%)`);
  if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast}%)`);
  if (filter.hueRotate > 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
  if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);
  if (filter.invert > 0) parts.push(`invert(${filter.invert}%)`);
  return parts.join(" ");
}

interface BeatArtworkProps {
  artworkUrl?: string | null;
  alt?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
  // When false, no overlay/filter is applied (e.g. for sound-kit covers, where
  // the user only configured the effect for beats). Default true.
  applyEffects?: boolean;
  // Inline style for the wrapper (e.g. flex sizing).
  style?: React.CSSProperties;
  // Override for the config (used by the admin live-preview panel).
  configOverride?: ArtworkConfig;
  loading?: "lazy" | "eager";
  testId?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// Render a beat artwork with site-wide overlay + filter applied via CSS.
// Reads ArtworkConfig from AppContext.settings.artwork_config so changes in
// the admin panel propagate everywhere instantly after a refresh.
export function BeatArtwork({
  artworkUrl,
  alt,
  width = "100%",
  height = "100%",
  borderRadius = 4,
  className,
  applyEffects = true,
  style,
  configOverride,
  loading = "lazy",
  testId,
  onClick,
}: BeatArtworkProps) {
  const { settings } = useApp() as { settings: Record<string, string> };
  const config = configOverride || parseArtworkConfig(settings?.artwork_config);

  const src = artworkUrl || config.defaultArtworkUrl || DEFAULT_ARTWORK_FALLBACK;
  const filterString = applyEffects ? buildFilterString(config.filter) : "";
  const showOverlay = applyEffects && config.overlay.enabled && config.overlay.opacity > 0;

  return (
    <div
      className={className}
      onClick={onClick}
      data-testid={testId}
      style={{
        position: "relative",
        overflow: "hidden",
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt || ""}
        loading={loading}
        onError={(e) => {
          const fallback = config.defaultArtworkUrl || DEFAULT_ARTWORK_FALLBACK;
          if ((e.currentTarget as HTMLImageElement).src !== fallback) {
            (e.currentTarget as HTMLImageElement).src = fallback;
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          filter: filterString || undefined,
          // Safari fix: forces a unique GPU compositing layer per image,
          // preventing Safari from reusing cached textures across different
          // <img> elements with the same dimensions (shows "wrong" artwork).
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
      />
      {showOverlay && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: config.overlay.color,
            opacity: config.overlay.opacity / 100,
            mixBlendMode: config.overlay.blendMode as any,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
