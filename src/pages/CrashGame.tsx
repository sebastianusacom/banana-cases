import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Check, XCircle, Star, WifiOff } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { UniversalMedia } from '../components/UniversalMedia';
import StarField from '../components/StarField';
import { useCrashGameStore } from '../store/crashGameStore';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../api/client';

interface GameState {
  phase: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  betAmount: number;
  autoCashout: number | null;
  hasBet: boolean;
  winnings: number;
  nextRoundIn: number;
  gameId: string | null;
}

interface PlayerBet {
  id: string;
  username: string;
  avatar?: string;
  avatarUrl?: string;
  betAmount: number;
  autoCashout: number | null;
  status?: 'active' | 'cashed_out' | 'lost' | 'queued';
  cashoutMultiplier?: number;
}

const MAX_BET = 10000;
const COUNTDOWN_TICK_MS = 900; 

const CrashGame: React.FC = () => {
  const { stars, subtractStars, addStars, userId } = useUserStore(); 
  const {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    crashImpact,
  } = useHaptics();
  const { user } = useTelegram();
  const { setGameState: setCrashGameStore } = useCrashGameStore();

  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    multiplier: 1.00,
    betAmount: 50,
    autoCashout: null,
    hasBet: false,
    winnings: 0,
    nextRoundIn: 10,
    gameId: null,
  });

  const [showBetDrawer, setShowBetDrawer] = useState(false);
  const [pastMultipliers, setPastMultipliers] = useState<number[]>([]);
  const [currentBets, setCurrentBets] = useState<PlayerBet[]>([]);
  const [highPing, setHighPing] = useState(false);
  const [pingMs, setPingMs] = useState(0);

  const gameIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const lastFlyingHapticRef = useRef<number>(0);
  const pingIntervalRef = useRef<number | null>(null);
  const isCashingOutRef = useRef(false);

  // Ping check logic
  useEffect(() => {
    const checkPing = async () => {
      if (!userId) return;
      const start = Date.now();
      try {
        // We can use getUser as a lightweight ping
        await api.getUser(userId);
        const latency = Date.now() - start;
        setPingMs(latency);
        setHighPing(latency > 300); // Alert if > 300ms
      } catch (e) {
        setHighPing(true);
      }
    };

    // Check initially and then every 10 seconds
    checkPing();
    pingIntervalRef.current = window.setInterval(checkPing, 10000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [userId]);

  const getRotation = () => {
    if (gameState.phase === 'waiting') return 45;
    const rotation = 45 - (gameState.multiplier - 1) * (45 / 4);
    return Math.max(0, rotation);
  };

  const getShakeIntensity = () => {
    if (gameState.phase !== 'flying') return 0;
    const intensity = Math.max(0, (gameState.multiplier - 1) * 1.25);
    return Math.min(intensity, 5); 
  };

  const placeBet = async () => {
    if (gameState.hasBet || !userId) return; // Require userId
    
    // Optimistic UI update first
    if (!subtractStars(gameState.betAmount)) {
      notificationError();
      return;
    }

    // Call API
    try {
        const response = await api.placeBet(userId, gameState.betAmount, gameState.autoCashout);
        
        if (response.gameId) {
             setGameState(prev => ({ ...prev, gameId: response.gameId }));
        } else {
             // Rollback if failed
             addStars(gameState.betAmount);
             notificationError();
             return;
        }
    } catch (e) {
        console.error(e);
        addStars(gameState.betAmount);
        notificationError();
        return;
    }

    const betStatus: PlayerBet['status'] = gameState.phase === 'flying' ? 'queued' : 'active';
    const userAvatarUrl = user?.photo_url;
    const newBet = {
      id: 'player',
      username: user?.first_name || 'You',
      avatar: '⭐',
      avatarUrl: userAvatarUrl || undefined,
      betAmount: gameState.betAmount,
      autoCashout: gameState.autoCashout,
      status: betStatus,
    };

    setCurrentBets(prev => [...prev, newBet]);

    impactLight();
    setTimeout(() => impactMedium(), 100);
  };

  const cancelBet = () => {
    // Note: Cancel API is not implemented yet in backend for MVP
    // So we just refund locally if it was queued.
    const playerBet = currentBets.find(
      bet => bet.id === 'player' && (bet.status === 'active' || bet.status === 'queued')
    );
    
    if (!playerBet) return;

    const betAmount = playerBet.betAmount;
    addStars(betAmount);

    setCurrentBets(prev => prev.filter(bet => bet.id !== 'player'));

    setGameState(prev => ({
      ...prev,
      hasBet: false,
      betAmount: 50, 
      autoCashout: null,
      gameId: null
    }));
  };

  const cashout = async () => {
    if (isCashingOutRef.current) return;

    const playerBet = currentBets.find(
      bet => bet.id === 'player' && bet.status === 'active'
    );
    if (gameState.phase !== 'flying' || !playerBet || !gameState.gameId || !userId) return;

    isCashingOutRef.current = true;

    // Call API to cashout
    try {
        const result = await api.cashout(userId, gameState.gameId);
        
        if (result.status === 'WON') {
            const winnings = result.winnings;
            addStars(winnings);
            
            notificationSuccess();
            setTimeout(() => impactLight(), 200);
            setTimeout(() => impactMedium(), 300);

            setCurrentBets(prev => prev.map(bet =>
              bet.id === 'player'
                ? { ...bet, status: 'cashed_out' as const, cashoutMultiplier: result.multiplier }
                : bet
            ));

            setGameState(prev => ({
              ...prev,
              hasBet: false,
              winnings: winnings - playerBet.betAmount,
            }));
        } else if (result.status === 'CRASHED') {
            // Server says we crashed! Even if client didn't see it yet.
            // Force crash locally
             handleCrash(result.crashPoint);
        }
    } catch (e) {
        console.error("Cashout failed", e);
    } finally {
        isCashingOutRef.current = false;
    }
  };

  const handleCrash = (crashValue: number) => {
        // Clear interval immediately
        if (gameIntervalRef.current) {
          window.clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = null;
        }

        setGameState(prev => ({
          ...prev,
          phase: 'crashed',
          multiplier: crashValue,
          nextRoundIn: 0, 
        }));

        setPastMultipliers(prev => [crashValue, ...prev.slice(0, 5)]);

        setCurrentBets(prev => prev.map(bet =>
          bet.status === 'active'
            ? { ...bet, status: 'lost' as const }
            : bet
        ));

        crashImpact(crashValue);
        
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            phase: 'waiting', 
            nextRoundIn: 10,
          }));
          setCurrentBets(prev => prev.filter(bet => {
            if (bet.id === 'player' && (bet.status === 'lost' || bet.status === 'cashed_out')) {
              return false;
            }
            return bet.status !== 'lost';
          }));
        }, 4000);
  }

  const startRound = () => {
    if (gameState.phase !== 'waiting' && gameState.phase !== 'crashed') return;

    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }

    setGameState(prev => ({
      ...prev,
      phase: 'flying',
      multiplier: 1.00,
      winnings: 0,
      hasBet: prev.hasBet, 
      nextRoundIn: 0, 
    }));

    setCurrentBets(prev => {
      return prev.map(bet => {
        if (bet.status === 'queued') {
          return { ...bet, status: 'active' as const };
        }
        return bet;
      }).filter(bet => {
        if (bet.id === 'player' && (bet.status === 'lost' || bet.status === 'cashed_out')) {
          return false;
        }
        return bet.status !== 'lost' && bet.status !== 'cashed_out';
      });
    });

    lastFlyingHapticRef.current = Date.now();

    let currentMultiplier = 1.00;
    let lastMilestone = 1;
    let hasCrashed = false; 

    gameIntervalRef.current = window.setInterval(() => {
      if (hasCrashed) {
        if (gameIntervalRef.current) {
          window.clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = null;
        }
        return;
      }

      // Simulation only for visual feedback
      // In real app, we should ideally listen to WebSocket for crashes
      // But for this HTTP MVP, we act as the "Server Simulation" locally too
      // However, the REAL check is on cashout.
      
      const crashProbability = (currentMultiplier - 1) * 0.0005; 
      const crashChance = Math.random();
      const shouldCrash = crashChance < crashProbability || currentMultiplier > 100;

      if (shouldCrash) {
        hasCrashed = true;
        const crashedMultiplier = Math.round(currentMultiplier * 100) / 100;
        handleCrash(crashedMultiplier);
        return;
      }

      const growthRate = 1.006; 
      currentMultiplier *= growthRate;

      const roundedMultiplier = Math.round(currentMultiplier * 100) / 100;

      const now = Date.now();
      const hapticInterval = 500; 
      
      if (now - lastFlyingHapticRef.current >= hapticInterval) {
        if (roundedMultiplier >= 5) {
          impactMedium(); 
        } else {
          impactLight(); 
        }
        lastFlyingHapticRef.current = now;
      }

      const currentMilestone = Math.floor(roundedMultiplier);
      if (currentMilestone > lastMilestone && currentMilestone >= 2) {
        if (currentMilestone >= 10) {
          impactHeavy(); 
        } else if (currentMilestone >= 5) {
          impactMedium(); 
        } else {
          impactLight(); 
        }
        lastMilestone = currentMilestone;
      }

      setGameState(prev => {
        if (prev.phase === 'crashed') return prev;

        return {
          ...prev,
          multiplier: roundedMultiplier,
        };
      });
    }, 50); 
  };

  // Auto Cashout Check
  useEffect(() => {
    if (gameState.phase === 'flying' && gameState.autoCashout && gameState.hasBet && gameState.gameId) {
        // Check if we hit the target
        if (gameState.multiplier >= gameState.autoCashout) {
             const playerBet = currentBets.find(b => b.id === 'player');
             if (playerBet && playerBet.status === 'active' && !isCashingOutRef.current) {
                 cashout();
             }
        }
    }
  }, [gameState.multiplier, gameState.autoCashout, gameState.phase, gameState.hasBet, gameState.gameId, currentBets]);

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
      }, COUNTDOWN_TICK_MS);
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
        {/* High Ping Alert */}
        <AnimatePresence>
          {highPing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
            >
              <WifiOff size={16} className="text-red-400 animate-pulse" />
              <span className="text-red-200 text-xs font-bold uppercase tracking-wide">
                High Ping {pingMs > 0 && <span className="opacity-60 ml-1">{pingMs}ms</span>}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
          <div className="w-full max-w-sm mb-4 space-y-3">
            {/* Player's Bet - Separate Container */}
            {(() => {
              const playerBet = currentBets.find(bet => bet.id === 'player');
              if (!playerBet) return null;
              
              const isQueuedAndWaiting = playerBet.status === 'queued' && gameState.phase === 'waiting';
              const avatarInitial = (playerBet.username?.[0] || '⭐').toUpperCase();
              
              return (
                <motion.div
                  key={playerBet.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 flex items-center justify-between ${
                    playerBet.status === 'cashed_out'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : playerBet.status === 'lost'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-semibold">
                      {playerBet.avatarUrl ? (
                        <img
                          src={playerBet.avatarUrl}
                          alt={`${playerBet.username}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">{playerBet.avatar || avatarInitial}</span>
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">{playerBet.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                      <span className="text-white font-black text-sm leading-none">
                        {playerBet.status === 'active' && gameState.phase === 'flying'
                          ? Math.floor(playerBet.betAmount * gameState.multiplier)
                          : playerBet.betAmount}
                      </span>
                      <Star size={16} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                    </div>
                    {playerBet.autoCashout && (playerBet.status === 'active' || playerBet.status === 'queued') && (
                      <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full font-semibold border border-yellow-400/30">
                        @{playerBet.autoCashout}x
                      </span>
                    )}
                    {playerBet.status === 'cashed_out' && playerBet.cashoutMultiplier && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Check size={16} className="text-green-400" />
                        <span className="text-xs font-semibold">{playerBet.cashoutMultiplier.toFixed(2)}x</span>
                      </div>
                    )}
                    {playerBet.status === 'lost' && (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    {playerBet.status === 'queued' && !isQueuedAndWaiting && (
                      <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/20 px-2 py-1 rounded-full border border-yellow-400/30">
                        Next Round
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* Other Bets List */}
            <div className="bg-white/5 rounded-2xl p-4 min-h-[120px] max-h-40 overflow-y-auto">
              {(() => {
                const otherBets = currentBets.filter(bet => bet.id !== 'player');
                if (otherBets.length === 0) {
                  return (
                    <div className="text-white/40 text-center py-8 text-sm">
                      No bets placed yet...
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {otherBets.map((bet, index) => {
                      const isQueuedAndWaiting = bet.status === 'queued' && gameState.phase === 'waiting';
                      const avatarInitial = (bet.username?.[0] || '⭐').toUpperCase();
                      return (
                        <motion.div
                          key={bet.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                            bet.status === 'cashed_out'
                              ? 'border border-green-500/30'
                              : bet.status === 'lost'
                              ? 'border border-red-500/30'
                              : bet.status === 'queued' && !isQueuedAndWaiting
                              ? 'border border-yellow-500/30'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-semibold">
                              {bet.avatarUrl ? (
                                <img
                                  src={bet.avatarUrl}
                                  alt={`${bet.username}'s avatar`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">{bet.avatar || avatarInitial}</span>
                              )}
                            </div>
                            <span className="text-white text-sm font-medium">{bet.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                              <span className="text-white font-black text-sm leading-none">
                                {bet.status === 'active' && gameState.phase === 'flying'
                                  ? Math.floor(bet.betAmount * gameState.multiplier)
                                  : bet.betAmount}
                              </span>
                              <Star size={16} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                            </div>
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
                );
              })()}
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
                    <div className="flex flex-col items-center">
                        <span className="uppercase tracking-wide font-black text-lg opacity-90 leading-none">CASH OUT</span>
                        {gameState.autoCashout && <span className="text-[10px] text-yellow-200/80 font-bold tracking-wider leading-none mt-0.5">AUTO @ {gameState.autoCashout}x</span>}
                    </div>
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
                  <div className="py-3 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 px-4 py-3 shadow-inner">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={gameState.betAmount || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : parseInt(value, 10);
                          const maxBet = Math.min(MAX_BET, stars);
                          setGameState(prev => ({ ...prev, betAmount: Math.max(50, Math.min(numValue, maxBet)) }));
                        }}
                        disabled={gameState.hasBet}
                        className="text-center text-white text-3xl font-black bg-transparent border-none outline-none placeholder-white/30 disabled:opacity-50"
                        style={{ width: `${Math.max(3, (gameState.betAmount ? String(gameState.betAmount).length + 1 : 3))}ch` }}
                        min="50"
                        max={Math.min(MAX_BET, stars)}
                      />
                      <Star size={20} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                    </div>
                    <p className="text-white/50 text-xs font-medium">50 to 10,000 stars</p>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="flex justify-center">
                    <div className="bg-white/5 rounded-full p-1 flex gap-1">
                      <button
                        onClick={() => {
                          const maxBet = Math.min(MAX_BET, stars);
                          setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 100, maxBet) }));
                        }}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +100
                      </button>
                      <button
                        onClick={() => {
                          const maxBet = Math.min(MAX_BET, stars);
                          setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 500, maxBet) }));
                        }}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +500
                      </button>
                      <button
                        onClick={() => {
                          const maxBet = Math.min(MAX_BET, stars);
                          setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount + 2500, maxBet) }));
                        }}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        +2500
                      </button>
                      <button
                        onClick={() => {
                          const maxBet = Math.min(MAX_BET, stars);
                          setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount * 2, maxBet) }));
                        }}
                        disabled={gameState.hasBet}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-30 text-yellow-400 disabled:text-white/20 rounded-full font-medium transition-colors text-sm"
                      >
                        2x
                      </button>
                    </div>
                  </div>

                  {/* Auto Cashout */}
                  <div className="flex items-center justify-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer flex-shrink-0 select-none">
                      <input
                        type="checkbox"
                        checked={!!gameState.autoCashout}
                        onChange={(e) => setGameState(prev => ({
                          ...prev,
                          autoCashout: e.target.checked ? (prev.autoCashout || 2.00) : null
                        }))}
                        disabled={gameState.hasBet}
                        className="sr-only"
                      />
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: gameState.autoCashout ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          borderColor: gameState.autoCashout ? 'rgba(74, 222, 128, 0.55)' : 'rgba(255, 255, 255, 0.18)'
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-12 h-7 rounded-full border relative shadow-inner"
                      >
                        <motion.div
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full shadow-lg ${
                            gameState.autoCashout ? 'bg-green-400 shadow-green-400/40' : 'bg-white shadow-white/20'
                          }`}
                          animate={{ x: gameState.autoCashout ? 22 : 2, scale: gameState.autoCashout ? 1.05 : 1 }}
                        />
                        {gameState.autoCashout && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-full bg-green-400/10"
                          />
                        )}
                      </motion.div>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        gameState.autoCashout ? 'text-green-300' : 'text-white/70'
                      }`}>
                        AUTO CASHOUT
                      </span>
                    </label>

                    {gameState.autoCashout && (
                      <motion.div
                        key="auto-cashout-controls"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="flex items-center gap-2"
                      >
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
                      </motion.div>
                    )}
                  </div>

                  {/* Place Bet Button */}
                  <button
                    onClick={() => {
                      placeBet();
                      setShowBetDrawer(false);
                    }}
                    disabled={gameState.hasBet || gameState.betAmount > Math.min(MAX_BET, stars) || gameState.betAmount < 50}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors text-base flex items-center justify-center mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-wide font-semibold">
                        {gameState.phase === 'flying' ? 'Bet for Next Round' : 'Place Bet'}
                      </span>
                      <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-white font-black text-lg leading-none">{gameState.betAmount || 0}</span>
                        <Star size={18} className="fill-yellow-300 text-yellow-300 drop-shadow-sm" />
                      </div>
                    </div>
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
