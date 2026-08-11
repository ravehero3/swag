// Beat Publishing Workflow - Implementation Guide
// This file documents the beat selection + editing + publishing workflow

/*
FEATURE REQUEST SUMMARY:
1. When viewing "vybrat preview audio" modal, users should be able to:
   - Click on a beat from the list to select it
   - See a form to add name, BPM, and key information
   - See it highlighted to show selection status
   - Have a "zveřejnit beat" button to publish
   - Browse gallery to select artwork before publishing

IMPLEMENTATION APPROACH:

1. DATABASE CHANGES NEEDED:
   - Add 'status' column to beats table: 'draft', 'ready', 'published'
   - Add 'selected_beat_id' to track which beat is being edited in the folder modal

2. MODAL STATE CHANGES:
   - Add beatFolderSelectedId: number | null  (tracks which beat file is selected for editing)
   - Add beatFolderEditMode: boolean (true when in edit mode)
   - Add beatFolderFormData: { name, bpm, key, artwork_url } (temp form state)

3. UI FLOW:
   a) User opens "Vybrat preview audio" modal (existing)
   b) User sees list of available beat files (existing)
   c) User clicks on a file → modal shows inline edit form
   d) Edit form has fields: Title, BPM, Key, Artwork selector
   e) Below the form: "Procházet galerii" button opens artwork picker
   f) When ready: "Zveřejnit beat" button creates/updates the beat in DB
   g) Beat appears on homepage playlist

4. NEW COMPONENTS NEEDED:
   - <BeatPublishForm /> - inline form for beat details
   - <BeatArtworkPicker /> - gallery browser for selecting artwork

5. NEW API ENDPOINTS:
   - POST /api/beats/publish-from-folder - create/update beat with folder audio

CURRENT STATUS:
- Search + sort in beat folder modal: ✅ DONE
- Gallery upload progress bar: ✅ DONE  
- File title above waveform: ✅ DONE
- i18n system: ✅ Created (needs integration to pages)
- Language selector in header: ✅ Done
- Beat selection workflow: ⏳ PENDING (see below for implementation)
*/

// REQUIRED DATABASE MIGRATION (run this in server/src/db.ts):
/*
ALTER TABLE beats ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_beats_status ON beats (status);

-- For tracking beat folder uploads
CREATE TABLE IF NOT EXISTS beat_drafts (
  id SERIAL PRIMARY KEY,
  file_url VARCHAR(500) NOT NULL,
  preview_url VARCHAR(500),
  title VARCHAR(255),
  bpm INTEGER,
  key VARCHAR(50),
  artwork_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_beat_drafts_file_url ON beat_drafts (file_url);
*/

export {};