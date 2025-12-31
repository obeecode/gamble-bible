import { Link } from 'react-router-dom';

interface ExploreCardProps {
    image: string;
    title: string;
    description: string;
    link?: string; // Add optional link prop
}

const ExploreCard = ({ image, title, description, link = '/reviews' }: ExploreCardProps) => {
    return (
        <Link to={link} style={{ textDecoration: 'none' }}>
            <div className="explore-card">
                {/* Content */}
                <div className="explore-card-content">
                    {/* Image Container */}
                    <div className="explore-card-image-container">
                        <img
                            src={image}
                            alt={title}
                            className="explore-card-image"
                        />
                    </div>

                    {/* Title */}
                    <h2 className="explore-card-title">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="explore-card-description">
                        {description}
                    </p>

                    {/* Explore Button */}
                    <div className="explore-card-button-container">
                        <button className="explore-card-button">
                            <div className="explore-card-button-inner">
                                Explore
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ExploreCard;