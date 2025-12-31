import { Router } from 'express';
import { uploadSingle, uploadMultiple } from '../utils/upload';
import { authenticate } from '../middleware/auth';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController';

const router = Router();

router.post('/image', authenticate, uploadSingle, uploadImage);
router.post('/images', authenticate, uploadMultiple, uploadMultipleImages);

export const uploadRouter = router;

