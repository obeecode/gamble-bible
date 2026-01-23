import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler } from '../utils';
import { claimPendingPrizes } from '../services/spinService';
import { createAuditLog } from '../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// Helper to get client IP
const getClientIp = (req: Request): string => {
  return req.headers['x-forwarded-for']?.toString().split(',')[0] || 
         req.headers['x-real-ip']?.toString() || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
};

const createToken = (id: string, email: string, role: string) => {
  return jwt.sign(
    { id, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, fingerprint, username } = req.body;

  if (!name || !email || !password || !username) {
    res.status(400).json({
      success: false,
      error: 'Please provide name, email, password, and username',
    });
    return;
  }

  // Validate username
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({
      success: false,
      error: 'Username must be between 3 and 20 characters',
    });
    return;
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    res.status(400).json({
      success: false,
      error: 'Username already taken',
    });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({
      success: false,
      error: 'User already exists with this email',
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const ipAddress = getClientIp(req);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    username,
    role: 'user',
    metadata: {
      registrationIp: ipAddress,
      registrationFingerprint: fingerprint || undefined,
      fingerprint: fingerprint || undefined,
      lastIp: ipAddress,
    },
  });

  const token = createToken(user._id.toString(), user.email, user.role);

  // Log registration
  await createAuditLog({
    action: 'account_created',
    user: user._id,
    fingerprint: fingerprint || undefined,
    ipAddress,
    severity: 'info',
    details: {
      name: user.name,
      email: user.email,
      username: user.username,
    },
  });

  // Claim any pending prizes for this fingerprint
  let pendingPrizesResult = null;
  if (fingerprint) {
    pendingPrizesResult = await claimPendingPrizes(user._id.toString(), fingerprint);
  }

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      pendingPrizes: pendingPrizesResult?.prizes || [],
      pendingPrizesMessage: pendingPrizesResult?.message,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fingerprint } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Please provide email/username and password',
    });
    return;
  }

  // Find user by email OR username
  const user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: email } // 'email' field can contain username
    ]
  }).select('+password');

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
    return;
  }

  const ipAddress = getClientIp(req);

  // Update user metadata WITHOUT triggering validation
  if (fingerprint) {
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          'metadata.fingerprint': fingerprint,
          'metadata.lastIp': ipAddress
        } 
      }
    );
  }

  const token = createToken(user._id.toString(), user.email, user.role);

  // Log login
  await createAuditLog({
    action: 'login',
    user: user._id,
    fingerprint: fingerprint || undefined,
    ipAddress,
    severity: 'info',
  });

  // Claim any pending prizes for this fingerprint
  let pendingPrizesResult = null;
  if (fingerprint) {
    pendingPrizesResult = await claimPendingPrizes(user._id.toString(), fingerprint);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      pendingPrizes: pendingPrizesResult?.prizes || [],
      pendingPrizesMessage: pendingPrizesResult?.message,
    },
  });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Please provide email and password',
    });
    return;
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
    return;
  }

  const token = createToken(user._id.toString(), user.email, user.role);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
});