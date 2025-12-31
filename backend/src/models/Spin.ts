import mongoose, { Schema, Document } from 'mongoose';

export interface ISpin extends Document {
    user?: mongoose.Types.ObjectId;
    fingerprint: string;
    ipAddress: string;
    sessionId?: string;
    result: 'no_win' | 'small_cash' | 'medium_cash' | 'large_cash' | 'bonus' | 'jackpot';
    prizeAmount?: number;
    prizeAwarded: boolean;
    prizeId?: mongoose.Types.ObjectId;
    claimed: boolean;
    claimedAt?: Date;
    metadata?: {
        userAgent?: string;
        country?: string;
        city?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const SpinSchema = new Schema<ISpin>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
            index: true,
        },
        fingerprint: {
            type: String,
            required: true,
            index: true,
        },
        ipAddress: {
            type: String,
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: false,
        },
        result: {
            type: String,
            enum: ['no_win', 'small_cash', 'medium_cash', 'large_cash', 'bonus', 'jackpot'],
            required: true,
        },
        prizeAmount: {
            type: Number,
            required: false,
        },
        prizeAwarded: {
            type: Boolean,
            default: false,
        },
        prizeId: {
            type: Schema.Types.ObjectId,
            ref: 'Prize',
            required: false,
        },
        claimed: {
            type: Boolean,
            default: false,
        },
        claimedAt: {
            type: Date,
            required: false,
        },
        metadata: {
            userAgent: String,
            country: String,
            city: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
SpinSchema.index({ fingerprint: 1, createdAt: -1 });
SpinSchema.index({ ipAddress: 1, createdAt: -1 });
SpinSchema.index({ user: 1, createdAt: -1 });
SpinSchema.index({ claimed: 1, prizeAwarded: 1 });
SpinSchema.index({ createdAt: -1 });

export const Spin = mongoose.model<ISpin>('Spin', SpinSchema);