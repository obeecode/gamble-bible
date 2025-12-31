import { Router } from 'express';
import { 
    createPrize, 
    getUserPrizes, 
    claimPrize,
    markPrizeAsPaid,
    getAllPrizes, 
    expirePrizes 
} from '../controllers/prizeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// User routes
router.post('/', createPrize);
router.get('/', getUserPrizes);
router.post('/:id/claim', claimPrize); // Changed from PATCH to POST to accept body

// Admin routes
router.get('/admin/all', getAllPrizes); // Get all prizes (admin only)
router.patch('/admin/:id/mark-paid', markPrizeAsPaid); // Mark prize as paid (NEW)
router.post('/admin/expire', expirePrizes); // Expire old prizes (can be called by cron job)

export const prizeRouter = router;