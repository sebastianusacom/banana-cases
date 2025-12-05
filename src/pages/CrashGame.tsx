import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { UniversalMedia } from '../components/UniversalMedia';
import StarField from '../components/StarField';

interface GameState {
  phase: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  betAmount: number;
  autoCashout: number | null;
  hasBet: boolean;
  winnings: number;
  nextRoundIn: number;
}

const CrashGame: React.FC = () => {
  const { stars, subtractStars, addStars } = useUserStore();
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError } = useHaptics();

  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    multiplier: 1.00,
    betAmount: 10,
    autoCashout: null,
    hasBet: false,
    winnings: 0,
    nextRoundIn: 10,
  });

  const gameIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Lottie animation rotation based on multiplier
  const getRotation = () => {
    if (gameState.phase === 'waiting') return 0;
    return (gameState.multiplier - 1) * 360; // Full rotation per multiplier point
  };

  const placeBet = () => {
    if (gameState.phase !== 'waiting' || gameState.hasBet) return;
    if (!subtractStars(gameState.betAmount)) {
      notificationError();
      return;
    }

    // Cool betting haptics - multiple impacts for excitement
    impactLight();
    setTimeout(() => impactMedium(), 100);
    setGameState(prev => ({ ...prev, hasBet: true }));
  };

  const cashout = () => {
    if (gameState.phase !== 'flying' || !gameState.hasBet) return;

    const winnings = Math.floor(gameState.betAmount * gameState.multiplier);
    addStars(winnings);

    // Exciting cashout haptics - success with celebration
    notificationSuccess();
    setTimeout(() => impactLight(), 200);
    setTimeout(() => impactMedium(), 300);

    setGameState(prev => ({
      ...prev,
      hasBet: false,
      winnings: winnings - prev.betAmount,
    }));
  };

  const startRound = () => {
    if (gameState.phase !== 'waiting') return;

    setGameState(prev => ({
      ...prev,
      phase: 'flying',
      multiplier: 1.00,
      winnings: 0,
    }));

    // Start the crash game simulation
    let currentMultiplier = 1.00;
    const houseEdge = 0.05; // 5% house edge
    let lastMilestone = 1;

    gameIntervalRef.current = window.setInterval(() => {
      // Calculate crash probability with house edge
      const crashChance = Math.random();
      const shouldCrash = crashChance < houseEdge || currentMultiplier > 100;

      if (shouldCrash) {
        // Dramatic crash haptics
        impactHeavy();
        setTimeout(() => impactHeavy(), 100);
        setTimeout(() => impactHeavy(), 200);
        setGameState(prev => ({ ...prev, phase: 'crashed' }));
        if (gameIntervalRef.current) window.clearInterval(gameIntervalRef.current);
        return;
      }

      // Increase multiplier exponentially (typical crash game mechanics)
      const growthRate = 1.002; // Slightly slower growth for better gameplay
      currentMultiplier *= growthRate;

      const roundedMultiplier = Math.round(currentMultiplier * 100) / 100;

      // Milestone haptics - celebrate big multipliers
      const currentMilestone = Math.floor(roundedMultiplier);
      if (currentMilestone > lastMilestone && currentMilestone >= 2) {
        if (currentMilestone >= 10) {
          impactHeavy(); // Big milestone
        } else if (currentMilestone >= 5) {
          impactMedium(); // Medium milestone
        } else {
          impactLight(); // Small milestone
        }
        lastMilestone = currentMilestone;
      }

      setGameState(prev => {
        // Auto cashout if set
        if (prev.autoCashout && roundedMultiplier >= prev.autoCashout) {
          // Auto cashout haptics
          setTimeout(() => cashout(), 100);
        }

        return {
          ...prev,
          multiplier: roundedMultiplier,
        };
      });
    }, 50); // Update every 50ms for smooth animation
  };


  // Handle countdown between rounds
  useEffect(() => {
    if (gameState.phase === 'crashed' || (gameState.phase === 'waiting' && !gameState.hasBet)) {
      countdownIntervalRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.nextRoundIn <= 1) {
            if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
            // Exciting round start haptics
            impactLight();
            setTimeout(() => impactMedium(), 150);
            startRound();
            return prev;
          }

          // Countdown tick haptics (subtle)
          if (prev.nextRoundIn <= 3) {
            impactLight();
          }

          return { ...prev, nextRoundIn: prev.nextRoundIn - 1 };
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, [gameState.phase, gameState.hasBet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) window.clearInterval(gameIntervalRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f10] overflow-hidden min-h-0">
      {/* Animated Star Field Background */}
      <StarField isFlying={gameState.phase === 'flying'} />

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 w-full py-2">
        <div className="w-full flex flex-col items-center justify-center gap-2 h-full">
          {/* Game Display */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              {/* Lottie Rocket Animation */}
              <div
                className="w-48 h-48 mx-auto transition-transform duration-100"
                style={{
                  transform: `rotate(${getRotation()}deg)`,
                }}
              >
                <UniversalMedia
                  src="https://cdn.jsdelivr.net/gh/sebastianusacom/banana-cases@2c2412ec6f4bd11b10d1f324952268d33beb3f6d/pepe.lottie"
                  className="w-full h-full"
                  loop={gameState.phase === 'waiting'}
                  autoplay={true}
                />
              </div>

              {/* Multiplier Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-6xl font-bold text-white drop-shadow-2xl transition-all duration-200 ${
                  gameState.phase === 'flying' ? 'scale-110' : ''
                }`}>
                  {gameState.phase === 'crashed' ? 'CRASHED!' : `${gameState.multiplier.toFixed(2)}x`}
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="text-white/80 text-lg mb-6">
              {gameState.phase === 'waiting' && gameState.nextRoundIn > 0 && (
                <div>Next round in {gameState.nextRoundIn}s</div>
              )}
              {gameState.phase === 'flying' && (
                <div className="text-green-400 font-semibold">FLYING!</div>
              )}
              {gameState.phase === 'crashed' && (
                <div className="text-red-400 font-semibold">BOOM!</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Betting Interface */}
      <div className="flex-shrink-0 w-full z-30 pb-4 bg-[#0f0f10]">
        <div className="w-full max-w-md mx-auto px-4 space-y-2">
          {/* Balance Display */}
          <div className="text-center mb-4 bg-white/5 rounded-2xl p-4">
            <div className="text-white/60 text-sm uppercase tracking-wide font-medium">Balance</div>
            <div className="text-white font-bold text-2xl flex items-center justify-center gap-2 mt-1">
              {stars} <span className="text-yellow-400">⭐</span>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <label className="block text-white/80 text-sm font-medium uppercase tracking-wide">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={gameState.betAmount}
                onChange={(e) => setGameState(prev => ({ ...prev, betAmount: parseInt(e.target.value) || 0 }))}
                disabled={gameState.phase !== 'waiting' || gameState.hasBet}
                className="flex-1 bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 disabled:opacity-50 transition-colors focus:border-white/20 focus:outline-none"
                min="1"
                max={stars}
              />
              <button
                onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount * 2, stars) }))}
                disabled={gameState.phase !== 'waiting' || gameState.hasBet}
                className="bg-gradient-to-b from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] disabled:opacity-50 text-black font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 border border-white/20"
              >
                2x
              </button>
            </div>
          </div>

          {/* Auto Cashout */}
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <label className="block text-white/80 text-sm font-medium uppercase tracking-wide">Auto Cashout <span className="text-white/40">(optional)</span></label>
            <input
              type="number"
              value={gameState.autoCashout || ''}
              onChange={(e) => setGameState(prev => ({
                ...prev,
                autoCashout: e.target.value ? parseFloat(e.target.value) : null
              }))}
              disabled={gameState.phase !== 'waiting' || gameState.hasBet}
              className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 disabled:opacity-50 transition-colors focus:border-white/20 focus:outline-none"
              placeholder="Leave empty for manual"
              min="1.01"
              step="0.01"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!gameState.hasBet ? (
              <button
                onClick={placeBet}
                disabled={gameState.phase !== 'waiting' || gameState.betAmount > stars || gameState.betAmount <= 0}
                className="flex-1 bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 border border-white/20"
              >
                Place Bet ({gameState.betAmount} ⭐)
              </button>
            ) : (
              <button
                onClick={cashout}
                disabled={gameState.phase !== 'flying'}
                className="flex-1 bg-gradient-to-b from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 border border-white/20"
              >
                Cash Out ({Math.floor(gameState.betAmount * gameState.multiplier)} ⭐)
              </button>
            )}
          </div>

          {/* Winnings Display */}
          {gameState.winnings > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
              <div className="text-green-400 font-bold text-lg">
                +{gameState.winnings} ⭐ won!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrashGame;