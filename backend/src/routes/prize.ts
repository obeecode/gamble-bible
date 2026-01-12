import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createPrize,
    createPrizeFromSpin,
    getUserPrizes,
    claimPrize,
    getAllPrizes,
    markPrizeAsPaid,
} from '../controllers/prizeController';

const router = Router();

// User routes
router.post('/', authenticate, createPrize); // Original endpoint (admin/manual)
router.post('/from-spin', authenticate, createPrizeFromSpin); // NEW - For spin wins
router.get('/', authenticate, getUserPrizes);
router.post('/:id/claim', authenticate, claimPrize);

// Admin routes
router.get('/admin/all', authenticate, getAllPrizes); // ✅ Changed from /admin/all-prizes to /admin/all
router.patch('/admin/:id/mark-paid', authenticate, markPrizeAsPaid);

export const prizeRouter = router;