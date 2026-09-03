import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface ArtworkImage {
  filename: string;
  url: string;
  size: number;
}

interface ArtworkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, filename: string) => void;
  beatName?: string;
}

export const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  beatName,
}) => {
  const [galleryImages, setGalleryImages] = useState<ArtworkImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load gallery images on open
  useEffect(() => {
    if (isOpen) {
      loadGalleryImages();
    }
  }, [isOpen]);

  const loadGalleryImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gallery-images');
      if (!res.ok) throw new Error('Failed to load gallery');
      const data = await res.json();
      setGalleryImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadArtwork = async (files: FileList | File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload?type=artwork', true);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.send(formData);
      });

      // Reload gallery after upload
      await loadGalleryImages();
      setUploadProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const res = await fetch(`/api/gallery-images/${filename}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      await loadGalleryImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-6">
          <div>
            <h2 className="text-xl font-bold text-white">Select Artwork</h2>
            {beatName && (
              <p className="text-sm text-gray-400 mt-1">for "{beatName}"</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="border-b border-gray-700 px-6 py-4 bg-gray-800">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUploadArtwork(e.dataTransfer.files);
            }}
            className={`block p-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
              dragOver
                ? 'border-purple-500 bg-purple-500 bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) handleUploadArtwork(e.target.files);
              }}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : 'Drag images here or click to select'}
              </span>
            </div>
          </label>

          {uploading && (
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-900 bg-opacity-30 border-b border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading gallery...
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
              <p>No artworks yet</p>
              <p className="text-xs text-gray-500 mt-2">Upload images above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={img.filename}
                  className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => onSelect(img.url, img.filename)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition"
                    >
                      Select
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img.filename);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-xs text-gray-300 truncate">
                      {img.filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
