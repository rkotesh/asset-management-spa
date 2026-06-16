import express from 'express';
import { createQuery, getQueries, resolveQuery } from '../controllers/queryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All queries routes require authentication
router.use(protect);

router.post('/', createQuery);

// Administrative routes require admin role checks
router.get('/', adminOnly, getQueries);
router.put('/:id', adminOnly, resolveQuery);

export default router;
