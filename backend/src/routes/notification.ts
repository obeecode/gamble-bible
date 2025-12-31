import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotificationHandler,
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get all notifications for the user
router.get('/', getNotifications);

// Create a notification
router.post('/', createNotificationHandler);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark a single notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

export const notificationRouter = router;
