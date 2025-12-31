import { Spin } from '../models/Spin';
import { PendingPrize } from '../models/PendingPrize';
import { Prize } from '../models/Prize';
import { User } from '../models/User';
import { createAuditLog } from '../models/AuditLog';
import SPIN_CONFIG from '../config/spinConfig';

// Helper to get random prize based on probabilities
const getRandomPrize = (): { result: string; amount?: number; description: string } => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [prize, probability] of Object.entries(SPIN_CONFIG.PRIZE_PROBABILITIES)) {
        cumulative += probability;
        if (random <= cumulative) {
            if (prize === 'no_win') {
                return { result: 'no_win', description: 'Better luck next time!' };
            }
            
            // Calculate random amount within range
            const range = SPIN_CONFIG.PRIZE_AMOUNTS[prize as keyof typeof SPIN_CONFIG.PRIZE_AMOUNTS];
            if (!range) {
                return { result: 'no_win', description: 'Better luck next time!' };
            }
            
            const amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            
            let description = '';
            switch (prize) {
                case 'small_cash':
                    description = `$${amount} Cash Prize`;
                    break;
                case 'medium_cash':
                    description = `$${amount} Cash Prize`;
                    break;
                case 'large_cash':
                    description = `$${amount} Cash Prize`;
                    break;
                case 'jackpot':
                    description = `🎰 JACKPOT - $${amount}!`;
                    break;
                case 'bonus':
                    description = `${amount} Bonus Spins`;
                    break;
            }
            
            return { result: prize, amount, description };
        }
    }
    
    return { result: 'no_win', description: 'Better luck next time!' };
};

// Check if fingerprint has exceeded rate limits
export const checkRateLimits = async (fingerprint: string, ipAddress: string): Promise<{
    allowed: boolean;
    reason?: string;
    hourlyCount?: number;
    dailyCount?: number;
}> => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check hourly limit
    const hourlyCount = await Spin.countDocuments({
        fingerprint,
        createdAt: { $gte: oneHourAgo },
    });
    
    if (hourlyCount >= SPIN_CONFIG.HOURLY_SPIN_LIMIT) {
        await createAuditLog({
            action: 'rate_limit_hit',
            fingerprint,
            ipAddress,
            severity: 'warning',
            details: {
                limit: 'hourly',
                count: hourlyCount,
                max: SPIN_CONFIG.HOURLY_SPIN_LIMIT,
            },
        });
        
        return {
            allowed: false,
            reason: `Hourly limit reached. You can spin again in ${60 - Math.floor((now.getTime() - oneHourAgo.getTime()) / 60000)} minutes.`,
            hourlyCount,
        };
    }
    
    // Check daily limit
    const dailyCount = await Spin.countDocuments({
        fingerprint,
        createdAt: { $gte: oneDayAgo },
    });
    
    if (dailyCount >= SPIN_CONFIG.DAILY_SPIN_LIMIT) {
        await createAuditLog({
            action: 'rate_limit_hit',
            fingerprint,
            ipAddress,
            severity: 'warning',
            details: {
                limit: 'daily',
                count: dailyCount,
                max: SPIN_CONFIG.DAILY_SPIN_LIMIT,
            },
        });
        
        return {
            allowed: false,
            reason: 'Daily limit reached. Come back tomorrow for more spins!',
            dailyCount,
        };
    }
    
    // Check IP-based limit (broader protection)
    const ipDailyCount = await Spin.countDocuments({
        ipAddress,
        createdAt: { $gte: oneDayAgo },
    });
    
    if (ipDailyCount >= SPIN_CONFIG.MAX_SPINS_PER_IP_DAILY) {
        await createAuditLog({
            action: 'rate_limit_hit',
            fingerprint,
            ipAddress,
            severity: 'error',
            details: {
                limit: 'ip_daily',
                count: ipDailyCount,
                max: SPIN_CONFIG.MAX_SPINS_PER_IP_DAILY,
            },
        });
        
        return {
            allowed: false,
            reason: 'Too many spins from this network. Please try again tomorrow.',
        };
    }
    
    return {
        allowed: true,
        hourlyCount,
        dailyCount,
    };
};

// Check for suspicious activity
export const checkSuspiciousActivity = async (fingerprint: string, ipAddress: string): Promise<{
    suspicious: boolean;
    reason?: string;
}> => {
    // Check number of accounts created from this fingerprint
    const accountCount = await User.countDocuments({
        'metadata.fingerprint': fingerprint,
    });
    
    if (accountCount > SPIN_CONFIG.MAX_ACCOUNTS_PER_FINGERPRINT) {
        await createAuditLog({
            action: 'suspicious_activity',
            fingerprint,
            ipAddress,
            severity: 'critical',
            details: {
                reason: 'too_many_accounts',
                accountCount,
                max: SPIN_CONFIG.MAX_ACCOUNTS_PER_FINGERPRINT,
            },
        });
        
        return {
            suspicious: true,
            reason: 'Multiple accounts detected from this device.',
        };
    }
    
    // Check for rapid-fire spins (potential bot)
    const recentSpins = await Spin.find({
        fingerprint,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // Last minute
    }).sort({ createdAt: -1 }).limit(5);
    
    if (recentSpins.length >= 5) {
        // Check if all spins were within 10 seconds
        const timeDiff = recentSpins[0].createdAt.getTime() - recentSpins[4].createdAt.getTime();
        if (timeDiff < 10000) {
            await createAuditLog({
                action: 'suspicious_activity',
                fingerprint,
                ipAddress,
                severity: 'error',
                details: {
                    reason: 'rapid_fire_spins',
                    count: 5,
                    duration: timeDiff,
                },
            });
            
            return {
                suspicious: true,
                reason: 'Suspicious activity detected. Please slow down.',
            };
        }
    }
    
    return { suspicious: false };
};

// Main spin function
export const performSpin = async (
    fingerprint: string,
    ipAddress: string,
    userId?: string,
    metadata?: any
): Promise<{
    success: boolean;
    result?: string;
    amount?: number;
    description?: string;
    prizeId?: string;
    pendingPrizeId?: string;
    message?: string;
    requiresAuth?: boolean;
    hourlyRemaining?: number;
    dailyRemaining?: number;
}> => {
    try {
        // Check rate limits
        const rateLimitCheck = await checkRateLimits(fingerprint, ipAddress);
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                message: rateLimitCheck.reason,
                hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0),
                dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0),
            };
        }
        
        // Check for suspicious activity
        const suspiciousCheck = await checkSuspiciousActivity(fingerprint, ipAddress);
        if (suspiciousCheck.suspicious) {
            return {
                success: false,
                message: suspiciousCheck.reason,
            };
        }
        
        // Get random prize
        const prizeResult = getRandomPrize();
        
        // Create spin record
        const spin = await Spin.create({
            user: userId || undefined,
            fingerprint,
            ipAddress,
            result: prizeResult.result,
            prizeAmount: prizeResult.amount,
            prizeAwarded: false,
            claimed: false,
            metadata,
        });
        
        // Log spin
        await createAuditLog({
            action: 'spin',
            user: userId || undefined,
            spin: spin._id,
            fingerprint,
            ipAddress,
            severity: 'info',
            details: {
                result: prizeResult.result,
                amount: prizeResult.amount,
            },
        });
        
        // If no win, return immediately
        if (prizeResult.result === 'no_win') {
            return {
                success: true,
                result: prizeResult.result,
                description: prizeResult.description,
                hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0) - 1,
                dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0) - 1,
            };
        }
        
        // If user is logged in, award prize immediately
        if (userId) {
            const prize = await awardPrize(userId, prizeResult.result, prizeResult.amount!, prizeResult.description);
            
            // Update spin record
            spin.prizeAwarded = true;
            spin.prizeId = prize._id;
            spin.claimed = true;
            spin.claimedAt = new Date();
            await spin.save();
            
            return {
                success: true,
                result: prizeResult.result,
                amount: prizeResult.amount,
                description: prizeResult.description,
                prizeId: prize._id.toString(),
                requiresAuth: false,
                hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0) - 1,
                dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0) - 1,
            };
        }
        
        // If user is not logged in, create pending prize
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + SPIN_CONFIG.PENDING_PRIZE_EXPIRY_HOURS);
        
        const pendingPrize = await PendingPrize.create({
            fingerprint,
            ipAddress,
            spinId: spin._id,
            result: prizeResult.result,
            amount: prizeResult.amount,
            description: prizeResult.description,
            expiresAt,
            claimed: false,
            expired: false,
        });
        
        // Log prize won
        await createAuditLog({
            action: 'prize_won',
            spin: spin._id,
            fingerprint,
            ipAddress,
            severity: prizeResult.result === 'jackpot' ? 'critical' : 'info',
            details: {
                result: prizeResult.result,
                amount: prizeResult.amount,
                requiresAuth: true,
            },
        });
        
        return {
            success: true,
            result: prizeResult.result,
            amount: prizeResult.amount,
            description: prizeResult.description,
            pendingPrizeId: pendingPrize._id.toString(),
            requiresAuth: true,
            message: 'Register or login to claim your prize!',
            hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0) - 1,
            dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0) - 1,
        };
        
    } catch (error) {
        console.error('Spin error:', error);
        await createAuditLog({
            action: 'spin',
            fingerprint,
            ipAddress,
            severity: 'error',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        });
        
        return {
            success: false,
            message: 'An error occurred. Please try again.',
        };
    }
};

// Award prize to user
export const awardPrize = async (
    userId: string,
    type: string,
    amount: number,
    description: string
): Promise<any> => {
    const referenceNumber = `SPIN-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const prize = await Prize.create({
        user: userId,
        type: 'cash',
        amount,
        description,
        referenceNumber,
        expiresAt,
        status: 'unclaimed',
    });
    
    await createAuditLog({
        action: 'prize_won',
        user: userId,
        prize: prize._id,
        severity: type === 'jackpot' ? 'critical' : 'info',
        details: {
            type,
            amount,
            description,
        },
    });
    
    return prize;
};

// Claim pending prize after registration/login
export const claimPendingPrizes = async (userId: string, fingerprint: string): Promise<{
    success: boolean;
    prizes?: any[];
    message?: string;
}> => {
    try {
        // Find all unclaimed, non-expired pending prizes for this fingerprint
        const pendingPrizes = await PendingPrize.find({
            fingerprint,
            claimed: false,
            expired: false,
            expiresAt: { $gte: new Date() },
        });
        
        if (pendingPrizes.length === 0) {
            return {
                success: true,
                prizes: [],
                message: 'No pending prizes to claim.',
            };
        }
        
        const awardedPrizes = [];
        
        for (const pendingPrize of pendingPrizes) {
            // Award the prize
            const prize = await awardPrize(
                userId,
                pendingPrize.result,
                pendingPrize.amount,
                pendingPrize.description
            );
            
            // Update pending prize
            pendingPrize.claimed = true;
            pendingPrize.claimedBy = userId as any;
            pendingPrize.claimedAt = new Date();
            await pendingPrize.save();
            
            // Update spin record
            await Spin.findByIdAndUpdate(pendingPrize.spinId, {
                user: userId,
                prizeAwarded: true,
                prizeId: prize._id,
                claimed: true,
                claimedAt: new Date(),
            });
            
            awardedPrizes.push(prize);
            
            await createAuditLog({
                action: 'prize_claimed',
                user: userId,
                prize: prize._id,
                fingerprint,
                severity: 'info',
                details: {
                    pendingPrizeId: pendingPrize._id,
                    amount: pendingPrize.amount,
                },
            });
        }
        
        return {
            success: true,
            prizes: awardedPrizes,
            message: `Successfully claimed ${awardedPrizes.length} prize(s)!`,
        };
        
    } catch (error) {
        console.error('Error claiming pending prizes:', error);
        return {
            success: false,
            message: 'Failed to claim prizes.',
        };
    }
};

// Get spin statistics for a fingerprint
export const getSpinStats = async (fingerprint: string): Promise<{
    hourlyCount: number;
    dailyCount: number;
    hourlyRemaining: number;
    dailyRemaining: number;
    canSpin: boolean;
    nextSpinAvailable?: Date;
}> => {
    const rateLimitCheck = await checkRateLimits(fingerprint, '');
    
    return {
        hourlyCount: rateLimitCheck.hourlyCount || 0,
        dailyCount: rateLimitCheck.dailyCount || 0,
        hourlyRemaining: SPIN_CONFIG.HOURLY_SPIN_LIMIT - (rateLimitCheck.hourlyCount || 0),
        dailyRemaining: SPIN_CONFIG.DAILY_SPIN_LIMIT - (rateLimitCheck.dailyCount || 0),
        canSpin: rateLimitCheck.allowed,
    };
};