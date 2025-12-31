import { Users, FileText, Eye, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
    const stats = [
        { label: 'Total Blogs', value: '124', change: '+12%', icon: FileText, color: 'admin-stat-blue', bg: 'admin-stat-bg-blue' },
        { label: 'Total Views', value: '45.2k', change: '+8.5%', icon: Eye, color: 'admin-stat-purple', bg: 'admin-stat-bg-purple' },
        { label: 'Active Users', value: '1,203', change: '+24%', icon: Users, color: 'admin-stat-green', bg: 'admin-stat-bg-green' },
        { label: 'Engagement', value: '8.4%', change: '+2.1%', icon: TrendingUp, color: 'admin-stat-orange', bg: 'admin-stat-bg-orange' },
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-header">
                <h1 className="admin-dashboard-title">Dashboard Overview</h1>
                <p className="admin-dashboard-subtitle">Welcome back, here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="admin-stat-card">
                        <div className="admin-stat-header">
                            <div className="admin-stat-info">
                                <p className="admin-stat-label">{stat.label}</p>
                                <h3 className="admin-stat-value">{stat.value}</h3>
                            </div>
                            <div className={`admin-stat-icon ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="admin-stat-change">
                            <span className="admin-stat-change-positive">{stat.change}</span>
                            <span className="admin-stat-change-text">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="admin-activity-card">
                <h2 className="admin-activity-title">Recent Activity</h2>
                <div className="admin-activity-list">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="admin-activity-item">
                            <div className="admin-activity-icon">
                                <FileText size={18} />
                            </div>
                            <div className="admin-activity-content">
                                <p className="admin-activity-title">New blog post published</p>
                                <p className="admin-activity-description">"Top 10 Poker Strategies" was published by Admin</p>
                            </div>
                            <span className="admin-activity-time">2h ago</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
