import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler } from '../utils';

const JWT_SECRET = process.env.JWT_SECRET || "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
const JWT_EXPIRES_IN = '30d'; // Hard-coded string to avoid type issues

// Helper function to create JWT token
const createToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { id: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password',
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

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'user',
  });

  const token = createToken(user._id.toString(), user.email, user.role);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
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
        role: user.role,
      },
      token,
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
        role: user.role,
      },
      token,
    },
  });
});

export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id);
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
        role: user.role,
      },
    },
  });
});