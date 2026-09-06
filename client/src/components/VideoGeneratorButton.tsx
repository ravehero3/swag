import React, { useState } from 'react';
import { Download, Film } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

interface Beat {
  id: number;
  title: string;
  bpm: number;
  key: string;
  artwork_url?: string;
  preview_url?: string;
  file_url?: string;
}

interface VideoGeneratorButtonProps {
  beat: Beat;
  onGenerated?: () => void;
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({
  beat,
  onGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async () => {
    if (!beat.artwork_url || !beat.preview_url) {
      setError('Beat must have artwork and preview URL');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/beats/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatId: beat.id,
          title: beat.title,
          bpm: beat.bpm,
          key: beat.key,
          artworkUrl: beat.artwork_url,
          audioUrl: beat.preview_url,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Video generation failed');
      }

      // Get the video as blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${beat.title.replace(/\s+/g, '-').toLowerCase()}-square.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onGenerated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Video generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={generateVideo}
        disabled={isGenerating || !beat.artwork_url || !beat.preview_url}
        title="Generovat čtvercové video (1080x1080)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: isGenerating ? DESIGN_SYSTEM.colors.textSecondary : DESIGN_SYSTEM.colors.primary,
          color: DESIGN_SYSTEM.colors.textPrimary,
          border: 'none',
          borderRadius: '4px',
          cursor: isGenerating ? 'wait' : 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'all 0.15s',
          opacity: !beat.artwork_url || !beat.preview_url ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isGenerating && beat.artwork_url && beat.preview_url) {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          if (beat.artwork_url && beat.preview_url) {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }
        }}
      >
        {isGenerating ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            Generuji...
          </>
        ) : (
          <>
            <Film size={14} />
            Video
          </>
        )}
      </button>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#333',
            color: '#ff5252',
            fontSize: '12px',
            padding: '8px 12px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
