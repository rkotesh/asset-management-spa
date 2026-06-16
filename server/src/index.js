import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './utils/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Management Server running.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
