import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { UniversalMedia } from '../components/UniversalMedia';
import { useHaptics } from '../hooks/useHaptics';
import { useUserStore } from '../store/userStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
}

type GameState = 'waiting' | 'countdown' | 'flying' | 'crashed' | 'cashing';

const ROCKET_LOTTIE_URL = 'https://cdn.jsdelivr.net/gh/sebastianusacom/banana-cases@2c2412ec6f4bd11b10d1f324952268d33beb3f6d/pepe.lottie';
const COUNTDOWN_TIME = 3;
const INTER_ROUND_TIME = 10;
const HOUSE_EDGE = 0.05; // 5% house edge

// Generate crash multiplier with 5% house edge
// Formula: P(crash before M) = 1 - (0.95 / M)
const generateCrashMultiplier = (): number => {
  const random = Math.random();
  // Inverse of the CDF: M = 0.95 / (1 - random)
  // This ensures expected value = 0.95
  const multiplier = 0.95 / (1 - random);
  return Math.max(1.01, Math.min(multiplier, 1000)); // Clamp between 1.01x and 1000x
};

const CrashGamePage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [interRoundCountdown, setInterRoundCountdown] = useState(INTER_ROUND_TIME);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const lastIntegerMultiplier = useRef(1);
  
  const { addStars, subtractStars, stars } = useUserStore();
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError } = useHaptics();
  const animationFrameRef = useRef<number>();
  const multiplierRef = useRef(1.0);
  const rocketControls = useAnimation();

  // Initialize particles
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.02,
    }));
    setParticles(initialParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((p) => {
          if (gameState === 'flying') {
            // Move particles to bottom left at an angle when rocket is flying
            return {
              ...p,
              x: (p.x - 0.15 + 100) % 100, // Move left
              y: (p.y + 0.1 + 100) % 100, // Move down
            };
          } else {
            // Static/moving slightly when no round
            return {
              ...p,
              x: (p.x + p.speedX + 100) % 100,
              y: (p.y + p.speedY + 100) % 100,
            };
          }
        })
      );
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    };

    animationFrameRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // Start new round
  const startNewRound = useCallback(() => {
    setGameState('countdown');
    setCountdown(COUNTDOWN_TIME);
    setMultiplier(1.0);
    multiplierRef.current = 1.0;
    lastIntegerMultiplier.current = 1;
    setCrashPoint(null);
    setHasBet(false);
    setCashedOut(false);
    setCashOutMultiplier(null);
    setRoundStartTime(null);
    setInterRoundCountdown(INTER_ROUND_TIME);
    rocketControls.set({ rotate: 0 });
    impactLight();
  }, [rocketControls, impactLight]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Start flying
            const newCrashPoint = generateCrashMultiplier();
            setCrashPoint(newCrashPoint);
            setGameState('flying');
            setRoundStartTime(Date.now());
            impactMedium();
            return COUNTDOWN_TIME;
          }
          impactLight();
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, impactLight, impactMedium]);

  // Multiplier animation during flight
  useEffect(() => {
    if (gameState === 'flying' && crashPoint) {
      const startTime = roundStartTime || Date.now();
      
      const updateMultiplier = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        // Exponential growth: multiplier = 1 + (crashPoint - 1) * (1 - e^(-t))
        const newMultiplier = 1 + (crashPoint - 1) * (1 - Math.exp(-elapsed * 0.5));
        
        if (newMultiplier >= crashPoint) {
          // Crashed
          setGameState('crashed');
          setMultiplier(crashPoint);
          multiplierRef.current = crashPoint;
          
          if (hasBet && !cashedOut) {
            // Player lost
            notificationError();
            impactHeavy();
          } else {
            impactMedium();
          }
          
          // Start inter-round countdown
          setInterRoundCountdown(INTER_ROUND_TIME);
        } else {
          setMultiplier(newMultiplier);
          multiplierRef.current = newMultiplier;
          
          // Haptic feedback as multiplier increases (every integer)
          const currentInteger = Math.floor(newMultiplier);
          if (currentInteger > lastIntegerMultiplier.current) {
            impactLight();
            lastIntegerMultiplier.current = currentInteger;
          }
          
          animationFrameRef.current = requestAnimationFrame(updateMultiplier);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateMultiplier);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [gameState, crashPoint, roundStartTime, hasBet, cashedOut, startNewRound, impactLight, impactMedium, impactHeavy, notificationError]);

  // Inter-round countdown timer
  useEffect(() => {
    if (gameState === 'crashed') {
      const timer = setInterval(() => {
        setInterRoundCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startNewRound();
            return INTER_ROUND_TIME;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, startNewRound]);

  // Rotate rocket based on multiplier
  useEffect(() => {
    if (gameState === 'flying' && crashPoint) {
      // Rotate rocket: 0° at 1x, 360° at crash point
      const rotation = ((multiplier - 1) / (crashPoint - 1)) * 360;
      rocketControls.set({ rotate: rotation });
    }
  }, [multiplier, crashPoint, gameState, rocketControls]);

  // Place bet
  const handlePlaceBet = () => {
    if (gameState !== 'waiting' && gameState !== 'countdown') return;
    if (stars < betAmount) {
      notificationError();
      return;
    }
    
    if (subtractStars(betAmount)) {
      setHasBet(true);
      impactMedium();
      notificationSuccess();
    }
  };

  // Cash out
  const handleCashOut = () => {
    if (gameState !== 'flying' || !hasBet || cashedOut) return;
    
    setCashedOut(true);
    setCashOutMultiplier(multiplier);
    setGameState('cashing');
    
    const winnings = Math.floor(betAmount * multiplier);
    addStars(winnings);
    
    impactHeavy();
    notificationSuccess();
  };

  // Initialize first round
  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const canBet = (gameState === 'waiting' || gameState === 'countdown') && !hasBet;
  const canCashOut = gameState === 'flying' && hasBet && !cashedOut;
  const displayMultiplier = cashedOut && cashOutMultiplier ? cashOutMultiplier : multiplier;

  return (
    <div className="flex-1 overflow-hidden relative h-full">
      {/* Particle Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transition: gameState === 'flying' ? 'none' : 'all 0.1s ease-out',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Rocket */}
        <motion.div
          animate={rocketControls}
          className="w-48 h-48 mb-8"
          style={{ transformOrigin: 'center center' }}
        >
          <UniversalMedia
            src={ROCKET_LOTTIE_URL}
            className="w-full h-full"
            loop={true}
            autoplay={true}
          />
        </motion.div>

        {/* Multiplier Display */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-6xl font-bold mb-2">
            {displayMultiplier.toFixed(2)}x
          </div>
          {cashedOut && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-400 text-lg font-semibold"
            >
              CASHED OUT!
            </motion.div>
          )}
          {gameState === 'crashed' && !cashedOut && hasBet && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-lg font-semibold"
            >
              CRASHED!
            </motion.div>
          )}
        </motion.div>

        {/* Countdown */}
        {gameState === 'countdown' && (
          <motion.div
            key={countdown}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-4xl font-bold mb-8"
          >
            {countdown}
          </motion.div>
        )}

        {/* Bet Controls */}
        <div className="w-full max-w-sm space-y-4">
          {/* Bet Amount Input */}
          {canBet && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={stars}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Math.min(stars, parseInt(e.target.value) || 1)))}
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
                <button
                  onClick={() => setBetAmount(Math.min(stars, betAmount * 2))}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  2x
                </button>
                <button
                  onClick={() => setBetAmount(stars)}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {canBet && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlaceBet}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors"
              >
                PLACE BET
              </motion.button>
            )}

            {canCashOut && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCashOut}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors"
              >
                CASH OUT
              </motion.button>
            )}

            {(gameState === 'waiting' || gameState === 'crashed') && !hasBet && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 bg-white/10 backdrop-blur-lg text-center py-4 px-6 rounded-2xl border border-white/20"
              >
                <div className="text-sm text-white/60">Next round in</div>
                <div className="text-lg font-semibold">
                  {gameState === 'crashed' ? `${interRoundCountdown}s` : 'Starting...'}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bet Info */}
          {hasBet && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Bet:</span>
                <span className="font-semibold">{betAmount} stars</span>
              </div>
              {cashedOut && cashOutMultiplier && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-white/60">Won:</span>
                  <span className="font-semibold text-green-400">
                    {Math.floor(betAmount * cashOutMultiplier)} stars
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrashGamePage;
