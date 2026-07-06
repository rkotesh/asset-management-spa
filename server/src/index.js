import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './utils/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy headers (1 means trust the first proxy hop, standard for Heroku/Render/Nginx)
app.set('trust proxy', 1);

// Force HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Payload Gzip/Brotli compression for Site Speed
app.use(compression());

app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Renamed/Deprecated routes 301 redirection
const REDIRECT_MAP = {
  '/dashboard': '/assets',
  '/files': '/assets',
  '/queries': '/query',
  '/user-profile': '/profile',
  '/signin': '/login',
  '/signup': '/register'
};

app.use((req, res, next) => {
  const target = REDIRECT_MAP[req.path];
  if (target) {
    console.log(`[Redirect 301]: ${req.path} -> ${target}`);
    return res.redirect(301, target);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Management Server running.' });
});

// Serve client built static assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.resolve(__dirname, '../../client/dist/client');

app.use(express.static(clientBuildPath, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    // Disable caching for HTML files and service workers to ensure immediate updates
    if (filePath.endsWith('.html') || filePath.includes('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Long-term immutable caching for JS, CSS, and image files
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Valid client-side SPA routes
const VALID_SPA_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/assets',
  '/profile',
  '/query',
  '/admin'
];

// Fallback routing for SPA pages
app.get('*', (req, res, next) => {
  // Pass through API requests to default error or 404 handler
  if (req.path.startsWith('/api')) {
    return next();
  }

  const cleanPath = req.path.replace(/\/$/, ''); // Remove trailing slash
  const routeToCheck = cleanPath || '/';
  
  // Check if it's a valid client-side route (either direct match or starts with /assets/)
  const isValidRoute = VALID_SPA_ROUTES.includes(routeToCheck) || req.path.startsWith('/assets/');
  
  if (isValidRoute) {
    // If it's a pre-rendered public route, serve its index.html if it exists
    const publicPrerenderedRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (publicPrerenderedRoutes.includes(cleanPath)) {
      const pagePath = path.join(clientBuildPath, cleanPath, 'index.html');
      if (fs.existsSync(pagePath)) {
        return res.sendFile(pagePath);
      }
    }
    // Otherwise serve main SPA index.html
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  }

  // If the route is invalid, return a proper 404 status code and serve the static 404 page
  const notFoundPath = path.join(clientBuildPath, '404/index.html');
  if (fs.existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  
  res.status(404).send('404 Page Not Found');
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      message: 'File size exceeds the allowed upload limit (50MB).',
      code: 400
    });
  }
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'An unexpected server error occurred',
    code: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
