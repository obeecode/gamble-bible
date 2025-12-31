import { User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ForumCardProps {
    title: string;
    image: string;
    showLoginButton?: boolean;
    link?: string;
}

const ForumCard = ({ title, image, showLoginButton = false, link = '/reviews' }: ForumCardProps) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        if (!showLoginButton) {
            navigate(link);
        }
    };

    const handleLoginClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/login');
    };

    return (
        <div 
            className="forum-card" 
            onClick={handleCardClick}
            style={{ cursor: showLoginButton ? 'default' : 'pointer' }}
        >
            <div className="forum-card-background">
                <div className="forum-card-pattern"></div>
            </div>
            <div className="forum-card-content">
                <div className="forum-card-left">
                    <img src="/Star.png" className="forum-card-star" alt="Star" />
                    <h3 className="forum-card-title">
                        {title}
                    </h3>
                    {showLoginButton && (
                        <button 
                            className="forum-card-login-btn"
                            onClick={handleLoginClick}
                        >
                            <User size={16} />
                            <span>Login</span>
                        </button>
                    )}
                </div>
                <div className="forum-card-image-container">
                    <img
                        src={image}
                        alt="Forum Character"
                        className="forum-card-image"
                    />
                </div>
            </div>
        </div>
    );
};

export default ForumCard;