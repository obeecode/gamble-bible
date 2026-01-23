import { useState, useRef, useEffect } from 'react';
import { Gift, Dices, Star, BadgeDollarSign, AlertCircle, Clock, BookOpenText, MessagesSquare, Gamepad2, Volleyball, Info, X } from 'lucide-react';
import { spinAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrCreateFingerprint } from '../utils/fingerprintUtils';
import { trackRouletteSpin, trackRouletteSignup } from '../services/analytics';

const RouletteSpinner = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [winningSegmentIndex, setWinningSegmentIndex] = useState<number | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showHourlyModal, setShowHourlyModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [prizeWon, setPrizeWon] = useState<any>(null);
  const [pendingPrizeId, setPendingPrizeId] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [spinStats, setSpinStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const wheelRef = useRef(null);
  const idleAnimationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(Date.now());

  const { user } = useAuth();
  const navigate = useNavigate();

  // Hover colors for each category
  const hoverColors = [
    '#e74c3c', '#3498db', '#9b59b6', '#1abc9c',
    '#f39c12', '#e91e63', '#00bcd4', '#8bc34a',
  ];

  // 9 categories
  const categories = [
    { name: 'Reviews', icon: Star, color: '#10121aff', hoverColor: hoverColors[0] },
    { name: 'Casinos', icon: Dices, color: '#10121aff', hoverColor: hoverColors[1] },
    { name: 'Betting Sites', icon: Volleyball, color: '#10121aff', hoverColor: hoverColors[2] },
    { name: 'Bonuses', icon: Gift, color: '#10121aff', hoverColor: hoverColors[3] },
    { name: 'Prize', icon: BadgeDollarSign, color: '#f59e0b', hoverColor: hoverColors[4], isPrize: true },
    { name: 'Games', icon: Gamepad2, color: '#10121aff', hoverColor: hoverColors[5] },
    { name: 'Guides', icon: BookOpenText, color: '#10121aff', hoverColor: hoverColors[6] },
    { name: 'Forum', icon: MessagesSquare, color: '#10121aff', hoverColor: hoverColors[7] },
    { name: 'Forum', icon: MessagesSquare, color: '#10121aff', hoverColor: hoverColors[7] },
  ];

  const PRIZE_INDEX = 4;
  const NUM_SEGMENTS = 9;
  const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

  const prizes = [
    { type: 'cash', spinType: 'small_cash', amount: 5, description: '$5 Cash Prize' },
    { type: 'cash', spinType: 'small_cash', amount: 10, description: '$10 Cash Prize' },
    { type: 'cash', spinType: 'medium_cash', amount: 25, description: '$25 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 50, description: '$50 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 100, description: '$100 Cash Prize!' },
  ];

  const outerRadius = 188;
  const innerRadius = isMobile ? 94 : 108;
  const innerGap = 6.5;

  // Button sizes
  const spinButtonWidth = isMobile ? 75 : 120;
  const spinButtonHeight = isMobile ? 40 : 55;

  // Wheel sizes
  const wheelSize = isMobile ? 370 : 690;

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setFingerprint(fp);
        const configResponse = await spinAPI.getConfig();
        if (configResponse.success) setConfig(configResponse.data);
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSpinStats = async (fp: string) => {
    try {
      const response = await spinAPI.getStats(fp);
      if (response.success) setSpinStats(response.data);
    } catch (error) {
      console.error('Error loading spin stats:', error);
    }
  };

  // Idle rotation
  useEffect(() => {
    const targetFPS = isMobile ? 24 : 60;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = Date.now();
    let currentRotation = rotation;
    const rotationSpeed = isMobile ? 7 : 9;

    const idleRotate = () => {
      if (!spinning && wheelRef.current) {
        const now = Date.now();
        const elapsed = now - lastFrameTime;
        if (elapsed >= frameInterval) {
          const delta = now - lastTimeRef.current;
          lastTimeRef.current = now;
          currentRotation += (rotationSpeed / 1000) * delta;
          (wheelRef.current as any).style.transform = `rotate(${currentRotation}deg)`;
          lastFrameTime = now - (elapsed % frameInterval);
        }
      }
      idleAnimationRef.current = requestAnimationFrame(idleRotate);
    };

    idleAnimationRef.current = requestAnimationFrame(idleRotate);
    return () => {
      if (idleAnimationRef.current) cancelAnimationFrame(idleAnimationRef.current);
    };
  }, [spinning, isMobile]);

  const getSegmentAtPointer = (rotationDegrees: number): number => {
    let normalized = ((rotationDegrees % 360) + 360) % 360;
    const segmentIndex = (NUM_SEGMENTS - 1 - Math.floor(normalized / SEGMENT_ANGLE)) % NUM_SEGMENTS;
    return (segmentIndex + NUM_SEGMENTS) % NUM_SEGMENTS;
  };

  const getRotationForSegment = (targetSegment: number): number => {
    const baseRotation = ((NUM_SEGMENTS - 1 - targetSegment + NUM_SEGMENTS) % NUM_SEGMENTS) * SEGMENT_ANGLE;
    return baseRotation + SEGMENT_ANGLE / 2;
  };

  const spinWheel = async () => {
    if (spinning || !fingerprint) return;
    if (spinStats && !spinStats.canSpin) {
      toast.error('You have reached your spin limit. Please try again later.');
      return;
    }

    setSpinning(true);
    setWinner(null);
    setWinningSegmentIndex(null);
    setIsBlinking(false);
    setShowPrizeModal(false);
    setShowRegisterModal(false);

    const prizeChance = Math.random() * 100;
    const prizeChancePercent = 3;

    let targetSegmentIndex: number;
    if (prizeChance < prizeChancePercent) {
      targetSegmentIndex = PRIZE_INDEX;
    } else {
      const nonPrizeIndices = [0, 1, 2, 3, 5, 6, 7];
      targetSegmentIndex = nonPrizeIndices[Math.floor(Math.random() * nonPrizeIndices.length)];
    }

    const fullSpins = Math.floor(Math.random() * 4) + 5;
    const targetAngle = getRotationForSegment(targetSegmentIndex);
    const currentNormalized = ((rotation % 360) + 360) % 360;
    let additionalRotation = targetAngle - currentNormalized;
    if (additionalRotation <= 0) additionalRotation += 360;
    const variance = (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;
    const totalRotation = (fullSpins * 360) + additionalRotation + variance;
    const finalRotation = rotation + totalRotation;

    const startTime = Date.now();
    const duration = 5000;
    const startRotation = rotation;

    const animate = () => {
      if (wheelRef.current) (wheelRef.current as any).style.willChange = 'transform';
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRotation(startRotation + totalRotation * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (wheelRef.current) (wheelRef.current as any).style.willChange = 'auto';
        setRotation(finalRotation);

        setTimeout(() => {
          lastTimeRef.current = Date.now();
          setSpinning(false);
          const landedIndex = getSegmentAtPointer(finalRotation);
          const landedCategory = categories[landedIndex];
          setWinner(landedCategory.name);
          setWinningSegmentIndex(landedIndex);
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
            setWinningSegmentIndex(null);
          }, 2000);

          if (landedCategory.isPrize) {
            const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
            trackRouletteSpin(true, randomPrize.amount);
            handlePrizeWin(randomPrize);
          } else {
            trackRouletteSpin(false);
          }
        }, 100);
      }
    };

    requestAnimationFrame(animate);

    try {
      const backendResponse = await spinAPI.spin(fingerprint);
      if (backendResponse.success) {
        await loadSpinStats(fingerprint);
      } else {
        toast.error(backendResponse.data?.message || 'Rate limit exceeded');
      }
    } catch (error: any) {
      console.error('Backend spin validation error:', error);
    }
  };

  const handlePrizeWin = async (prize: any) => {
    setPrizeWon(prize);
    if (user) {
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
        toast.error('Prize won but failed to save. Please contact support.');
      }
    } else {
      try {
        const response = await spinAPI.createPendingPrize({
          fingerprint,
          result: prize.spinType,
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
    trackRouletteSignup();
    navigate('/signup', { state: { pendingPrize: true, fingerprint, from: 'spin-wheel' } });
  };

  const handleLogin = () => {
    navigate('/login', { state: { pendingPrize: true, fingerprint, from: 'spin-wheel' } });
  };

  const createSegmentPath = (index: number, total: number, outer: number, inner: number, cornerRadius: number = 8, gapDegrees: number = 2) => {
    const gapRad = (gapDegrees / 2) * (Math.PI / 180);
    const angle = (360 / total) * (Math.PI / 180);
    const startAngle = (index * 360 / total - 90) * (Math.PI / 180) + gapRad;
    const endAngle = startAngle + angle - (2 * gapRad);

    const outerCornerAngle = cornerRadius / outer;
    const innerCornerAngle = cornerRadius / inner;

    const outerStartMain = { x: 200 + outer * Math.cos(startAngle + outerCornerAngle), y: 200 + outer * Math.sin(startAngle + outerCornerAngle) };
    const outerEndMain = { x: 200 + outer * Math.cos(endAngle - outerCornerAngle), y: 200 + outer * Math.sin(endAngle - outerCornerAngle) };
    const innerStartMain = { x: 200 + inner * Math.cos(endAngle - innerCornerAngle), y: 200 + inner * Math.sin(endAngle - innerCornerAngle) };
    const innerEndMain = { x: 200 + inner * Math.cos(startAngle + innerCornerAngle), y: 200 + inner * Math.sin(startAngle + innerCornerAngle) };
    const outerStartCorner = { x: 200 + outer * Math.cos(startAngle), y: 200 + outer * Math.sin(startAngle) };
    const outerStartInner = { x: 200 + (outer - cornerRadius) * Math.cos(startAngle), y: 200 + (outer - cornerRadius) * Math.sin(startAngle) };
    const outerEndCorner = { x: 200 + outer * Math.cos(endAngle), y: 200 + outer * Math.sin(endAngle) };
    const outerEndInner = { x: 200 + (outer - cornerRadius) * Math.cos(endAngle), y: 200 + (outer - cornerRadius) * Math.sin(endAngle) };
    const innerStartCorner = { x: 200 + inner * Math.cos(endAngle), y: 200 + inner * Math.sin(endAngle) };
    const innerStartOuter = { x: 200 + (inner + cornerRadius) * Math.cos(endAngle), y: 200 + (inner + cornerRadius) * Math.sin(endAngle) };
    const innerEndCorner = { x: 200 + inner * Math.cos(startAngle), y: 200 + inner * Math.sin(startAngle) };
    const innerEndOuter = { x: 200 + (inner + cornerRadius) * Math.cos(startAngle), y: 200 + (inner + cornerRadius) * Math.sin(startAngle) };

    return `
      M ${outerStartInner.x} ${outerStartInner.y}
      Q ${outerStartCorner.x} ${outerStartCorner.y} ${outerStartMain.x} ${outerStartMain.y}
      A ${outer} ${outer} 0 0 1 ${outerEndMain.x} ${outerEndMain.y}
      Q ${outerEndCorner.x} ${outerEndCorner.y} ${outerEndInner.x} ${outerEndInner.y}
      L ${innerStartOuter.x} ${innerStartOuter.y}
      Q ${innerStartCorner.x} ${innerStartCorner.y} ${innerStartMain.x} ${innerStartMain.y}
      A ${inner} ${inner} 0 0 0 ${innerEndMain.x} ${innerEndMain.y}
      Q ${innerEndCorner.x} ${innerEndCorner.y} ${innerEndOuter.x} ${innerEndOuter.y}
      Z
    `;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #000000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  const canSpin = spinStats?.canSpin !== false;

  return (
    <div style={{ minHeight: '10vh' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        
        {/* Wheel container */}
        <div className='wheel-container' style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '0.5rem' : '1rem',
          maxHeight: isMobile ? '250px' : '370px',
          overflow: 'hidden',
        }}>
          
          {/* Info Button */}
          <button
            onClick={() => setShowHowItWorksModal(true)}
            style={{
              position: 'absolute',
              top: isMobile ? '-10px' : '100px',
              right: isMobile ? '-10px' : '100px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(156, 163, 175, 0.5)',
              transition: 'color 0.2s',
              zIndex: 20,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.5)'; }}
            title="How it works"
          >
            <Info size={isMobile ? 20 : 20} />
          </button>

          {/* ============================================ */}
{/* TRIANGLE INDICATOR AT TOP OF WHEEL */}
{/* ============================================ */}
<div
  style={{
    position: 'absolute',
    top: isMobile ? -30 : -8,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 5,
  }}
>
  {/* Outer triangle */}
  <div style={{
    width: `${isMobile ? 2.5 : 2.5}em`,
    height: `${isMobile ? 2.5 : 2.5}em`,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: '20%',
    transform: 'translateY(50%) rotate(210deg) skewY(30deg) scaleX(.866)',
    pointerEvents: 'none'
  }}>
    <div style={{
      width: `${isMobile ? 2.5 : 2.5}em`,
      height: `${isMobile ? 2.5 : 2.5}em`,
      position: 'absolute',
      background: '#4b4b4bff',
      pointerEvents: 'auto',
      borderRadius: '20% 20% 20% 53%',
      transform: 'scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(-42.3%) skewX(30deg) scaleY(.866) translateX(-24%)',
      }} />
    <div style={{
      width: `${isMobile ? 2.5 : 2.5}em`,
      height: `${isMobile ? 2.5 : 2.5}em`,
      position: 'absolute',
      background: '#10121a',
      pointerEvents: 'auto',
      borderRadius: '20% 20% 53% 20%',
      transform: 'scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(-42.3%) skewX(-30deg) scaleY(.866) translateX(24%)'
    }} />
  </div>
  
  {/* Inner triangle */}
  <div style={{ 
    position: 'absolute', 
    top: 25, 
    left: 0, 
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      width: `${isMobile ? 1.5 : 1.5}em`,
      height: `${isMobile ? 1.5 : 1.5}em`,
      overflow: 'hidden',
      position: 'relative',
      borderRadius: '20%',
      transform: 'translateY(50%) rotate(210deg) skewY(30deg) scaleX(.866)',
      pointerEvents: 'none'
    }}>
      <div style={{
        width: `${isMobile ? 1.5 : 1.5}em`,
        height: `${isMobile ? 1.5 : 1.5}em`,
        position: 'absolute',
        background: '#8c44f1',
        pointerEvents: 'auto',
        borderRadius: '20% 20% 20% 53%',
        transform: 'scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(-42.3%) skewX(30deg) scaleY(.866) translateX(-24%)'
      }} />
      <div style={{
        width: `${isMobile ? 1.5 : 1.5}em`,
        height: `${isMobile ? 1.5 : 1.5}em`,
        position: 'absolute',
        background: '#8c44f1',
        pointerEvents: 'auto',
        borderRadius: '20% 20% 53% 20%',
        transform: 'scaleX(1.155) skewY(-30deg) rotate(-30deg) translateY(-42.3%) skewX(-30deg) scaleY(.866) translateX(24%)'
      }} />
    </div>
  </div>
</div>

          <div style={{ position: 'relative', width: `${wheelSize}px`, height: `${wheelSize}px`, marginTop: isMobile ? 170 : 400 }}>
            <svg
              ref={wheelRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }}
              viewBox="0 0 400 400"
            >
              <defs>
                <linearGradient id="neonPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#5454557c' }} />
                  <stop offset="100%" style={{ stopColor: '#5454557c' }} />
                </linearGradient>
                <linearGradient id="prizeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
                  <stop offset="50%" style={{ stopColor: '#f59e0b' }} />
                  <stop offset="100%" style={{ stopColor: '#d97706' }} />
                </linearGradient>
              </defs>

              <circle cx="200" cy="200" r="196" fill="#191a22" stroke="url(#neonPurpleGradient)" strokeWidth="0.7" />

              {categories.map((category, index) => {
                const isPrize = category.isPrize;
                const isWinningAndBlinking = isBlinking && winningSegmentIndex === index;
                return (
                  <path
                    key={index}
                    d={createSegmentPath(index, NUM_SEGMENTS, outerRadius, innerRadius + innerGap)}
                    fill={isWinningAndBlinking ? category.hoverColor : (hoveredSegment === index ? category.hoverColor : category.color)}
                    stroke={isPrize ? "url(#prizeGradient)" : "url(#neonPurpleGradient)"}
                    strokeWidth="1"
                    style={{
                      cursor: isMobile ? 'default' : 'pointer',
                      transition: isWinningAndBlinking ? 'none' : 'fill 0.2s ease',
                      filter: isPrize ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' : 'none',
                      animation: isWinningAndBlinking ? 'segmentBlink 0.5s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={isMobile ? undefined : () => setHoveredSegment(index)}
                    onMouseLeave={isMobile ? undefined : () => setHoveredSegment(null)}
                  />
                );
              })}

              <circle cx="200" cy="200" r={innerRadius} fill="#07080d" stroke="url(#neonPurpleGradient)" strokeWidth="1" style={{ pointerEvents: 'none' }} />

              {categories.map((category, index) => {
                const midAngle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                const radians = (midAngle - 90) * (Math.PI / 180);
                const radius = (outerRadius + innerRadius + innerGap) / 2;
                const x = 200 + Math.cos(radians) * radius;
                const y = 200 + Math.sin(radians) * radius;
                const Icon = category.icon;

                return (
                  <g key={`icon-${index}`}>
                    <foreignObject x={x - 40} y={y - 40} width="80" height="80" transform={`rotate(${midAngle}, ${x}, ${y})`} style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Icon style={{ width: '1.55rem', height: '1.55rem', color: '#e3dfdf', marginBottom: '0.2rem' }} />
                        <span style={{ color: '#e3dfdf', fontSize: isMobile ? '0.84rem' : '0.6rem', fontWeight: isMobile ? '600' : 'bold', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {category.name}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* ============================================ */}
            {/* SIMPLIFIED CENTER BUTTON (No pear shape) */}
            {/* ============================================ */}
            <div style={{ position: 'absolute', top:  isMobile ? '50%' : '39%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={spinWheel}
                disabled={spinning || !canSpin}
                style={{
                  zIndex: 3,
                  width: `${spinButtonWidth}px`,
                  height: `${spinButtonHeight}px`,
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.85rem' : '1.1rem',
                  color: 'white',
                  background: (spinning || !canSpin) ? '#6b7280' : 'linear-gradient(145deg, #a855f7, #7c3aed)',
                  border: '4px solid #c084fc',
                  cursor: (spinning || !canSpin) ? 'not-allowed' : 'pointer',
                  boxShadow: (spinning || !canSpin) ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 0 30px rgba(168, 85, 247, 0.7), inset 0 2px 6px rgba(255,255,255,0.25)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => { if (!spinning && canSpin) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.9), inset 0 2px 6px rgba(255,255,255,0.25)'; }}}
                onMouseLeave={(e) => { if (!spinning && canSpin) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.7), inset 0 2px 6px rgba(255,255,255,0.25)'; }}}
              >
                {spinning ? '...' : !canSpin ? 'LIMIT' : 'SPIN'}
              </button>

              {spinStats && (
                <div style={{ display: 'flex', gap: isMobile ? '1rem' : '1.25rem', marginTop: '0.75rem' }}>
                  <button onClick={() => setShowHourlyModal(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(156, 163, 175, 0.6)', fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: '500', transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.9)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.6)'; }} title="Hourly spins remaining">
                    H:{spinStats.hourlyRemaining}
                  </button>
                  <button onClick={() => setShowDailyModal(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(156, 163, 175, 0.6)', fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: '500', transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.9)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(156, 163, 175, 0.6)'; }} title="Daily spins remaining">
                    D:{spinStats.dailyRemaining}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prize Modal (Logged-in users) */}
        {showPrizeModal && prizeWon && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <div style={{ background: 'linear-gradient(to bottom right, #facc15, #eab308, #ca8a04)', padding: '1px', borderRadius: '1rem', maxWidth: '28rem', width: '100%', animation: 'pulse 2s infinite' }}>
              <div style={{ background: '#112711ff', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
                <Gift style={{ width: isMobile ? '4rem' : '5rem', height: isMobile ? '4rem' : '5rem', color: '#facc15', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>🎉 WINNER! 🎉</h2>
                <p style={{ color: '#facc15', fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{prizeWon.description}</p>
                <p style={{ color: '#9ca3af', fontSize: isMobile ? '0.75rem' : '0.875rem', marginBottom: '1rem' }}>Check your prizes page to claim!</p>
                <button onClick={() => { setShowPrizeModal(false); navigate('/prizes'); }} style={{ background: 'linear-gradient(to right, #eab308, #ca8a04)', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>View Prizes</button>
              </div>
            </div>
          </div>
        )}

        {/* Register Modal (Anonymous users) */}
        {showRegisterModal && prizeWon && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <div style={{ background: 'linear-gradient(to bottom right, #facc15, #eab308)', padding: '1px', borderRadius: '1rem', maxWidth: '28rem', width: '100%' }}>
              <div style={{ background: '#1f2937', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
                <AlertCircle style={{ width: isMobile ? '3rem' : '4rem', height: isMobile ? '3rem' : '4rem', color: '#facc15', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Congratulations! 🎉</h2>
                <p style={{ color: '#facc15', fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>You won {prizeWon.description}!</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>Create an account or log in to claim your prize. Your prize will be held for 24 hours!</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                  <button onClick={handleRegister} style={{ background: 'linear-gradient(to right, #eab308, #ca8a04)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Create Account</button>
                  <button onClick={handleLogin} style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer', fontSize: '1rem' }}>Log In</button>
                  <button onClick={() => setShowRegisterModal(false)} style={{ background: 'transparent', color: '#9ca3af', padding: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>Maybe Later</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Modal */}
        {showHowItWorksModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowHowItWorksModal(false)}>
            <div style={{ background: '#1f2937', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '2rem', maxWidth: '500px', width: '100%', border: '1px solid #374151', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowHowItWorksModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
              <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '1rem' }}>How It Works</h3>
              <ul style={{ color: '#9ca3af', fontSize: isMobile ? '0.875rem' : '1rem', listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
                <li style={{ marginBottom: '0.75rem' }}>• Click "SPIN" to spin the roulette wheel</li>
                <li style={{ marginBottom: '0.75rem' }}>• Land on "Prize" to win cash prizes up to $100</li>
                <li style={{ marginBottom: '0.75rem' }}>• You get {config?.hourlyLimit || 100} spins per hour, {config?.dailyLimit || 500} per day</li>
                <li style={{ marginBottom: '0.75rem' }}>• Create an account to claim your prizes</li>
                <li>• Each spin is tracked to prevent abuse</li>
              </ul>
            </div>
          </div>
        )}

        {/* Hourly Modal */}
        {showHourlyModal && spinStats && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowHourlyModal(false)}>
            <div style={{ background: '#1f2937', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '2rem', maxWidth: '400px', width: '100%', border: '1px solid #374151', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Clock size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '0.5rem' }}>Hourly Spins</h3>
              <p style={{ color: '#9ca3af', fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{spinStats.hourlyRemaining}</p>
              <p style={{ color: '#6b7280', fontSize: isMobile ? '0.875rem' : '1rem' }}>spins remaining this hour</p>
            </div>
          </div>
        )}

        {/* Daily Modal */}
        {showDailyModal && spinStats && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowDailyModal(false)}>
            <div style={{ background: '#1f2937', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '2rem', maxWidth: '400px', width: '100%', border: '1px solid #374151', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Gift size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '0.5rem' }}>Daily Spins</h3>
              <p style={{ color: '#9ca3af', fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{spinStats.dailyRemaining}</p>
              <p style={{ color: '#6b7280', fontSize: isMobile ? '0.875rem' : '1rem' }}>spins remaining today</p>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
          @keyframes segmentBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        `}</style>
      </div>
    </div>
  );
};

export default RouletteSpinner;