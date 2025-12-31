import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.post('/', authenticate, authorizeAdmin, createCategory);
router.put('/:id', authenticate, authorizeAdmin, updateCategory);
router.delete('/:id', authenticate, authorizeAdmin, deleteCategory);

export const categoryRouter = router;
