import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Check, XCircle, Star } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { UniversalMedia } from '../components/UniversalMedia';
import StarField from '../components/StarField';
import { useCrashGameStore } from '../store/crashGameStore';

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
  status?: 'active' | 'cashed_out' | 'lost' | 'queued';
  cashoutMultiplier?: number;
}

const CrashGame: React.FC = () => {
  const { stars, subtractStars, addStars } = useUserStore();
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError } = useHaptics();
  const { setGameState: setCrashGameStore } = useCrashGameStore();

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
  const lastFlyingHapticRef = useRef<number>(0);

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
    if (gameState.hasBet) return;
    if (!subtractStars(gameState.betAmount)) {
      notificationError();
      return;
    }

    // Add player to current bets list
    const betStatus: PlayerBet['status'] = gameState.phase === 'flying' ? 'queued' : 'active';
    const newBet = {
      id: 'player',
      username: 'You',
      avatar: '⭐',
      betAmount: gameState.betAmount,
      autoCashout: gameState.autoCashout,
      status: betStatus,
    };

    setCurrentBets(prev => [...prev, newBet]);

    // Cool betting haptics - multiple impacts for excitement
    impactLight();
    setTimeout(() => impactMedium(), 100);
  };

  const cancelBet = () => {
    // Check if player has an active or queued bet
    const playerBet = currentBets.find(
      bet => bet.id === 'player' && (bet.status === 'active' || bet.status === 'queued')
    );
    
    if (!playerBet) return;

    // Return the stars to the player
    const betAmount = playerBet.betAmount;
    addStars(betAmount);

    // Remove the bet from current bets
    setCurrentBets(prev => prev.filter(bet => bet.id !== 'player'));

    // Reset game state
    setGameState(prev => ({
      ...prev,
      hasBet: false,
      betAmount: 10, // Reset to default
      autoCashout: null,
    }));
  };

  const cashout = () => {
    // Only allow cashout for active bets during flying phase
    const playerBet = currentBets.find(
      bet => bet.id === 'player' && bet.status === 'active'
    );
    if (gameState.phase !== 'flying' || !playerBet) return;

    const winnings = Math.floor(playerBet.betAmount * gameState.multiplier);
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
      winnings: winnings - playerBet.betAmount,
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

    // Keep active bets and activate queued bets, clear old ones (lost/cashed_out)
    setCurrentBets(prev => {
      return prev.map(bet => {
        if (bet.status === 'queued') {
          return { ...bet, status: 'active' as const };
        }
        return bet;
      }).filter(bet => bet.status !== 'lost' && bet.status !== 'cashed_out');
    });

    // Reset flying haptic timer for new round
    lastFlyingHapticRef.current = Date.now();

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

        // Mark all active bets as lost, keep queued bets for next round
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

      // Continuous flying haptics - subtle vibration every ~0.5 seconds
      const now = Date.now();
      const hapticInterval = 500; // Haptic every 500ms
      
      if (now - lastFlyingHapticRef.current >= hapticInterval) {
        // Intensity increases slightly with multiplier
        if (roundedMultiplier >= 5) {
          impactMedium(); // Stronger haptics at higher multipliers
        } else {
          impactLight(); // Light haptics during normal flight
        }
        lastFlyingHapticRef.current = now;
      }

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

          // Countdown tick haptics for all numbers
          // Stronger haptics as countdown approaches zero
          if (prev.nextRoundIn <= 3) {
            impactMedium(); // Stronger for final 3 seconds
          } else if (prev.nextRoundIn <= 5) {
            impactLight(); // Medium for 4-5 seconds
          } else {
            impactLight(); // Light for 6-10 seconds
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

  // Keep hasBet synchronized with actual bet state
  useEffect(() => {
    const playerBet = currentBets.find(
      bet => bet.id === 'player' && (bet.status === 'active' || bet.status === 'queued')
    );
    const shouldHaveBet = !!playerBet;

    if (gameState.hasBet !== shouldHaveBet) {
      setGameState(prev => ({ ...prev, hasBet: shouldHaveBet }));
    }
  }, [currentBets, gameState.hasBet]);

  // Sync game state with global store for BottomNav
  useEffect(() => {
    const playerBet = currentBets.find(
      bet => bet.id === 'player' && (bet.status === 'active' || bet.status === 'queued')
    );
    const hasActiveBet = !!playerBet;
    setCrashGameStore(hasActiveBet, gameState.phase);
  }, [currentBets, gameState.phase, setCrashGameStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) window.clearInterval(gameIntervalRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
      // Reset store when component unmounts
      setCrashGameStore(false, 'waiting');
    };
  }, [setCrashGameStore]);

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
                    src="https://cdn.jsdelivr.net/gh/sebastianusacom/banana-cases@main/Stellar%20Rocket%20%2323888-2.lottie"
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
            <div className="bg-white/5 rounded-2xl p-4 min-h-[120px] max-h-40 overflow-y-auto">
              {currentBets.length === 0 ? (
                <div className="text-white/40 text-center py-8 text-sm">
                  No bets placed yet
                </div>
              ) : (
                <div className="space-y-3">
                  {currentBets.map((bet, index) => {
                    const isQueuedAndWaiting = bet.status === 'queued' && gameState.phase === 'waiting';
                    return (
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
                            : bet.status === 'queued' && !isQueuedAndWaiting
                            ? 'bg-yellow-500/10'
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
                          {bet.autoCashout && (bet.status === 'active' || bet.status === 'queued') && (
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
                          {bet.status === 'queued' && !isQueuedAndWaiting && (
                            <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/20 px-2 py-1 rounded-full border border-yellow-400/30">
                              Next Round
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-full z-30 pb-30 bg-[#0f0f10]">
        <div className="w-full max-w-md mx-auto px-4 space-y-4">
          {/* Bet/Cash Out/Cancel Button */}
          {(() => {
            const playerBet = currentBets.find(
              bet => bet.id === 'player' && (bet.status === 'active' || bet.status === 'queued')
            );
            const hasActiveBet = !!playerBet;
            const canCashOut = playerBet?.status === 'active' && gameState.phase === 'flying';

            if (canCashOut) {
              return (
                <motion.button
                  onClick={cashout}
                  className="w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden group bg-gradient-to-b from-[#eab308] to-[#ca8a04] text-white shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 border-t border-white/20"
                >
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear", repeatDelay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 skew-x-12 pointer-events-none"
                  />
                  <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                    <span className="uppercase tracking-wide font-black text-lg opacity-90">
                      CASH OUT
                    </span>
                    <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                      <span className="text-white font-black text-2xl drop-shadow-sm leading-none">{Math.floor(gameState.betAmount * gameState.multiplier)}</span>
                      <Star size={22} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                    </div>
                  </div>
                </motion.button>
              );
            } else if (hasActiveBet) {
              return (
                <button
                  onClick={cancelBet}
                  className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  <span>Cancel Bet</span>
                </button>
              );
            } else {
              return (
                <button
                  onClick={() => setShowBetDrawer(true)}
                  className="w-full h-14 bg-white hover:bg-white/90 text-black font-bold rounded-2xl shadow-lg shadow-white/20 hover:shadow-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <Flame size={20} />
                  <span>Place Bet</span>
                </button>
              );
            }
          })()}

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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-2xl z-[60] max-h-[70vh] flex flex-col"
            >
              <div className="p-6 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-center mb-4 relative">
                  <h3 className="text-lg font-semibold text-white/90">Place Bet</h3>
                  <button
                    onClick={() => setShowBetDrawer(false)}
                    className="absolute right-0 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  {/* Bet Amount Display */}
                  <div className="text-center py-3">
                    <input
                      type="number"
                      value={gameState.betAmount || ''}
                        onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseInt(value, 10);
                        setGameState(prev => ({ ...prev, betAmount: Math.max(0, numValue) }));
                      }}
                      disabled={gameState.hasBet}
                      className="text-center text-white text-3xl font-bold bg-transparent border-none outline-none w-full placeholder-white/30 disabled:opacity-50"
                      min="1"
                      max={stars}
                    />
                    <div className="text-yellow-400 text-lg mt-1">⭐</div>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="flex justify-center">
                    <div className="bg-white/5 rounded-full p-1 flex gap-1">
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 100, stars) }))}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +100
                      </button>
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 500, stars) }))}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +500
                      </button>
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 2500, stars) }))}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +2500
                      </button>
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount * 2, stars) }))}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-30 text-yellow-400 disabled:text-white/20 rounded-full font-medium transition-colors text-sm"
                      >
                        2x
                      </button>
                    </div>
                  </div>

                  {/* Auto Cashout */}
                  <div className="flex items-center justify-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={!!gameState.autoCashout}
                        onChange={(e) => setGameState(prev => ({
                          ...prev,
                          autoCashout: e.target.checked ? (prev.autoCashout || 2.00) : null
                        }))}
                        disabled={gameState.hasBet}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-green-500 checked:border-green-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-white/70 text-xs uppercase tracking-wider">Auto</span>
                    </label>

                    {gameState.autoCashout && (
                      <>
                        {/* Preset Multipliers */}
                        <div className="bg-white/5 rounded-full p-1 flex gap-1 flex-shrink-0">
                          {[1.5, 2.0, 5.0].map((multiplier) => (
                            <button
                              key={multiplier}
                              onClick={() => setGameState(prev => ({ ...prev, autoCashout: multiplier }))}
                              disabled={gameState.hasBet}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                gameState.autoCashout === multiplier
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              } disabled:opacity-50`}
                            >
                              {multiplier}x
                            </button>
                          ))}
                        </div>

                        {/* Custom Multiplier Input */}
                        <div className="flex items-center bg-white/5 rounded-full px-1 py-1 gap-1">
                          <button
                            onClick={() => setGameState(prev => ({
                              ...prev,
                              autoCashout: Math.max(1.01, (prev.autoCashout || 0) - 1)
                            }))}
                            disabled={gameState.hasBet}
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white/70 hover:text-white flex items-center justify-center text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <div className="px-2 py-1 text-white text-sm font-medium min-w-12 text-center">
                            {gameState.autoCashout?.toFixed(1)}x
                          </div>
                          <button
                            onClick={() => setGameState(prev => ({
                              ...prev,
                              autoCashout: (prev.autoCashout || 0) + 1
                            }))}
                            disabled={gameState.hasBet}
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white/70 hover:text-white flex items-center justify-center text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Place Bet Button */}
                  <button
                    onClick={() => {
                      placeBet();
                      setShowBetDrawer(false);
                    }}
                    disabled={gameState.hasBet || gameState.betAmount > stars || gameState.betAmount <= 0}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-base flex items-center justify-center mt-2"
                  >
                    {gameState.phase === 'flying' ? `Bet for Next Round (${gameState.betAmount} ⭐)` : `Place Bet (${gameState.betAmount} ⭐)`}
                  </button>
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