# Aunty.pk

E-commerce platform for authentic homemade Pakistani food (achaar, chutney, murabbay, biryani, etc.) — based in Multan. Currently configured as an **admin-only dashboard**: public user registration is disabled and only an admin can manage products, categories, orders (with voice-message notes), and inventory.

## Tech stack

- **Monorepo** — Turborepo + npm workspaces
- **Backend** — NestJS 11, MongoDB (Mongoose), JWT auth, Multer uploads, Nodemailer
- **Frontend** — Next.js 15, React 19, Tailwind CSS, Leaflet (delivery map), Quill editor
- **Shared packages** — `@repo/db` (Mongoose schemas), `@repo/ui` (React components), shared eslint + tsconfig

```
apps/
  api/   NestJS backend  (port 3030)
  web/   Next.js frontend (port 3000)
packages/
  db/    Mongoose schemas
  ui/    Shared React components
  eslint-config/
  typescript-config/
```

---

## Quick start (local dev)

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment

**API** — copy and edit:
```bash
cp apps/api/.env.example apps/api/.env
```

Then set at minimum:
- `MONGODB_URI` — your MongoDB connection string
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate via `openssl rand -base64 48`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — for the admin seed script
- `CORS_ORIGINS` — comma-separated frontend origins

**Web** — copy and edit:
```bash
cp apps/web/.env.example apps/web/.env.local
```

### 4. Seed the admin user
```bash
cd apps/api
npm run seed:admin
```

This reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and creates a single admin account.

### 5. Run
In two terminals:
```bash
# Terminal 1 - API
cd apps/api && npm run dev

# Terminal 2 - Web
cd apps/web && npm run dev
```

Visit http://localhost:3000 and log in with your admin credentials.

---

## Security checklist (before production)

- [ ] Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with strong random values (the app refuses to start otherwise)
- [ ] Set `ADMIN_PASSWORD` to a strong value (min 8 chars; the seed script enforces this)
- [ ] Restrict `CORS_ORIGINS` to only the production domain(s)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS in front of the API (nginx / Caddy / Vercel)
- [ ] Configure MongoDB with auth + IP allow-list (never expose Mongo publicly)
- [ ] Configure `MAIL_*` for order-status emails (or leave empty to disable)
- [ ] Never commit `.env` — root `.gitignore` is configured to block this
- [ ] Set `MAX_IMAGE_SIZE_MB` / `MAX_VOICE_SIZE_MB` to sensible limits

---

## What's hardened

| Concern | Mitigation |
|---|---|
| Hardcoded credentials | Removed; admin seed reads from env, fails if missing/short |
| Path traversal on `/api/uploads/:imgpath` | Filename whitelisted to `^[a-f0-9]{32}\.(jpg\|jpeg\|png\|webp\|gif)$` + `basename()` + root check |
| Anonymous file uploads | `/api/uploads/single` and `/multiple` now require JWT + Admin |
| Unbounded file uploads | Multer `limits.fileSize` + mime/extension whitelist |
| Unbounded voice base64 | DTO `MaxLength` + decoded buffer size check (`MAX_VOICE_SIZE_MB`) + mime whitelist |
| Sync `fs.writeFileSync` blocking event loop | Switched voice save to `fs.promises` |
| Permissive CORS (`http://aunty.pk` etc) | Driven by `CORS_ORIGINS` env, defaults to localhost in dev |
| JWT fallback secrets (`'fallback-secret'`) | Strategies throw if secret missing or still a placeholder |
| Missing security headers | `helmet()` installed globally |
| Auth brute force | `@nestjs/throttler` — global + per-endpoint limits on login/register/refresh |
| Generic error responses leaking stack traces | Global `AllExceptionsFilter` hides internals in production |
| 50 MB body limit (DoS surface) | Reduced to 20 MB (configurable via `BODY_LIMIT`) |
| Missing input validation on orders | DTOs hardened with `IsEmail`, `MaxLength`, `Min`/`Max`, `ArrayMaxSize` |
| No `.gitignore` at repo root | Added — blocks `.env`, `node_modules`, build output, uploads, etc. |

---

## Useful scripts

```bash
# At repo root
npm run build         # build all apps + packages
npm run lint          # lint all
npm run dev           # run all in parallel (turbo)

# In apps/api
npm run dev           # nest watch mode
npm run build         # nest build
npm run start:prod    # run compiled dist
npm run seed:admin    # create the single admin user
npm run lint
npm test

# In apps/web
npm run dev
npm run build
npm start
```

---

## Database models (MongoDB collections)

- **User** — email, passwordHash, role (USER | ADMIN), refreshToken
- **Product** — name, slug, price, stock, images[], variants (size/weight), isFeatured, category
- **Category** — name, slug, image, isActive (controls navbar visibility)
- **Order** — items, status (PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED), shippingAddress, paymentMethod (COD | STRIPE), voiceMessage (fileUrl, mimeType, duration)
- **Review** — product reviews
- **Settings** — store config (delivery fee, store info)

---

## Notable features

- **Voice message on orders** — customers can record a short audio note attached to the order
- **Dynamic categories** — toggling `isActive` on a category instantly affects the public navbar
- **Variants** — products can have size/weight variants (e.g. 500g / 1kg) with independent stock and pricing
- **Admin dashboard** — products, categories, orders (with Leaflet delivery map), settings, users
- **Order-status emails** — sent on create + each status transition (when SMTP is configured)

---

## License

Private / unlicensed.
