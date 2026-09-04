import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

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

interface GalleryImage {
  url: string;
  filename: string;
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
  
  // Gallery state
  const [showGallery, setShowGallery] = useState(false);
  const [selectedBeatForArtwork, setSelectedBeatForArtwork] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);

  // Load gallery images when modal opens
  useEffect(() => {
    if (isOpen && showGallery) {
      loadGalleryImages();
    }
  }, [isOpen, showGallery]);

  const loadGalleryImages = async () => {
    try {
      setGalleryLoading(true);
      const res = await fetch('/api/gallery-images');
      if (!res.ok) throw new Error('Failed to load gallery');
      const data = await res.json();
      setGalleryImages(data || []);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleGallerySelect = (url: string) => {
    if (selectedBeatForArtwork) {
      updateBeat(selectedBeatForArtwork, {
        artworkUrl: url,
        artworkFilename: url.split('/').pop() || 'artwork',
      });
      setSelectedBeatForArtwork(null);
      setShowGallery(false);
    }
  };

  const handleGalleryImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    setGalleryUploadProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/gallery-images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      setGalleryUploadProgress(100);
      
      // Reload gallery images
      await new Promise(r => setTimeout(r, 500));
      await loadGalleryImages();
    } catch (err) {
      console.error('Gallery upload failed:', err);
    } finally {
      setGalleryUploading(false);
      setGalleryUploadProgress(0);
    }
  };

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

  const handleUpload = async () => {
    console.log('[handleUpload] Starting upload with', beats.length, 'beats');
    if (beats.length === 0) return;
    setIsUploading(true);

    try {
      const uploadPromises = beats.map(async (beat) => {
        console.log('[handleUpload] Processing beat:', beat.name, 'status:', beat.status);
        if (beat.status !== 'pending') return beat;

        try {
          console.log('[handleUpload] Uploading beat:', beat.name);
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

          const response = await fetch('/api/upload?type=beat', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[handleUpload] Upload failed for', beat.name, '- Status:', response.status, 'Text:', errorText);
            throw new Error(errorText || 'Upload failed');
          }
          console.log('[handleUpload] Upload successful for', beat.name);

          updateBeat(beat.id, {
            status: 'completed',
            progress: 100,
          });

          return await response.json();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[BeatUploadModal] Upload error for', beat.name, ':', errorMsg);
          updateBeat(beat.id, {
            status: 'error',
            error: errorMsg,
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
    pending: '⌛',
    uploading: '⬆',
    completed: '✓',
    error: '✕',
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1400px',
          maxHeight: '85vh',
          backgroundColor: '#000',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #2a2a2a',
          margin: '0 1rem',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
          
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #2a2a2a',
            backgroundColor: '#0d0d0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Upload Beats</h1>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '6px', margin: 0 }}>
                {beats.length} beat{beats.length !== 1 ? 's' : ''} queued
                {completedCount > 0 && ` • ${completedCount} completed`}
                {errorCount > 0 && ` • ${errorCount} errors`}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                opacity: isUploading ? 0.5 : 0.7,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = isUploading ? '0.5' : '0.7')}
            >
              <X className="w-5 h-5" style={{ color: '#999' }} />
            </button>
          </div>

          {/* Global Settings */}
          {beats.length > 0 && (
            <div style={{
              padding: '12px 24px',
              borderBottom: '1px solid #2a2a2a',
              backgroundColor: '#111',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={globalReleaseImmediately}
                  onChange={(e) => setGlobalReleaseImmediately(e.target.checked)}
                  disabled={isUploading}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0B99FC' }}
                />
                <span style={{ fontSize: '13px', color: '#ccc' }}>Release all immediately</span>
              </label>
            </div>
          )}

          {/* Beat List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {beats.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#666' }}>
                <div style={{ textAlign: 'center' }}>
                  <Upload className="w-10 h-10" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>No beats selected yet</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Column Headers */}
                <div style={{
                  display: 'grid',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: 500,
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #2a2a2a',
                  gridTemplateColumns: '40px 1fr 60px 50px 100px 90px 100px 50px',
                  letterSpacing: '0.3px',
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
                    gap: '8px',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#0d0d0d',
                    border: '1px solid #1e1e1e',
                    gridTemplateColumns: '40px 1fr 60px 50px 100px 90px 100px 50px',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
                  >
                    
                    {/* Status */}
                    <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: beat.status === 'completed' ? '#4caf50' : beat.status === 'error' ? '#f44336' : '#999' }}>
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
                        padding: '8px 10px',
                        fontSize: '13px',
                        backgroundColor: '#111',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#0B99FC')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />

                    {/* BPM */}
                    <input
                      type="number"
                      value={beat.bpm}
                      onChange={(e) => updateBeat(beat.id, { bpm: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="BPM"
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        backgroundColor: '#111',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#0B99FC')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />

                    {/* Key */}
                    <select
                      value={beat.key}
                      onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        backgroundColor: '#111',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#fff',
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#0B99FC')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    >
                      <option value="">-</option>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>

                    {/* Artwork */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {beat.artworkUrl ? (
                        <>
                          <img
                            src={beat.artworkUrl}
                            alt={beat.artworkFilename}
                            style={{ width: '28px', height: '28px', borderRadius: '3px', objectFit: 'cover', border: '1px solid #2a2a2a' }}
                          />
                          <button
                            onClick={() => {
                              setSelectedBeatForArtwork(beat.id);
                              setShowGallery(true);
                            }}
                            disabled={isUploading}
                            style={{
                              fontSize: '11px',
                              padding: '6px 10px',
                              backgroundColor: '#0B99FC',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              opacity: isUploading ? 0.6 : 1,
                              transition: 'opacity 0.15s',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = isUploading ? '0.6' : '1')}
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBeatForArtwork(beat.id);
                            setShowGallery(true);
                          }}
                          disabled={isUploading}
                          style={{
                            fontSize: '11px',
                            padding: '6px 10px',
                            backgroundColor: '#1e1e1e',
                            color: '#999',
                            border: '1px solid #2a2a2a',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            opacity: isUploading ? 0.6 : 1,
                            transition: 'all 0.15s',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3a3a3a';
                            e.currentTarget.style.color = '#ccc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#2a2a2a';
                            e.currentTarget.style.color = '#999';
                          }}
                        >
                          <ImageIcon className="w-3 h-3" />
                          Select
                        </button>
                      )}
                    </div>

                    {/* Release */}
                    <div style={{ fontSize: '12px' }}>
                      {beat.releaseImmediately ? (
                        <span style={{ color: '#4caf50', fontWeight: 500 }}>Now</span>
                      ) : (
                        <input
                          type="date"
                          value={beat.releaseDate}
                          onChange={(e) => updateBeat(beat.id, { releaseDate: e.target.value })}
                          disabled={isUploading}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '12px',
                            backgroundColor: '#111',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#fff',
                            opacity: isUploading ? 0.6 : 1,
                            outline: 'none',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s',
                            cursor: 'pointer',
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = '#0B99FC')}
                          onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                        />
                      )}
                    </div>

                    {/* Progress */}
                    {beat.status === 'uploading' && (
                      <div style={{ height: '4px', backgroundColor: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#0B99FC', transition: 'width 0.3s ease', width: `${beat.progress}%` }} />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isUploading && beat.status === 'pending' && (
                      <button
                        onClick={() => removeBeat(beat.id)}
                        style={{
                          color: '#666',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px',
                          opacity: 0.6,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
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
            padding: '16px 24px',
            borderTop: '1px solid #2a2a2a',
            backgroundColor: '#0d0d0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
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
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#1e1e1e',
                color: '#ccc',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                opacity: isUploading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = '#1e1e1e';
                e.currentTarget.style.color = '#ccc';
              }}
              >
                <Upload className="w-4 h-4" />
                Add Beats
              </span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={onClose}
                disabled={isUploading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e1e1e',
                  color: '#ccc',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: isUploading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a2a2a';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e1e';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ccc';
                }}
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={beats.length === 0 || isUploading}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#0B99FC',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: beats.length === 0 || isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: beats.length === 0 || isUploading ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (beats.length > 0 && !isUploading) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = beats.length === 0 || isUploading ? '0.6' : '1';
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGallery(false); }}
        >
          <div style={{ background: "#111", border: "0.4px solid #333", borderRadius: "8px", width: "min(860px, 96vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.4px solid #2a2a2a", flexShrink: 0 }}>
              <div>
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>Select Artwork</div>
                <div style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Choose an image or upload new ones</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ background: "transparent", border: "0.4px solid #555", color: galleryUploading ? "#555" : "#aaa", borderRadius: "3px", padding: "6px 12px", cursor: galleryUploading ? "default" : "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  {galleryUploading
                    ? `Uploading${galleryUploadProgress > 0 ? ` ${galleryUploadProgress}%` : '...'}`
                    : "+ Upload Images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={galleryUploading}
                    style={{ display: "none" }}
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleGalleryImageUpload(e.target.files); e.target.value = ""; }}
                  />
                </label>
                <button
                  onClick={() => setShowGallery(false)}
                  style={{ background: "transparent", border: "none", color: "#666", fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
                >
                  ×
                </button>
              </div>
            </div>
            <div
              style={{ overflowY: "auto", padding: "20px", flex: 1, position: "relative", transition: "background 0.15s" }}
              onDragOver={(e) => { e.preventDefault(); setGalleryDragging(true); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setGalleryDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setGalleryDragging(false);
                const files = e.dataTransfer.files;
                if (files && files.length > 0) handleGalleryImageUpload(files);
              }}
            >
              {galleryDragging && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(11,153,252,0.08)", border: "2px dashed #0B99FC", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
                  <span style={{ color: "#0B99FC", fontSize: "14px", fontWeight: 500 }}>Drag images here</span>
                </div>
              )}
              {galleryLoading ? (
                <div style={{ textAlign: "center", color: "#444", padding: "48px 0", fontSize: "12px" }}>Loading...</div>
              ) : galleryImages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ color: "#444", fontSize: "13px", marginBottom: "8px" }}>No images in gallery</div>
                  <div style={{ color: "#333", fontSize: "11px" }}>Upload images through the admin gallery first</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                  {galleryImages.map(img => (
                    <div
                      key={img.filename}
                      style={{ position: "relative", border: "0.4px solid #2a2a2a", borderRadius: "5px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#666"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"}
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        onClick={() => handleGallerySelect(img.url)}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "contain", background: "#080808", display: "block" }}
                      />
                      <div style={{ padding: "6px 8px 4px", background: "#0e0e0e" }}>
                        <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.filename}</div>
                        <button
                          onClick={() => handleGallerySelect(img.url)}
                          style={{ background: "transparent", border: "0.4px solid #444", color: "#aaa", borderRadius: "3px", padding: "2px 8px", cursor: "pointer", fontSize: "11px", marginTop: "4px", width: "100%" }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "10px 20px", borderTop: "0.4px solid #1a1a1a", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowGallery(false)} style={{padding: '8px 16px', backgroundColor: '#0B99FC', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
