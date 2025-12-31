import { useState, useRef, useEffect } from 'react';
import { Gift, TrendingUp, Newspaper, Star, DollarSign } from 'lucide-react';
import { prizeAPI } from '../services/api';
import { toast } from 'react-toastify';

const RouletteSpinner = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeWon, setPrizeWon] = useState(null);
  const wheelRef = useRef(null);
  const idleAnimationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  const categories = [
    { name: 'Reviews', icon: Star, color: '#792ba4' },
    { name: 'Casinos', icon: TrendingUp, color: '#1a1a2e' },
    { name: 'Betting Sites', icon: Newspaper, color: '#792ba4' },
    { name: 'Bonuses', icon: Gift, color: '#1a1a2e' },
    { name: 'Prize', icon: DollarSign, color: '#f59e0b ', isPrize: true },
    { name: 'Games', icon: Star, color: '#792ba4' },
    { name: 'News', icon: Newspaper, color: '#1a1a2e' },
    { name: 'GB Awards', icon: Star, color: '#792ba4' },
    { name: 'Tools', icon: TrendingUp, color: '#1a1a2e' },
    { name: 'Guides', icon: Gift, color: '#792ba4' },
    { name: 'Forum', icon: TrendingUp, color: '#1a1a2e' }
  ];

  const prizes = [
    { type: 'cash', amount: 0.50, description: '$0.50 Cash Prize' },
    { type: 'cash', amount: 0.25, description: '$0.25 Cash Prize' },
    { type: 'cash', amount: 1.00, description: '$1.00 Cash Prize!' },
    { type: 'bonus', amount: 5, description: '$5 Bet Account Funding' },
    { type: 'points', amount: 100, description: '100 GB Points' }
  ];

  const segmentAngle = 360 / categories.length;

  // Save prize to database
  const savePrizeToDatabase = async (prize: any) => {
    try {
      const response = await prizeAPI.createPrize({
        type: prize.type,
        amount: prize.amount,
        description: prize.description,
      });
      
      if (response.success) {
        console.log('Prize saved:', response.data.prize);
        // Trigger notification update
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      }
    } catch (error) {
      console.error('Failed to save prize:', error);
      toast.error('Prize won but failed to save. Please contact support.');
    }
  };

  // Idle rotation effect
  useEffect(() => {
    const idleRotate = () => {
      if (!spinning) {
        const now = Date.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        
        const rotationSpeed = 12 / 1000;
        setRotation(prev => prev + (rotationSpeed * delta));
      }
      idleAnimationRef.current = requestAnimationFrame(idleRotate);
    };
    
    idleAnimationRef.current = requestAnimationFrame(idleRotate);
    
    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, [spinning]);

  const spinWheel = () => {
    if (spinning) return;
    
    setSpinning(true);
    setWinner(null);
    setShowPrizeModal(false);

    const minSpins = 5;
    const maxSpins = 8;
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    
    // Weighted probability: 2% chance for Prize, 98% for others
    const prizeChance = Math.random();
    let winningIndex;
    let nearMissOffset = 0;
    
    if (prizeChance < 0.90) {
      // 2% chance - land on Prize (index 4)
      winningIndex = 4;
    } else {
      // 98% chance - land on any other segment (NOT Prize)
      const nonPrizeIndices = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
      winningIndex = nonPrizeIndices[Math.floor(Math.random() * nonPrizeIndices.length)];
      
      // 70% of the time when NOT winning, create a near-miss on Prize
      if (Math.random() < 0.7) {
        // Land on the segment RIGHT AFTER Prize (index 5 - "Games")
        winningIndex = 5;
        nearMissOffset = segmentAngle * 0.15;
      }
    }
    
    const targetAngle = spins * 360 + (winningIndex * segmentAngle) + (segmentAngle / 2) + nearMissOffset;
    
    const startTime = Date.now();
    const duration = 5000;
    const startRotation = rotation;
    const finalRotation = startRotation + targetAngle;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = startRotation + (targetAngle * eased);
      setRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setRotation(finalRotation);
        
        setTimeout(() => {
          lastTimeRef.current = Date.now();
          setSpinning(false);
          
          const normalizedRotation = finalRotation % 360;
          const positiveRotation = ((normalizedRotation % 360) + 360) % 360;
          
          const winningSegment = categories.length - 1 - Math.floor(positiveRotation / segmentAngle) % categories.length;
          const adjustedWinningSegment = (winningSegment + categories.length) % categories.length;
          
          setWinner(categories[adjustedWinningSegment].name);
          
          if (categories[adjustedWinningSegment].isPrize) {
            const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
            setPrizeWon(randomPrize);
            
            // Save prize to database if user is logged in
            const token = localStorage.getItem('token');
            if (token) {
              savePrizeToDatabase(randomPrize);
            }
            
            setTimeout(() => setShowPrizeModal(true), 500);
          }
        }, 100);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const createRoundedSegmentPath = (index, total, outerRadius, innerRadius) => {
    const angle = (360 / total) * (Math.PI / 180);
    const startAngle = (index * 360 / total - 90) * (Math.PI / 180);
    const endAngle = startAngle + angle;
    
    const outerStart = {
      x: 200 + outerRadius * Math.cos(startAngle),
      y: 200 + outerRadius * Math.sin(startAngle)
    };
    const outerEnd = {
      x: 200 + outerRadius * Math.cos(endAngle),
      y: 200 + outerRadius * Math.sin(endAngle)
    };
    const innerStart = {
      x: 200 + innerRadius * Math.cos(endAngle),
      y: 200 + innerRadius * Math.sin(endAngle)
    };
    const innerEnd = {
      x: 200 + innerRadius * Math.cos(startAngle),
      y: 200 + innerRadius * Math.sin(startAngle)
    };

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    return `
      M ${outerStart.x} ${outerStart.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}
      L ${innerStart.x} ${innerStart.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}
      Z
    `;
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #000000)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '2rem' }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2.25rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            GambleBible.com
          </h1>
          <p style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: '#9ca3af'
          }}>
            Spin the wheel for a chance to win prizes!
          </p>
        </div>

        {/* Roulette Wheel */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          {/* Pointer at top */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: isMobile ? 'translateX(-50%) translateY(-0.75rem)' : 'translateX(-50%) translateY(-1rem)',
            zIndex: 20,
            width: 0,
            height: 0,
            borderLeft: isMobile ? '15px solid transparent' : '20px solid transparent',
            borderRight: isMobile ? '15px solid transparent' : '20px solid transparent',
            borderTop: isMobile ? '22px solid #facc15' : '30px solid #facc15',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
          }} />

          {/* Winning segment highlighter */}
          {!spinning && winner && (
            <div style={{
              position: 'absolute',
              top: isMobile ? '2rem' : '3rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              background: '#facc15',
              color: '#111827',
              padding: isMobile ? '0.375rem 1rem' : '0.5rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
              animation: 'pulse 2s infinite',
              border: '2px solid #fde047'
            }}>
              {winner}
            </div>
          )}

          {/* Wheel Container */}
          <div style={{
            position: 'relative',
            width: isMobile ? '350px' : '550px',
            height: isMobile ? '350px' : '550px'
          }}>
            {/* SVG Wheel */}
            <svg
              ref={wheelRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              viewBox="0 0 400 400"
            >
              <circle cx="200" cy="200" r="196" fill="none" stroke="#ead18a" strokeWidth="3" />
              
              {categories.map((category, index) => (
                <path
                  key={index}
                  d={createRoundedSegmentPath(index, categories.length, 188, 110)}
                  fill={category.color}
                  stroke="#ead18a"
                  strokeWidth="3"
                />
              ))}

              {categories.map((category, index) => {
                const angle = index * segmentAngle;
                const midAngle = angle + segmentAngle / 2;
                const radians = (midAngle - 90) * (Math.PI / 180);
                const radius = 149;
                const x = 200 + Math.cos(radians) * radius;
                const y = 200 + Math.sin(radians) * radius;

                const Icon = category.icon;

                return (
                  <g key={`icon-${index}`}>
                    <foreignObject
                      x={x - 30}
                      y={y - 30}
                      width="60"
                      height="60"
                      transform={`rotate(${midAngle}, ${x}, ${y})`}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <Icon style={{
                          width: isMobile ? '1.25rem' : '1.5rem',
                          height: isMobile ? '1.25rem' : '1.5rem',
                          color: 'white',
                          marginBottom: '0.25rem'
                        }} />
                        <span style={{
                          color: 'white',
                          fontSize: isMobile ? '0.625rem' : '0.75rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {category.name}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* Large center circle with button */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10
            }}>
                
              <div style={{
                width: isMobile ? '210px' : '313px',
                height: isMobile ? '210px' : '313px',
                background: 'linear-gradient(to bottom right, #e1ca86, #e1ca86)',
                borderRadius: '50%',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: isMobile ? '193px' : '303px',
                  height: isMobile ? '193px' : '303px',
                  background: '#1e293b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={spinWheel}
                    disabled={spinning}
                    style={{
                      pointerEvents: 'auto',
                      padding: isMobile ? '1rem 2rem' : '1.5rem 3rem',
                      borderRadius: '9999px',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      color: 'white',
                      background: spinning ? '#6b7280' : 'linear-gradient(to right, #a855f7, #7c3aed)',
                      border: 'none',
                      cursor: spinning ? 'not-allowed' : 'pointer',
                      boxShadow: spinning ? 'none' : '0 0 30px rgba(168, 85, 247, 0.6)',
                      transform: 'scale(1)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!spinning) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.background = 'linear-gradient(to right, #a855f7, #7c3aed)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!spinning) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'linear-gradient(to right, #a855f7, #7c3aed)';
                      }
                    }}
                  >
                    {spinning ? 'SPINNING...' : 'SPIN ME!'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {winner && !showPrizeModal && (
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{
              display: 'inline-block',
              background: '#1f2937',
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid #eab308'
            }}>
              <p style={{
                color: 'white',
                fontSize: isMobile ? '0.875rem' : '1.125rem'
              }}>
                Landed on: <span style={{
                  fontWeight: 'bold',
                  color: '#facc15'
                }}>{winner}</span>
              </p>
            </div>
          </div>
        )}

        {/* Prize Modal */}
        {showPrizeModal && prizeWon && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(to bottom right, #facc15, #eab308, #ca8a04)',
              padding: '1px',
              borderRadius: '1rem',
              maxWidth: '28rem',
              width: '100%',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                background: '#112711ff',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                  <Gift style={{
                    width: isMobile ? '4rem' : '5rem',
                    height: isMobile ? '4rem' : '5rem',
                    color: '#facc15',
                    margin: '0 auto',
                    marginBottom: isMobile ? '0.75rem' : '1rem'
                  }} />
                  <h2 style={{
                    fontSize: isMobile ? '1.5rem' : '1.875rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '0.5rem'
                  }}>
                    🎉 WINNER! 🎉
                  </h2>
                  <p style={{
                    color: '#facc15',
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: 'bold',
                    marginBottom: isMobile ? '0.75rem' : '1rem'
                  }}>
                    {prizeWon.description}
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}>
                    {prizeWon.type === 'bonus' 
                      ? 'Check your prizes page to claim your bonus!'
                      : prizeWon.type === 'points'
                      ? 'Points added to your GB account'
                      : 'Check your prizes page to claim!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPrizeModal(false)}
                  style={{
                    background: 'linear-gradient(to right, #eab308, #ca8a04)',
                    color: 'white',
                    padding: isMobile ? '0.625rem 1.5rem' : '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ca8a04, #a16207)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #ca8a04)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  View Prizes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div style={{
          marginTop: isMobile ? '2rem' : '3rem',
          background: '#1f2937',
          borderRadius: '0.5rem',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid #374151'
        }}>
          <h3 style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.125rem',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            How It Works
          </h3>
          <ul style={{
            color: '#9ca3af',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Click "Spin Me" to spin the roulette wheel</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Land on "Prize" to win cash, bonuses, or GB points</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Prizes are saved to your account automatically</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Each spin is completely random</li>
            <li>• Login to save and claim your prizes</li>
          </ul>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default RouletteSpinner;