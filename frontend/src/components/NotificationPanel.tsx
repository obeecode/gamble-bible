import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Reply, Info, Gift, FileText, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

interface Notification {
    _id: string;
    type: 'comment' | 'reply' | 'system' | 'welcome' | 'blog';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange: (count: number) => void;
}

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }

        const handleNotificationUpdate = () => {
            fetchNotifications();
        };

        window.addEventListener('notificationUpdated', handleNotificationUpdate);
        return () => window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationAPI.getNotifications({ limit: 10 });
            if (response.success) {
                setNotifications(response.data.notifications);
                const unreadCount = response.data.notifications.filter((n: Notification) => !n.isRead).length;
                onUnreadCountChange(unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await notificationAPI.markAsRead(notification._id);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                onUnreadCountChange(notifications.filter(n => !n.isRead && n._id !== notification._id).length);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            onUnreadCountChange(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'comment':
                return <MessageSquare size={16} />;
            case 'reply':
                return <Reply size={16} />;
            case 'welcome':
                return <Gift size={16} />;
            case 'blog':
                return <FileText size={16} />;
            default:
                return <Info size={16} />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className="notification-panel" ref={panelRef}>
            <div className="notification-panel-header">
                <h3 className="notification-panel-title">Notifications</h3>
                <div className="notification-panel-actions">
                    {notifications.some(n => !n.isRead) && (
                        <button
                            className="notification-mark-all-btn"
                            onClick={handleMarkAllAsRead}
                            title="Mark all as read"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    <button className="notification-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="notification-panel-content">
                {loading ? (
                    <div className="notification-loading">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <Bell size={32} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map(notification => (
                            <div
                                key={notification._id}
                                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className={`notification-icon ${notification.type}`}>
                                    {getTypeIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <p className="notification-title">{notification.title}</p>
                                    <p className="notification-message">{notification.message}</p>
                                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                                </div>
                                {!notification.isRead && <div className="notification-unread-dot" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
