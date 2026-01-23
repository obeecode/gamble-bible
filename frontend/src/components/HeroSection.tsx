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
                The #1 Gambling Resource & Community
            </h1>

            <p className="hero-description">
                The ultimate resource and community built by gamblers, for gamblers. Join 10,000+ players in the global gambling village.
            </p>
            
        </div>
    );
};

export default HeroSection;