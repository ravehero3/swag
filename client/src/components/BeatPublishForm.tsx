import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface BeatPublishFormProps {
  title: string;
  bpm: string;
  key: string;
  artworkUrl: string;
  onTitleChange: (value: string) => void;
  onBpmChange: (value: string) => void;
  onKeyChange: (value: string) => void;
  onArtworkChange: (url: string) => void;
  onBrowseArtwork: () => void;
  onPublish: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function BeatPublishForm({
  title,
  bpm,
  key,
  artworkUrl,
  onTitleChange,
  onBpmChange,
  onKeyChange,
  onArtworkChange,
  onBrowseArtwork,
  onPublish,
  onCancel,
  isLoading,
}: BeatPublishFormProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(11, 153, 252, 0.05)',
        border: '1px solid rgba(11, 153, 252, 0.2)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0B99FC' }}>Přidat informace o beatu</div>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px' }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>
            Název
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Např. Midnight Rain"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '0.4px solid #333',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#fff',
              outline: 'none',
            }}
          />
        </div>

        {/* BPM */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>
            BPM
          </label>
          <input
            type="number"
            min="40"
            max="300"
            value={bpm}
            onChange={(e) => onBpmChange(e.target.value)}
            placeholder="140"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '0.4px solid #333',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#fff',
              outline: 'none',
              textAlign: 'center',
            }}
          />
        </div>

        {/* Key */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>
            Tónina
          </label>
          <select
            value={key}
            onChange={(e) => onKeyChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '0.4px solid #333',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#aaa',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">—</option>
            {MUSICAL_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Artwork Section */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px', textTransform: 'uppercase' }}>Artwork</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt="artwork"
              style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={18} color="#333" />
            </div>
          )}
          <button
            onClick={onBrowseArtwork}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '0.4px solid #333',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#aaa',
              cursor: 'pointer',
            }}
          >
            Procházet galerii
          </button>
          {artworkUrl && (
            <button
              onClick={() => onArtworkChange('')}
              style={{
                background: 'rgba(255,82,82,0.1)',
                border: '0.4px solid rgba(255,82,82,0.3)',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '12px',
                color: '#ff5252',
                cursor: 'pointer',
              }}
            >
              Odebrat
            </button>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={isPublishing}
          style={{
            background: 'transparent',
            border: '0.4px solid #333',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#555',
            cursor: 'pointer',
            opacity: isPublishing ? 0.5 : 1,
          }}
        >
          Zrušit
        </button>
        <button
          onClick={handlePublish}
          disabled={!title || isPublishing}
          style={{
            background: '#0B99FC',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#000',
            cursor: 'pointer',
            fontWeight: 600,
            opacity: !title || isPublishing ? 0.5 : 1,
          }}
        >
          {isPublishing ? 'Publikuji…' : 'Zveřejnit beat'}
        </button>
      </div>
    </div>
  );
}
