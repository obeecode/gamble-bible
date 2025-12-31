import { Response } from 'express';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';
import { 
    performSpin, 
    claimPendingPrizes, 
    getSpinStats,
    checkRateLimits 
} from '../services/spinService';
import { PendingPrize } from '../models/PendingPrize';
import { Spin } from '../models/Spin';
import { AuditLog } from '../models/AuditLog';
import SPIN_CONFIG from '../config/spinConfig';

// Get client IP address
const getClientIp = (req: any): string => {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
};

// Spin the wheel (works for both authenticated and anonymous users)
export const spin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fingerprint } = req.body;
    const ipAddress = getClientIp(req);
    const userId = req.user?.id;
    
    if (!fingerprint) {
        res.status(400).json({
            success: false,
            error: 'Fingerprint is required',
        });
        return;
    }
    
    const metadata = {
        userAgent: req.headers['user-agent'],
    };
    
    const result = await performSpin(fingerprint, ipAddress, userId, metadata);
    
    res.json({
        success: result.success,
        data: result,
    });
});

// Get spin statistics for current user/fingerprint
export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const fingerprint = req.query.fingerprint as string;
    
    if (!fingerprint) {
        res.status(400).json({
            success: false,
            error: 'Fingerprint is required',
        });
        return;
    }
    
    const stats = await getSpinStats(fingerprint);
    
    res.json({
        success: true,
        data: stats,
    });
});

// Get pending prizes for a fingerprint
export const getPendingPrizes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const fingerprint = req.query.fingerprint as string;
    
    if (!fingerprint) {
        res.status(400).json({
            success: false,
            error: 'Fingerprint is required',
        });
        return;
    }
    
    const pendingPrizes = await PendingPrize.find({
        fingerprint,
        claimed: false,
        expired: false,
        expiresAt: { $gte: new Date() },
    }).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        data: {
            prizes: pendingPrizes,
            count: pendingPrizes.length,
        },
    });
});

// Claim pending prizes after login/registration
export const claimPending = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fingerprint } = req.body;
    const userId = req.user!.id;
    
    if (!fingerprint) {
        res.status(400).json({
            success: false,
            error: 'Fingerprint is required',
        });
        return;
    }
    
    // Check if user has exceeded limits
    const ipAddress = getClientIp(req);
    const rateLimitCheck = await checkRateLimits(fingerprint, ipAddress);
    
    if (!rateLimitCheck.allowed) {
        res.status(429).json({
            success: false,
            error: rateLimitCheck.reason,
        });
        return;
    }
    
    const result = await claimPendingPrizes(userId, fingerprint);
    
    res.json({
        success: result.success,
        data: result,
    });
});

// Get spin configuration (for frontend)
export const getConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        data: {
            hourlyLimit: SPIN_CONFIG.HOURLY_SPIN_LIMIT,
            dailyLimit: SPIN_CONFIG.DAILY_SPIN_LIMIT,
            pendingPrizeExpiryHours: SPIN_CONFIG.PENDING_PRIZE_EXPIRY_HOURS,
            spinCooldownSeconds: SPIN_CONFIG.SPIN_COOLDOWN_SECONDS,
        },
    });
});

// ADMIN: Get all spins with filters
export const getAllSpins = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can view all spins',
        });
        return;
    }
    
    const { page = 1, limit = 50, result, claimed, fingerprint, userId } = req.query;
    
    const query: any = {};
    if (result) query.result = result;
    if (claimed !== undefined) query.claimed = claimed === 'true';
    if (fingerprint) query.fingerprint = fingerprint;
    if (userId) query.user = userId;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const spins = await Spin.find(query)
        .populate('user', 'name email')
        .populate('prizeId', 'referenceNumber amount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));
    
    const total = await Spin.countDocuments(query);
    
    res.json({
        success: true,
        data: {
            spins,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        },
    });
});

// ADMIN: Get audit logs
export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can view audit logs',
        });
        return;
    }
    
    const { page = 1, limit = 100, action, severity, fingerprint, userId } = req.query;
    
    const query: any = {};
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (fingerprint) query.fingerprint = fingerprint;
    if (userId) query.user = userId;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const logs = await AuditLog.find(query)
        .populate('user', 'name email')
        .populate('targetUser', 'name email')
        .populate('adminUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
        success: true,
        data: {
            logs,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        },
    });
});

// ADMIN: Get suspicious activity
export const getSuspiciousActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can view suspicious activity',
        });
        return;
    }
    
    const suspiciousLogs = await AuditLog.find({
        action: 'suspicious_activity',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);
    
    const rateLimitHits = await AuditLog.find({
        action: 'rate_limit_hit',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
        .sort({ createdAt: -1 })
        .limit(50);
    
    res.json({
        success: true,
        data: {
            suspiciousActivity: suspiciousLogs,
            rateLimitHits,
        },
    });
});

// ADMIN: Get spin analytics
export const getSpinAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can view analytics',
        });
        return;
    }
    
    const { days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    
    const totalSpins = await Spin.countDocuments({ createdAt: { $gte: daysAgo } });
    const wins = await Spin.countDocuments({ 
        createdAt: { $gte: daysAgo },
        result: { $ne: 'no_win' },
    });
    
    const resultBreakdown = await Spin.aggregate([
        { $match: { createdAt: { $gte: daysAgo } } },
        { $group: { _id: '$result', count: { $sum: 1 }, totalAmount: { $sum: '$prizeAmount' } } },
    ]);
    
    const uniquePlayers = await Spin.distinct('fingerprint', { createdAt: { $gte: daysAgo } });
    
    const totalPrizesAwarded = await Spin.aggregate([
        { $match: { createdAt: { $gte: daysAgo }, prizeAwarded: true } },
        { $group: { _id: null, total: { $sum: '$prizeAmount' } } },
    ]);
    
    res.json({
        success: true,
        data: {
            period: `Last ${days} days`,
            totalSpins,
            wins,
            losses: totalSpins - wins,
            winRate: totalSpins > 0 ? ((wins / totalSpins) * 100).toFixed(2) : 0,
            uniquePlayers: uniquePlayers.length,
            resultBreakdown,
            totalPrizesAwarded: totalPrizesAwarded[0]?.total || 0,
        },
    });
});