# CDN Service (`apps/cdn`)

Self-hosted image CDN — koi 3rd-party (Cloudinary/S3) nahi.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET`  | `/health` | none | Service health |
| `GET`  | `/:filename` | none | Image serve (immutable 30-day cache) |
| `POST` | `/upload/single` | Admin JWT | Single image upload |
| `POST` | `/upload/multiple` | Admin JWT | Multiple (up to 10) images |

## Auth

Same `JWT_ACCESS_SECRET` as API. Admin user (`role: 'ADMIN'`) ka access token Bearer header me bhejna hota hai.

## Storage

- Files: `apps/cdn/uploads/<32hex>.<ext>` (random)
- Allowed: jpg/jpeg/png/webp/gif
- Max size: `MAX_IMAGE_SIZE_MB` env (default 5MB)

## Production

Port `3031`. Nginx `/cdn/` → `127.0.0.1:3031/`. PM2 process: `aunty-cdn`.

## Local dev

```bash
cd apps/cdn
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
```
