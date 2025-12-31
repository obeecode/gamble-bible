import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    metadata?: {
        fingerprint?: string;
        lastIp?: string;
        registrationIp?: string;
        registrationFingerprint?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        metadata: {
            fingerprint: String,
            lastIp: String,
            registrationIp: String,
            registrationFingerprint: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fingerprint queries
UserSchema.index({ 'metadata.fingerprint': 1 });
UserSchema.index({ 'metadata.registrationFingerprint': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);