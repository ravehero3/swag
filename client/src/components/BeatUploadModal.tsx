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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl flex flex-col border border-purple-500/40">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-purple-500/20 bg-gradient-to-r from-gray-900 to-gray-850">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">🎵 Upload Beats</h1>
                <p className="text-sm text-gray-400 mt-2">
                  {beats.length} beat{beats.length !== 1 ? 's' : ''} queued
                  {completedCount > 0 && ` • ${completedCount} ✅`}
                  {errorCount > 0 && ` • ${errorCount} ❌`}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Global Settings */}
          {beats.length > 0 && (
            <div className="px-8 py-3 border-b border-gray-700/50 bg-gray-800/30 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalReleaseImmediately}
                  onChange={(e) => setGlobalReleaseImmediately(e.target.checked)}
                  disabled={isUploading}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-300">Release all immediately</span>
              </label>
            </div>
          )}

          {/* Beat List */}
          <div className="flex-1 overflow-y-auto">
            {beats.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No beats selected yet</p>
                </div>
              </div>
            ) : (
              <div className="px-8 py-4 space-y-2">
                {/* Column Headers */}
                <div className="grid gap-3 text-xs text-gray-500 font-semibold mb-3 pb-2 border-b border-gray-700/50" style={{
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
                  <div key={beat.id} className="grid gap-3 items-center p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:border-purple-500/30 transition" style={{
                    gridTemplateColumns: '40px 1fr 70px 60px 120px 100px 80px 60px'
                  }}>
                    
                    {/* Status */}
                    <div className="text-center text-lg">
                      {statusIcon[beat.status]}
                    </div>

                    {/* Name */}
                    <input
                      type="text"
                      value={beat.name}
                      onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="Beat name"
                      className="px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 rounded text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    />

                    {/* BPM */}
                    <input
                      type="number"
                      value={beat.bpm}
                      onChange={(e) => updateBeat(beat.id, { bpm: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="BPM"
                      className="px-2 py-2 text-sm bg-gray-900/50 border border-gray-600 rounded text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    />

                    {/* Key */}
                    <select
                      value={beat.key}
                      onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      className="px-2 py-2 text-sm bg-gray-900/50 border border-gray-600 rounded text-white disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-</option>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>

                    {/* Artwork */}
                    <div className="flex items-center gap-2">
                      {beat.artworkUrl ? (
                        <>
                          <img
                            src={beat.artworkUrl}
                            alt={beat.artworkFilename}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <button
                            onClick={() => {
                              setSelectedBeatForArtwork(beat.id);
                              setShowArtworkSelector(true);
                            }}
                            disabled={isUploading}
                            className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded whitespace-nowrap"
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
                          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 rounded whitespace-nowrap"
                        >
                          <ImageIcon className="w-3 h-3 inline mr-1" />
                          Select
                        </button>
                      )}
                    </div>

                    {/* Release */}
                    <div className="text-xs">
                      {beat.releaseImmediately ? (
                        <span className="text-green-400 font-semibold">Now</span>
                      ) : (
                        <input
                          type="date"
                          value={beat.releaseDate}
                          onChange={(e) => updateBeat(beat.id, { releaseDate: e.target.value })}
                          disabled={isUploading}
                          className="w-full px-2 py-1 text-xs bg-gray-900/50 border border-gray-600 rounded text-white disabled:opacity-50 focus:outline-none focus:border-purple-500"
                        />
                      )}
                    </div>

                    {/* Progress */}
                    {beat.status === 'uploading' && (
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${beat.progress}%` }} />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isUploading && beat.status === 'pending' && (
                      <button
                        onClick={() => removeBeat(beat.id)}
                        className="text-gray-400 hover:text-red-400 transition"
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
          <div className="px-8 py-6 border-t border-purple-500/20 bg-gradient-to-r from-gray-800/50 to-gray-900 flex items-center justify-between gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4" />
                Add Beats
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={beats.length === 0 || isUploading}
                className="px-8 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-semibold rounded-lg transition"
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
