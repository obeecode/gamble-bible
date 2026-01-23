import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    username: string;  // REQUIRED username field
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
        username: {
            type: String,
            required: true,  // NOW REQUIRED
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
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
UserSchema.index({ username: 1 }); // Index for username lookups
UserSchema.index({ email: 1 }); // Index for email lookups

export const User = mongoose.model<IUser>('User', UserSchema);