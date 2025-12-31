import { useState, useEffect } from 'react';
import { Bell, Menu, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../services/api';
import NotificationPanel from './NotificationPanel';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
    if (user) {
        fetchUnreadCount();
    }

    const handleNotificationUpdate = () => {
        if (user) fetchUnreadCount();
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    return () => {
        window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
}, [user]);

    const fetchUnreadCount = async () => {
    if (!user) return; // Don't fetch if not logged in
    
    try {
        const response = await notificationAPI.getUnreadCount();
        if (response.success) {
            setUnreadCount(response.data.count);
        }
    } catch (error) {
        // Silently fail - user might have been logged out
        setUnreadCount(0);
    }
};

    const navItems = [
    { name: 'Reviews', path: '/reviews' },
    { name: 'Casinos', path: '/casino-reviews' },
    { name: 'Bookmakers', path: '/reviews' }, // Will use reviews page for now
    { name: 'Bonuses', path: '/reviews' },
    { name: 'News', path: '/reviews' },
    { name: 'GB Awards', path: '/reviews' },
    { name: 'Tools', path: '/reviews' },
    { name: 'Guides', path: '/reviews' },
    { name: 'Complaints', path: '/reviews' },
    { name: 'Forum', path: '/reviews' },
];

    const handleNotificationClick = () => {
        if (user) {
            setIsNotificationOpen(!isNotificationOpen);
        }
    };

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">

                    <div className="header-logo">
                        <Link to="/">
                            <img src="/logo.png" className="header-logo-icon" />
                            <img src="/Gamble Bible.png" className="header-logo-text" />
                        </Link>
                    </div>


                    <nav className="header-nav-desktop">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="nav-link"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="header-actions-desktop">
    <div className="notification-wrapper">
        <button
            className="notification-btn"
            onClick={handleNotificationClick}
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="notification-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
        <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onUnreadCountChange={setUnreadCount}
        />
    </div>

    {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to={user.role === 'admin' ? '/admin' : '/'} className="login-btn">
                <User size={18} />
                <span>{user.name}</span>
            </Link>
        </div>
    ) : (
        <Link to="/login" className="login-btn">
            <User size={18} />
            <span>Login</span>
        </Link>
    )}
</div>

                    <div className="header-actions-mobile">
                        <div className="notification-wrapper">
                            <button
                                className="notification-btn"
                                onClick={handleNotificationClick}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="notification-badge">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <NotificationPanel
                                isOpen={isNotificationOpen}
                                onClose={() => setIsNotificationOpen(false)}
                                onUnreadCountChange={setUnreadCount}
                            />
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="mobile-menu-btn"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>
            {isMenuOpen && (
                <div className="mobile-menu">
                    <div className="mobile-menu-content">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="mobile-nav-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="mobile-menu-divider">
                            {user ? (
                                <div className="mobile-user-info">
                                    <User size={18} />
                                    <span>{user.name}</span>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="mobile-login-btn"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User size={18} />
                                    <span>Login</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;

