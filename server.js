// ─────────────────────────────────────────────
// ✅ Neeki Hub Server.js (Stable for Render)
// ─────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ─── Safe Dynamic Route Import Function ───
const safeImport = async (path) => {
  try {
    const mod = await import(path);
    return mod.default || mod;
  } catch (err) {
    console.error(`❌ Failed to load route ${path}:`, err.message);
    return express.Router().get('/', (req, res) => {
      res.status(500).json({ success: false, error: `Route ${path} failed to load` });
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// ─── Security & Performance Middleware ───
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [])],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.aladhan.com',
          'https://generativelanguage.googleapis.com',
          'https://api-inference.huggingface.co',
          'https://nominatim.openstreetmap.org',
        ],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiters ───
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE) || 60,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE) || 10,
  message: { success: false, error: 'AI rate limit exceeded. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Logging middleware (development only) ───
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ─── Static files with proper caching headers ───
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isDevelopment ? 0 : '1y',
    etag: true,
    lastModified: true,
  })
);

app.use('/src', express.static(path.join(__dirname, 'src'), { maxAge: isDevelopment ? 0 : '1y' }));
app.use('/data', express.static(path.join(__dirname, 'data'), { maxAge: isDevelopment ? 0 : '1d' }));

// ─── Manifest & Service Worker ───
app.get('/manifest.json', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// ─── API Routes (Safe Dynamic Loading) ───
app.use('/api/prayers', apiLimiter, await safeImport('./api/prayers.js'));
app.use('/api/qibla', apiLimiter, await safeImport('./api/qibla.js'));
app.use('/api/verse', apiLimiter, await safeImport('./api/verse.js'));
app.use('/api/hadith', apiLimiter, await safeImport('./api/hadith.js'));
app.use('/api/duas', apiLimiter, await safeImport('./api/duas.js'));
app.use('/api/ai', aiLimiter, await safeImport('./api/ai.js'));

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// ─── API 404 handler ───
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
  });
});

// ─── SPA Fallback ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const errorResponse = {
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
  };
  if (isDevelopment) errorResponse.stack = err.stack;
  res.status(err.status || 500).json(errorResponse);
});

// ─── Graceful Shutdown ───
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('  ✅ Neeki Hub Server Running');
  console.log(`  🌐 Port: ${PORT}`);
  console.log(`  🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
  console.log(`  🤖 HuggingFace API: ${process.env.HF_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
  console.log('═══════════════════════════════════════════');
});

export default app;