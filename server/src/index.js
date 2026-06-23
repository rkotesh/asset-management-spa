import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './utils/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/workflows', workflowRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Management Server running.' });
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
