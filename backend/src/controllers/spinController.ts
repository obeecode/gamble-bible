import { Response } from 'express';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';
import { 
    checkRateLimits 
} from '../services/spinService';
import { PendingPrize } from '../models/PendingPrize';
import { Spin } from '../models/Spin';
import { AuditLog, createAuditLog } from '../models/AuditLog';
import SPIN_CONFIG from '../config/spinConfig';
import mongoose from 'mongoose';

// Get client IP address
const getClientIp = (req: any): string => {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
};

// VALIDATE spin (check rate limits only - frontend decides outcome)
export const validateSpin = asyncHandler(async (req: AuthRequest, res: Response) => {
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
    
    // Check rate limits
    const rateLimitCheck = await checkRateLimits(fingerprint, ipAddress);
    
    if (!rateLimitCheck.allowed) {
        res.status(429).json({
            success: false,
            error: rateLimitCheck.reason,
            data: {
                hourlyRemaining: 0,
                dailyRemaining: rateLimitCheck.dailyCount ? SPIN_CONFIG.DAILY_SPIN_LIMIT - rateLimitCheck.dailyCount : 0,
            }
        });
        return;
    }
    
    // Create spin record (outcome will be updated later if prize won)
    const metadata = {
        userAgent: req.headers['user-agent'],
    };
    
    const spin = await Spin.create({
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        fingerprint,
        ipAddress,
        result: 'pending', // Will be updated by savePrize if won
        prizeAwarded: false,
        claimed: false,
        metadata,
    });
    
    // Log spin validation
    await createAuditLog({
        action: 'spin',
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        spin: spin._id,
        fingerprint,
        ipAddress,
        severity: 'info',
        details: {
            validated: true,
        },
    });
    
    // Return success with updated limits
    res.json({
        success: true,
        data: {
            spinId: spin._id.toString(),
            hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0) - 1,
            dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0) - 1,
        },
    });
});

// Create pending prize (for anonymous users who won)
export const createPendingPrize = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fingerprint, result, amount, description } = req.body;
    const ipAddress = getClientIp(req);
    
    if (!fingerprint || !result || !amount || !description) {
        res.status(400).json({
            success: false,
            error: 'Missing required fields',
        });
        return;
    }
    
    // Create a temporary spin record for this pending prize
    const spin = await Spin.create({
        fingerprint,
        ipAddress,
        result,
        prizeAmount: amount,
        prizeAwarded: false,
        claimed: false,
    });
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SPIN_CONFIG.PENDING_PRIZE_EXPIRY_HOURS);
    
    const pendingPrize = await PendingPrize.create({
        fingerprint,
        ipAddress,
        spinId: spin._id,
        result,
        amount,
        description,
        expiresAt,
        claimed: false,
        expired: false,
    });
    
    await createAuditLog({
        action: 'prize_won',
        fingerprint,
        ipAddress,
        severity: result === 'jackpot' ? 'critical' : 'info',
        details: {
            result,
            amount,
            requiresAuth: true,
            pendingPrizeId: pendingPrize._id,
        },
    });
    
    res.json({
        success: true,
        data: {
            pendingPrizeId: pendingPrize._id.toString(),
        },
    });
});

// Get spin statistics
export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const fingerprint = req.query.fingerprint as string;
    
    if (!fingerprint) {
        res.status(400).json({
            success: false,
            error: 'Fingerprint is required',
        });
        return;
    }
    
    const rateLimitCheck = await checkRateLimits(fingerprint, '');
    
    res.json({
        success: true,
        data: {
            hourlyCount: rateLimitCheck.hourlyCount || 0,
            dailyCount: rateLimitCheck.dailyCount || 0,
            hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0),
            dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0),
            canSpin: rateLimitCheck.allowed,
        },
    });
});

// Get pending prizes
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

// Get configuration
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

// ADMIN: Get all spins
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
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);
    
    const rateLimitHits = await AuditLog.find({
        action: 'rate_limit_hit',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
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
        result: { $nin: ['no_win', 'pending'] },
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