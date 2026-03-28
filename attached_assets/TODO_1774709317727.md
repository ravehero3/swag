# Batch Upload to B2 (Free Vercel) TODO

Status: 0/8

## Phase 1: Docs
- [ ] Update this TODO.md

## Phase 2: Backend Schema/DB
- [x] server/src/db.ts: CREATE TABLE pending_uploads

## Phase 3: Backend Endpoints
- [x] server/src/routes/upload.ts: POST /authorize (admin, return {keyId, applicationKey, endpoint})
- [x] server/src/routes/upload.ts: POST /pending (admin, save pending keys to DB)
- [x] server/src/routes/upload.ts: GET /pending (list)
- [x] server/src/routes/upload.ts: DELETE /pending/:id

## Phase 4: Frontend Batch
- [ ] client/src/pages/Admin.tsx: DragDrop zone multiple, parallel B2 upload using backblaze-b2
- [ ] client/src/pages/Admin.tsx: Pending list + link to beat form (multi-select → insert license_types)

## Phase 5: Test/Deploy
- [ ] Test batch 10x350MB local
- [ ] Deploy Railway free (no Vercel)

