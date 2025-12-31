import React from 'react';

interface RankingCardProps {
    title: string;
    description: string;
    image: string;
    glowColor?: 'purple' | 'orange';
}

const RankingCard: React.FC<RankingCardProps> = ({ title, description, image, glowColor = 'purple' }) => {
    return (
        <div className="ranking-card">
            <div className="ranking-card-image-container">
                <div className={`ranking-card-glow ranking-card-glow-${glowColor}`}></div>
                <img
                    src={image}
                    alt={title}
                    className="ranking-card-image"
                />
            </div>
            <div className="ranking-card-content">
                <h3 className="ranking-card-title">{title}</h3>
                <p className="ranking-card-description">
                    {description}
                </p>

                <div className="ranking-card-tags">
                    <button className="ranking-card-tag ranking-card-tag-blue">
                        Design
                    </button>
                    <button className="ranking-card-tag ranking-card-tag-orange">
                        Design
                    </button>
                    <button className="ranking-card-tag ranking-card-tag-blue">
                        Design
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RankingCard;
