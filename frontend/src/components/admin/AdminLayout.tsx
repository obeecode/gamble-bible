import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Settings,
    Menu,
    LogOut,
    ChevronLeft,
    ChevronRight,
    FolderTree,
    Gift
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (user.role !== 'admin') {
                navigate('/');
            }
        }
    }, [user, loading, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Blogs', href: '/admin/blogs', icon: FileText },
        { name: 'Categories', href: '/admin/categories', icon: FolderTree },
        { name: 'Prizes', href: '/admin/prizes', icon: Gift }, // NEW: Prize Management
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    if (loading || !user || user.role !== 'admin') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'} ${isSidebarCollapsed ? 'admin-sidebar-collapsed' : ''}`}>
                <div className="admin-sidebar-content">
                    {/* Logo */}
                    <div className="admin-sidebar-header">
                        {!isSidebarCollapsed && (
                            <Link to="/" className="admin-sidebar-logo">
                                GambleBible
                            </Link>
                        )}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="admin-sidebar-toggle"
                            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="admin-sidebar-nav">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`admin-nav-item ${isActive ? 'admin-nav-item-active' : 'admin-nav-item-inactive'}`}
                                    title={isSidebarCollapsed ? item.name : ''}
                                >
                                    <item.icon size={20} />
                                    {!isSidebarCollapsed && <span className="admin-nav-text">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    {!isSidebarCollapsed && (
                        <div className="admin-sidebar-footer">
                            <div className="admin-user-profile">
                                <div className="admin-user-avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="admin-user-info">
                                    <p className="admin-user-name">{user.name}</p>
                                    <p className="admin-user-email">{user.email}</p>
                                </div>
                                <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                {/* Mobile Menu Button */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="admin-mobile-menu-btn"
                    >
                        <Menu size={24} />
                    </button>
                )}

                {/* Page Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;