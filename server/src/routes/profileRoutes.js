import express from 'express';
import { getProfile, updateProfile, updatePassword } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All profile endpoints are protected by JWT auth
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', updatePassword);

export default router;
