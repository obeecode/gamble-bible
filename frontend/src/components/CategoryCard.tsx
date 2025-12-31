import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
    icon: string;
    title: string;
    subtitle: string;
    description: string;
    link?: string; // Add optional link prop
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
    icon, 
    title, 
    subtitle, 
    description,
    link = '/reviews'
}) => {
    return (
        <Link to={link} style={{ textDecoration: 'none' }}>
            <div className="category-card">
                {/* Icon */}
                <div className="category-card-icon-container">
                    <img
                        src={icon}
                        alt={title}
                        className="category-card-icon"
                    />
                </div>

                {/* Content */}
                <div className="category-card-content">
                    <h3 className="category-card-title">{title}</h3>
                    <p className="category-card-subtitle">{subtitle}</p>
                </div>

                {/* Description */}
                <p className="category-card-description">
                    {description}
                </p>

                {/* Arrow Button */}
                <div className="category-card-arrow">
                    <div className="category-card-arrow-button">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="category-card-arrow-icon"
                        >
                            <path
                                d="M5 12H19M19 12L12 5M19 12L12 19"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CategoryCard;