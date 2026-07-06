import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getOverview,
  getLoginActivity,
  getUserAnalytics,
  getAssetBreakdown
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard endpoints require admin authentication
router.use(protect, adminOnly);

router.get('/overview', getOverview);
router.get('/login-activity', getLoginActivity);
router.get('/users', getUserAnalytics);
router.get('/asset-breakdown', getAssetBreakdown);

export default router;
