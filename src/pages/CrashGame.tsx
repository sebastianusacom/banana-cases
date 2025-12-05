import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, TrendingUp, Check, XCircle } from 'lucide-react';
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

interface PlayerBet {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  autoCashout: number | null;
  status?: 'active' | 'cashed_out' | 'lost';
  cashoutMultiplier?: number;
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

  const [showBetDrawer, setShowBetDrawer] = useState(false);
  const [pastMultipliers, setPastMultipliers] = useState<number[]>([]);
  const [currentBets, setCurrentBets] = useState<PlayerBet[]>([]);

  const gameIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Lottie animation rotation based on multiplier
  // Starts at 45 degrees (top right) and rotates to 0 degrees (top) as multiplier increases
  const getRotation = () => {
    if (gameState.phase === 'waiting') return 45;
    // Start at 45 degrees, rotate to 0 degrees as multiplier increases
    // At multiplier 1.00: 45 degrees
    // At multiplier 5.00: 0 degrees
    // Clamp to prevent negative rotation
    const rotation = 45 - (gameState.multiplier - 1) * (45 / 4);
    return Math.max(0, rotation);
  };

  // Calculate shake intensity based on multiplier
  const getShakeIntensity = () => {
    if (gameState.phase !== 'flying') return 0;
    // Shake intensity increases with multiplier
    // At 1x: no shake, at 5x: max shake (5px)
    const intensity = Math.max(0, (gameState.multiplier - 1) * 1.25);
    return Math.min(intensity, 5); // Cap at 5px
  };

  const placeBet = () => {
    if (gameState.phase === 'flying' || gameState.hasBet) return;
    if (!subtractStars(gameState.betAmount)) {
      notificationError();
      return;
    }

    // Add player to current bets list
    setCurrentBets(prev => [
      ...prev,
      {
        id: 'player',
        username: 'You',
        avatar: '⭐',
        betAmount: gameState.betAmount,
        autoCashout: gameState.autoCashout,
        status: 'active' as const,
      }
    ]);

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

    // Mark player bet as cashed out instead of removing it
    setCurrentBets(prev => prev.map(bet => 
      bet.id === 'player' 
        ? { ...bet, status: 'cashed_out' as const, cashoutMultiplier: gameState.multiplier }
        : bet
    ));

    setGameState(prev => ({
      ...prev,
      hasBet: false,
      winnings: winnings - prev.betAmount,
    }));
  };

  const startRound = () => {
    // Allow starting from waiting or crashed phase
    if (gameState.phase !== 'waiting' && gameState.phase !== 'crashed') return;

    // Clear any existing game interval
    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }

    // Reset game state for new round
    setGameState(prev => ({
      ...prev,
      phase: 'flying',
      multiplier: 1.00,
      winnings: 0,
      hasBet: prev.hasBet, // Keep bet state if user has bet
      nextRoundIn: 0, // Reset countdown
    }));

    // Keep only active bets, clear old ones (lost/cashed_out)
    setCurrentBets(prev => {
      return prev.filter(bet => bet.status === 'active');
    });

    // Start the crash game simulation
    let currentMultiplier = 1.00;
    let lastMilestone = 1;
    let hasCrashed = false; // Flag to prevent multiple crash handlers

    gameIntervalRef.current = window.setInterval(() => {
      // Prevent updates if already crashed
      if (hasCrashed) {
        if (gameIntervalRef.current) {
          window.clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = null;
        }
        return;
      }

      // Calculate crash probability - increases gradually with multiplier
      // Formula ensures crashes happen at various multipliers, not just near 1.00x
      // Probability starts at 0 when multiplier is 1.00x and increases linearly
      // This creates a fair distribution where crashes can happen at any multiplier
      const crashProbability = (currentMultiplier - 1) * 0.0005; // 0.05% per multiplier point above 1.00x
      const crashChance = Math.random();
      const shouldCrash = crashChance < crashProbability || currentMultiplier > 100;

      if (shouldCrash) {
        hasCrashed = true;
        
        // Capture the exact crash multiplier before clearing interval
        const crashedMultiplier = Math.round(currentMultiplier * 100) / 100;
        
        // Clear interval immediately
        if (gameIntervalRef.current) {
          window.clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = null;
        }

        // Update state atomically - set crashed phase and freeze multiplier
        setGameState(prev => ({
          ...prev,
          phase: 'crashed',
          multiplier: crashedMultiplier, // Freeze at crash value
          nextRoundIn: 0, // Start at 0, will be set to 10 after delay
        }));

        // Add crashed multiplier to history - most recent always on the left, keep max 5 old ones
        setPastMultipliers(prev => [crashedMultiplier, ...prev.slice(0, 5)]); // Keep max 6 total (1 most recent + 5 old)

        // Mark all active bets as lost
        setCurrentBets(prev => prev.map(bet => 
          bet.status === 'active' 
            ? { ...bet, status: 'lost' as const }
            : bet
        ));

        // Dramatic crash haptics
        impactHeavy();
        setTimeout(() => impactHeavy(), 100);
        setTimeout(() => impactHeavy(), 200);
        
        // Delay before starting countdown (4 seconds)
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            phase: 'waiting', // Change to waiting phase when countdown starts
            nextRoundIn: 10,
          }));
          // Clear lost bets when countdown starts
          setCurrentBets(prev => prev.filter(bet => bet.status !== 'lost'));
        }, 4000);
        
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
        // Don't update if already crashed
        if (prev.phase === 'crashed') {
          return prev;
        }

        // Auto cashout if set
        if (prev.autoCashout && roundedMultiplier >= prev.autoCashout && prev.hasBet) {
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
    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Only start countdown if waiting, and nextRoundIn is greater than 0
    if (gameState.phase === 'waiting' && gameState.nextRoundIn > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setGameState(prev => {
          // Don't countdown if not in waiting phase
          if (prev.phase !== 'waiting') {
            return prev;
          }

          if (prev.nextRoundIn <= 1) {
            // Clear interval before starting new round
            if (countdownIntervalRef.current) {
              window.clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            // Exciting round start haptics
            impactLight();
            setTimeout(() => impactMedium(), 150);
            // Start new round immediately
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
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [gameState.phase, gameState.nextRoundIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) window.clearInterval(gameIntervalRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f10] overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 w-full py-4">
        {/* Animated Star Field Background */}
        <StarField isFlying={gameState.phase === 'flying'} />
        {/* Game Display */}
        <div className="text-center mb-6 w-full flex flex-col items-center">
          <div className="relative mb-6">
            {/* Intermission Time Display - Big and centered when waiting */}
            {gameState.phase === 'waiting' && gameState.nextRoundIn > 0 ? (
              <div className="flex items-center justify-center w-48 h-48 mx-auto">
                <div className="text-8xl font-black text-white drop-shadow-2xl animate-pulse">
                  {gameState.nextRoundIn}
                </div>
              </div>
            ) : (
              <>
                {/* Lottie Rocket Animation */}
                <motion.div
                  className={`w-75 h-75 mx-auto ${
                    gameState.phase === 'crashed' ? 'opacity-50' : ''
                  }`}
                  style={{
                    rotate: getRotation(),
                  }}
                  animate={
                    gameState.phase === 'flying'
                      ? {
                          x: [
                            -getShakeIntensity(),
                            getShakeIntensity(),
                            -getShakeIntensity(),
                            getShakeIntensity(),
                            -getShakeIntensity(),
                            0,
                          ],
                          y: [
                            -getShakeIntensity() * 0.7,
                            getShakeIntensity() * 0.7,
                            -getShakeIntensity() * 0.7,
                            getShakeIntensity() * 0.7,
                            -getShakeIntensity() * 0.7,
                            0,
                          ],
                        }
                      : { x: 0, y: 0 }
                  }
                  transition={{
                    duration: 0.1,
                    repeat: Infinity,
                    ease: 'linear',
                    x: {
                      duration: 0.1,
                      repeat: Infinity,
                    },
                    y: {
                      duration: 0.1,
                      repeat: Infinity,
                    },
                  }}
                >
                  <UniversalMedia
                    src="https://cdn.jsdelivr.net/gh/sebastianusacom/banana-cases@main/Stellar%20Rocket%20%2323888.lottie"
                    className="w-full h-full"
                    loop={gameState.phase === 'flying'}
                    autoplay={gameState.phase === 'flying'}
                  />
                </motion.div>
              </>
            )}
          </div>

          {/* Multiplier History Capsules */}
          <div className="mb-4">
            <div className="flex gap-2 justify-center overflow-x-auto pb-2 max-w-full">
              {/* Active multiplier (first capsule) */}
              <motion.div
                key="active-multiplier"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-white text-black"
              >
                {gameState.phase === 'waiting'
                  ? 'WAITING' 
                  : gameState.phase === 'crashed'
                  ? `${gameState.multiplier.toFixed(2)}x`
                  : gameState.phase === 'flying'
                  ? `${gameState.multiplier.toFixed(2)}x`
                  : 'WAITING'}
              </motion.div>
              {/* Past multipliers */}
              {pastMultipliers.slice(0, 4).map((multiplier, index) => (
                <motion.div
                  key={`multiplier-${multiplier}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-white/10 text-white/60"
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
              ))}
            </div>
          </div>

          {/* Current Bets List - Always Visible */}
          <div className="w-full max-w-sm mb-4">
            <div className="bg-white/5 rounded-xl p-4 min-h-[120px] max-h-40 overflow-y-auto">
              {currentBets.length === 0 ? (
                <div className="text-white/40 text-center py-8 text-sm">
                  No bets placed yet
                </div>
              ) : (
                <div className="space-y-3">
                  {currentBets.map((bet, index) => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-white/15 transition-colors ${
                        bet.status === 'cashed_out' 
                          ? 'bg-green-500/10' 
                          : bet.status === 'lost'
                          ? 'bg-red-500/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{bet.avatar}</span>
                        <span className="text-white text-sm font-medium">{bet.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">
                          {bet.status === 'active' && gameState.phase === 'flying'
                            ? `${Math.floor(bet.betAmount * gameState.multiplier)}⭐`
                            : `${bet.betAmount}⭐`}
                        </span>
                        {bet.autoCashout && bet.status === 'active' && (
                          <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full font-semibold border border-yellow-400/30">
                            @{bet.autoCashout}x
                          </span>
                        )}
                        {bet.status === 'cashed_out' && bet.cashoutMultiplier && (
                          <div className="flex items-center gap-1 text-green-400">
                            <Check size={16} className="text-green-400" />
                            <span className="text-xs font-semibold">{bet.cashoutMultiplier.toFixed(2)}x</span>
                          </div>
                        )}
                        {bet.status === 'lost' && (
                          <XCircle size={16} className="text-red-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-full z-30 pb-30 bg-[#0f0f10]">
        <div className="w-full max-w-md mx-auto px-4 space-y-4">
          {/* Bet/Cash Out Button */}
          {gameState.hasBet && gameState.phase === 'flying' ? (
            <button
              onClick={cashout}
              className="w-full h-14 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white font-bold rounded-2xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all"
            >
              Cash Out ({Math.floor(gameState.betAmount * gameState.multiplier)} ⭐)
            </button>
          ) : (
            <button
              onClick={() => setShowBetDrawer(true)}
              disabled={gameState.phase === 'flying'}
              className="w-full h-14 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Flame size={20} />
              <span>Place Bet</span>
            </button>
          )}

        </div>
      </div>

      {/* Bet Drawer */}
      <AnimatePresence>
        {showBetDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBetDrawer(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-[2rem] z-50 border-t border-white/10 max-h-[80vh] flex flex-col"
            >
              <div className="p-6 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Place Your Bet</h3>
                  <button
                    onClick={() => setShowBetDrawer(false)}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Balance Display */}
                  <div className="text-center">
                    <div className="text-white/40 text-sm uppercase tracking-wide">Balance</div>
                    <div className="text-white font-bold text-2xl flex items-center justify-center gap-1">
                      {stars} <span className="text-yellow-400">⭐</span>
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div>
                    <label className="block text-white/80 text-sm mb-3 uppercase tracking-wide">Bet Amount</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={gameState.betAmount}
                        onChange={(e) => setGameState(prev => ({ ...prev, betAmount: parseInt(e.target.value) || 0 }))}
                        disabled={gameState.phase === 'flying' || gameState.hasBet}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 disabled:opacity-50 transition-colors text-lg"
                        min="1"
                        max={stars}
                      />
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount * 2, stars) }))}
                        disabled={gameState.phase === 'flying' || gameState.hasBet}
                        className="bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-50 text-yellow-400 disabled:text-white/20 font-bold px-4 py-3 rounded-xl border border-yellow-500/20 disabled:border-white/5 transition-colors"
                      >
                        2x
                      </button>
                    </div>
                  </div>

                  {/* Auto Cashout */}
                  <div>
                    <label className="block text-white/80 text-sm mb-3 uppercase tracking-wide">Auto Cashout (optional)</label>
                    <input
                      type="number"
                      value={gameState.autoCashout || ''}
                      onChange={(e) => setGameState(prev => ({
                        ...prev,
                        autoCashout: e.target.value ? parseFloat(e.target.value) : null
                      }))}
                      disabled={gameState.phase === 'flying' || gameState.hasBet}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 disabled:opacity-50 transition-colors text-lg"
                      placeholder="Leave empty for manual"
                      min="1.01"
                      step="0.01"
                    />
                  </div>

                  {/* Place Bet Button */}
                  <button
                    onClick={() => {
                      placeBet();
                      setShowBetDrawer(false);
                    }}
                    disabled={gameState.phase === 'flying' || gameState.hasBet || gameState.betAmount > stars || gameState.betAmount <= 0}
                    className="w-full h-14 bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all text-lg"
                  >
                    Place Bet ({gameState.betAmount} ⭐)
                  </button>

                  {/* Game Stats */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={16} className="text-white/60" />
                      <span className="text-white/80 text-sm font-semibold">Recent Multipliers</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {pastMultipliers.slice(0, 5).map((multiplier, index) => (
                        <span
                          key={`recent-${multiplier}-${index}`}
                          className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm"
                        >
                          {multiplier.toFixed(2)}x
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrashGame;