import { Router } from 'express';
import {
    spin,
    getStats,
    getPendingPrizes,
    claimPending,
    getConfig,
    getAllSpins,
    getAuditLogs,
    getSuspiciousActivity,
    getSpinAnalytics,
} from '../controllers/spinController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public/Anonymous routes (no auth required, but can be authenticated)
router.post('/spin', optionalAuth, spin); // Use optionalAuth middleware
router.get('/config', getConfig);
router.get('/stats', getStats);
router.get('/pending', getPendingPrizes);

// Authenticated routes
router.post('/claim-pending', authenticate, claimPending);

// Admin routes
router.get('/admin/all-spins', authenticate, getAllSpins);
router.get('/admin/audit-logs', authenticate, getAuditLogs);
router.get('/admin/suspicious-activity', authenticate, getSuspiciousActivity);
router.get('/admin/analytics', authenticate, getSpinAnalytics);

export const spinRouter = router;