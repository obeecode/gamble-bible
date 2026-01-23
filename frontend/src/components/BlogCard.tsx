import { Link } from 'react-router-dom';

interface BlogCardProps {
    image: string;
    category: string;
    title: string;
    likes?: string;
    shares?: string;
    slug?: string;
    compact?: boolean;
}

const BlogCard = ({ image, category, title, slug, compact }: BlogCardProps) => {
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

                {/* Read Link (optional overlay) */}
                {slug && (
                    <Link to={`/blog/${slug}`} className="blog-card-link-overlay" aria-label={`Read ${title}`} />
                )}
            </div>
        </div>
    );
};

export default BlogCard;