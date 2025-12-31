
import { ArrowUpRight, Twitter, Linkedin, Disc } from 'lucide-react';

const Footer = () => {
    return (
        <div>
            {/* Revolution Section */}
            <div className="footer-revolution-section">
                <div className="footer-revolution-content">
                    <div className="footer-logo-section">
                        <img src="/logo.png" alt="logo" className="footer-logo" />
                    </div>

                    <div className="footer-text-section">
                        <span className="footer-badge">
                            Learn, Connect, and Innovate
                        </span>
                        <h2 className="footer-title">
                            Be Part of the Gambling Revolution
                        </h2>
                        <p className="footer-description">
                            Immerse yourself in the world of future technology. Explore our comprehensive resources, connect with fellow tech enthusiasts innovation in the industry. Join a dynamic community of forward-thinkers.
                        </p>
                    </div>
                </div>

                <div className="footer-cards-grid">
                    {[
                        {
                            title: "Resource Access",
                            desc: "Visitors can access a wide range of resources, including ebooks, whitepapers, reports."
                        },
                        {
                            title: "Community Forum",
                            desc: "Join our active community forum to discuss industry trends, share insights, and collaborate with peers."
                        },
                        {
                            title: "Compnainant",
                            desc: "Stay updated on upcoming tech events, webinars, and conferences to enhance your knowledge."
                        }
                    ].map((card, idx) => (
                        <div key={idx} className="footer-card">
                            <div className="footer-card-header">
                                <h3 className="footer-card-title">{card.title}</h3>
                                <button className="footer-card-button">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-arrow-icon">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                    </svg>
                                </button>
                            </div>
                            <p className="footer-card-desc">
                                {card.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="footer-main">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* Home Column */}
                        <div className="footer-column">
                            <h3 className="footer-column-title">Home</h3>
                            <a href="#" className="footer-link">Features</a>
                            <a href="#" className="footer-link">Blogs</a>
                            <div className="footer-link-with-badge">
                                <a href="#" className="footer-link">Resources</a>
                                <span className="footer-badge-new">New</span>
                            </div>
                            <a href="#" className="footer-link">Testimonials</a>
                            <a href="#" className="footer-link">Contact Us</a>
                            <a href="#" className="footer-link">Newsletter</a>
                        </div>

                        {/* Blogs Column */}
                        <div className="footer-column">
                            <h3 className="footer-column-title">Blogs</h3>
                            <a href="#" className="footer-link">Quantum Computing</a>
                            <a href="#" className="footer-link">AI Ethics</a>
                            <a href="#" className="footer-link">Space Exploration</a>
                            <div className="footer-link-with-badge">
                                <a href="#" className="footer-link">Biotechnology</a>
                                <span className="footer-badge-new">New</span>
                            </div>
                            <a href="#" className="footer-link">Renewable Energy</a>
                            <a href="#" className="footer-link">Biohacking</a>
                        </div>

                        {/* Podcasts Column */}
                        <div className="footer-column">
                            <h3 className="footer-column-title">Podcasts</h3>
                            <a href="#" className="footer-link">AI Revolution</a>
                            <div className="footer-link-with-badge">
                                <a href="#" className="footer-link">AI Revolution</a>
                                <span className="footer-badge-new">New</span>
                            </div>
                            <a href="#" className="footer-link">TechTalk AI</a>
                            <a href="#" className="footer-link">AI Conversations</a>
                        </div>

                        {/* Resources Column */}
                        <div className="footer-column">
                            <h3 className="footer-column-title">Resources</h3>
                            <button className="footer-resource-btn">
                                <span>Whitepapers</span>
                                <ArrowUpRight className="footer-resource-icon" />
                            </button>
                            <button className="footer-resource-btn">
                                <span>Ebooks</span>
                                <ArrowUpRight className="footer-resource-icon" />
                            </button>
                            <button className="footer-resource-btn">
                                <span>Reports</span>
                                <ArrowUpRight className="footer-resource-icon" />
                            </button>
                            <button className="footer-resource-btn">
                                <span>Research Papers</span>
                                <ArrowUpRight className="footer-resource-icon" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="footer-bottom">
                        <div className="footer-legal-links">
                            <a href="#" className="footer-legal-link">Terms & Conditions</a>
                            <span className="footer-divider"></span>
                            <a href="#" className="footer-legal-link">Privacy Policy</a>
                        </div>

                        <div className="footer-social-links">
                            <a href="#" className="footer-social-link">
                                <Twitter size={14} />
                            </a>
                            <a href="#" className="footer-social-link">
                                <Disc size={14} />
                            </a>
                            <a href="#" className="footer-social-link">
                                <Linkedin size={14} />
                            </a>
                        </div>

                        <p className="footer-copyright">
                            © 2024 FutureTech. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>

    );
};

export default Footer;
