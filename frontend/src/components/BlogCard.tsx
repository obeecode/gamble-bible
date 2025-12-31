import { Heart, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogCardProps {
    image: string;
    category: string;
    title: string;
    likes: string;
    shares: string;
    slug?: string; // Add optional slug prop
}

const BlogCard = ({ image, category, title, likes, shares, slug }: BlogCardProps) => {
    return (
        <div className="blog-card">
            {/* Image Container */}
            <div className="blog-card-image-container">
                <img
                    src={image}
                    alt={title}
                    className="blog-card-image"
                />
            </div>

            {/* Content */}
            <div className="blog-card-content">
                {/* Category */}
                <div className="blog-card-category">
                    <span className="blog-card-category-text">
                        {category}
                    </span>
                </div>

                {/* Title */}
                <h3 className="blog-card-title">
                    {title}
                </h3>

                {/* Footer */}
                <div className="blog-card-footer">
                    <div className="blog-card-actions">
                        {/* Likes */}
                        <button className="blog-card-action-btn">
                            <Heart size={18} className="blog-card-action-icon" />
                            <span className="blog-card-action-text">{likes}</span>
                        </button>

                        {/* Shares */}
                        <button className="blog-card-action-btn">
                            <Send size={18} className="blog-card-action-icon" />
                            <span className="blog-card-action-text">{shares}</span>
                        </button>
                    </div>

                    {/* Read Button - Now a Link */}
                    {slug ? (
                        <Link to={`/blog/${slug}`} className="blog-card-read-btn" style={{ textDecoration: 'none' }}>
                            Read
                        </Link>
                    ) : (
                        <Link to="/reviews" className="blog-card-read-btn" style={{ textDecoration: 'none' }}>
                            Read
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogCard;