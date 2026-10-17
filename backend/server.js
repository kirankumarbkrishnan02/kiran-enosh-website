const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

/* ============ SECURITY MIDDLEWARE ============ */
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());


/* ============ CORS (Allows Localhost 5500 & 5501) ============ */
/* ============ STRICT CORS SECURITY ============ */
const allowedOrigins = [
  'https://kiran-enosh-website-frontend.vercel.app', // Your live site
  'http://localhost:5500',                           // Local frontend
  'http://localhost:5501',                           // Local frontend (Live Server)
  'http://127.0.0.1:5500',                           // Local fallback
  'http://127.0.0.1:5501'                            // Local fallback
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        console.warn('⛔ CORS Blocked Origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
/* ============ RATE LIMITING ============ */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

/* ============ ROUTES ============ */
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', require('./routes/attendance'));  // ← ADD THIS

/* ============ HEALTH CHECK ============ */
app.get('/', (req, res) => res.json({ status: 'Kiran Enosh API running ✅' }));

/* ============ 404 FALLBACK ============ */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

/* ============ START SERVER ============ */
const PORT = process.env.PORT || 5000;
app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   → Local:    http://localhost:${PORT}`);
  console.log(`   → Network:  http://192.168.31.89:${PORT}`);
});
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_MOBILE,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);