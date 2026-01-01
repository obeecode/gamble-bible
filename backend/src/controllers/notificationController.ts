import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ user: userId });

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const count = await Notification.countDocuments({ user: userId, isRead: false });

        res.json({
            success: true,
            data: { count },
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }

        res.json({
            success: true,
            data: { notification },
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const notification = await Notification.findOneAndDelete({ _id: id, user: userId });

        if (!notification) {
            res.status(404).json({ success: false, error: 'Notification not found' });
            return;
        }

        res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
};

// Create a new notification
export const createNotificationHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { title, message, type, link } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        if (!title || !message || !type) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }

        const notification = await createNotification({
            user: userId,
            type,
            title,
            message,
            link
        });

        if (!notification) {
            res.status(500).json({ success: false, error: 'Failed to create notification' });
            return;
        }

        res.status(201).json({
            success: true,
            data: { notification },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: 'Failed to create notification' });
    }
};

// Update this function in your notificationController.ts

// Helper function to create notifications (for use in other controllers)
export const createNotification = async (data: {
    user: string;
    type: 'comment' | 'reply' | 'system' | 'welcome' | 'blog' | 'prize'; // Added 'prize'
    title: string;
    message: string;
    link?: string;
    data?: any; // Added for additional data like prizeId
}) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};
