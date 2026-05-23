import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer, { FileFilterCallback } from 'multer';
import jwt from 'jsonwebtoken';
import { mkdirSync, existsSync } from 'fs';
import { extname, basename, join, normalize } from 'path';
import { randomBytes } from 'crypto';

// ─── Config ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3031;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const UPLOAD_ROOT = join(process.cwd(), UPLOAD_DIR);
const MAX_IMAGE_SIZE = Number(process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024;
const PUBLIC_PATH_PREFIX = process.env.PUBLIC_PATH_PREFIX || '/cdn';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!JWT_SECRET) {
  console.error('[CDN] FATAL: JWT_ACCESS_SECRET not set');
  process.exit(1);
}

// Ensure upload dir exists
if (!existsSync(UPLOAD_ROOT)) {
  mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// ─── Validation rules ───────────────────────────────────────────────────────
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_FILENAME_RE = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/i;

function safeFilename(file: Express.Multer.File): string {
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Invalid file extension: ${ext}`);
  }
  return `${randomBytes(16).toString('hex')}${ext}`;
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error(`Invalid mime type: ${file.mimetype}`));
  }
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(new Error(`Invalid extension: ${ext}`));
  }
  cb(null, true);
}

// ─── Multer storage ─────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_ROOT,
    filename: (_req, file, cb) => {
      try {
        cb(null, safeFilename(file));
      } catch (e) {
        cb(e as Error, '');
      }
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 10 },
  fileFilter,
});

// ─── Auth middleware (admin-only via shared JWT) ────────────────────────────
interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    if (payload.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin role required' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ─── App ────────────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: CORS_ORIGINS.length === 1 && CORS_ORIGINS[0] === '*' ? true : CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cdn', uptime: process.uptime() });
});

// ─── Public file serving ────────────────────────────────────────────────────
// Strong cache (immutable: filename hash kabhi same content me change nahi hota)
app.get('/:filename', (req, res) => {
  const safeName = basename(req.params.filename);
  if (!ALLOWED_FILENAME_RE.test(safeName)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  const resolved = normalize(join(UPLOAD_ROOT, safeName));
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    return res.status(400).json({ message: 'Invalid path' });
  }
  if (!existsSync(resolved)) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.set('Cache-Control', 'public, max-age=2592000, immutable'); // 30 days
  res.sendFile(safeName, { root: UPLOAD_ROOT });
});

// ─── Rate limiter (light, in-memory) for the public review endpoint ────────
// Stops a single IP from spamming the CDN. Resets every minute.
const PUBLIC_UPLOAD_PER_MIN = Number(process.env.PUBLIC_UPLOAD_PER_MIN || 20);
const ipHits = new Map<string, { count: number; resetAt: number }>();

function publicUploadLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > PUBLIC_UPLOAD_PER_MIN) {
    return res.status(429).json({ message: 'Too many uploads, please slow down.' });
  }
  next();
}

// ─── Public review-photo upload (guest-friendly) ────────────────────────────
// No JWT required — guests post reviews with photos without an account.
// Protected by:
//  - same mime/extension/size validation as admin uploads
//  - per-IP rate limit (PUBLIC_UPLOAD_PER_MIN)
//  - single file per call
app.post('/upload/review', publicUploadLimiter, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ message: 'No file uploaded' });
    res.json({
      url: `${PUBLIC_PATH_PREFIX}/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mime: f.mimetype,
    });
  });
});

// ─── Upload endpoints (admin only) ──────────────────────────────────────────
app.post('/upload/single', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ message: 'No file uploaded' });
    res.json({
      url: `${PUBLIC_PATH_PREFIX}/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mime: f.mimetype,
    });
  });
});

app.post('/upload/multiple', requireAdmin, (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    const files = ((req as any).files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ message: 'No files uploaded' });
    res.json(
      files.map((f) => ({
        url: `${PUBLIC_PATH_PREFIX}/${f.filename}`,
        filename: f.filename,
        size: f.size,
        mime: f.mimetype,
      })),
    );
  });
});

// ─── Generic error handler ──────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[CDN] Error:', err);
  res.status(500).json({ message: err?.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`[CDN] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[CDN] Upload dir: ${UPLOAD_ROOT}`);
  console.log(`[CDN] Public prefix: ${PUBLIC_PATH_PREFIX}`);
  console.log(`[CDN] CORS origins: ${CORS_ORIGINS.join(', ') || '(any)'}`);
});
