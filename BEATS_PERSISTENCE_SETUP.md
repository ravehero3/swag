# Beat Persistence Setup — voodoo808.com

## Problem Solved

Beats were disappearing after container restarts because they were stored in an **ephemeral Docker volume**, not a persistent host directory.

## Solution

All beats are now stored in a **persistent bind mount** on the Oracle VPS:

- **Host path:** `/home/ubuntu/apps/data/uploads/beats/`
- **Container path:** `/app/public/uploads/beats/`
- **Persistence:** Survives container restarts, redeploys, and version updates

## How It Works

### docker-compose.yml (VPS)
```yaml
swag:
  volumes:
    - ./data/uploads/beats:/app/public/uploads/beats  # ← Persistent beats
    - ./data/uploads:/app/public/uploads               # ← Other uploads
    - ./data/kit-artworks:/app/public/kit-artworks     # ← Artwork
```

The **explicit beats mount** (`./data/uploads/beats:/app/public/uploads/beats`) overrides the anonymous Docker volume from the Dockerfile, ensuring beats are stored on the host filesystem.

### Dockerfile
```dockerfile
# This VOLUME declaration is now overridden by docker-compose.yml
# but remains as documentation of intent.
VOLUME ["/app/public/uploads/beats"]
```

## Verifying Persistence

### After uploading a beat:
```bash
# Local VPS
ls -lah ~/apps/data/uploads/beats/
```

### After container restart:
```bash
# All beats survive
docker exec apps-swag-1 ls /app/public/uploads/beats/ | wc -l
```

## Current Status (Oct 9, 2026)

- **Total beats:** 129 (stored on host)
- **Setup:** ✅ Deployed to voodoo808.com production
- **Test result:** ✅ Beats persist across `docker compose restart`
- **Accessibility:** ✅ All beats playable at `https://voodoo808.com/uploads/beats/<filename>`

## Uploading New Beats

1. Go to **voodoo808.com admin panel**
2. Upload beat (audio file)
3. Beat is **automatically saved** to `/home/ubuntu/apps/data/uploads/beats/` on the VPS
4. Beat **stays forever** — survives all restarts and redeploys

## Backup & Recovery

Beats are on a single VPS disk. Optional: Set up daily backups.

```bash
# VPS cron job (backs up beats daily)
0 2 * * * tar -czf ~/backups/beats-$(date +\%Y-\%m-\%d).tar.gz ~/apps/data/uploads/beats/
```

## For Developers

### Local docker-compose.yml
```yaml
swag:
  volumes:
    - ./data/uploads/beats:/app/public/uploads/beats
```

### Ensure this directory exists locally:
```bash
mkdir -p ./data/uploads/beats
```

### Test locally before pushing to VPS:
```bash
docker compose up
# Upload a beat
docker compose restart swag
# Verify beat still exists in ./data/uploads/beats/
```

## Related Files

- `docker-compose.yml` — service definitions with persistent volume mounts
- `Dockerfile` — build configuration (beats path documented in VOLUME)
- `.dockerignore` — excluded from build
- Server code (`server/src/routes/upload.ts`, `beatFiles.ts`) — handles beat uploads to `/app/public/uploads/beats/`

---

**Setup date:** Oct 9, 2026  
**Verified:** 129 beats persisting across restarts  
**Status:** Production ✅
