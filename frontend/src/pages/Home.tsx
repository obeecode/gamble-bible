import { Link } from 'react-router-dom';
import BlogCard from "../components/BlogCard";
import ForumCard from "../components/ForumCard";
import HeroSection from "../components/HeroSection";
import ExploreCard from "../components/ExploreCard";
import RankingCard from "../components/RankingCard";
import CategoryCard from "../components/CategoryCard";
import RouletteSpinner from '../components/RouletteSpinner';
import AdBanner from '../components/AdBanner'; // Simple ad banner
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import SVGBackground from '../components/SVGBackground';

const Home = () => {
  return (
    <div className="home-page" style={{ position: 'relative' }}>
      {/* SVG Background Layer - Behind all content */}
      <SVGBackground 
        icons={[ 'book', 'football', 'bitcoinChip', 'casinoChip', 'gamepad', 'star', 'award', 'forum', 'gift']}
        iconSize={25}
        opacity={0.06}
        spacing={180}
        color="#ffffff"
      />
      
      {/* Main Content Layer - Above background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="container-lg">
          <div className="home-hero-grid">
            <div className="home-left-cards">
              <BlogCard
                image="https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=2073&auto=format&fit=crop"
                category="Gaming"
                title="The Ultimate Beginner's Guide to Playing Blackjack"
                likes="10k"
                shares="124"
              />
              <BlogCard
                image="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop"
                category="Strategy"
                title="Top 5 Poker Strategies for Advanced Players"
                likes="8.5k"
                shares="92"
              />
            </div>

            <div className="home-hero-center">
              {/* Simple Ad Banner - Customizable text and height */}
              <AdBanner 
                text="Place Ad Here"
                height="75px"
                backgroundColor="#2a2e3b"
              />
              
              <HeroSection />
              
              {/* RouletteSpinner moved here - below HeroSection */}
              <div style={{ marginTop: '10px', width: '100%' }}>
                <RouletteSpinner />
              </div>
            </div>

            <div className="home-right-cards">
              <ForumCard
                title="Join our Forum and Discuss"
                image="/person.png"
              />
              <ForumCard
                title="Join our Forum and Discuss"
                image="/trophy.png"
              />
              <ForumCard
                title="Join our Forum and Discuss"
                image="/trophy.png"
                showLoginButton={true}
              />
            </div>
          </div>

          {/* Explore Cards Section */}
          <div className="home-section">
            <div className="home-section-header">
              <img src="/Notification.png" alt="icon" className="home-section-icon" />
              <h2 className="home-section-title">Why read GambleBible</h2>
            </div>
            <div className="home-explore-grid">
              <ExploreCard
                image="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop"
                title="Find Everything Gambling"
                description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet"
              />
              <ExploreCard
                image="https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=2070&auto=format&fit=crop"
                title="Casino Games Guide"
                description="Discover best strategies and tips for all your favorite casino games"
              />
              <ExploreCard
                image="https://images.unsplash.com/photo-1518991043280-1da61d7c6c6f?q=80&w=2070&auto=format&fit=crop"
                title="Sports Betting Hub"
                description="Get expert insights and predictions for sports betting across all major leagues"
              />
            </div>
          </div>

          <div className="home-section">
            <div className="home-section-header">
              <img src="/Notification.png" alt="icon" className="home-section-icon" />
              <h2 className="home-section-title">Ranking best</h2>
            </div>
            <div className="home-ranking-grid">
              <RankingCard
                title="How we rank"
                description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet .Lorem ipsum dolo"
                image="/slot.png"
                glowColor="purple"
              />
              <RankingCard
                title="Who we rank"
                description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet .Lorem ipsum dolo"
                image="/bonus.png"
                glowColor="orange"
              />
            </div>
          </div>

          <div className="home-section">
            <div className="home-section-header">
              <img src="/Notification.png" alt="icon" className="home-section-icon" />
              <h2 className="home-section-title">Category</h2>
            </div>
            <div className="home-category-grid">
              {[
                { image: "/slot.png", label: "Slot", count: "234" },
                { image: "/slot.png", label: "Casino", count: "234" },
                { image: "/slot.png", label: "Poker", count: "234" },
                { image: "/slot.png", label: "Sports", count: "234" },
                { image: "/slot.png", label: "Roulette", count: "234" },
                { image: "/slot.png", label: "Blackjack", count: "234" }
              ].map((cat, idx) => (
                <CategoryCard
                  key={idx}
                  image={cat.image}
                  label={cat.label}
                  count={cat.count}
                />
              ))}
            </div>
          </div>

          <div className="home-cta-section">
            <div className="home-cta-content">
              <span className="home-cta-badge">New Update 🎉</span>
              <div>
                <h2 className="home-cta-title">Join our Community</h2>
                <p className="home-cta-description">
                  Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet .Lorem ipsum dolo
                </p>
                <button className="home-cta-button">
                  <span className="home-cta-button-text">
                    Start Now
                  </span>
                  <ArrowRight />
                </button>
              </div>
            </div>

            <img src="/poker.png" alt="poker" className="home-cta-image" />
          </div>

          <div className="home-section">
            <div className="home-section-header">
              <img src="/Notification.png" alt="icon" className="home-section-icon" />
              <h2 className="home-section-title">Hot Blogs</h2>
            </div>
            <div className="home-blog-grid">
              {new Array(4).fill(0).map((_, idx) => (
                <BlogCard
                  key={idx}
                  image="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop"
                  category="Gaming"
                  title="The Ultimate Beginner's Guide to Playing Blackjack"
                  likes="10k"
                  shares="124"
                  compact={true}
                />
              ))}
            </div>
          </div>

          <div className="home-section">
            <div className="home-reviews-header">
              <div className="home-section-header">
                <img src="/Notification.png" alt="icon" className="home-section-icon" />
                <h2 className="home-section-title">Company Reviews</h2>
              </div>
              <div className="home-reviews-nav">
                <button className="home-nav-btn">
                  <ChevronLeft className="nav-icon-black" size={20} />
                </button>
                <button className="home-nav-btn">
                  <ChevronRight className="nav-icon-black" size={20} />
                </button>
              </div>
            </div>

            <div className="home-reviews-grid">
              {new Array(5).fill(0).map((_, idx) => (
                <div key={idx} className="home-review-card">
                  <div className="home-review-image-container">
                    <img src="/bonus.png" alt="review" className="home-review-image" />
                  </div>

                  <h3 className="home-review-title">Bet 9ja Review</h3>

                  <button className="home-review-button">
                    Claim Bonus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;