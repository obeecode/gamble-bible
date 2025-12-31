import { useState } from 'react';
import { Share2, MessageCircle, Calendar, Star, Check, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { notificationAPI } from '../services/api';
import kayakImg from '../assets/kayak_lake.png';
import authorImg from '../assets/author_louis.png';

const CasinoReviews = () => {
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [cards, setCards] = useState([1, 2, 3]);

    const toggleCard = (index: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleGetBonus = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();

        // Better confetti effect
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });

        // Remove card
        setCards(prev => prev.filter(cardId => cardId !== id));

        // Send notification
        try {
            await notificationAPI.createNotification({
                title: 'Bonus Claimed!',
                message: 'You have successfully claimed the welcome bonus.',
                type: 'welcome'
            });
            window.dispatchEvent(new CustomEvent('notificationUpdated'));
            toast.success("Offer Applied! Check your notifications.", {
                icon: <span>🎉</span>,
                style: {
                    background: "#1a0b2e",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.1)"
                }
            });
        } catch (error) {
            console.error('Failed to create notification', error);
        }
    };

    return (
        <div className="casino-reviews-page">
            <div className="casino-reviews-grid">
                <div className="casino-reviews-main">
                    <div className="casino-reviews-header">
                        <span className="casino-reviews-category">
                            📁 Category : Sport
                        </span>
                        <h1 className="casino-reviews-title">
                            Top 10 Online Casinos with Best Welcome Bonuses in 2025
                        </h1>

                        <div className="casino-reviews-meta">
                            <div className="casino-reviews-meta-left">
                                <div className="casino-reviews-meta-item">
                                    <Calendar size={16} />
                                    <span>July 14, 2022</span>
                                </div>
                                <div className="casino-reviews-meta-item">
                                    <MessageCircle size={16} />
                                    <span>Comments : 35</span>
                                </div>
                            </div>

                            <div className="casino-reviews-actions">
                                <button className="casino-share-btn">
                                    <Share2 size={16} />
                                    Share
                                </button>
                                <button className="casino-comment-btn">
                                    <MessageCircle size={16} />
                                    Comment
                                </button>
                            </div>
                        </div>
                        <div className="casino-reviews-disclosure">
                            <a href="#" className="casino-disclosure-link">Disclosure Here</a>
                        </div>
                    </div>
                    <div className="casino-cards-list">
                        {cards.map((item) => {
                            const isExpanded = expandedCards.has(item);
                            return (
                                <div
                                    key={item}
                                    className={`casino-card ${isExpanded ? 'casino-card-expanded' : ''}`}
                                >
                                    <div
                                        className="casino-card-content"
                                        onClick={() => toggleCard(item)}
                                    >
                                        <div className={`casino-card-chevron ${isExpanded ? 'casino-card-chevron-expanded' : ''}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                        <div className="casino-card-image">
                                            <div className="casino-card-image-container">
                                                <img src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=500" alt="Casino" className="casino-card-img" />
                                            </div>
                                        </div>

                                        <div className="casino-card-info">
                                            <h2 className="casino-card-title">Bet Victor Casino Play</h2>
                                            <div className="casino-card-rating">
                                                <div className="casino-rating-stars">
                                                    <Star size={12} fill="currentColor" />
                                                    <Star size={12} fill="currentColor" />
                                                    <Star size={12} fill="currentColor" />
                                                    <Star size={12} fill="currentColor" />
                                                    <Star size={12} fill="currentColor" className="casino-rating-star-empty" />
                                                </div>
                                                <span className="casino-rating-score">9.5</span>
                                            </div>
                                        </div>

                                        <div className="casino-card-bonus">
                                            <a href="#" className="casino-bonus-link" onClick={(e) => e.stopPropagation()}>
                                                Welcome Bonus
                                            </a>
                                            <p className="casino-bonus-description">
                                                Wagrer $39 Get 200 Free Spins On Big Bass Games Splash Wins
                                            </p>
                                        </div>

                                        <div className="casino-card-actions">
                                            <button
                                                className="casino-get-bonus-btn"
                                                onClick={(e) => handleGetBonus(e, item)}
                                            >
                                                Get Bonus
                                            </button>
                                            <button
                                                className="casino-review-link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCard(item);
                                                }}
                                            >
                                                Read Full Review
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`casino-card-expanded-content ${isExpanded ? 'casino-card-expanded-content-visible' : ''}`}>
                                        <div className="casino-expanded-description">
                                            <p>On Mr. Gamble, we not only list casinos that stand out in a highly competitive market but also great casinos that have been acknowledged with the biggest and most prestigious gaming industry awards. others are always on the lookout for the newest casino games, for example.</p>
                                        </div>

                                        <div className="casino-expanded-details">
                                            <div className="casino-expanded-features">
                                                <div className="casino-feature-item">
                                                    <Check size={16} className="casino-feature-check" />
                                                    <span>Extreme Slots And Pools Betting</span>
                                                </div>
                                                <div className="casino-feature-item">
                                                    <Check size={16} className="casino-feature-check" />
                                                    <span>The Best Online Casino Depends Preferences.</span>
                                                </div>
                                                <div className="casino-feature-item">
                                                    <Check size={16} className="casino-feature-check" />
                                                    <span>Some Casino Players Are After Lucrative Bonuses</span>
                                                </div>
                                            </div>

                                            <div className="casino-expanded-bonus-columns">
                                                <div className="casino-bonus-column">
                                                    <div className="casino-bonus-column-header">BONUS</div>
                                                    <div className="casino-bonus-code">ZBE39034JFF</div>
                                                    <div className="casino-bonus-text">Casino Players</div>
                                                    <div className="casino-bonus-number">70000+</div>
                                                </div>
                                                <div className="casino-bonus-column">
                                                    <div className="casino-bonus-column-header">BONUS</div>
                                                    <div className="casino-bonus-number">70000+</div>
                                                    <div className="casino-bonus-text">Casino Players</div>
                                                    <div className="casino-bonus-number">70000+</div>
                                                </div>
                                                <div className="casino-bonus-column">
                                                    <div className="casino-bonus-column-header">BONUS</div>
                                                    <div className="casino-bonus-text">Casino Players</div>
                                                    <div className="casino-bonus-text">Casino Players</div>
                                                    <div className="casino-bonus-number">70000+</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="casino-reviews-footer">
                        <p className="casino-footer-text">Gambling Sites Need To Offer Great Games, Good Bonuses, And A Real Chance Of You Winning Money</p>
                    </div>
                </div>
                <div className="casino-reviews-sidebar">
                    <div className="casino-author-card">
                        <div className="casino-author-content">
                            <div className="casino-author-avatar">
                                <img src={authorImg} alt="Louis Hoebregts" className="casino-author-img" />
                            </div>
                            <div className="casino-author-info">
                                <div className="casino-author-header">
                                    <h3 className="casino-author-name">Louis Hoebregts</h3>
                                    <span className="casino-author-posts">27 post</span>
                                </div>
                                <button className="casino-follow-btn">
                                    <span className="casino-follow-plus">+</span> Follow
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="casino-tags-card">
                        <div className="casino-card-header">
                            <div className="casino-card-accent casino-tags-accent"></div>
                            <h3 className="casino-card-title">Tags</h3>
                        </div>
                        <div className="casino-tags-list">
                            {['Montenegro', 'Visit Croatia', 'Luxury Travel', 'Paradise Island', 'Travel Info'].map((tag) => (
                                <span key={tag} className="casino-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="casino-top-posts-card">
                        <div className="casino-card-header">
                            <div className="casino-card-accent casino-top-posts-accent"></div>
                            <h3 className="casino-card-title">Top Post</h3>
                        </div>
                        <div className="casino-top-posts-list">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="casino-top-post-item">
                                    <div className="casino-top-post-image">
                                        <img src={kayakImg} alt="Thumbnail" className="casino-top-post-img" />
                                    </div>
                                    <div>
                                        <h4 className="casino-top-post-title">
                                            How To Spend The Perfect Day On Croatia's Most Magical Island
                                        </h4>
                                        <span className="casino-top-post-subhead">Subhead</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="casino-ad-card">
                        <div className="casino-ad-pattern"></div>
                        <div className="casino-ad-content">
                            <p className="casino-ad-title">Advertising</p>
                            <p className="casino-ad-size">360 Px * 180px</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CasinoReviews;
