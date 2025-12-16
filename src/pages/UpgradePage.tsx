import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { X, Star, ArrowUp, Loader2, Plus, Sparkles } from 'lucide-react';
import { useUserStore, type Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { api } from '../api/client';
import clsx from 'clsx';
import { PrizeModal } from '../components/PrizeModal';

const UpgradePage: React.FC = () => {
  const { inventory, userId, fetchUser, removeItem, addItem } = useUserStore();
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError, selectionChanged } = useHaptics();

  const [selectedUserItem, setSelectedUserItem] = useState<Prize | null>(null);
  const [selectedTargetItem, setSelectedTargetItem] = useState<Prize | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  
  // Data state
  const [availableTargets, setAvailableTargets] = useState<Prize[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Animation states
  const [rollValue, setRollValue] = useState(0);
  const [showRoll, setShowRoll] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<'success' | 'fail' | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Use spring for smoother visual roll updates
  const springRoll = useSpring(0, { stiffness: 60, damping: 15 });

  // Fetch targets when user item is selected
  useEffect(() => {
    if (!selectedUserItem || !userId) {
       setAvailableTargets([]);
       return;
    }
    
    const fetchTargets = async () => {
       setLoadingTargets(true);
       try {
          const res = await api.getUpgradeTargets(userId, selectedUserItem.id);
          if (res.targets) {
             setAvailableTargets(res.targets);
          }
       } catch (e) {
          console.error("Failed to fetch targets", e);
       } finally {
          setLoadingTargets(false);
       }
    };
    
    fetchTargets();
  }, [selectedUserItem, userId]);

  const winChance = useMemo(() => {
    if (!selectedTargetItem) return 0;
    return selectedTargetItem.chance || 0;
  }, [selectedTargetItem]);

  const handleUpgrade = async () => {
    if (!selectedUserItem || !selectedTargetItem || !userId || isUpgrading) return;

    setIsUpgrading(true);
    setIsFinalizing(false);
    setShowRoll(true);
    setRollValue(0);
    springRoll.set(0);
    setUpgradeResult(null);
    impactMedium();

    try {
      // Fast jitter phase
      const jitterInterval = setInterval(() => {
         const randomJitter = Math.random() * 100;
         setRollValue(randomJitter); 
         // We don't use spring here for the jitter to make it look chaotic/fast
         impactLight();
      }, 50);

      const res = await api.upgradeItem(userId, selectedUserItem.id, selectedTargetItem.id);
      
      clearInterval(jitterInterval);
      
      if (res.error) throw new Error(res.error);

      // Determine final visual roll value
      let finalRoll = 0;
      if (res.success) {
        // Success: Roll falls within 0 to winChance
        finalRoll = Math.random() * winChance;
      } else {
        // Fail logic
        const nearMissChance = 0.4;
        if (Math.random() < nearMissChance) {
           // Near miss: Just above winChance
           finalRoll = winChance + (Math.random() * 5); 
        } else {
           // Normal fail
           finalRoll = winChance + 5 + (Math.random() * (100 - winChance - 5));
        }
        finalRoll = Math.min(finalRoll, 99.99);
      }

      // Switch to spring animation
      setIsFinalizing(true);
      springRoll.jump(rollValue);
      setTimeout(() => springRoll.set(finalRoll), 10);

      // Wait for spring to settle roughly
      setTimeout(() => {
         finishUpgrade(res.success);
      }, 1500);

    } catch (e) {
      console.error(e);
      notificationError();
      setIsUpgrading(false);
      setIsFinalizing(false);
      setShowRoll(false);
    }
  };

  const finishUpgrade = (success: boolean) => {
    setUpgradeResult(success ? 'success' : 'fail');
    
    if (success && selectedTargetItem) {
        impactHeavy();
        notificationSuccess();
        removeItem(selectedUserItem!.id);
        const newItem = { ...selectedTargetItem, id: `upgraded-${Date.now()}`, wonAt: Date.now() };
        addItem(newItem);
        setTimeout(() => {
           setShowPrizeModal(true);
           setIsUpgrading(false);
           setIsFinalizing(false);
        }, 800);
    } else {
        impactHeavy();
        notificationError();
        removeItem(selectedUserItem!.id);
        setTimeout(() => {
           setIsUpgrading(false);
           setIsFinalizing(false);
           setShowRoll(false); // Hide roll after delay
           // Keep selection or reset? Usually reset source since it's burned.
           setSelectedUserItem(null);
           setSelectedTargetItem(null);
        }, 2000);
    }
    
    fetchUser();
  };

  const reset = () => {
    setSelectedUserItem(null);
    setSelectedTargetItem(null);
    setUpgradeResult(null);
    setShowRoll(false);
    springRoll.set(0);
    setIsUpgrading(false);
    setIsFinalizing(false);
    setAvailableTargets([]);
  };

  const getChanceColor = (chance: number) => {
    if (chance > 50) return '#4ade80'; // green-400
    if (chance > 20) return '#facc15'; // yellow-400
    return '#f87171'; // red-400
  };

  // Circle configuration
  const circleSize = 140; // Slightly larger
  const strokeWidth = 4;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (winChance / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0b] overflow-hidden relative font-sans h-full pb-safe">
      
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 mt-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Upgrade
          </h1>
        </header>

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col relative justify-center gap-12">
           
           {/* Target Slot (Top) */}
           <div className="flex flex-col items-center justify-center relative z-10">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isUpgrading && selectedUserItem) {
                      setShowTargets(true);
                      selectionChanged();
                  }
                }}
                disabled={!selectedUserItem || isUpgrading}
                className={clsx(
                    "w-36 h-36 rounded-3xl border flex items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-md z-20",
                    selectedTargetItem
                      ? "bg-[#151516] border-white/10"
                      : "bg-[#151516] border-dashed border-white/10 opacity-50 hover:opacity-80"
                )}
              >
                  {selectedTargetItem ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 w-full h-full flex items-center justify-center p-6"
                    >
                        <img src={selectedTargetItem.image} className="w-full h-full object-contain drop-shadow-2xl" alt="" />
                        <div className="absolute bottom-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/5">
                            <Star size={10} className="text-white fill-white" />
                            <span className="text-white font-bold text-xs">{selectedTargetItem.value}</span>
                        </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-40">
                        <Plus size={24} />
                    </div>
                  )}
              </motion.button>
           </div>

           {/* Middle Action Area */}
           <div className="h-32 flex items-center justify-center relative z-30">
              <AnimatePresence mode="wait">
                 {isUpgrading || showRoll ? (
                    <motion.div
                       key="rolling"
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.9, opacity: 0 }}
                       className="w-full flex flex-col items-center gap-6"
                    >
                       {/* Sleek Rolling Visualizer */}
                       <div className="relative w-72 h-2 bg-[#1a1a1c] rounded-full overflow-hidden">
                          {/* Success Zone */}
                          <div 
                             className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-full transition-all duration-300"
                             style={{ width: `${winChance}%` }}
                          />
                          
                          {/* Cursor/Needle */}
                          <RollCursor spring={springRoll} value={rollValue} isSpring={isFinalizing} />
                       </div>
                       
                       {/* Text Status */}
                       <div className="h-6 flex items-center justify-center overflow-hidden">
                          <AnimatePresence mode="wait">
                              {upgradeResult === 'fail' ? (
                                 <motion.div 
                                    key="fail"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-2 text-red-500"
                                 >
                                    <span className="font-bold tracking-wide uppercase text-xs">Failed</span>
                                 </motion.div>
                              ) : upgradeResult === 'success' ? (
                                 <motion.div 
                                    key="success"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-2 text-emerald-500"
                                 >
                                    <span className="font-bold tracking-wide uppercase text-xs">Success</span>
                                 </motion.div>
                              ) : (
                                 <motion.div
                                    key="rolling-text"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                 >
                                    <RollingNumber value={isFinalizing ? springRoll : rollValue} />
                                 </motion.div>
                              )}
                          </AnimatePresence>
                       </div>

                    </motion.div>
                 ) : selectedUserItem && selectedTargetItem ? (
                    <motion.button
                       key="upgrade-btn"
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.9, opacity: 0 }}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={handleUpgrade}
                       className="relative group flex items-center justify-center cursor-pointer"
                       style={{ width: circleSize, height: circleSize }}
                    >
                        {/* Circular Progress Bar */}
                        <svg width={circleSize} height={circleSize} className="absolute inset-0 rotate-[-90deg]">
                            <circle
                                cx={circleSize / 2}
                                cy={circleSize / 2}
                                r={radius}
                                stroke="#1a1a1c"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            <motion.circle
                                cx={circleSize / 2}
                                cy={circleSize / 2}
                                r={radius}
                                stroke={getChanceColor(winChance)}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: dashOffset }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Button Inner */}
                        <div className="absolute inset-[6px] rounded-full bg-[#151516] flex flex-col items-center justify-center z-10 shadow-lg">
                             <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Chance</span>
                                <span className="text-3xl font-bold text-white tracking-tighter">
                                    {winChance.toFixed(2)}<span className="text-lg text-white/30">%</span>
                                </span>
                                <div className="mt-1 px-3 py-1 rounded-full bg-white/5 flex items-center gap-1">
                                   <ArrowUp size={12} className={clsx(`text-[${getChanceColor(winChance)}]`)} style={{ color: getChanceColor(winChance) }} />
                                   <span className="text-[9px] font-bold text-white uppercase">Roll</span>
                                </div>
                             </div>
                        </div>
                    </motion.button>
                 ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                 )}
              </AnimatePresence>
           </div>

           {/* Source Slot (Bottom) */}
           <div className="flex flex-col items-center justify-center relative z-10">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isUpgrading) {
                      setShowInventory(true);
                      selectionChanged();
                  }
                }}
                disabled={isUpgrading}
                className={clsx(
                    "w-28 h-28 rounded-3xl border flex items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-md z-20",
                    selectedUserItem
                      ? "bg-[#151516] border-white/10"
                      : "bg-[#151516] border-dashed border-white/10 opacity-50 hover:opacity-80"
                )}
              >
                  {selectedUserItem ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 w-full h-full flex items-center justify-center p-5"
                    >
                        <img src={selectedUserItem.image} className="w-full h-full object-contain drop-shadow-xl" alt="" />
                        <div className="absolute bottom-2 px-2.5 py-0.5 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-1 border border-white/5">
                            <Star size={9} className="text-white fill-white" />
                            <span className="text-white font-bold text-[10px]">{selectedUserItem.value}</span>
                        </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <Plus size={20} />
                    </div>
                  )}
              </motion.button>
           </div>

        </div>
      </div>

      {/* Inventory Drawer */}
      <Drawer 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
        title="Select Item"
      >
          <div className="grid grid-cols-3 gap-3">
             {inventory.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => {
                    setSelectedUserItem(item);
                    setSelectedTargetItem(null); 
                    setShowInventory(false);
                    setTimeout(() => setShowTargets(true), 300); // Auto-advance
                    impactLight();
                  }}
                />
             ))}
             {inventory.length === 0 && (
               <div className="col-span-3 py-12 text-center text-white/30 text-sm">
                  Inventory is empty.
               </div>
             )}
          </div>
      </Drawer>

      {/* Target Drawer */}
      <Drawer 
        isOpen={showTargets} 
        onClose={() => setShowTargets(false)} 
        title="Select Target"
      >
         {loadingTargets ? (
            <div className="py-20 flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" />
            </div>
         ) : availableTargets.length > 0 ? (
             <div className="grid grid-cols-3 gap-3">
                 {availableTargets.map(item => (
                    <TargetCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => {
                        setSelectedTargetItem(item);
                        setShowTargets(false);
                        impactLight();
                      }}
                    />
                 ))}
             </div>
         ) : (
           <div className="py-12 text-center text-white/30 text-sm">
              No targets available for this item.
           </div>
         )}
      </Drawer>

      {/* Win Modal */}
      <AnimatePresence>
         {showPrizeModal && selectedTargetItem && (
            <PrizeModal 
               prizes={[{ ...selectedTargetItem, id: `won-${Date.now()}` }]} 
               onClose={() => {
                  setShowPrizeModal(false);
                  reset();
               }} 
            />
         )}
      </AnimatePresence>
    </div>
  );
};

// Subcomponents for cleaner code

const Drawer: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-[#121212] rounded-t-[2rem] z-[70] max-h-[75vh] flex flex-col shadow-2xl"
        >
          <div className="p-5 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={16} className="text-white/70" />
            </button>
          </div>
          <div className="p-5 pt-0 overflow-y-auto pb-safe">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const ItemCard: React.FC<{ item: Prize; onClick: () => void }> = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className="bg-[#1a1a1c] rounded-2xl p-3 flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-[#202022] group"
  >
     <div className="w-full aspect-square relative flex items-center justify-center">
        <img src={item.image} className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" alt="" />
     </div>
     <div className="w-full">
        <div className="flex items-center justify-center gap-1.5 bg-white/5 rounded-full py-1 px-2">
           <Star size={10} className="fill-white text-white" />
           <p className="text-xs font-bold text-white text-center">{item.value}</p>
        </div>
     </div>
  </button>
);

const TargetCard: React.FC<{ item: Prize; onClick: () => void }> = ({ item, onClick }) => {
   const chanceColor = item.chance > 50 ? '#4ade80' : item.chance > 20 ? '#facc15' : '#f87171';
   
   return (
      <button
        onClick={onClick}
        className="bg-[#1a1a1c] rounded-2xl p-1 flex flex-col items-center gap-2 active:scale-95 transition-all hover:bg-[#202022] group relative overflow-hidden"
      >
        <div className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md">
           {item.chance?.toFixed(2)}%
        </div>

        <div className="w-full aspect-square relative flex items-center justify-center p-2">
           <img src={item.image} className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" alt="" />
        </div>
        
        <div className="w-full px-2 pb-2">
            <div className="flex items-center justify-center gap-1.5 mb-2">
                <Star size={10} className="fill-white text-white" />
                <p className="text-xs font-bold text-white text-center">{item.value}</p>
            </div>
            {/* Minimal bar */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div 
                  className="h-full rounded-full" 
                  style={{ width: `${Math.min(item.chance || 0, 100)}%`, backgroundColor: chanceColor }} 
               />
            </div>
        </div>
      </button>
   );
};

// Helper for Roll Value Animation
const RollCursor = ({ spring, value, isSpring }: { spring: any, value: number, isSpring: boolean }) => {
   const springLeft = useTransform(spring, (v: number) => `${v}%`);
   
   return (
      <motion.div 
         className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_white] z-10"
         style={{ 
            left: isSpring ? springLeft : `${value}%`,
            transition: isSpring ? 'none' : 'left 0.05s linear'
         }}
      />
   );
};

// Helper for text number animation
const RollingNumber = ({ value }: { value: any }) => {
   const ref = useRef<HTMLSpanElement>(null);
   
   // Subscribe to motion value changes
   useEffect(() => {
      // If it's a motion value
      if (value && typeof value.onChange === 'function') {
         const unsubscribe = value.onChange((v: number) => {
            if (ref.current) {
               ref.current.textContent = `${v.toFixed(2)}%`;
            }
         });
         return unsubscribe;
      } else {
         // If it's a raw number (fallback)
         if (ref.current) {
            ref.current.textContent = `${Number(value).toFixed(2)}%`;
         }
      }
   }, [value]);

   return <span ref={ref} className="text-white/60 font-mono text-sm tracking-wider" />;
};

export default UpgradePage;
