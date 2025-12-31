import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    action: 'spin' | 'prize_won' | 'prize_claimed' | 'prize_paid' | 'prize_expired' | 
            'rate_limit_hit' | 'suspicious_activity' | 'account_created' | 'login' |
            'prize_claim_submitted' | 'prize_rejected';
    user?: mongoose.Types.ObjectId;
    targetUser?: mongoose.Types.ObjectId;
    prize?: mongoose.Types.ObjectId;
    spin?: mongoose.Types.ObjectId;
    fingerprint?: string;
    ipAddress?: string;
    details?: any;
    severity: 'info' | 'warning' | 'error' | 'critical';
    adminUser?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
            index: true,
        },
        targetUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        prize: {
            type: Schema.Types.ObjectId,
            ref: 'Prize',
            required: false,
        },
        spin: {
            type: Schema.Types.ObjectId,
            ref: 'Spin',
            required: false,
        },
        fingerprint: {
            type: String,
            required: false,
            index: true,
        },
        ipAddress: {
            type: String,
            required: false,
            index: true,
        },
        details: {
            type: Schema.Types.Mixed,
            required: false,
        },
        severity: {
            type: String,
            enum: ['info', 'warning', 'error', 'critical'],
            default: 'info',
            index: true,
        },
        adminUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ user: 1, action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Helper function to create audit logs
export const createAuditLog = async (data: Partial<IAuditLog>) => {
    try {
        await AuditLog.create(data);
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};