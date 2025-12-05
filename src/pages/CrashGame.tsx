import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, TrendingUp } from 'lucide-react';
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
      hasBet: false, // Reset bet state for new round
    }));

    // Add some mock current bets
    const mockBets: PlayerBet[] = [
      { id: '1', username: 'Player1', avatar: '🎮', betAmount: Math.floor(Math.random() * 50) + 5, autoCashout: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 2 : null },
      { id: '2', username: 'Player2', avatar: '🚀', betAmount: Math.floor(Math.random() * 100) + 10, autoCashout: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 3 : null },
      { id: '3', username: 'Player3', avatar: '💎', betAmount: Math.floor(Math.random() * 30) + 15, autoCashout: null },
    ];
    setCurrentBets(mockBets);

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

        // Add this multiplier to past multipliers
        const crashedMultiplier = Math.round(currentMultiplier * 100) / 100;
        setPastMultipliers(prev => [crashedMultiplier, ...prev.slice(0, 9)]); // Keep only last 10

        setGameState(prev => ({ ...prev, phase: 'crashed', nextRoundIn: 10 }));
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
    if (gameState.phase === 'crashed' || gameState.phase === 'waiting') {
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
                <div
                  className={`w-48 h-48 mx-auto transition-transform duration-100 ${
                    gameState.phase === 'crashed' ? 'opacity-50' : ''
                  }`}
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
              </>
            )}
          </div>

          {/* Current Multiplier and History */}
          <div className="mb-4">
            <div className="text-4xl font-bold text-white mb-2">
              {gameState.multiplier.toFixed(2)}x
            </div>
            {/* Multiplier History Capsules */}
            <div className="flex gap-2 justify-center overflow-x-auto pb-2 max-w-full">
              {pastMultipliers.slice(0, 10).map((multiplier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                    index === 0
                      ? 'bg-white text-black border-2 border-white'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
              ))}
            </div>
          </div>

          {/* Game Status */}
          <div className="text-white/80 text-lg mb-6">
            {gameState.phase === 'flying' && (
              <div className="text-green-400 font-semibold">FLYING!</div>
            )}
            {gameState.phase === 'crashed' && (
              <div className="text-red-400 font-semibold">BOOM!</div>
            )}
          </div>

          {/* Current Bets List - Always Visible */}
          <div className="w-full max-w-sm mb-4">
            <div className="text-white/80 text-sm mb-3 uppercase tracking-wide text-center font-semibold">Current Bets</div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 min-h-[120px] max-h-40 overflow-y-auto">
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
                      className="bg-white/10 rounded-lg p-3 border border-white/5 flex items-center justify-between hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{bet.avatar}</span>
                        <span className="text-white text-sm font-medium">{bet.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{bet.betAmount}⭐</span>
                        {bet.autoCashout && (
                          <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full font-semibold border border-yellow-400/30">
                            @{bet.autoCashout}x
                          </span>
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

      <div className="flex-shrink-0 w-full z-30 pb-4 bg-[#0f0f10]">
        <div className="w-full max-w-md mx-auto px-4 space-y-4">
          {/* Bet Button */}
          <button
            onClick={() => setShowBetDrawer(true)}
            disabled={gameState.phase === 'flying' && gameState.hasBet}
            className="w-full h-14 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Settings size={20} />
            <span>Place Bet</span>
          </button>

          {/* Current Bet Display */}
          {gameState.hasBet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/5"
            >
              <div className="text-center">
                <div className="text-white/60 text-sm uppercase tracking-wide mb-2">Your Bet</div>
                <div className="text-white font-bold text-xl mb-1">{gameState.betAmount} ⭐</div>
                {gameState.autoCashout && (
                  <div className="text-yellow-400 text-sm">Auto cashout at {gameState.autoCashout}x</div>
                )}
                {gameState.phase === 'flying' && (
                  <div className="text-green-400 font-semibold mt-2">
                    Current: {Math.floor(gameState.betAmount * gameState.multiplier)} ⭐
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Cash Out Button */}
          {gameState.hasBet && gameState.phase === 'flying' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={cashout}
              className="w-full h-14 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white font-bold rounded-2xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all"
            >
              Cash Out ({Math.floor(gameState.betAmount * gameState.multiplier)} ⭐)
            </motion.button>
          )}

          {/* Winnings Display */}
          {gameState.winnings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-green-400 font-bold text-lg flex items-center justify-center gap-1">
                +{gameState.winnings} <span className="text-yellow-400">⭐</span> won!
              </div>
            </motion.div>
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
                        disabled={gameState.phase !== 'waiting' || gameState.hasBet}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 disabled:opacity-50 transition-colors text-lg"
                        min="1"
                        max={stars}
                      />
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.min(prev.betAmount * 2, stars) }))}
                        disabled={gameState.phase !== 'waiting' || gameState.hasBet}
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
                      disabled={gameState.phase !== 'waiting' || gameState.hasBet}
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
                    disabled={gameState.phase !== 'waiting' || gameState.hasBet || gameState.betAmount > stars || gameState.betAmount <= 0}
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
                          key={index}
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