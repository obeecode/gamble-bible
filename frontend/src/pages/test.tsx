import React, { useState, useRef, useEffect } from 'react';
import { Gift, TrendingUp, Newspaper, Star, DollarSign } from 'lucide-react';

const RouletteSpinner = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeWon, setPrizeWon] = useState(null);
  const wheelRef = useRef(null);

  const categories = [
    { name: 'Casinos', icon: Star, color: 'bg-red-600' },
    { name: 'Reviews', icon: TrendingUp, color: 'bg-black' },
    { name: 'News', icon: Newspaper, color: 'bg-red-600' },
    { name: 'Bonuses', icon: Gift, color: 'bg-black' },
    { name: 'Prize', icon: DollarSign, color: 'bg-green-600', isPrize: true },
    { name: 'Guides', icon: Star, color: 'bg-red-600' },
    { name: 'Sports', icon: TrendingUp, color: 'bg-black' },
    { name: 'Slots', icon: Star, color: 'bg-red-600' }
  ];

  const prizes = [
    { type: 'cash', amount: 0.50, description: '$0.50 Cash Prize' },
    { type: 'cash', amount: 0.25, description: '$0.25 Cash Prize' },
    { type: 'cash', amount: 1.00, description: '$1.00 Cash Prize!' },
    { type: 'bonus', amount: 5, description: '$5 Bet Account Funding' },
    { type: 'points', amount: 100, description: '100 GB Points' }
  ];

  const segmentAngle = 360 / categories.length;

  const spinWheel = () => {
    if (spinning) return;
    
    setSpinning(true);
    setWinner(null);
    setShowPrizeModal(false);

    // Random spins between 5-8 full rotations plus landing position
    const minSpins = 5;
    const maxSpins = 8;
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    
    // Determine which segment to land on
    const winningIndex = Math.floor(Math.random() * categories.length);
    const targetAngle = spins * 360 + (winningIndex * segmentAngle) + (segmentAngle / 2);
    
    // Use requestAnimationFrame for smooth animation
    const startTime = Date.now();
    const duration = 5000; // 5 seconds for the spin
    const startRotation = rotation;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for deceleration (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = startRotation + (targetAngle * eased);
      setRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const normalizedRotation = currentRotation % 360;
        const winningSegment = Math.floor((360 - normalizedRotation + segmentAngle/2) / segmentAngle) % categories.length;
        setWinner(categories[winningSegment].name);
        
        // If prize won, show modal
        if (categories[winningSegment].isPrize) {
          const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
          setPrizeWon(randomPrize);
          setTimeout(() => setShowPrizeModal(true), 500);
        }
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">GambleBible.com</h1>
          <p className="text-gray-400">Spin the wheel for a chance to win prizes!</p>
        </div>

        {/* Roulette Wheel */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Pointer at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-lg"></div>
          </div>

          {/* Winning segment highlighter */}
          {!spinning && winner && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse border-2 border-yellow-300">
                {winner}
              </div>
            </div>
          )}

          {/* Wheel Container */}
          <div className="relative w-96 h-96">
            <div
              ref={wheelRef}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `rotate(${rotation}deg)`
              }}
            >
              {/* Gold rim */}
              <div className="absolute inset-0 rounded-full border-8 border-yellow-500 shadow-2xl"></div>
              
              {/* Segments */}
              {categories.map((category, index) => {
                const Icon = category.icon;
                const angle = index * segmentAngle;
                const midAngle = angle + segmentAngle / 2;
                const radians = (midAngle - 90) * (Math.PI / 180);
                const radius = 120;
                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                return (
                  <div
                    key={index}
                    className={`absolute inset-0 ${category.color}`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + segmentAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + segmentAngle - 90) * Math.PI / 180)}%)`
                    }}
                  >
                    <div
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <Icon className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-xs font-bold whitespace-nowrap">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Center circle */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="text-center mb-6">
          <button
            onClick={spinWheel}
            disabled={spinning}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              spinning
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            } text-white`}
          >
            {spinning ? 'SPINNING...' : 'SPIN ME!'}
          </button>
        </div>

        {/* Result Display */}
        {winner && !showPrizeModal && (
          <div className="text-center">
            <div className="inline-block bg-gray-800 px-6 py-3 rounded-lg border-2 border-yellow-500">
              <p className="text-white text-lg">
                Landed on: <span className="font-bold text-yellow-400">{winner}</span>
              </p>
            </div>
          </div>
        )}

        {/* Prize Modal */}
        {showPrizeModal && prizeWon && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-1 rounded-2xl max-w-md w-full animate-pulse">
              <div className="bg-gray-900 rounded-2xl p-8 text-center">
                <div className="mb-6">
                  <Gift className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">🎉 WINNER! 🎉</h2>
                  <p className="text-yellow-400 text-xl font-bold mb-4">{prizeWon.description}</p>
                  <p className="text-gray-400 text-sm">
                    {prizeWon.type === 'bonus' 
                      ? 'Create an account to claim your bonus!'
                      : prizeWon.type === 'points'
                      ? 'Points added to your GB account'
                      : 'Prize will be sent to your account'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPrizeModal(false)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  Claim Prize
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-3">How It Works</h3>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>• Click "Spin Me" to spin the roulette wheel</li>
            <li>• Land on "Prize" to win cash, bonuses, or GB points</li>
            <li>• Daily prize pool: $50</li>
            <li>• Each spin is completely random</li>
            <li>• Create an account to claim your prizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RouletteSpinner;