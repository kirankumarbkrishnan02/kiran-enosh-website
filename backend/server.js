const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust Render's proxy for rate limiting to work correctly
app.set('trust proxy', 1);

/* ============ SECURITY MIDDLEWARE ============ */
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

/* ============ STRICT CORS SECURITY ============ */
const allowedOrigins = [
  'https://kiranenosh.vercel.app', // <-- YOUR NEW DOMAIN
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501'
];

app.use(
  cors({
    origin: function (origin, callback) {
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
app.use('/api/attendance', require('./routes/attendance'));

app.get('/', (req, res) => res.json({ status: 'Kiran Enosh API running ✅' }));

/* ============ START SERVER ============ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});