import { useState, useRef, useEffect } from 'react';
import { Gift, Dices, Star, BadgeDollarSign, AlertCircle, Clock, BookOpenText, MessagesSquare, Gamepad2, Volleyball } from 'lucide-react';
import { spinAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrCreateFingerprint } from '../utils/fingerprintUtils';


const RouletteSpinner = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [winningSegmentIndex, setWinningSegmentIndex] = useState<number | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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
    '#e74c3c', // Reviews - Red
    '#3498db', // Casinos - Blue
    '#9b59b6', // Betting Sites - Purple
    '#1abc9c', // Bonuses - Teal
    '#f39c12', // Prize - Brighter Gold
    '#e91e63', // Games - Pink
    '#00bcd4', // Guides - Cyan
    '#8bc34a', // Forum - Light Green
  ];


  // 8 categories - all #212128 except Prize (#f59e0b)
  const categories = [
    { name: 'Reviews', icon: Star, color: '#212128', hoverColor: hoverColors[0] },
    { name: 'Casinos', icon: Dices, color: '#212128', hoverColor: hoverColors[1] },
    { name: 'Betting Sites', icon: Volleyball, color: '#212128', hoverColor: hoverColors[2] },
    { name: 'Bonuses', icon: Gift, color: '#212128', hoverColor: hoverColors[3] },
    { name: 'Prize', icon: BadgeDollarSign, color: '#f59e0b', hoverColor: hoverColors[4], isPrize: true },
    { name: 'Games', icon: Gamepad2, color: '#212128', hoverColor: hoverColors[5] },
    { name: 'Guides', icon: BookOpenText, color: '#212128', hoverColor: hoverColors[6] },
    { name: 'Forum', icon: MessagesSquare, color: '#212128', hoverColor: hoverColors[7] }
  ];


  const PRIZE_INDEX = 4;
  const NUM_SEGMENTS = 8;
  const SEGMENT_ANGLE = 360 / NUM_SEGMENTS; // 45°


  // Prize definitions
  const prizes = [
    { type: 'cash', spinType: 'small_cash', amount: 5, description: '$5 Cash Prize' },
    { type: 'cash', spinType: 'small_cash', amount: 10, description: '$10 Cash Prize' },
    { type: 'cash', spinType: 'medium_cash', amount: 25, description: '$25 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 50, description: '$50 Cash Prize' },
    { type: 'cash', spinType: 'large_cash', amount: 100, description: '$100 Cash Prize!' },
  ];


  const outerRadius = 188;
  const innerRadius = 88; // Compact center
  const innerGap = 6.5; // Gap between segments and inner circle


  // ============================================
  // PEAR BUTTON SIZE CONTROL
  // Change this single value to scale the entire button component
  // ============================================
  const pearButtonScale = isMobile ? 0.7 : 1.25; // 1.0 = base size, 1.5 = 50% larger, 0.8 = 20% smaller
 
  // Base dimensions (at scale 1.0)
  const basePearWidth = 120;
  const basePearHeight = 135;
  const baseSpinButtonSize = 90;
  const baseSpinButtonBottom = 15;
 
  // Calculated dimensions based on scale
  const pearWidth = Math.round(basePearWidth * pearButtonScale);
  const pearHeight = Math.round(basePearHeight * pearButtonScale);
  const spinButtonSize = Math.round(baseSpinButtonSize * pearButtonScale);
  const spinButtonBottom = Math.round(baseSpinButtonBottom * pearButtonScale);


  // Wheel size
  const wheelSize = isMobile ? 320 : 550;


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


  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };


    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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


  // Idle rotation
  useEffect(() => {
  const targetFPS = isMobile ? 24 : 60;
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = Date.now();
  let currentRotation = rotation; // Local variable
  const rotationSpeed = isMobile ? 7 : 12;

  const idleRotate = () => {
    if (!spinning && wheelRef.current) {
      const now = Date.now();
      const elapsed = now - lastFrameTime;
      
      if (elapsed >= frameInterval) {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        currentRotation += (rotationSpeed / 1000) * delta;
        
        // Direct DOM manipulation (no React re-render)
        (wheelRef.current as any).style.transform = `rotate(${currentRotation}deg)`;
        
        lastFrameTime = now - (elapsed % frameInterval);
      }
    }
    idleAnimationRef.current = requestAnimationFrame(idleRotate);
  };
  
  idleAnimationRef.current = requestAnimationFrame(idleRotate);
  
  return () => {
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
    }
  };
}, [spinning, isMobile]);

  /**
   * CORRECTED ROTATION LOGIC
   *
   * Based on empirical testing:
   * - At rotation 0°, pointer is between Forum(7) and Reviews(0)
   * - At rotation 22.5°, pointer is at CENTER of Forum(7)
   * - As rotation increases, segments go BACKWARDS (7→6→5→4...)
   *
   * Formula: segment = (NUM_SEGMENTS - 1 - floor(rotation / SEGMENT_ANGLE)) % NUM_SEGMENTS
   */
  const getSegmentAtPointer = (rotationDegrees: number): number => {
    let normalized = ((rotationDegrees % 360) + 360) % 360;
    const segmentIndex = (NUM_SEGMENTS - 1 - Math.floor(normalized / SEGMENT_ANGLE)) % NUM_SEGMENTS;
    return (segmentIndex + NUM_SEGMENTS) % NUM_SEGMENTS;
  };


  const getRotationForSegment = (targetSegment: number): number => {
    // To land on segment N with center under pointer:
    // rotation = ((NUM_SEGMENTS - 1 - N + NUM_SEGMENTS) % NUM_SEGMENTS) * SEGMENT_ANGLE + SEGMENT_ANGLE/2
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


    // ====================================
    // DETERMINE OUTCOME
    // ====================================
    const prizeChance = Math.random() * 100;
    const prizeChancePercent = 8; // 8% chance for prize
   
    let targetSegmentIndex: number;
   
    if (prizeChance < prizeChancePercent) {
      // Prize win!
      targetSegmentIndex = PRIZE_INDEX;
    } else {
      // Random non-prize segment
      const nonPrizeIndices = [0, 1, 2, 3, 5, 6, 7];
      targetSegmentIndex = nonPrizeIndices[Math.floor(Math.random() * nonPrizeIndices.length)];
    }


    // ====================================
    // CALCULATE ROTATION
    // ====================================
    const fullSpins = Math.floor(Math.random() * 4) + 5; // 5-8 spins
    const targetAngle = getRotationForSegment(targetSegmentIndex);
   
    // Current position normalized
    const currentNormalized = ((rotation % 360) + 360) % 360;
   
    // Calculate additional rotation needed
    let additionalRotation = targetAngle - currentNormalized;
    if (additionalRotation <= 0) additionalRotation += 360;
   
    // Add variance within segment (±30% of segment width from center)
    const variance = (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;
   
    const totalRotation = (fullSpins * 360) + additionalRotation + variance;
    const finalRotation = rotation + totalRotation;


    // ====================================
    // ANIMATE
    // ====================================
    const startTime = Date.now();
    const duration = 5000;
    const startRotation = rotation;
   
    const animate = () => {
  // Enable hardware acceleration hint
  if (wheelRef.current) {
    (wheelRef.current as any).style.willChange = 'transform';
  }
 
  const elapsed = Date.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
 
  setRotation(startRotation + totalRotation * eased);
 
  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    // Remove hardware acceleration hint
    if (wheelRef.current) {
      (wheelRef.current as any).style.willChange = 'auto';
    }
   
    setRotation(finalRotation);
   
    setTimeout(() => {
      lastTimeRef.current = Date.now();
      setSpinning(false);
         
          // Determine actual landed segment using corrected formula
          const landedIndex = getSegmentAtPointer(finalRotation);
          const landedCategory = categories[landedIndex];
         
          setWinner(landedCategory.name);
         
          // Start blinking effect
          setWinningSegmentIndex(landedIndex);
          setIsBlinking(true);
         
          // Stop blinking after 2 seconds
          setTimeout(() => {
            setIsBlinking(false);
            setWinningSegmentIndex(null);
          }, 2000);
         
          // Handle prize win
          if (landedCategory.isPrize) {
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
        toast.error('Prize won but failed to save. Please contact support with timestamp: ' + new Date().toISOString());
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


  const createSegmentPath = (index: number, total: number, outer: number, inner: number, cornerRadius: number = 8, gapDegrees: number = 2) => {
    const gapRad = (gapDegrees / 2) * (Math.PI / 180); // Half gap on each side
    const angle = (360 / total) * (Math.PI / 180);
    const startAngle = (index * 360 / total - 90) * (Math.PI / 180) + gapRad;
    const endAngle = startAngle + angle - (2 * gapRad);
   
    // Calculate corner offset angles based on radius
    const outerCornerAngle = cornerRadius / outer;
    const innerCornerAngle = cornerRadius / inner;
   
    // Outer arc points (with offset for rounded corners)
    const outerStartMain = {
      x: 200 + outer * Math.cos(startAngle + outerCornerAngle),
      y: 200 + outer * Math.sin(startAngle + outerCornerAngle)
    };
    const outerEndMain = {
      x: 200 + outer * Math.cos(endAngle - outerCornerAngle),
      y: 200 + outer * Math.sin(endAngle - outerCornerAngle)
    };
   
    // Inner arc points (with offset for rounded corners)
    const innerStartMain = {
      x: 200 + inner * Math.cos(endAngle - innerCornerAngle),
      y: 200 + inner * Math.sin(endAngle - innerCornerAngle)
    };
    const innerEndMain = {
      x: 200 + inner * Math.cos(startAngle + innerCornerAngle),
      y: 200 + inner * Math.sin(startAngle + innerCornerAngle)
    };
   
    // Corner control points for quadratic curves
    // Outer start corner
    const outerStartCorner = {
      x: 200 + outer * Math.cos(startAngle),
      y: 200 + outer * Math.sin(startAngle)
    };
    const outerStartInner = {
      x: 200 + (outer - cornerRadius) * Math.cos(startAngle),
      y: 200 + (outer - cornerRadius) * Math.sin(startAngle)
    };
   
    // Outer end corner
    const outerEndCorner = {
      x: 200 + outer * Math.cos(endAngle),
      y: 200 + outer * Math.sin(endAngle)
    };
    const outerEndInner = {
      x: 200 + (outer - cornerRadius) * Math.cos(endAngle),
      y: 200 + (outer - cornerRadius) * Math.sin(endAngle)
    };
   
    // Inner start corner (at endAngle)
    const innerStartCorner = {
      x: 200 + inner * Math.cos(endAngle),
      y: 200 + inner * Math.sin(endAngle)
    };
    const innerStartOuter = {
      x: 200 + (inner + cornerRadius) * Math.cos(endAngle),
      y: 200 + (inner + cornerRadius) * Math.sin(endAngle)
    };
   
    // Inner end corner (at startAngle)
    const innerEndCorner = {
      x: 200 + inner * Math.cos(startAngle),
      y: 200 + inner * Math.sin(startAngle)
    };
    const innerEndOuter = {
      x: 200 + (inner + cornerRadius) * Math.cos(startAngle),
      y: 200 + (inner + cornerRadius) * Math.sin(startAngle)
    };


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
            position: 'relative',
            width: `${wheelSize}px`,
            height: `${wheelSize}px`
          }}>
            <svg
  ref={wheelRef}
  style={{
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    willChange: 'transform',  // ← Tells browser to optimize
    backfaceVisibility: 'hidden',  // ← Prevents flickering
    WebkitBackfaceVisibility: 'hidden',  // ← iOS Safari
    perspective: 1000,  // ← Enables 3D hardware acceleration
    WebkitPerspective: 1000  // ← iOS Safari
  }}
              viewBox="0 0 400 400"
            >
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="neonPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                </linearGradient>
               
                <linearGradient id="prizeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                </linearGradient>


                {/* Glow filter with extended boundaries */}
                <filter id="innerCircleGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
  <feColorMatrix
    in="blur"
    type="matrix"
    values="0 0 0 0 0.753
            0 0 0 0 0.231
            0 0 0 0 0.933
            0 0 0 0.6 0"
    result="coloredBlur"
  />
  <feMerge>
    <feMergeNode in="coloredBlur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
              </defs>
             
              {/* Outer ring with neon purple gradient */}
              <circle
                cx="200"
                cy="200"
                r="196"
                fill="#212128"
                stroke="url(#neonPurpleGradient)"
                strokeWidth="0.7"
                style={{
                  filter: 'drop-shadow(0 0 3.5px rgba(168, 85, 247, 0.8))'
                }}
              />
             
              {/* Segments with hover effect */}
              {categories.map((category, index) => {
  const isPrize = category.isPrize;
  const isWinningAndBlinking = isBlinking && winningSegmentIndex === index;
  return (
    <path
      key={index}
      d={createSegmentPath(index, NUM_SEGMENTS, outerRadius, innerRadius + innerGap)}
      fill={isWinningAndBlinking ? category.hoverColor : (hoveredSegment === index ? category.hoverColor : category.color)}
      stroke={isPrize ? "url(#prizeGradient)" : "url(#neonPurpleGradient)"}
      strokeWidth={isPrize ? "1" : "1"}
      style={{ 
        cursor: isMobile ? 'default' : 'pointer',  // No pointer on mobile
        transition: isWinningAndBlinking ? 'none' : 'fill 0.2s ease',
        filter: isPrize ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' : 'none',
        animation: isWinningAndBlinking ? 'segmentBlink 0.5s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={isMobile ? undefined : () => setHoveredSegment(index)}  // Disable on mobile
      onMouseLeave={isMobile ? undefined : () => setHoveredSegment(null)}  // Disable on mobile
    />
  );
})}


             


              {/* Inner circle with proper glow filter */}
              <circle
                cx="200"
                cy="200"
                r={innerRadius}
                fill="#212128"
                stroke="url(#neonPurpleGradient)"
                strokeWidth="1"
                filter="url(#innerCircleGlow)"
                style={{ pointerEvents: 'none' }}
              />


              {/* Category icons and text */}
              {categories.map((category, index) => {
                const midAngle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                const radians = (midAngle - 90) * (Math.PI / 180);
                const radius = (outerRadius + innerRadius + innerGap) / 2;
                const x = 200 + Math.cos(radians) * radius;
                const y = 200 + Math.sin(radians) * radius;
                const Icon = category.icon;


                return (
                  <g key={`icon-${index}`}>
                    <foreignObject
                      x={x - 40}
                      y={y - 40}
                      width="80"
                      height="80"
                      transform={`rotate(${midAngle}, ${x}, ${y})`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}>
                        {/* Roulette category icon styles*/}
                        <Icon style={{
                          width: isMobile ? '1.55rem' : '1.75rem',
                          height: isMobile ? '1.55rem' : '1.75rem',
                          color: 'white',
                          marginBottom: '0.2rem'
                        }} />
                        {/* Roulette category text styles*/}
                        <span style={{
                          color: 'white',
                          fontSize: isMobile ? '0.84rem' : '0.7rem',
                          fontWeight: isMobile ? '600': 'bold',
                          whiteSpace: 'nowrap',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {category.name}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>


            {/* Pear-shaped button container with integrated arrow top */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: `${pearWidth}px`,
                height: `${pearHeight}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Pulsing glow ring */}
              <div style={{
                position: 'absolute',
                width: `${pearWidth + 20}px`,
                height: `${pearHeight + 20}px`,
                borderRadius: '60% 60% 50% 50% / 60% 60% 40% 40%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
                animation: spinning ? 'none' : 'pulse 2s ease-in-out infinite',
                zIndex: 0
              }} />
             
              {/* SVG pear shape with arrow top */}
              <svg
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
                viewBox="0 0 120 160"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="pearShapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#7c3aed', stopOpacity: 0.5 }} />
                    <stop offset="50%" style={{ stopColor: '#9333ea', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 0.5 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M 60 2
                     L 72 20
                     C 76 28, 78 36, 81 46
                     C 84 58, 88 70, 91 82
                     C 94 94, 95 105, 89 118
                     C 83 131, 72 137, 60 137
                     C 48 137, 37 131, 31 118
                     C 25 105, 26 94, 29 82
                     C 32 70, 36 58, 39 46
                     C 42 36, 44 28, 48 20
                     L 60 2 Z"
                  fill="url(#pearShapeGradient)"
                  stroke="#c084fc"
                  strokeWidth="3"
                  strokeLinejoin="miter"
                  style={{
                    filter: 'drop-shadow(0 4px 10px rgba(168, 85, 247, 0.5))'
                  }}
                />
              </svg>
             
              {/* Circular SPIN button */}
              <button
                onClick={spinWheel}
                disabled={spinning || !canSpin}
                style={{
                  position: 'absolute',
                  bottom: `${spinButtonBottom}px`,
                  zIndex: 3,
                  width: `${spinButtonSize}px`,
                  height: `${spinButtonSize}px`,
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  fontSize: `${spinButtonSize / 5.5}px`,
                  color: 'white',
                  background: (spinning || !canSpin)
                    ? '#6b7280'
                    : 'linear-gradient(145deg, #a855f7, #7c3aed)',
                  border: '4px solid #c084fc',
                  cursor: (spinning || !canSpin) ? 'not-allowed' : 'pointer',
                  boxShadow: (spinning || !canSpin)
                    ? '0 4px 15px rgba(0, 0, 0, 0.3)'
                    : '0 0 30px rgba(168, 85, 247, 0.7), inset 0 2px 6px rgba(255,255,255,0.25)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  if (!spinning && canSpin) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.9), inset 0 2px 6px rgba(255,255,255,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!spinning && canSpin) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.7), inset 0 2px 6px rgba(255,255,255,0.25)';
                  }
                }}
              >
                {spinning ? '...' : !canSpin ? 'LIMIT' : 'SPIN'}
              </button>
            </div>
          </div>
        </div>


        {/* Result display */}
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
                Landed on: <span style={{ fontWeight: 'bold', color: '#facc15' }}>{winner}</span>
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


        {/* How It Works */}
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
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Click "Spin" to spin the roulette wheel</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Land on "Prize" to win cash prizes up to $100</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• You get {config?.hourlyLimit || 100} spins per hour, {config?.dailyLimit || 500} per day</li>
            <li style={{ marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>• Create an account to claim your prizes</li>
            <li>• Each spin is tracked to prevent abuse</li>
          </ul>
        </div>


        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          @keyframes segmentBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
        `}</style>
      </div>
    </div>
  );
};


export default RouletteSpinner;



