import { Router } from 'express';
import {
    createComment,
    getCommentsByBlog,
    getCommentById,
    updateComment,
    deleteComment,
    getReplies,
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/blog/:blogId', getCommentsByBlog);
router.post('/blog/:blogId', authenticate, createComment);
router.get('/:commentId/replies', getReplies);
router.get('/:id', getCommentById);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export const commentRouter = router;

