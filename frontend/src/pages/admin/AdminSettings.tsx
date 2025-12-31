import { useState } from 'react';
import { Save, Globe, Lock, Bell, Mail } from 'lucide-react';

const AdminSettings = () => {
    const [siteName, setSiteName] = useState('GambleBible');
    const [siteDescription, setSiteDescription] = useState('Your ultimate guide to gambling strategies and news.');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);

    return (
        <div className="admin-settings">
            <div className="admin-settings-header">
                <h1 className="admin-settings-title">Settings</h1>
                <p className="admin-settings-subtitle">Manage your site configuration and preferences</p>
            </div>

            {/* General Settings */}
            <div className="admin-settings-card">
                <div className="admin-card-header">
                    <div className="admin-card-title-group">
                        <Globe className="admin-card-icon" size={20} />
                        <h2 className="admin-card-title">General Information</h2>
                    </div>
                    <p className="admin-card-description">Basic details about your website</p>
                </div>

                <div className="admin-card-content">
                    <div className="admin-form-group">
                        <label className="admin-form-label">Site Name</label>
                        <input
                            type="text"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            className="admin-form-input"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Site Description</label>
                        <textarea
                            rows={3}
                            value={siteDescription}
                            onChange={(e) => setSiteDescription(e.target.value)}
                            className="admin-form-textarea"
                        />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="admin-settings-card">
                <div className="admin-card-header">
                    <div className="admin-card-title-group">
                        <Bell className="admin-card-icon" size={20} />
                        <h2 className="admin-card-title">Notifications</h2>
                    </div>
                    <p className="admin-card-description">Manage how you receive updates</p>
                </div>

                <div className="admin-card-content">
                    <div className="admin-setting-item">
                        <div className="admin-setting-info">
                            <div className="admin-setting-icon">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="admin-setting-title">Email Notifications</p>
                                <p className="admin-setting-description">Receive daily summaries of blog activity</p>
                            </div>
                        </div>
                        <label className="admin-toggle">
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                className="admin-toggle-input"
                            />
                            <div className="admin-toggle-slider"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="admin-settings-card">
                <div className="admin-card-header">
                    <div className="admin-card-title-group">
                        <Lock className="admin-card-icon" size={20} />
                        <h2 className="admin-card-title">Privacy & Security</h2>
                    </div>
                    <p className="admin-card-description">Control visibility and security settings</p>
                </div>

                <div className="admin-card-content">
                    <div className="admin-setting-item">
                        <div>
                            <p className="admin-setting-title">Public Profile</p>
                            <p className="admin-setting-description">Allow search engines to index your profile</p>
                        </div>
                        <label className="admin-toggle">
                            <input
                                type="checkbox"
                                checked={publicProfile}
                                onChange={(e) => setPublicProfile(e.target.checked)}
                                className="admin-toggle-input"
                            />
                            <div className="admin-toggle-slider"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="admin-settings-actions">
                <button className="admin-save-btn">
                    <Save size={20} />
                    <span>Save Changes</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
