import { Router } from 'express';
import {
    validateSpin,
    getStats,
    getPendingPrizes,
    createPendingPrize,
    getConfig,
    getAllSpins,
    getAuditLogs,
    getSuspiciousActivity,
    getSpinAnalytics,
} from '../controllers/spinController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public/Anonymous routes
router.post('/validate', optionalAuth, validateSpin); // Changed from /spin to /validate
router.get('/config', getConfig);
router.get('/stats', getStats);
router.get('/pending', getPendingPrizes);
router.post('/pending-prize', createPendingPrize); // New endpoint for creating pending prizes

// Admin routes
router.get('/admin/all-spins', authenticate, getAllSpins);
router.get('/admin/audit-logs', authenticate, getAuditLogs);
router.get('/admin/suspicious-activity', authenticate, getSuspiciousActivity);
router.get('/admin/analytics', authenticate, getSpinAnalytics);

export const spinRouter = router;