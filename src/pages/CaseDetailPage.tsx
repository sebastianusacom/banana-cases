import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, X, Flame } from 'lucide-react';
import { useCaseStore } from '../store/caseStore'; 
import { useUserStore, type Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { useTelegram } from '../hooks/useTelegram';
import clsx from 'clsx';
import { Roulette } from '../components/Roulette';
import { PrizeModal } from '../components/PrizeModal';
import { api } from '../api/client';
import { InnerStroke } from '../components/InnerStroke';

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById } = useCaseStore();
  const { stars, isDemoMode, toggleDemoMode, setDemoMode, addItem, subtractStars, userId } = useUserStore();
  const { selectionChanged, impactMedium, impactHeavy, notificationSuccess, notificationError } = useHaptics();
  const { tg, isTelegramWebApp } = useTelegram();

  const caseItem = getCaseById(id || '');
  const [count, setCount] = useState<1 | 2 | 3>(1);
  
  const [isOpening, setIsOpening] = useState(false);
  const [isPending, setIsPending] = useState(false); // Immediate feedback state
  const [winningPrizes, setWinningPrizes] = useState<Prize[]>([]);
  const pendingPrizesRef = useRef<Prize[] | null>(null); // Store API result while animating
  const itemsAddedRef = useRef(false); // Prevent double-adding items
  const completedSpins = useRef(0);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showDropsDrawer, setShowDropsDrawer] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const apiPromiseRef = useRef<Promise<Prize[]> | null>(null);
  const modeToggleRef = useRef<HTMLDivElement>(null);
  const countToggleRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setDemoMode(false);
  }, [setDemoMode]);

  useEffect(() => {
    if (!caseItem) {
      navigate('/cases');
    }
  }, [caseItem, navigate]);

  useEffect(() => {
    if (caseItem?.id === 'free-case' && count !== 1) {
      setCount(1);
    } else if (isDemoMode && count !== 1) {
      setCount(1);
    }
  }, [isDemoMode, count, caseItem]);

  useEffect(() => {
    if (isTelegramWebApp) {
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
    }
  }, [isOpening, navigate, tg, isTelegramWebApp]);


  if (!caseItem) return null;

  const totalPrice = caseItem.price * count;
  const canAfford = stars >= totalPrice;

  // Fetch prizes from API (non-blocking)
  const fetchPrizesFromAPI = async (): Promise<Prize[]> => {
    const res = await api.openCase(userId!, caseItem.id, count);
    if (res.error) {
      throw new Error(res.error);
    }
    return res.prizes.map((p: any, i: number) => ({
      ...p,
      id: `won-${Date.now()}-${i}`,
      wonAt: Date.now()
    }));
  };

  // Shared logic for calling API and setting state
  const executeOpen = async (isQuickSpin: boolean) => {
      if (isOpening || isPending || !userId) return;

      if (!isDemoMode && !canAfford) {
        tg.showAlert("You don't have enough stars!");
        return;
      }

      // Immediate haptic feedback
      if (isQuickSpin) {
        impactHeavy();
      } else {
        impactMedium();
      }

      // 1. Optimistic UI update - deduct stars immediately
      if (!isDemoMode) {
          const success = subtractStars(totalPrice);
          if (!success) {
             notificationError();
             return; 
          }
      }

      // 2. Set pending state for immediate visual feedback
      setIsPending(true);
      pendingPrizesRef.current = null;
      itemsAddedRef.current = false;

      if (!isDemoMode) {
          // Start API call immediately (don't await yet)
          const apiPromise = fetchPrizesFromAPI();
          apiPromiseRef.current = apiPromise;

          if (isQuickSpin) {
              // For quick spin, we need to wait for API result
              try {
                  const prizes = await apiPromise;
                  if (!itemsAddedRef.current) {
                    itemsAddedRef.current = true;
                    prizes.forEach(p => addItem(p));
                  }
                  setWinningPrizes(prizes);
                  setIsPending(false);
                  notificationSuccess();
                  setShowPrizeModal(true);
              } catch (e) {
                  console.error("Failed to open case", e);
                  notificationError();
                  setIsPending(false);
                  // TODO: Refund stars on error
              }
          } else {
              // For regular spin, start "loading" animation immediately
              setIsOpening(true);
              
              try {
                  const prizes = await apiPromise;
                  
                  // Store in ref for spin completion handler
                  pendingPrizesRef.current = prizes;

                  if (!itemsAddedRef.current) {
                    itemsAddedRef.current = true;
                    prizes.forEach(p => addItem(p));
                  }

                  setWinningPrizes(prizes);
                  setIsPending(false);
                  completedSpins.current = 0;
                  window.dispatchEvent(new Event('case-spin-start'));
              } catch (e) {
                  console.error("Failed to open case", e);
                  notificationError();
                  setIsPending(false);
                  setIsOpening(false);
                  pendingPrizesRef.current = null;
              }
          }
      } else {
          // Demo Mode Logic (Local Fallback) - instant
          const demoPick = (items: any[]) => items[Math.floor(Math.random() * items.length)];
          const prizes: Prize[] = [];
          
          for (let i = 0; i < count; i++) {
              const winner = demoPick(caseItem.items);
              prizes.push({ ...winner, id: `won-${Date.now()}-${i}`, wonAt: Date.now() });
          }
          
          prizes.forEach(p => addItem(p));
          setWinningPrizes(prizes);
          setIsPending(false);

          if (isQuickSpin) {
              notificationSuccess();
              setShowPrizeModal(true);
          } else {
              setIsOpening(true);
              completedSpins.current = 0;
              window.dispatchEvent(new Event('case-spin-start'));
          }
      }
  };

  const handleQuickSpin = () => executeOpen(true);
  const handleOpen = () => executeOpen(false);

  const handleMouseDown = () => {
    if (caseItem.id === 'free-case') {
      handleOpen();
      return;
    }

    if (isDemoMode) {
      handleOpen();
      return;
    }

    if (holdTimeoutRef.current) return;

    setIsHolding(true);
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      setIsHolding(false);
      handleQuickSpin();
    }, 300);
  };

  const handleMouseUp = () => {
    if (caseItem.id === 'free-case') return;
    if (isDemoMode) return;

    setIsHolding(false);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
      handleOpen();
    }
  };

  const handleSpinComplete = async () => {
    completedSpins.current += 1;
    if (completedSpins.current >= count) {
        // Wait for API if it hasn't resolved yet (only for real mode)
        if (!isDemoMode && apiPromiseRef.current) {
          try {
            // If pendingPrizesRef is still null, wait for the API
            if (!pendingPrizesRef.current) {
              const prizes = await apiPromiseRef.current;
              pendingPrizesRef.current = prizes;
              // Only add items if not already added
              if (!itemsAddedRef.current) {
                itemsAddedRef.current = true;
                prizes.forEach(p => addItem(p));
              }
            }
            // Use the actual API prizes for the modal
            setWinningPrizes(pendingPrizesRef.current);
          } catch (e) {
            // API failed - the error was already handled
            console.error("API failed during spin complete");
          }
        }
        
        setTimeout(() => {
            impactHeavy();
            notificationSuccess();
            setShowPrizeModal(true);
        }, 500);
    }
  };

  const resetOpening = () => {
      setIsOpening(false);
      setIsPending(false);
      setWinningPrizes([]);
      completedSpins.current = 0;
      pendingPrizesRef.current = null;
      itemsAddedRef.current = false;
      apiPromiseRef.current = null;
      setShowPrizeModal(false);
      window.dispatchEvent(new Event('case-spin-end'));
  };

  const handleCountChange = (newCount: 1 | 2 | 3) => {
    if (isOpening) return;
    selectionChanged();
    setCount(newCount);
  };

  // Mobile: hold + drag + release toggles — selection is based on release position
  const handleModeTouchMove = (e: React.TouchEvent) => {
    const t = e.changedTouches?.[0] || e.touches?.[0];
    if (t) lastTouchRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleModeTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches?.[0];
    if (!t || !modeToggleRef.current) return;
    e.preventDefault();
    const rect = modeToggleRef.current.getBoundingClientRect();
    const x = t.clientX;
    const mid = rect.left + rect.width / 2;
    const wantDemo = x >= mid;
    if (wantDemo !== isDemoMode) {
      selectionChanged();
      setDemoMode(wantDemo);
    }
    lastTouchRef.current = null;
  };
  const handleCountTouchMove = (e: React.TouchEvent) => {
    const t = e.changedTouches?.[0] || e.touches?.[0];
    if (t) lastTouchRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleCountTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches?.[0];
    if (!t || !countToggleRef.current || isOpening) return;
    e.preventDefault();
    const rect = countToggleRef.current.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const third = rect.width / 3;
    let newCount: 1 | 2 | 3 = 1;
    if (x < third) newCount = 1;
    else if (x < third * 2) newCount = 2;
    else newCount = 3;
    if (newCount !== count) {
      selectionChanged();
      setCount(newCount);
    }
    lastTouchRef.current = null;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f10] overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 w-full py-2">
        <div className="w-full flex flex-col items-center justify-center gap-2 h-full">
            <AnimatePresence mode="popLayout">
                {Array.from({ length: count }).map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex-1 min-h-0 flex items-center"
                    >
                        <Roulette
                            items={caseItem.items}
                            winningItem={isOpening ? winningPrizes[index] : undefined}
                            idle={!isOpening}
                            onComplete={handleSpinComplete}
                            delay={0}
                            multiplier={count}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>

      <div className="flex-shrink-0 w-full z-30 pb-4 bg-[#0f0f10]">
        <motion.div
          layout
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto px-4 space-y-2"
        >
            
            <div className={clsx("flex items-center justify-between gap-2 transition-opacity duration-300", isOpening && "opacity-20 pointer-events-none")}>
                {caseItem.id !== 'free-case' && (
                    <div
                        ref={modeToggleRef}
                        onTouchMove={handleModeTouchMove}
                        onTouchEnd={handleModeTouchEnd}
                        onTouchCancel={() => { lastTouchRef.current = null; }}
                        className={clsx("h-11 bg-white/5 p-1 rounded-3xl flex relative isolate transition-all duration-100 ease-out", isDemoMode ? "flex-[2]" : "flex-1")}
                    >
                        <InnerStroke borderRadius="1.5rem" />
                        <button
                            onClick={() => {
                              if (!isDemoMode) return;
                              selectionChanged();
                              toggleDemoMode();
                            }}
                            disabled={isOpening}
                            className={clsx(
                                "flex-1 relative z-10 flex items-center justify-center gap-1.5 rounded-3xl font-bold text-xs uppercase tracking-wide transition-all duration-150",
                                !isDemoMode ? "text-green-500" : "text-white/40 hover:text-white/60"
                            )}
                        >
                            {!isDemoMode && (
                                <motion.div
                                    layoutId="mode-active"
                                    className="absolute inset-0 bg-[#0f0f10] rounded-3xl shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                >
                                    <InnerStroke borderRadius="1.5rem" inset="0" />
                                </motion.div>
                            )}
                            <div className={clsx("w-1.5 h-1.5 rounded-full relative z-10 transition-all duration-200", !isDemoMode ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-white/20")} />
                            <span className="relative z-10">Real</span>
                        </button>
                        <button
                            onClick={() => {
                              if (isDemoMode) return;
                              selectionChanged();
                              toggleDemoMode();
                            }}
                            disabled={isOpening}
                            className={clsx(
                                "flex-1 relative z-10 flex items-center justify-center gap-1.5 rounded-3xl font-bold text-xs uppercase tracking-wide transition-all duration-150",
                                isDemoMode ? "text-yellow-500" : "text-white/40 hover:text-white/60"
                            )}
                        >
                            {isDemoMode && (
                                <motion.div
                                    layoutId="mode-active"
                                    className="absolute inset-0 bg-[#0f0f10] rounded-3xl shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                >
                                    <InnerStroke borderRadius="1.5rem" inset="0" />
                                </motion.div>
                            )}
                            <div className={clsx("w-1.5 h-1.5 rounded-full relative z-10 transition-all duration-200", isDemoMode ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "bg-white/20")} />
                            <span className="relative z-10">Demo</span>
                        </button>
                    </div>
                )}

                {caseItem.id !== 'free-case' && !isDemoMode && (
                    <motion.div
                        ref={countToggleRef}
                        onTouchMove={handleCountTouchMove}
                        onTouchEnd={handleCountTouchEnd}
                        onTouchCancel={() => { lastTouchRef.current = null; }}
                        initial={{ opacity: 0, scale: 0.85, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 5 }}
                        transition={{
                          duration: 0.25,
                          ease: "easeOut"
                        }}
                        className="relative flex gap-1 bg-white/5 p-1 rounded-3xl"
                    >
                        <InnerStroke borderRadius="1.5rem" />
                        {[1, 2, 3].map((c) => (
                            <button
                                key={c}
                                onClick={() => handleCountChange(c as 1 | 2 | 3)}
                                disabled={isOpening}
                                className={clsx(
                                    "h-9 w-11 relative z-10 flex items-center justify-center rounded-3xl font-bold transition-all text-sm",
                                    count === c
                                        ? "text-white"
                                        : "text-white/40 hover:text-white/80"
                                )}
                            >
                                {count === c && (
                                    <motion.div
                                        layoutId="count-active"
                                        className="absolute inset-0 bg-[#0f0f10] rounded-3xl shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                    >
                                        <InnerStroke borderRadius="1.5rem" inset="0" />
                                    </motion.div>
                                )}
                                <span className="relative z-10">{c}x</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            <motion.button
                animate={isHolding || isPending ? { scale: 0.98, opacity: 0.9 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                disabled={isOpening || isPending || (!isDemoMode && !canAfford)}
                className={clsx(
                    "w-full h-16 rounded-4xl font-bold text-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden group",
                    (isOpening || isPending)
                        ? 'bg-gradient-to-b from-[#ca8a04] to-[#854d0e] text-white/90 cursor-wait shadow-inner border-black/10 opacity-40'
                        : (!isDemoMode && !canAfford)
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-gradient-to-b from-[#eab308] to-[#ca8a04] text-white shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 border-white/20'
                )}
            >
                {(isOpening || isPending) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 bg-white z-0 pointer-events-none"
                    />
                )}

                {!isOpening && !isPending && (isDemoMode || canAfford) && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear", repeatDelay: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 skew-x-12 pointer-events-none"
                    />
                )}

                <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                    {(isOpening || isPending) ? (
                        <motion.span 
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="font-bold tracking-widest uppercase text-sm"
                        >
                            Opening...
                        </motion.span>
                    ) : (
                        <>
                            <span className="uppercase tracking-wide font-black text-lg opacity-90">
                                {caseItem.id === 'free-case' ? "OPEN FOR FREE" : (isDemoMode ? "OPEN FREE" : "OPEN FOR")}
                            </span>
                            {caseItem.id !== 'free-case' && !isDemoMode && (
                                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-3xl shadow-inner">
                                    <span className="text-white font-black text-2xl drop-shadow-sm leading-none">{totalPrice}</span>
                                    <Star size={22} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.button>

            {!isDemoMode && caseItem.id !== 'free-case' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={clsx("text-center text-[10px] text-white/40 mt-1 flex items-center justify-center gap-1", isOpening && "opacity-20 pointer-events-none")}
              >
                <Flame size={8} className="text-white/40" />
                Hold button for quick spin
              </motion.p>
            )}

            <button
                onClick={() => setShowDropsDrawer(true)}
                disabled={isOpening}
                className={clsx(
                    "relative w-fit mx-auto px-6 h-10 text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest rounded-3xl",
                    isOpening && "opacity-20 pointer-events-none"
                )}
            >
                <InnerStroke borderRadius="1.5rem" />
                <ShieldCheck size={14} />
                <span>Case Contents</span>
            </button>
        </motion.div>
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
                    className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
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
                                    <div key={item.id} className="relative bg-white/5 rounded-3xl p-3">
                                        <InnerStroke borderRadius="1.5rem" />
                                        <div className="w-full aspect-square mb-2 bg-black/20 rounded-xl p-2">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-[10px] font-medium leading-tight line-clamp-1 opacity-80">{item.name}</p>
                                        <div className="flex items-center justify-between gap-1 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Star size={8} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-[10px] text-yellow-400">{item.value}</span>
                                            </div>
                                            <span className="text-[10px] text-white/40">{item.chance}%</span>
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
