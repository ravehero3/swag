import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const TEMP_DIR = process.env.NODE_ENV === 'production' ? '/tmp/video-gen' : path.join(process.cwd(), 'tmp/video-gen');

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function getFfmpegPath(): string {
  try {
    const { createRequire } = require('module');
    const ffmpegPath = createRequire(import.meta.url)('ffmpeg-static');
    if (ffmpegPath && typeof ffmpegPath === 'string') return ffmpegPath;
  } catch { /* fall through */ }
  return 'ffmpeg';
}

async function downloadFile(url: string, dest: string): Promise<void> {
  // Handle local URLs
  let fetchUrl = url;
  if (url.startsWith('/uploads/')) {
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    if (appUrl) {
      fetchUrl = appUrl + url;
    } else {
      // Fallback: assume localhost if no APP_URL
      fetchUrl = `http://localhost:3000${url}`;
    }
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  
  const buffer = await response.buffer();
  fs.writeFileSync(dest, buffer);
}

async function generateSquareVideo(options: {
  beatId: number;
  title: string;
  bpm: number;
  key: string;
  artworkUrl: string;
  audioUrl: string;
}): Promise<Buffer> {
  ensureTempDir();

  const id = `${options.beatId}-${Date.now()}`;
  const artworkFile = path.join(TEMP_DIR, `${id}-artwork.jpg`);
  const audioFile = path.join(TEMP_DIR, `${id}-audio.mp3`);
  const videoFile = path.join(TEMP_DIR, `${id}-video.mp4`);

  try {
    // Download artwork and audio
    console.log(`[VideoGen] Downloading artwork: ${options.artworkUrl}`);
    await downloadFile(options.artworkUrl, artworkFile);

    console.log(`[VideoGen] Downloading audio: ${options.audioUrl}`);
    await downloadFile(options.audioUrl, audioFile);

    // Generate square video using FFmpeg
    // 1080x1080 video with artwork stretched to fill, audio synced
    console.log(`[VideoGen] Generating video with FFmpeg`);

    const ffmpegPath = getFfmpegPath();
    const args = [
      '-loop', '1',
      '-i', artworkFile,
      '-i', audioFile,
      '-c:v', 'libx264',
      '-tune', 'stillimage',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
      '-vf', 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2',
      '-y',
      videoFile,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      });
    });

    // Read video file
    const videoBuffer = fs.readFileSync(videoFile);
    return videoBuffer;
  } finally {
    // Cleanup temp files
    [artworkFile, audioFile, videoFile].forEach((f) => {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch { /* ignore */ }
      }
    });
  }
}

export { generateSquareVideo, ensureTempDir };
