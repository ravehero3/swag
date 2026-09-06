import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, Plus, CheckCircle } from 'lucide-react';
import { CZECH } from '../constants/czech';
import { DESIGN_SYSTEM } from '../constants/designSystem';

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
  size?: number;
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
  // Czech plural forms: 1 beat, 2-4 beaty, 5+ beatů
  const getCzechPlural = (count: number): string => {
    if (count === 1) return 'beat';
    if (count >= 2 && count <= 4) return 'beaty';
    return 'beatů';
  };

  const parseBeatMetadata = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    let bpm = '';
    let key = '';

    const bpmMatch = nameWithoutExt.match(/(\d+)\s*bpm/i);
    if (bpmMatch) {
      bpm = bpmMatch[1];
    }

    const keyMatch = nameWithoutExt.match(/\b([A-G](?:[#b])?)(?:\s*(?:minor|major))?\b/i);
    if (keyMatch) {
      key = keyMatch[1].trim().toUpperCase();
    }

    return { bpm, key };
  };
  
  const [beats, setBeats] = useState<BeatFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBeats, setUploadedBeats] = useState<BeatFile[]>([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [globalReleaseImmediately, setGlobalReleaseImmediately] = useState(true);
  const [showReleaseScheduler, setShowReleaseScheduler] = useState(false);
  const [schedulerDate, setSchedulerDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [autoIncrement, setAutoIncrement] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedBeatForArtwork, setSelectedBeatForArtwork] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);
  const [galleryUploadTotal, setGalleryUploadTotal] = useState(0);

  useEffect(() => {
    if (!isUploading && uploadedBeats.length > 0 && completedCount === beats.length && beats.length > 0) {
      setShowSuccessScreen(true);
      const timer = setTimeout(() => {
        setShowSuccessScreen(false);
        onClose();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadedBeats.length, completedCount, beats.length, onClose]);

  useEffect(() => {
    if (showGallery) {
      loadGalleryImages();
    }
  }, [showGallery]);

  const loadGalleryImages = async () => {
    try {
      setGalleryLoading(true);
      const res = await fetch('/api/kit-artworks', { credentials: 'include' });
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

  const handleApplyReleaseDate = () => {
    if (applyToAll) {
      setBeats((prev) =>
        prev.map((beat, index) => {
          const date = new Date(schedulerDate);
          if (autoIncrement) {
            date.setDate(date.getDate() + index);
          }
          return {
            ...beat,
            releaseImmediately: false,
            releaseDate: date.toISOString().split('T')[0],
          };
        })
      );
    }
    setShowReleaseScheduler(false);
  };

  const getNextWeekday = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextFriday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (5 - d.getDay() + 7) % 7 || 7);
    return d.toISOString().split('T')[0];
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
    setGalleryUploadTotal(files.length);
    setGalleryUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGalleryUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 300);

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/kit-artworks/upload-batch', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }
      setGalleryUploadProgress(100);
      
      await new Promise(r => setTimeout(r, 2000));
      await loadGalleryImages();
    } catch (err) {
      console.error('Gallery upload failed:', err);
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
      setGalleryUploadProgress(0);
    } finally {
      setGalleryUploading(false);
      setGalleryUploadTotal(0);
    }
  };

  const handleGalleryImageDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const res = await fetch(`/api/kit-artworks/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setGalleryImages((prev) => prev.filter((i) => i.filename !== filename));
      } else {
        alert('Failed to delete image');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed');
    }
  };

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files;
      if (!files) return;

      const newBeats = Array.from(files).map((file) => {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const { bpm, key } = parseBeatMetadata(file.name);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: cleanName,
          bpm,
          key,
          releaseDate: new Date().toISOString().split('T')[0],
          releaseImmediately: globalReleaseImmediately,
          progress: 0,
          status: 'pending' as const,
        };
      });

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
    if (beats.length === 0) return;
    setIsUploading(true);
    setUploadedBeats([]);

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

          const response = await fetch('/api/upload?type=beat', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Upload failed');
          }
          
          const uploadedFile = await response.json();

          const beatCreateRes = await fetch('/api/beats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: beat.name,
              artist: 'VOODOO808',
              bpm: parseInt(beat.bpm) || 0,
              key: beat.key || '',
              price: 5000,
              fileUrl: uploadedFile.url,
              previewUrl: uploadedFile.url,
              artworkUrl: beat.artworkUrl || '',
              isPublished: true,
              tags: [],
            }),
          });

          if (!beatCreateRes.ok) {
            const errText = await beatCreateRes.text();
            throw new Error('Beat creation failed');
          }
          
          const completedBeat = { ...beat, status: 'completed' as const, progress: 100 };
          updateBeat(beat.id, { status: 'completed', progress: 100 });
          setUploadedBeats((prev) => [...prev, completedBeat]);

          const createdBeat = await beatCreateRes.json();
          return createdBeat;
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

      const uploadedBeatsResult = await Promise.all(uploadPromises);

      if (onUploadComplete) {
        onUploadComplete(uploadedBeatsResult.filter(Boolean));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const completedCount = beats.filter((b) => b.status === 'completed').length;
  const errorCount = beats.filter((b) => b.status === 'error').length;
  const totalProgress = Math.round((completedCount / beats.length) * 100) || 0;

  if (!isOpen) return null;

  // Success animation screen
  if (showSuccessScreen && !isUploading && uploadedBeats.length > 0) {
    return (
      <>
        <style>{`
          @keyframes bounceIn {
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .success-icon-ring {
            fill: none;
            stroke: #2fd66b;
            stroke-width: 5;
            opacity: 0;
            transform: scale(0.5);
            transform-origin: center;
          }
          .success-icon-check {
            fill: none;
            stroke: #2fd66b;
            stroke-width: 6;
            stroke-linecap: round;
            stroke-linejoin: round;
            opacity: 0;
            transform: scale(0.3);
            transform-origin: center;
          }
          .success-playing .success-icon-ring {
            animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .success-playing .success-icon-check {
            animation: bounceIn 0.5s 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .success-playing .success-label {
            animation: fadeUp 0.4s 0.55s ease-out forwards;
          }
        `}</style>
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
          <div className="success-playing" style={{
            width: '320px',
            backgroundColor: '#131315',
            border: '1px solid #232326',
            borderRadius: '16px',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ display: 'block', overflow: 'visible' }}>
                <circle className="success-icon-ring" cx="32" cy="32" r="27" />
                <path className="success-icon-check" d="M20 33 L28 41 L45 23" />
              </svg>
            </div>
            <div className="success-label" style={{
              marginTop: '14px',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              color: '#f4f4f5',
              opacity: 0,
            }}>
              Hotovo
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isOpen) return null;
  if (isUploading && uploadedBeats.length > 0 && completedCount === beats.length) {
    return (
      <>
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
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
            backgroundColor: DESIGN_SYSTEM.colors.background,
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${DESIGN_SYSTEM.colors.border}`,
            margin: '0 1rem',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border}`,
              backgroundColor: DESIGN_SYSTEM.colors.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: DESIGN_SYSTEM.colors.textPrimary, 
                  margin: 0, 
                  letterSpacing: '-0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <CheckCircle size={24} color={DESIGN_SYSTEM.colors.success} />
                  {globalReleaseImmediately ? 'Vaše beaty jsou live!' : 'Vaše beaty jsou připraveny na release'}
                </h1>
                <p style={{ fontSize: '13px', color: DESIGN_SYSTEM.colors.textSecondary, marginTop: '6px', margin: 0 }}>
                  {uploadedBeats.length} beat{uploadedBeats.length !== 1 ? 'y' : ''} byly úspěšně nahrány
                </p>
              </div>
            </div>

            {/* Uploaded Beats Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                {uploadedBeats.map((beat) => (
                  <div 
                    key={beat.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: DESIGN_SYSTEM.colors.elevated,
                      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.15s',
                      animation: 'slideIn 0.3s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#444';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(0, 0, 0, 0.3)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = DESIGN_SYSTEM.colors.border;
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Artwork placeholder */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: DESIGN_SYSTEM.colors.tertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                    }}>
                      {beat.artworkUrl ? (
                        <img 
                          src={beat.artworkUrl} 
                          alt={beat.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: DESIGN_SYSTEM.colors.textSecondary }}>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>♪</div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: DESIGN_SYSTEM.colors.textPrimary,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {beat.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: DESIGN_SYSTEM.colors.textSecondary,
                        display: 'flex',
                        gap: '12px',
                      }}>
                        {beat.bpm && <span>{beat.bpm} BPM</span>}
                        {beat.key && <span>{beat.key}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${DESIGN_SYSTEM.colors.border}`,
              backgroundColor: DESIGN_SYSTEM.colors.elevated,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px',
                  backgroundColor: DESIGN_SYSTEM.colors.primary,
                  color: DESIGN_SYSTEM.colors.textPrimary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
          backgroundColor: DESIGN_SYSTEM.colors.background,
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${DESIGN_SYSTEM.colors.border}`,
          margin: '0 1rem',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
          
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border}`,
            backgroundColor: DESIGN_SYSTEM.colors.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: DESIGN_SYSTEM.colors.textPrimary, margin: 0, letterSpacing: '-0.5px' }}>Nahrát beaty</h1>
              <p style={{ fontSize: '13px', color: DESIGN_SYSTEM.colors.textSecondary, marginTop: '6px', margin: 0 }}>
                {beats.length} {getCzechPlural(beats.length)} v pořadí
                {isUploading && completedCount > 0 && ` • ${totalProgress}% hotovo`}
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
          {beats.length > 0 && !isUploading && (
            <div style={{
              padding: '12px 24px',
              borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border}`,
              backgroundColor: DESIGN_SYSTEM.colors.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={globalReleaseImmediately}
                  onChange={(e) => setGlobalReleaseImmediately(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: DESIGN_SYSTEM.colors.primary }}
                />
                <span style={{ fontSize: '13px', color: DESIGN_SYSTEM.colors.textPrimary }}>Vydat okamžitě</span>
              </label>
              {!globalReleaseImmediately && (
                <button
                  onClick={() => setShowReleaseScheduler(true)}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    backgroundColor: DESIGN_SYSTEM.colors.primary,
                    color: DESIGN_SYSTEM.colors.textPrimary,
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Nastavit datum vydání
                </button>
              )}
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && beats.length > 0 && (
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border}`,
              backgroundColor: DESIGN_SYSTEM.colors.tertiary,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: DESIGN_SYSTEM.colors.textPrimary }}>
                  Nahrávání beatů...
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: DESIGN_SYSTEM.colors.primary }}>
                  {totalProgress}%
                </span>
              </div>
              <div style={{ height: '4px', backgroundColor: DESIGN_SYSTEM.colors.border, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: DESIGN_SYSTEM.colors.primary,
                  transition: 'width 0.3s ease', 
                  width: `${totalProgress}%`,
                }} />
              </div>
            </div>
          )}

          {/* Beat List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {beats.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#666' }}>
                <div style={{ textAlign: 'center' }}>
                  <Upload className="w-10 h-10" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>Zatím není vybrán žádný beat</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Column Headers */}
                <div style={{
                  display: 'grid',
                  gap: '8px',
                  fontSize: '12px',
                  color: DESIGN_SYSTEM.colors.textSecondary,
                  fontWeight: 500,
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border}`,
                  gridTemplateColumns: '1fr 60px 50px 100px 100px 50px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                  <div>Název</div>
                  <div>BPM</div>
                  <div>Tónina</div>
                  <div>Obrázek</div>
                  <div>Datum vydání</div>
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
                    backgroundColor: DESIGN_SYSTEM.colors.elevated,
                    border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                    gridTemplateColumns: '1fr 60px 50px 100px 100px 50px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#444';
                    (e.currentTarget as HTMLElement).style.backgroundColor = DESIGN_SYSTEM.colors.tertiary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = DESIGN_SYSTEM.colors.border;
                    (e.currentTarget as HTMLElement).style.backgroundColor = DESIGN_SYSTEM.colors.elevated;
                  }}
                  >
                    
                    {/* Name */}
                    <input
                      type="text"
                      value={beat.name}
                      onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="Název beatu"
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        backgroundColor: DESIGN_SYSTEM.colors.inputs,
                        border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                        borderRadius: '4px',
                        color: DESIGN_SYSTEM.colors.textPrimary,
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border)}
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
                        backgroundColor: DESIGN_SYSTEM.colors.inputs,
                        border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                        borderRadius: '4px',
                        color: DESIGN_SYSTEM.colors.textPrimary,
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border)}
                    />

                    {/* Key / Tónina */}
                    <select
                      value={beat.key}
                      onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        backgroundColor: DESIGN_SYSTEM.colors.inputs,
                        border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                        borderRadius: '4px',
                        color: DESIGN_SYSTEM.colors.textPrimary,
                        opacity: isUploading || beat.status === 'completed' ? 0.6 : 1,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border)}
                    >
                      <option value="">-</option>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>

                    {/* Artwork - Empty slot with + sign */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
                      {beat.artworkUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <img
                            src={beat.artworkUrl}
                            alt={beat.artworkFilename}
                            style={{ width: '28px', height: '28px', borderRadius: '3px', objectFit: 'cover', border: `0.5px solid ${DESIGN_SYSTEM.colors.border}` }}
                          />
                          <button
                            onClick={() => {
                              setSelectedBeatForArtwork(beat.id);
                              setShowGallery(true);
                            }}
                            disabled={isUploading}
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              backgroundColor: DESIGN_SYSTEM.colors.primary,
                              color: DESIGN_SYSTEM.colors.textPrimary,
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
                            Změnit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBeatForArtwork(beat.id);
                            setShowGallery(true);
                          }}
                          disabled={isUploading}
                          style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: DESIGN_SYSTEM.colors.tertiary,
                            border: `0.5px dashed ${DESIGN_SYSTEM.colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            opacity: isUploading ? 0.6 : 1,
                            transition: 'all 0.15s',
                            color: DESIGN_SYSTEM.colors.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = '#666';
                            (e.currentTarget as HTMLElement).style.color = DESIGN_SYSTEM.colors.textPrimary;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = DESIGN_SYSTEM.colors.border;
                            (e.currentTarget as HTMLElement).style.color = DESIGN_SYSTEM.colors.textSecondary;
                          }}
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>

                    {/* Release Date */}
                    <div style={{ fontSize: '12px' }}>
                      {beat.releaseImmediately ? (
                        <span style={{ color: DESIGN_SYSTEM.colors.success, fontWeight: 500 }}>Okamžitě</span>
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
                            backgroundColor: DESIGN_SYSTEM.colors.inputs,
                            border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                            borderRadius: '4px',
                            color: DESIGN_SYSTEM.colors.textPrimary,
                            opacity: isUploading ? 0.6 : 1,
                            outline: 'none',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s',
                            cursor: 'pointer',
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border)}
                        />
                      )}
                    </div>

                    {/* Remove Button */}
                    {!isUploading && beat.status === 'pending' && (
                      <button
                        onClick={() => removeBeat(beat.id)}
                        style={{
                          color: DESIGN_SYSTEM.colors.textSecondary,
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
            borderTop: `1px solid ${DESIGN_SYSTEM.colors.border}`,
            backgroundColor: DESIGN_SYSTEM.colors.elevated,
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
                backgroundColor: DESIGN_SYSTEM.colors.inputs,
                color: DESIGN_SYSTEM.colors.textSecondary,
                border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                opacity: isUploading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.tertiary;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.textPrimary;
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.inputs;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.textSecondary;
              }}
              >
                <Upload className="w-4 h-4" />
                Přidat beaty
              </span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={onClose}
                disabled={isUploading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: DESIGN_SYSTEM.colors.inputs,
                  color: DESIGN_SYSTEM.colors.textSecondary,
                  border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: isUploading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = DESIGN_SYSTEM.colors.tertiary;
                  (e.currentTarget as HTMLButtonElement).style.color = DESIGN_SYSTEM.colors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = DESIGN_SYSTEM.colors.inputs;
                  (e.currentTarget as HTMLButtonElement).style.color = DESIGN_SYSTEM.colors.textSecondary;
                }}
              >
                Zavřít
              </button>
              <button
                onClick={handleUpload}
                disabled={beats.length === 0 || isUploading}
                style={{
                  padding: '8px 20px',
                  backgroundColor: DESIGN_SYSTEM.colors.primary,
                  color: DESIGN_SYSTEM.colors.textPrimary,
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
                {isUploading ? 'Nahrávání...' : 'Nahrát vše'}
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
          <div style={{ background: DESIGN_SYSTEM.colors.tertiary, border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, borderRadius: "8px", width: "min(860px, 96vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, flexShrink: 0 }}>
              <div>
                <div style={{ color: DESIGN_SYSTEM.colors.textPrimary, fontSize: "14px", fontWeight: 500 }}>Vybrat umění</div>
                <div style={{ color: DESIGN_SYSTEM.colors.textSecondary, fontSize: "11px", marginTop: "2px" }}>Zvolte obrázek nebo nahrajte nové</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {galleryUploading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "220px" }}>
                    <div style={{ flex: 1, height: "4px", background: DESIGN_SYSTEM.colors.border, borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(galleryUploadProgress, 100)}%`, background: `linear-gradient(90deg,${DESIGN_SYSTEM.colors.primary},#3399FF)`, transition: "width 200ms ease" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: DESIGN_SYSTEM.colors.primary, fontWeight: 500, whiteSpace: "nowrap", minWidth: "50px", textAlign: "right" }}>
                      {Math.round(Math.min(galleryUploadProgress, 100))}%
                    </span>
                  </div>
                )}
                <label style={{ background: "transparent", border: `0.4px solid ${DESIGN_SYSTEM.colors.textSecondary}`, color: galleryUploading ? DESIGN_SYSTEM.colors.textTertiary : DESIGN_SYSTEM.colors.textSecondary, borderRadius: "3px", padding: "6px 12px", cursor: galleryUploading ? "default" : "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                  {galleryUploading ? `Nahrávání ${galleryUploadTotal} obrázků...` : `+ Nahrát obrázky`}
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
                  disabled={galleryUploading}
                  style={{ background: "transparent", border: "none", color: galleryUploading ? DESIGN_SYSTEM.colors.textTertiary : DESIGN_SYSTEM.colors.textSecondary, fontSize: "20px", cursor: galleryUploading ? "not-allowed" : "pointer", lineHeight: 1, padding: "0 4px", opacity: galleryUploading ? 0.5 : 1, transition: "all 0.15s" }}
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
                <div style={{ position: "absolute", inset: 0, background: "rgba(11,153,252,0.08)", border: "2px dashed #0055FF", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
                  <span style={{ color: "#0055FF", fontSize: "14px", fontWeight: 500 }}>Přetáhněte obrázky sem</span>
                </div>
              )}
              {galleryLoading ? (
                <div style={{ textAlign: "center", color: DESIGN_SYSTEM.colors.textTertiary, padding: "48px 0", fontSize: "12px" }}>Načítání...</div>
              ) : galleryImages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ color: DESIGN_SYSTEM.colors.textSecondary, fontSize: "13px", marginBottom: "8px" }}>V galerii nejsou žádné obrázky</div>
                  <div style={{ color: DESIGN_SYSTEM.colors.textTertiary, fontSize: "11px" }}>Nahrajte obrázky prostřednictvím administrátorské galerie</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                  {galleryImages.map(img => (
                    <div
                      key={img.filename}
                      style={{ position: "relative", border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, borderRadius: "5px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#666"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = DESIGN_SYSTEM.colors.border}
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        onClick={() => handleGallerySelect(img.url)}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "contain", background: DESIGN_SYSTEM.colors.background, display: "block" }}
                      />
                      <div style={{ padding: "6px 8px 4px", background: DESIGN_SYSTEM.colors.background }}>
                        <div style={{ fontSize: "10px", color: DESIGN_SYSTEM.colors.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.filename}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", gap: "4px" }}>
                          <button
                            onClick={() => handleGallerySelect(img.url)}
                            style={{ background: "transparent", border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, color: DESIGN_SYSTEM.colors.textSecondary, borderRadius: "3px", padding: "2px 8px", cursor: "pointer", fontSize: "11px", flex: 1 }}
                          >
                            Vybrat
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGalleryImageDelete(img.filename); }}
                            style={{ background: "transparent", border: "none", color: DESIGN_SYSTEM.colors.textSecondary, cursor: "pointer", fontSize: "16px", padding: "0 4px", lineHeight: 1, transition: "color 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = DESIGN_SYSTEM.colors.textSecondary)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "10px 20px", borderTop: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowGallery(false)} style={{padding: '8px 16px', backgroundColor: DESIGN_SYSTEM.colors.primary, color: DESIGN_SYSTEM.colors.textPrimary, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>Zavřít</button>
            </div>
          </div>
        </div>
      )}
      {/* Release Scheduler Modal */}
      {showReleaseScheduler && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReleaseScheduler(false); }}
        >
          <div style={{ background: DESIGN_SYSTEM.colors.tertiary, border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, borderRadius: "8px", width: "min(400px, 96vw)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: `0.4px solid ${DESIGN_SYSTEM.colors.border}` }}>
              <div>
                <div style={{ color: DESIGN_SYSTEM.colors.textPrimary, fontSize: "16px", fontWeight: 600 }}>Plánování vydání</div>
                <div style={{ color: DESIGN_SYSTEM.colors.textSecondary, fontSize: "12px", marginTop: "4px" }}>Kdy mají být vaše beaty zveřejněny</div>
              </div>
              <button
                onClick={() => setShowReleaseScheduler(false)}
                style={{ background: "transparent", border: "none", color: DESIGN_SYSTEM.colors.textSecondary, fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Date Input */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: DESIGN_SYSTEM.colors.textPrimary, marginBottom: "8px" }}>Datum vydání</label>
                <input
                  type="date"
                  value={schedulerDate}
                  onChange={(e) => setSchedulerDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "14px",
                    backgroundColor: DESIGN_SYSTEM.colors.inputs,
                    border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`,
                    borderRadius: "4px",
                    color: DESIGN_SYSTEM.colors.textPrimary,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: DESIGN_SYSTEM.colors.textPrimary, marginBottom: "8px" }}>Rychlý výběr</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Zítra", get: () => new Date(Date.now() + 86400000).toISOString().split('T')[0] },
                    { label: "Další pracovní den", get: getNextWeekday },
                    { label: "Příští pátek", get: getNextFriday },
                    { label: "Příští týden", get: () => new Date(Date.now() + 604800000).toISOString().split('T')[0] },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setSchedulerDate(preset.get())}
                      style={{
                        padding: "10px",
                        backgroundColor: DESIGN_SYSTEM.colors.inputs,
                        border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`,
                        borderRadius: "4px",
                        color: DESIGN_SYSTEM.colors.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.tertiary;
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.textPrimary;
                        e.currentTarget.style.borderColor = "#444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.inputs;
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.textSecondary;
                        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border;
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to All + Auto-Increment */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: DESIGN_SYSTEM.colors.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: DESIGN_SYSTEM.colors.primary }}
                  />
                  <span>Použít pro všechny {beats.length} beatů</span>
                </label>
                {applyToAll && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: DESIGN_SYSTEM.colors.textPrimary, marginLeft: "24px" }}>
                    <input
                      type="checkbox"
                      checked={autoIncrement}
                      onChange={(e) => setAutoIncrement(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: DESIGN_SYSTEM.colors.primary }}
                    />
                    <span>Automaticky zvyšovat o 1 den (05.09, 06.09, 07.09...)</span>
                  </label>
                )}
                {applyToAll && autoIncrement && (
                  <div style={{ marginLeft: "24px", padding: "10px", backgroundColor: DESIGN_SYSTEM.colors.inputs, border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, borderRadius: "4px", fontSize: "12px", color: DESIGN_SYSTEM.colors.textSecondary, lineHeight: "1.4" }}>
                    <div style={{ fontWeight: 500, marginBottom: "6px", color: DESIGN_SYSTEM.colors.textPrimary }}>Náhled:</div>
                    {beats.slice(0, 3).map((beat, idx) => {
                      const date = new Date(schedulerDate);
                      date.setDate(date.getDate() + idx);
                      return (
                        <div key={beat.id} style={{ fontSize: "11px" }}>
                          • {beat.name} → {date.toLocaleDateString()}
                        </div>
                      );
                    })}
                    {beats.length > 3 && <div style={{ fontSize: "11px", marginTop: "4px" }}>... a dalších {beats.length - 3}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px", borderTop: `0.4px solid ${DESIGN_SYSTEM.colors.border}`, display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowReleaseScheduler(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: DESIGN_SYSTEM.colors.inputs,
                  color: DESIGN_SYSTEM.colors.textSecondary,
                  border: `0.4px solid ${DESIGN_SYSTEM.colors.border}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.tertiary;
                  e.currentTarget.style.color = DESIGN_SYSTEM.colors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.inputs;
                  e.currentTarget.style.color = DESIGN_SYSTEM.colors.textSecondary;
                }}
              >
                Zrušit
              </button>
              <button
                onClick={handleApplyReleaseDate}
                style={{
                  padding: "8px 20px",
                  backgroundColor: DESIGN_SYSTEM.colors.primary,
                  color: DESIGN_SYSTEM.colors.textPrimary,
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Použít plán
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
