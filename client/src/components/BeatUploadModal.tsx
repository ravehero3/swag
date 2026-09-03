import React, { useState, useCallback } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { ArtworkSelector } from './ArtworkSelector';

interface BeatFile {
  id: string;
  file: File;
  name: string;
  bpm: string;
  key: string;
  releaseDate: string;
  releaseImmediately: boolean;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  artworkUrl?: string;
  artworkFilename?: string;
}

interface BeatUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (beats: any[]) => void;
}

export const BeatUploadModal: React.FC<BeatUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  console.log('[BeatUploadModal] Component rendering with isOpen:', isOpen);
  
  const [beats, setBeats] = useState<BeatFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalReleaseImmediately, setGlobalReleaseImmediately] = useState(true);
  const [showArtworkSelector, setShowArtworkSelector] = useState(false);
  const [selectedBeatForArtwork, setSelectedBeatForArtwork] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files;
      if (!files) return;

      const newBeats = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        bpm: '',
        key: '',
        releaseDate: new Date().toISOString().split('T')[0],
        releaseImmediately: globalReleaseImmediately,
        progress: 0,
        status: 'pending' as const,
      }));

      setBeats((prev) => [...prev, ...newBeats]);
      event.currentTarget.value = '';
    },
    [globalReleaseImmediately]
  );

  const updateBeat = useCallback((id: string, updates: Partial<BeatFile>) => {
    setBeats((prev) =>
      prev.map((beat) => (beat.id === id ? { ...beat, ...updates } : beat))
    );
  }, []);

  const removeBeat = useCallback((id: string) => {
    setBeats((prev) => prev.filter((beat) => beat.id !== id));
  }, []);

  const handleArtworkSelect = useCallback(
    (url: string, filename: string) => {
      if (selectedBeatForArtwork) {
        updateBeat(selectedBeatForArtwork, {
          artworkUrl: url,
          artworkFilename: filename,
        });
        setSelectedBeatForArtwork(null);
        setShowArtworkSelector(false);
      }
    },
    [selectedBeatForArtwork, updateBeat]
  );

  const handleUpload = async () => {
    if (beats.length === 0) return;
    setIsUploading(true);

    try {
      const uploadPromises = beats.map(async (beat) => {
        if (beat.status !== 'pending') return beat;

        try {
          updateBeat(beat.id, { status: 'uploading' });

          const formData = new FormData();
          formData.append('file', beat.file);
          formData.append('name', beat.name);
          formData.append('bpm', beat.bpm || '0');
          formData.append('key', beat.key || '');
          formData.append('releaseImmediately', String(beat.releaseImmediately));
          if (!beat.releaseImmediately) {
            formData.append('releaseDate', beat.releaseDate);
          }
          if (beat.artworkUrl) {
            formData.append('artworkUrl', beat.artworkUrl);
          }

          const response = await fetch('/api/beats/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Upload failed');
          }

          updateBeat(beat.id, {
            status: 'completed',
            progress: 100,
          });

          return await response.json();
        } catch (error) {
          updateBeat(beat.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return null;
        }
      });

      await Promise.all(uploadPromises);

      if (onUploadComplete) {
        onUploadComplete(beats.filter((b) => b.status === 'completed'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const completedCount = beats.filter((b) => b.status === 'completed').length;
  const errorCount = beats.filter((b) => b.status === 'error').length;

  if (!isOpen) return null;

  const statusIcon = {
    pending: '⏳',
    uploading: '⬆️',
    completed: '✅',
    error: '❌',
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          margin: '0 1rem',
          overflow: 'hidden',
        }}>
          
          {/* Header */}
          <div style={{
            padding: '2rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'linear-gradient(to right, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>🎵 Upload Beats</h1>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem', margin: 0 }}>
                {beats.length} beat{beats.length !== 1 ? 's' : ''} queued
                {completedCount > 0 && ` • ${completedCount} ✅`}
                {errorCount > 0 && ` • ${errorCount} ❌`}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                opacity: isUploading ? 0.5 : 1,
              }}
            >
              <X className="w-6 h-6" style={{ color: '#9ca3af' }} />
            </button>
          </div>

          {/* Global Settings */}
          {beats.length > 0 && (
            <div style={{
              padding: '0.75rem 2rem',
              borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
              backgroundColor: 'rgba(30, 41, 59, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={globalReleaseImmediately}
                  onChange={(e) => setGlobalReleaseImmediately(e.target.checked)}
                  disabled={isUploading}
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Release all immediately</span>
              </label>
            </div>
          )}

          {/* Beat List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {beats.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#6b7280' }}>
                <div style={{ textAlign: 'center' }}>
                  <Upload className="w-12 h-12" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p>No beats selected yet</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Column Headers */}
                <div style={{
                  display: 'grid',
                  gap: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
                  gridTemplateColumns: '40px 1fr 70px 60px 120px 100px 80px 60px'
                }}>
                  <div>Status</div>
                  <div>Name</div>
                  <div>BPM</div>
                  <div>Key</div>
                  <div>Artwork</div>
                  <div>Release</div>
                  <div>Progress</div>
                  <div></div>
                </div>

                {/* Beat Rows */}
                {beats.map((beat) => (
                  <div key={beat.id} style={{
                    display: 'grid',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    gridTemplateColumns: '40px 1fr 70px 60px 120px 100px 80px 60px',
                  }}>
                    
                    {/* Status */}
                    <div style={{ textAlign: 'center', fontSize: '1.125rem' }}>
                      {statusIcon[beat.status]}
                    </div>

                    {/* Name */}
                    <input
                      type="text"
                      value={beat.name}
                      onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="Beat name"
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '0.375rem',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.5 : 1,
                      }}
                    />

                    {/* BPM */}
                    <input
                      type="number"
                      value={beat.bpm}
                      onChange={(e) => updateBeat(beat.id, { bpm: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="BPM"
                      style={{
                        padding: '0.5rem 0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '0.375rem',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.5 : 1,
                      }}
                    />

                    {/* Key */}
                    <select
                      value={beat.key}
                      onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      style={{
                        padding: '0.5rem 0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '0.375rem',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.5 : 1,
                      }}
                    >
                      <option value="">-</option>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>

                    {/* Artwork */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {beat.artworkUrl ? (
                        <>
                          <img
                            src={beat.artworkUrl}
                            alt={beat.artworkFilename}
                            style={{ width: '2rem', height: '2rem', borderRadius: '0.25rem', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => {
                              setSelectedBeatForArtwork(beat.id);
                              setShowArtworkSelector(true);
                            }}
                            disabled={isUploading}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#9333ea',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              opacity: isUploading ? 0.5 : 1,
                            }}
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBeatForArtwork(beat.id);
                            setShowArtworkSelector(true);
                          }}
                          disabled={isUploading}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#4b5563',
                            color: '#d1d5db',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            opacity: isUploading ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <ImageIcon className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                          Select
                        </button>
                      )}
                    </div>

                    {/* Release */}
                    <div style={{ fontSize: '0.75rem' }}>
                      {beat.releaseImmediately ? (
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Now</span>
                      ) : (
                        <input
                          type="date"
                          value={beat.releaseDate}
                          onChange={(e) => updateBeat(beat.id, { releaseDate: e.target.value })}
                          disabled={isUploading}
                          style={{
                            width: '100%',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid #4b5563',
                            borderRadius: '0.25rem',
                            color: '#fff',
                            opacity: isUploading ? 0.5 : 1,
                          }}
                        />
                      )}
                    </div>

                    {/* Progress */}
                    {beat.status === 'uploading' && (
                      <div style={{ height: '0.5rem', backgroundColor: '#4b5563', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#a855f7', transition: 'width 0.3s ease', width: `${beat.progress}%` }} />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isUploading && beat.status === 'pending' && (
                      <button
                        onClick={() => removeBeat(beat.id)}
                        style={{
                          color: '#9ca3af',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '2rem',
            borderTop: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'linear-gradient(to right, rgba(30, 41, 59, 0.5) 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#4b5563',
                color: '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                opacity: isUploading ? 0.5 : 1,
              }}>
                <Upload className="w-4 h-4" />
                Add Beats
              </span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                disabled={isUploading}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#4b5563',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={beats.length === 0 || isUploading}
                style={{
                  padding: '0.5rem 2rem',
                  background: 'linear-gradient(to right, #a855f7, #c084fc)',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: beats.length === 0 || isUploading ? 'not-allowed' : 'pointer',
                  opacity: beats.length === 0 || isUploading ? 0.5 : 1,
                }}
              >
                {isUploading ? '⬆️ Uploading...' : '⬆️ Upload All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ArtworkSelector
        isOpen={showArtworkSelector}
        onClose={() => setShowArtworkSelector(false)}
        onSelect={handleArtworkSelect}
        beatName={selectedBeatForArtwork ? beats.find((b) => b.id === selectedBeatForArtwork)?.name : undefined}
      />
    </>
  );
};
