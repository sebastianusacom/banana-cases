import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, X } from 'lucide-react';
import { useCaseStore } from '../store/caseStore';
import { useUserStore, type Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { useTelegram } from '../hooks/useTelegram';
import clsx from 'clsx';
import { Roulette } from '../components/Roulette';
import { PrizeModal } from '../components/PrizeModal';

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById } = useCaseStore();
  const { stars, isDemoMode, toggleDemoMode, addItem, subtractStars } = useUserStore();
  const { selectionChanged, impactMedium, impactHeavy, notificationSuccess } = useHaptics();
  const { tg } = useTelegram();

  const caseItem = getCaseById(id || '');
  const [count, setCount] = useState<1 | 2 | 3>(1);
  
  const [isOpening, setIsOpening] = useState(false);
  const [winningPrizes, setWinningPrizes] = useState<Prize[]>([]);
  const [completedSpins, setCompletedSpins] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showDropsDrawer, setShowDropsDrawer] = useState(false);

  useEffect(() => {
    if (!caseItem) {
      navigate('/cases');
    }
  }, [caseItem, navigate]);

  useEffect(() => {
    if (!isOpening) {
        tg.BackButton.show();
        const handleBack = () => {
            navigate(-1);
        };
        tg.BackButton.onClick(handleBack);
        return () => {
            tg.BackButton.offClick(handleBack);
            tg.BackButton.hide();
        };
    } else {
        tg.BackButton.hide();
    }
  }, [isOpening, navigate, tg]);


  if (!caseItem) return null;

  const totalPrice = caseItem.price * count;
  const canAfford = stars >= totalPrice;

  const handleOpen = () => {
    if (isOpening) return;
    
    if (!isDemoMode && !canAfford) {
      tg.showAlert("You don't have enough stars!");
      return;
    }

    impactMedium();
    
    if (!isDemoMode) {
        const success = subtractStars(totalPrice);
        if (!success) return; 
    }

    const generatedPrizes: Prize[] = [];
    const sortedItems = [...caseItem.items].sort((a, b) => a.value - b.value);

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let winner;
      
      if (rand > 0.98) winner = sortedItems[sortedItems.length - 1];
      else if (rand > 0.90) winner = sortedItems[Math.floor(sortedItems.length * 0.8)];
      else if (rand > 0.60) winner = sortedItems[Math.floor(sortedItems.length * 0.5)];
      else winner = sortedItems[Math.floor(Math.random() * (sortedItems.length / 2))];

      if (!winner) winner = sortedItems[0];

      const prizeInstance = { ...winner, id: `won-${Date.now()}-${i}` };
      generatedPrizes.push(prizeInstance);
      addItem(prizeInstance);
    }

    setWinningPrizes(generatedPrizes);
    setIsOpening(true);
    setCompletedSpins(0);
  };

  const handleSpinComplete = () => {
    setCompletedSpins(prev => {
        const newCount = prev + 1;
        if (newCount >= count) {
            setTimeout(() => {
                impactHeavy();
                notificationSuccess();
                setShowPrizeModal(true);
            }, 500);
        }
        return newCount;
    });
  };

  const resetOpening = () => {
      setIsOpening(false);
      setWinningPrizes([]);
      setCompletedSpins(0);
      setShowPrizeModal(false);
  };

  const handleCountChange = (newCount: 1 | 2 | 3) => {
    if (isOpening) return;
    selectionChanged();
    setCount(newCount);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#1c1c1e] overflow-hidden">
      
      <div className="flex-shrink-0 h-14 relative z-20" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 w-full">
        <div className="w-full max-w-md flex flex-col items-center justify-center px-4 gap-4">
            <AnimatePresence mode="popLayout">
                {Array.from({ length: count }).map((_, index) => (
                    <motion.div
                        key={`${index}-${isOpening ? 'open' : 'idle'}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="w-full"
                    >
                        <Roulette
                            items={caseItem.items}
                            winningItem={isOpening ? winningPrizes[index] : undefined}
                            idle={!isOpening}
                            onComplete={handleSpinComplete}
                            delay={index * 0.5}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>

      <div className="flex-shrink-0 w-full z-30 pb-safe bg-gradient-to-t from-black via-[#1c1c1e]/50 to-transparent pt-8">
        <div className="w-full max-w-md mx-auto px-4 pb-6 space-y-4">
            
            <div className="flex items-center justify-between gap-4">
                 <button 
                      onClick={toggleDemoMode}
                      disabled={isOpening}
                      className="flex-1 h-10 flex items-center justify-center gap-2 bg-white/5 rounded-xl border border-white/5 transition-all hover:bg-white/10"
                  >
                      <div className={clsx(
                          "w-8 h-5 rounded-full p-0.5 transition-colors relative",
                          isDemoMode ? "bg-yellow-500/20" : "bg-green-500/20"
                      )}>
                          <motion.div 
                              layout
                              className={clsx(
                                  "w-4 h-4 rounded-full shadow-sm",
                                  isDemoMode ? "bg-yellow-500" : "bg-green-500"
                              )}
                              animate={{ x: isDemoMode ? 12 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                      </div>
                      <span className={clsx(
                          "text-xs font-bold uppercase tracking-wide",
                          isDemoMode ? "text-yellow-500" : "text-green-500"
                      )}>
                          {isDemoMode ? 'Demo' : 'Real'}
                      </span>
                  </button>

                <div className="flex gap-2">
                    {[1, 2, 3].map((c) => (
                        <button
                            key={c}
                            onClick={() => handleCountChange(c as 1 | 2 | 3)}
                            disabled={isOpening}
                            className={clsx(
                                "h-10 w-12 rounded-xl font-bold transition-all border flex items-center justify-center text-sm",
                                count === c 
                                    ? "bg-white text-black border-white shadow-lg scale-105" 
                                    : "bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white/80"
                            )}
                        >
                            {c}x
                        </button>
                    ))}
                </div>
            </div>

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleOpen}
                disabled={isOpening || (!isDemoMode && !canAfford)}
                className={clsx(
                    "w-full h-14 rounded-2xl font-bold text-lg shadow-[0_4px_20px_rgba(250,204,21,0.2)] flex items-center justify-center gap-3 transition-all relative overflow-hidden",
                    isOpening 
                        ? 'bg-white/10 text-white/50 cursor-wait'
                        : (!isDemoMode && !canAfford)
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-[linear-gradient(110deg,#facc15_20%,#fef08a_45%,#facc15_80%)] bg-[length:200%_100%] animate-shimmer text-black border border-yellow-300/50 shadow-[0_0_30px_rgba(250,204,21,0.4)]'
                )}
            >
                {isOpening ? (
                    <span className="opacity-80">Opening{count > 1 ? ` ${Math.min(completedSpins + 1, count)}/${count}` : '...'}</span>
                ) : (
                    <>
                        <span className="uppercase tracking-wide drop-shadow-sm font-black text-xl">OPEN FOR</span>
                        <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-xl backdrop-blur-sm border border-black/10">
                            <span className="text-black font-black text-xl">{totalPrice}</span>
                            <Star size={20} className="fill-black text-black" />
                        </div>
                    </>
                )}
            </motion.button>

            <button 
                onClick={() => setShowDropsDrawer(true)}
                disabled={isOpening}
                className="w-full py-2 text-xs font-medium text-white/30 hover:text-white transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
            >
                <ShieldCheck size={14} />
                <span>Possible Drops</span>
            </button>
        </div>
      </div>

      {showPrizeModal && (
          <PrizeModal prizes={winningPrizes} onClose={resetOpening} />
      )}

      <AnimatePresence>
        {showDropsDrawer && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDropsDrawer(false)}
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
                            <h3 className="text-xl font-bold">Case Contents</h3>
                            <button 
                                onClick={() => setShowDropsDrawer(false)}
                                className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 pb-10 pr-2 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-3">
                                {caseItem.items.sort((a,b) => b.value - a.value).map((item) => (
                                    <div key={item.id} className="relative bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <div className="w-full aspect-square mb-2 bg-black/20 rounded-xl p-2">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="h-1 w-8 rounded-full mb-2 opacity-50" style={{ backgroundColor: item.color }} />
                                        <p className="text-[10px] font-medium leading-tight line-clamp-1 opacity-80">{item.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star size={8} className="text-yellow-400 fill-yellow-400" />
                                            <span className="text-[10px] text-yellow-400">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
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

export default CaseDetailPage;
