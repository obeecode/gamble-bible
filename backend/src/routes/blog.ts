import { Router } from 'express';
import {
  createBlog,
  getBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from '../controllers/blogController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);
router.post('/', authenticate, createBlog);
router.put('/:id', authenticate, updateBlog);
router.delete('/:id', authenticate, deleteBlog);
router.patch('/:id/publish', authenticate, publishBlog);
router.patch('/:id/unpublish', authenticate, unpublishBlog);

export const blogRouter = router;

