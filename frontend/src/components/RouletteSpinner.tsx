import { useState, useRef, useEffect } from 'react';
import { Gift, TrendingUp, Newspaper, Star, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { spinAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrCreateFingerprint } from '../utils/fingerprintUtils';

const RouletteSpinner = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [prizeWon, setPrizeWon] = useState<any>(null);
  const [pendingPrizeId, setPendingPrizeId] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [spinStats, setSpinStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const wheelRef = useRef(null);
  const idleAnimationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(Date.now());
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { name: 'Reviews', icon: Star, color: '#792ba4' },
    { name: 'Casinos', icon: TrendingUp, color: '#1a1a2e' },
    { name: 'Betting Sites', icon: Newspaper, color: '#792ba4' },
    { name: 'Bonuses', icon: Gift, color: '#1a1a2e' },
    { name: 'Prize', icon: DollarSign, color: '#f59e0b', isPrize: true },
    { name: 'Games', icon: Star, color: '#792ba4' },
    { name: 'News', icon: Newspaper, color: '#1a1a2e' },
    { name: 'GB Awards', icon: Star, color: '#792ba4' },
    { name: 'Tools', icon: TrendingUp, color: '#1a1a2e' },
    { name: 'Guides', icon: Gift, color: '#792ba4' },
    { name: 'Forum', icon: TrendingUp, color: '#1a1a2e' }
  ];

  // Prize definitions (local)
  const prizes = [
    { type: 'cash', spinType: 'small_cash', amount: 5, description: '$5 Cash Prize' },
    { type: 'cash', spinType: 'small_cash', amount: 10, description: '$10 Cash Prize' },
    { type: 'cash', spinType: 'medium_cash', amount: 25, description: '$25 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 50, description: '$50 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 100, description: '$100 Cash Prize!' },
  ];

  const segmentAngle = 360 / categories.length;

  // Initialize fingerprint and load stats
  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setFingerprint(fp);

        const configResponse = await spinAPI.getConfig();
        if (configResponse.success) {
          setConfig(configResponse.data);
        }

        await loadSpinStats(fp);
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize spin wheel');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadSpinStats = async (fp: string) => {
    try {
      const response = await spinAPI.getStats(fp);
      if (response.success) {
        setSpinStats(response.data);
      }
    } catch (error) {
      console.error('Error loading spin stats:', error);
    }
  };

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

  const spinWheel = async () => {
    if (spinning || !fingerprint) return;
    
    // Check local stats first (instant feedback)
    if (spinStats && !spinStats.canSpin) {
      toast.error('You have reached your spin limit. Please try again later.');
      return;
    }
    
    setSpinning(true);
    setWinner(null);
    setShowPrizeModal(false);
    setShowRegisterModal(false);

    // ====================================
    // FRONTEND DETERMINES RESULT (INSTANT)
    // ====================================
    const minSpins = 5;
    const maxSpins = 8;
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    
    // Weighted probability: 2% chance for Prize, 98% for others
    const prizeChance = Math.random();
    let winningIndex;
    let nearMissOffset = 0;
    
    if (prizeChance < 0.02) { // 2% chance for prize
      winningIndex = 4; // Prize segment (index 4)
    } else {
      // 98% chance - land on any other segment (NOT Prize)
      const nonPrizeIndices = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
      winningIndex = nonPrizeIndices[Math.floor(Math.random() * nonPrizeIndices.length)];
      
      // 70% of the time when NOT winning, create a near-miss on Prize
      if (Math.random() < 0.7) {
        winningIndex = 5; // Right after Prize
        nearMissOffset = segmentAngle * 0.15;
      }
    }
    
    const targetAngle = spins * 360 + (winningIndex * segmentAngle) + (segmentAngle / 2) + nearMissOffset;
    
    // ====================================
    // START ANIMATION IMMEDIATELY
    // ====================================
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
          
          const landedCategory = categories[adjustedWinningSegment];
          setWinner(landedCategory.name);
          
          // ====================================
          // DETERMINE PRIZE AFTER LANDING (Like Version A)
          // ====================================
          if (landedCategory.isPrize) {
            // Select random prize
            const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
            handlePrizeWin(randomPrize);
          }
        }, 100);
      }
    };
    
    requestAnimationFrame(animate);
    
    // ====================================
    // BACKEND VALIDATION (IN BACKGROUND)
    // ====================================
    try {
      const backendResponse = await spinAPI.spin(fingerprint);
      
      // Update stats after backend confirms
      if (backendResponse.success) {
        await loadSpinStats(fingerprint);
      } else {
        // Backend rejected (rate limit hit on server side)
        toast.error(backendResponse.data?.message || 'Rate limit exceeded');
      }
    } catch (error: any) {
      console.error('Backend spin validation error:', error);
      // Don't show error to user - spin already happened
      // Just log for monitoring
    }
  };

  // Handle prize win (save to backend)
  const handlePrizeWin = async (prize: any) => {
    setPrizeWon(prize);
    
    if (user) {
      // Logged in user - save prize immediately
      try {
        const response = await spinAPI.savePrize({
          type: prize.type,
          amount: prize.amount,
          description: prize.description,
          fingerprint,
        });
        
        if (response.success) {
          setTimeout(() => setShowPrizeModal(true), 500);
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        } else {
          toast.error('Failed to save prize. Please contact support.');
        }
      } catch (error) {
        console.error('Error saving prize:', error);
        toast.error('Prize won but failed to save. Please contact support with timestamp: ' + new Date().toISOString());
      }
    } else {
      // Anonymous user - create pending prize
      try {
        const response = await spinAPI.createPendingPrize({
          fingerprint,
          result: prize.spinType, // Use spinType for Spin model
          amount: prize.amount,
          description: prize.description,
        });
        
        if (response.success) {
          setPendingPrizeId(response.data.pendingPrizeId);
          setTimeout(() => setShowRegisterModal(true), 500);
        } else {
          toast.error('Failed to save prize. Please contact support.');
        }
      } catch (error) {
        console.error('Error creating pending prize:', error);
        toast.error('Prize won but failed to save. Please contact support.');
      }
    }
  };

  const handleRegister = () => {
    navigate('/signup', { 
      state: { 
        pendingPrize: true, 
        fingerprint,
        from: 'spin-wheel'
      } 
    });
  };

  const handleLogin = () => {
    navigate('/login', { 
      state: { 
        pendingPrize: true, 
        fingerprint,
        from: 'spin-wheel'
      } 
    });
  };

  const createRoundedSegmentPath = (index: number, total: number, outerRadius: number, innerRadius: number) => {
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #1f2937, #000000)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: 'white', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  const canSpin = spinStats?.canSpin !== false;

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
          
          {spinStats && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: '#1f2937',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={16} color="#10b981" />
                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                  {spinStats.hourlyRemaining} spins this hour
                </span>
              </div>
              <div style={{
                background: '#1f2937',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Gift size={16} color="#3b82f6" />
                <span style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: '600' }}>
                  {spinStats.dailyRemaining} spins today
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wheel component */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
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

          <div style={{
            position: 'relative',
            width: isMobile ? '350px' : '550px',
            height: isMobile ? '350px' : '550px'
          }}>
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
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={spinWheel}
                    disabled={spinning || !canSpin}
                    style={{
                      pointerEvents: 'auto',
                      padding: isMobile ? '1rem 2rem' : '1.5rem 3rem',
                      borderRadius: '9999px',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      color: 'white',
                      background: (spinning || !canSpin) ? '#6b7280' : 'linear-gradient(to right, #a855f7, #7c3aed)',
                      border: 'none',
                      cursor: (spinning || !canSpin) ? 'not-allowed' : 'pointer',
                      boxShadow: (spinning || !canSpin) ? 'none' : '0 0 30px rgba(168, 85, 247, 0.6)',
                      transform: 'scale(1)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!spinning && canSpin) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!spinning && canSpin) {
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {spinning ? 'SPINNING...' : !canSpin ? 'LIMIT REACHED' : 'SPIN ME!'}
                  </button>
                  
                  {!canSpin && (
                    <div style={{
                      pointerEvents: 'auto',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      maxWidth: '180px'
                    }}>
                      Come back later!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {winner && !showPrizeModal && !showRegisterModal && (
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

        {/* Prize Modal (Logged-in users) */}
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
                    Check your prizes page to claim!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPrizeModal(false);
                    navigate('/prizes');
                  }}
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

        {/* Register Modal (Anonymous users) */}
        {showRegisterModal && prizeWon && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(to bottom right, #facc15, #eab308)',
              padding: '1px',
              borderRadius: '1rem',
              maxWidth: '28rem',
              width: '100%'
            }}>
              <div style={{
                background: '#1f2937',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                textAlign: 'center'
              }}>
                <AlertCircle style={{
                  width: isMobile ? '3rem' : '4rem',
                  height: isMobile ? '3rem' : '4rem',
                  color: '#facc15',
                  margin: '0 auto',
                  marginBottom: '1rem'
                }} />
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '0.5rem'
                }}>
                  Congratulations! 🎉
                </h2>
                <p style={{
                  color: '#facc15',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  You won {prizeWon.description}!
                </p>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Create an account or log in to claim your prize. Your prize will be held for 24 hours!
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                  <button
                    onClick={handleRegister}
                    style={{
                      background: 'linear-gradient(to right, #eab308, #ca8a04)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={handleLogin}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    style={{
                      background: 'transparent',
                      color: '#9ca3af',
                      padding: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Land on "Prize" to win cash prizes</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• You get {config?.hourlyLimit || 100} spins per hour, {config?.dailyLimit || 500} per day</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Create an account to claim your prizes</li>
            <li>• Each spin is tracked to prevent abuse</li>
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