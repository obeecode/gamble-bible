// Update your prize-routes.ts

import { Router } from 'express';
import {
    createPrize,
    createPrizeFromSpin, // NEW
    getUserPrizes,
    claimPrize,
    getAllPrizes,
    markPrizeAsPaid,
} from '../controllers/prizeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// User routes
router.post('/', authenticate, createPrize); // Original endpoint (admin/manual)
router.post('/from-spin', authenticate, createPrizeFromSpin); // NEW - For spin wins
router.get('/', authenticate, getUserPrizes);
router.post('/:id/claim', authenticate, claimPrize);

// Admin routes
router.get('/admin/all-prizes', authenticate, getAllPrizes);
router.patch('/admin/:id/mark-paid', authenticate, markPrizeAsPaid);

export const prizeRouter = router;