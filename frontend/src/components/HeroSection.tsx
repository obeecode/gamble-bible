import { useState } from "react";

const cards = [
    {
        icon: "/slot.png",
        label: "Case",
        action: "Open Case"
    },
    {
        icon: "/bonus.png",
        label: "Case",
        action: "Open Case",
        active: true
    },
    {
        icon: "/slot.png",
        label: "Case",
        action: "Open Case"
    }
];

const HeroSection = () => {
    const [isSpinning, setIsSpinning] = useState(false);

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);

        setTimeout(() => {
            setIsSpinning(false);
        }, 3000);
    };

    return (
        <div className="hero-section">
            <div className="hero-case-row">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`hero-case-card${card.active ? " hero-case-card-active" : ""}`}
                    >
                        <div className="hero-case-icon">
                            <img src={card.icon} alt={card.label} />
                        </div>
                        <div className="hero-case-text">
                            <span className="hero-case-label">{card.label}</span>
                            <span className="hero-case-action">{card.action}</span>
                        </div>
                        {card.active && <div className="hero-case-indicator" />}
                    </div>
                ))}
            </div>

            <h1 className="hero-title">
                The Truth About Gambling
            </h1>

            <p className="hero-description">
                For a forum banner, the icons you use should reflect the theme, tone,
                and purpose of your community — whether it's about tech
            </p>

            <div className="hero-wheel-container">
                <div className="hero-wheel-wrapper">
                    <img
                        src="/wheel.png"
                        className={`hero-wheel-image ${isSpinning ? "hero-wheel-spinning" : ""}`}
                        alt="Spin wheel"
                    />
                </div>
                <button
                    className="spin-btn"
                    onClick={handleSpin}
                    disabled={isSpinning}
                >
                    Spin Me
                </button>
            </div>
        </div>
    );
};

export default HeroSection;
