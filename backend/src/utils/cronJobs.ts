import cron from 'node-cron';
import { PendingPrize } from '../models/PendingPrize';
import { createAuditLog } from '../models/AuditLog';

// Expire pending prizes that have passed their expiry date
export const expirePendingPrizes = async () => {
    try {
        const now = new Date();
        
        const result = await PendingPrize.updateMany(
            {
                expired: false,
                claimed: false,
                expiresAt: { $lt: now },
            },
            {
                $set: { expired: true },
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ Expired ${result.modifiedCount} pending prizes`);
            
            await createAuditLog({
                action: 'prize_expired',
                severity: 'info',
                details: {
                    count: result.modifiedCount,
                    reason: 'automatic_expiration',
                },
            });
        }
        
        return result.modifiedCount;
    } catch (error) {
        console.error('Error expiring pending prizes:', error);
        return 0;
    }
};

// Start cron jobs
export const startCronJobs = () => {
    // Run every hour to expire pending prizes
    cron.schedule('0 * * * *', async () => {
        console.log('🕒 Running pending prize expiration check...');
        await expirePendingPrizes();
    });
    
    console.log('✅ Cron jobs started');
    console.log('   - Pending prize expiration: Every hour');
};

// You can also call this manually via an endpoint if needed
export const manualExpirePendingPrizes = expirePendingPrizes;