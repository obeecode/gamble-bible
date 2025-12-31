import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingPrize extends Document {
    fingerprint: string;
    ipAddress: string;
    spinId: mongoose.Types.ObjectId;
    result: 'small_cash' | 'medium_cash' | 'large_cash' | 'bonus' | 'jackpot';
    amount: number;
    description: string;
    expiresAt: Date;
    claimed: boolean;
    claimedBy?: mongoose.Types.ObjectId;
    claimedAt?: Date;
    expired: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PendingPrizeSchema = new Schema<IPendingPrize>(
    {
        fingerprint: {
            type: String,
            required: true,
            index: true,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        spinId: {
            type: Schema.Types.ObjectId,
            ref: 'Spin',
            required: true,
        },
        result: {
            type: String,
            enum: ['small_cash', 'medium_cash', 'large_cash', 'bonus', 'jackpot'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        claimed: {
            type: Boolean,
            default: false,
            index: true,
        },
        claimedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        claimedAt: {
            type: Date,
            required: false,
        },
        expired: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
PendingPrizeSchema.index({ fingerprint: 1, claimed: 1, expired: 1 });
PendingPrizeSchema.index({ expiresAt: 1, expired: 1 });
PendingPrizeSchema.index({ createdAt: -1 });

export const PendingPrize = mongoose.model<IPendingPrize>('PendingPrize', PendingPrizeSchema);