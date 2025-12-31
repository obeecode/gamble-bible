import { Response } from 'express';
import { asyncHandler } from '../utils';
import { AuthRequest } from '../middleware/auth';

export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
    return;
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      imageUrl,
      filename: req.file.filename,
    },
  });
});

export const uploadMultipleImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    res.status(400).json({
      success: false,
      error: 'No files uploaded',
    });
    return;
  }

  const files = Array.isArray(req.files) ? req.files : [req.files];
  const imageUrls = files.map((file) => ({
    imageUrl: `/uploads/${file.filename}`,
    filename: file.filename,
  }));

  res.json({
    success: true,
    data: {
      images: imageUrls,
    },
  });
});

