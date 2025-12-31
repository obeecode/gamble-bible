import { Response } from 'express';
import { Prize } from '../models/Prize';
import { User } from '../models/User';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from './notificationController';
import { sendPrizeClaimReceivedEmail, sendPrizePaymentConfirmationEmail } from '../utils/emailService';

// Generate unique reference number
const generateReferenceNumber = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PRIZE-${timestamp}-${randomStr}`;
};

export const createPrize = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, amount, description } = req.body;
    const userId = req.user!.id;

    if (!type || !amount || !description) {
        res.status(400).json({
            success: false,
            error: 'Type, amount, and description are required',
        });
        return;
    }

    // Generate unique reference number
    const referenceNumber = generateReferenceNumber();

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const prize = await Prize.create({
        user: userId,
        type,
        amount,
        description,
        referenceNumber,
        expiresAt,
        status: 'unclaimed',
    });

    // Create notification for the user
    await createNotification({
        user: userId,
        type: 'welcome',
        title: '🎉 Prize Won!',
        message: `Congratulations! You won ${description}! Reference: ${referenceNumber}`,
        link: '/prizes',
    });

    res.status(201).json({
        success: true,
        data: { prize },
    });
});

export const getUserPrizes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = { user: userId };
    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const prizes = await Prize.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await Prize.countDocuments(query);

    res.json({
        success: true,
        data: {
            prizes,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        },
    });
});

// NEW: Submit payment information and claim prize
export const claimPrize = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { fullName, paymentMethod, accountNumber, bankName } = req.body;
    const userId = req.user!.id;

    // Validate payment information
    if (!fullName || !paymentMethod || !accountNumber || !bankName) {
        res.status(400).json({
            success: false,
            error: 'All payment information fields are required',
        });
        return;
    }

    // Validate payment method
    const validPaymentMethods = ['bank_transfer', 'opay', 'palmpay', 'paypal'];
    if (!validPaymentMethods.includes(paymentMethod)) {
        res.status(400).json({
            success: false,
            error: 'Invalid payment method',
        });
        return;
    }

    const prize = await Prize.findOne({ _id: id, user: userId });

    if (!prize) {
        res.status(404).json({
            success: false,
            error: 'Prize not found',
        });
        return;
    }

    if (prize.status === 'processing') {
        res.status(400).json({
            success: false,
            error: 'Prize claim is already being processed',
        });
        return;
    }

    if (prize.status === 'paid') {
        res.status(400).json({
            success: false,
            error: 'Prize has already been paid',
        });
        return;
    }

    if (prize.status === 'expired') {
        res.status(400).json({
            success: false,
            error: 'Prize has expired',
        });
        return;
    }

    if (prize.expiresAt && new Date() > prize.expiresAt) {
        prize.status = 'expired';
        await prize.save();
        
        res.status(400).json({
            success: false,
            error: 'Prize has expired',
        });
        return;
    }

    // Update prize with payment information and change status to processing
    prize.paymentInfo = {
        fullName,
        paymentMethod,
        accountNumber,
        bankName,
        submittedAt: new Date(),
    };
    prize.status = 'processing';
    prize.claimedAt = new Date();
    await prize.save();

    // Get user information for email
    const user = await User.findById(userId);
    
    // Send confirmation email to user
    if (user) {
        try {
            await sendPrizeClaimReceivedEmail(
                user.email,
                user.name,
                prize.description,
                prize.amount,
                prize.referenceNumber
            );
        } catch (error) {
            console.error('Failed to send claim confirmation email:', error);
            // Don't fail the request if email fails
        }
    }

    // Create notification for the user
    await createNotification({
        user: userId,
        type: 'system',
        title: '⏳ Prize Claim Submitted',
        message: `Your prize claim for ${prize.description} has been submitted and is being processed. Check your email for confirmation!`,
        link: '/prizes',
    });

    res.json({
        success: true,
        message: 'Prize claim submitted successfully. Check your email for confirmation!',
        data: { prize },
    });
});

// NEW: Mark prize as paid (Admin only)
export const markPrizeAsPaid = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if user is admin
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can mark prizes as paid',
        });
        return;
    }

    const prize = await Prize.findById(id).populate('user', 'name email');

    if (!prize) {
        res.status(404).json({
            success: false,
            error: 'Prize not found',
        });
        return;
    }

    if (prize.status !== 'processing') {
        res.status(400).json({
            success: false,
            error: 'Only processing prizes can be marked as paid',
        });
        return;
    }

    if (!prize.paymentInfo) {
        res.status(400).json({
            success: false,
            error: 'Prize does not have payment information',
        });
        return;
    }

    prize.status = 'paid';
    prize.paidAt = new Date();
    await prize.save();

    // Get user information
    const user = prize.user as any;

    // Send payment confirmation email
    if (user && user.email) {
        try {
            await sendPrizePaymentConfirmationEmail(
                user.email,
                user.name,
                prize.description,
                prize.amount,
                prize.referenceNumber,
                prize.paymentInfo.paymentMethod,
                prize.paymentInfo.accountNumber
            );
        } catch (error) {
            console.error('Failed to send payment confirmation email:', error);
            // Don't fail the request if email fails
        }
    }

    // Notify the user that their prize has been paid
    await createNotification({
        user: prize.user as any,
        type: 'system',
        title: '✅ Prize Payment Sent!',
        message: `Your prize ${prize.description} has been paid! Check your ${prize.paymentInfo.paymentMethod} account. Check your email for details.`,
        link: '/prizes',
    });

    res.json({
        success: true,
        message: 'Prize marked as paid and user notified',
        data: { prize },
    });
});

// Get all prizes for admin (with payment info visible)
export const getAllPrizes = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Only admins can view all prizes',
        });
        return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const prizes = await Prize.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await Prize.countDocuments(query);

    res.json({
        success: true,
        data: {
            prizes,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        },
    });
});

// Cron job or scheduled task to expire prizes
export const expirePrizes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const now = new Date();
    
    // Find all unclaimed and processing prizes that have passed their expiration date
    const expiredPrizes = await Prize.updateMany(
        {
            status: { $in: ['unclaimed', 'processing'] },
            expiresAt: { $lt: now }
        },
        {
            status: 'expired'
        }
    );

    res.json({
        success: true,
        message: `${expiredPrizes.modifiedCount} prizes expired`,
        data: { count: expiredPrizes.modifiedCount },
    });
});