import React, { useState, useCallback } from 'react';
import { X, Upload, Calendar, Play, Image as ImageIcon } from 'lucide-react';
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
  console.log('[BeatUploadModal] Rendering with isOpen:', isOpen);
  
  const [beats, setBeats] = useState<BeatFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null);
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

  const updateBeat = useCallback(
    (id: string, updates: Partial<BeatFile>) => {
      setBeats((prev) =>
        prev.map((beat) => (beat.id === id ? { ...beat, ...updates } : beat))
      );
    },
    []
  );

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

  const handleClearCompleted = () => {
    setBeats((prev) => prev.filter((beat) => beat.status !== 'completed'));
  };

  const completedCount = beats.filter((b) => b.status === 'completed').length;
  const errorCount = beats.filter((b) => b.status === 'error').length;

  if (!isOpen) {
      return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-purple-500/30">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/20 p-6 bg-gradient-to-r from-gray-900 to-gray-800/50">
            <div>
              <h2 className="text-2xl font-bold text-white">🎵 Upload Beats</h2>
              <p className="text-sm text-gray-400 mt-1">
                {beats.length} beat{beats.length !== 1 ? 's' : ''} queued
                {completedCount > 0 && ` • ${completedCount} completed`}
                {errorCount > 0 && ` • ${errorCount} errors`}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-2 hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
              type="button"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Global Settings */}
          {beats.length > 0 && (
            <div className="border-b border-gray-700 px-6 py-4 bg-gray-800">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalReleaseImmediately}
                  onChange={(e) => setGlobalReleaseImmediately(e.target.checked)}
                  disabled={isUploading}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-300">Release all beats immediately</span>
              </label>
            </div>
          )}

          {/* Beat List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {beats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Upload className="w-12 h-12 mb-3 opacity-50" />
                <p>No beats selected</p>
              </div>
            ) : (
              beats.map((beat) => (
                <div
                  key={beat.id}
                  onMouseEnter={() => setHoveredBeatId(beat.id)}
                  onMouseLeave={() => setHoveredBeatId(null)}
                  className={`p-4 rounded-xl border transition-all ${
                    hoveredBeatId === beat.id
                      ? 'bg-gray-700/80 border-purple-500 shadow-lg shadow-purple-500/40'
                      : 'bg-gray-800/60 border-gray-700 hover:border-purple-500/50'
                  } ${beat.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  {/* Status Indicator & File Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          beat.status === 'completed'
                            ? 'bg-green-500'
                            : beat.status === 'error'
                            ? 'bg-red-500'
                            : beat.status === 'uploading'
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {beat.file.name}
                        </p>
                        {beat.error && (
                          <p className="text-xs text-red-400 mt-1">{beat.error}</p>
                        )}
                      </div>
                    </div>
                    {!isUploading && beat.status === 'pending' && (
                      <button
                        onClick={() => removeBeat(beat.id)}
                        className="p-1 hover:bg-gray-700 rounded transition ml-2"
                        type="button"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Name */}
                    <input
                      type="text"
                      value={beat.name}
                      onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="Beat name"
                      className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    />

                    {/* BPM */}
                    <input
                      type="number"
                      value={beat.bpm}
                      onChange={(e) => updateBeat(beat.id, { bpm: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      placeholder="BPM"
                      className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    />

                    {/* Key */}
                    <select
                      value={beat.key}
                      onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                      disabled={isUploading || beat.status === 'completed'}
                      className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Key</option>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(
                        (k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        )
                      )}
                    </select>

                    {/* Release Date / Immediately */}
                    {beat.releaseImmediately ? (
                      <div className="flex items-center space-x-2">
                        <Play className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Release now</span>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={beat.releaseDate}
                        onChange={(e) =>
                          updateBeat(beat.id, { releaseDate: e.target.value })
                        }
                        disabled={isUploading || beat.status === 'completed'}
                        className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white disabled:opacity-50 focus:outline-none focus:border-purple-500"
                      />
                    )}

                    {/* Artwork Selection */}
                    <div className="col-span-2 flex items-center gap-2">
                      {beat.artworkUrl ? (
                        <>
                          <img 
                            src={beat.artworkUrl} 
                            alt={beat.artworkFilename} 
                            className="w-10 h-10 rounded object-cover bg-gray-800 border border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">
                              {beat.artworkFilename}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBeatForArtwork(beat.id);
                              setShowArtworkSelector(true);
                            }}
                            disabled={isUploading || beat.status === 'completed'}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs rounded transition"
                            type="button"
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
                          disabled={isUploading || beat.status === 'completed'}
                          className="col-span-2 flex items-center justify-center px-3 py-2 bg-gray-800 border border-gray-600 hover:border-purple-500 disabled:opacity-50 text-gray-300 text-sm rounded transition"
                          type="button"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Select Artwork
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(beat.status === 'uploading' || beat.status === 'completed') && (
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          beat.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${beat.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-purple-500/20 p-6 bg-gradient-to-r from-gray-800/50 to-gray-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
                <span className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg cursor-pointer transition">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Beats
                </span>
              </label>
              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition disabled:opacity-50"
                  type="button"
                >
                  Clear completed
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
                type="button"
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={beats.length === 0 || isUploading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                type="button"
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ArtworkSelector
        isOpen={showArtworkSelector}
        onClose={() => setShowArtworkSelector(false)}
        onSelect={handleArtworkSelect}
        beatName={selectedBeatForArtwork ? beats.find(b => b.id === selectedBeatForArtwork)?.name : undefined}
      />
    </>
  );
};
