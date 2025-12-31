import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentInfo {
    fullName: string;
    paymentMethod: 'bank_transfer' | 'opay' | 'palmpay' | 'paypal';
    accountNumber: string;
    bankName: string;
    submittedAt: Date;
}

export interface IPrize extends Document {
    user: mongoose.Types.ObjectId;
    type: 'cash' | 'bonus' | 'points';
    amount: number;
    description: string;
    referenceNumber: string;
    status: 'unclaimed' | 'processing' | 'paid' | 'expired';  // ✅ NEW - has 'processing' and 'paid'
    paymentInfo?: IPaymentInfo;  // ✅ NEW
    expiresAt?: Date;
    claimedAt?: Date;
    paidAt?: Date;  // ✅ NEW
    createdAt: Date;
    updatedAt: Date;
}

const PaymentInfoSchema = new Schema<IPaymentInfo>({
    fullName: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'opay', 'palmpay', 'paypal'],
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
    },
    bankName: {
        type: String,
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const PrizeSchema = new Schema<IPrize>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['cash', 'bonus', 'points'],
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
        referenceNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['unclaimed', 'processing', 'paid', 'expired'],  // ✅ NEW ENUM
            default: 'unclaimed',
        },
        paymentInfo: {  // ✅ NEW FIELD
            type: PaymentInfoSchema,
            required: false,
        },
        expiresAt: {
            type: Date,
        },
        claimedAt: {
            type: Date,
        },
        paidAt: {  // ✅ NEW FIELD
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
PrizeSchema.index({ user: 1, status: 1, createdAt: -1 });

export const Prize = mongoose.model<IPrize>('Prize', PrizeSchema);