import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useSpring } from 'framer-motion';
import { X, Star, Zap, Loader2, Plus, ArrowUpRight, RotateCw } from 'lucide-react';
import { useUserStore, type Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { api } from '../api/client';
import clsx from 'clsx';
import { PrizeModal } from '../components/PrizeModal';

// --- Blackhole Particle System ---
const BlackholeParticles: React.FC<{ isActive: boolean; intensity: number }> = ({ isActive, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; angle: number; dist: number; speed: number; size: number; color: string }[] = [];
    let animationFrameId: number;

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDist = Math.max(canvas.width, canvas.height) / 1.5;

    const createParticle = () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = maxDist;
        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            angle,
            dist,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 1.5 + 0.5,
            color: Math.random() > 0.8 ? '#a78bfa' : '#ffffff' // Purple or white
        };
    };

    // Fill initial pool
    for(let i=0; i<50; i++) particles.push(createParticle());

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Intensity multiplier
        const currentSpeedMult = isActive ? 3 + (intensity * 5) : 0.5;

        if (particles.length < (isActive ? 150 : 50)) {
            if (Math.random() < 0.2) particles.push(createParticle());
        }

        particles.forEach((p, i) => {
            // Update
            p.dist -= p.speed * currentSpeedMult;
            p.angle += (0.01 + (1 - p.dist/maxDist) * 0.05) * currentSpeedMult; // Spiral faster as gets closer
            
            p.x = centerX + Math.cos(p.angle) * p.dist;
            p.y = centerY + Math.sin(p.angle) * p.dist;

            // Draw
            const alpha = Math.min(1, (p.dist / maxDist));
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Trail
            if (isActive) {
                const tailLen = p.speed * currentSpeedMult * 2;
                const tailX = centerX + Math.cos(p.angle - 0.1) * (p.dist + tailLen);
                const tailY = centerY + Math.sin(p.angle - 0.1) * (p.dist + tailLen);
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(167, 139, 250, ${alpha * 0.5})`;
                ctx.lineWidth = p.size;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }

            // Reset if sucked in
            if (p.dist < 10) {
                particles[i] = createParticle();
            }
        });

        animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, intensity]);

  return <canvas ref={canvasRef} className="absolute inset-[-100px] w-[calc(100%+200px)] h-[calc(100%+200px)] pointer-events-none z-0 opacity-60" />;
};


const UpgradePage: React.FC = () => {
  const { inventory, userId, fetchUser, removeItem, addItem } = useUserStore();
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError, selectionChanged } = useHaptics();

  // State
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
  const controls = useAnimation();
  const [upgradeStatus, setUpgradeStatus] = useState<'idle' | 'rolling' | 'success' | 'fail'>('idle');
  
  // Roll Animation
  const rollSpring = useSpring(0, { stiffness: 40, damping: 15 }); // Used for smooth needle movement
  
  const circleSize = 220; // Increased size for circular bar
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

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
    setUpgradeStatus('rolling');
    impactMedium();
    
    // Reset roll
    rollSpring.set(0);

    // Start fast spinning visual (visual only)
    let spinInterval: ReturnType<typeof setInterval>;
    let currentRotation = 0;
    
    // Spin fast!
    controls.start("rolling");
    
    // Animate rotation manually to simulate fast spinning
    spinInterval = setInterval(() => {
        currentRotation += 15 + Math.random() * 10; 
        rollSpring.set(currentRotation);
        impactLight();
    }, 50);

    try {
      const res = await api.upgradeItem(userId, selectedUserItem.id, selectedTargetItem.id);
      
      // Ensure minimum spin time of 2s
      await new Promise(r => setTimeout(r, 2000));
      clearInterval(spinInterval);

      // Determine final visual angle
      // We normalize everything to 360 degrees.
      // Win zone is from 0 to (winChance / 100) * 360.
      const winAngleMax = (winChance / 100) * 360;
      
      // Current rotation might be very high (e.g. 7200), we need to land on a specific spot relative to module 360
      const currentMod = currentRotation % 360;
      const baseRotation = currentRotation - currentMod + 360; // Next full circle start
      
      let finalAngle = 0;

      if (res.success) {
          // Land safely inside 0 to winAngleMax
          // Add buffer to avoid visual edge cases (e.g. 5% buffer inside)
          const buffer = Math.min(5, winAngleMax * 0.1); 
          const safeMax = Math.max(0, winAngleMax - buffer);
          const safeMin = buffer;
          
          const randomOffset = Math.random() * (safeMax - safeMin) + safeMin;
          finalAngle = baseRotation + randomOffset;
      } else {
          // Fail
          // Near miss logic?
          const isNearMiss = Math.random() < 0.4; // 40% chance of near miss visual on fail
          
          if (isNearMiss) {
              // Land JUST outside winAngleMax
              // e.g., winAngleMax + 1 to 15 degrees
              finalAngle = baseRotation + winAngleMax + 2 + Math.random() * 15;
          } else {
              // Hard fail: Land anywhere else in the fail zone
              // Fail zone start: winAngleMax
              // Fail zone end: 360
              const failZoneStart = winAngleMax + 20; 
              const failZoneEnd = 360 - 10;
              
              if (failZoneEnd > failZoneStart) {
                  finalAngle = baseRotation + failZoneStart + Math.random() * (failZoneEnd - failZoneStart);
              } else {
                  // Fallback if chance is super high (like 90%)
                   finalAngle = baseRotation + winAngleMax + 5;
              }
          }
      }

      // Execute final slow roll to landing
      rollSpring.set(finalAngle);
      
      // Wait for spring to settle roughly
      setTimeout(() => {
          if (res.success) {
              finishSuccess();
          } else {
              finishFail();
          }
      }, 1000);

    } catch (e) {
      console.error(e);
      notificationError();
      setIsUpgrading(false);
      setUpgradeStatus('idle');
      clearInterval(spinInterval!);
    }
  };

  const finishSuccess = () => {
      setUpgradeStatus('success');
      controls.start("success");
      impactHeavy();
      notificationSuccess();

      // Process inventory changes
      removeItem(selectedUserItem!.id);
      const newItem = { ...selectedTargetItem!, id: `upgraded-${Date.now()}`, wonAt: Date.now() };
      addItem(newItem);

      setTimeout(() => {
         setShowPrizeModal(true);
         setIsUpgrading(false);
         setUpgradeStatus('idle');
         controls.start("idle");
         rollSpring.set(0);
      }, 1500);
      fetchUser();
  };

  const finishFail = () => {
      setUpgradeStatus('fail');
      controls.start("fail");
      impactHeavy();
      notificationError();

      // Burn item
      removeItem(selectedUserItem!.id);

      setTimeout(() => {
         setIsUpgrading(false);
         setUpgradeStatus('idle');
         controls.start("idle");
         setSelectedUserItem(null);
         setSelectedTargetItem(null);
         rollSpring.set(0);
      }, 2000);
      fetchUser();
  };

  const reset = () => {
    setSelectedUserItem(null);
    setSelectedTargetItem(null);
    setUpgradeStatus('idle');
    setIsUpgrading(false);
    setAvailableTargets([]);
    rollSpring.set(0);
  };

  const getChanceColor = (chance: number) => {
    if (chance > 50) return '#4ade80'; // green
    if (chance > 20) return '#facc15'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f10] overflow-hidden relative">
      
      {/* Grid Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: `radial-gradient(circle at center, #2a2a30 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }} 
      />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full p-4 max-w-lg mx-auto gap-4">
        
        {/* --- Top: Target Slot --- */}
        <div className="relative z-20 w-full flex justify-center">
            <motion.button
                onClick={() => {
                  if (!isUpgrading && selectedUserItem) {
                      setShowTargets(true);
                      selectionChanged();
                  }
                }}
                disabled={!selectedUserItem || isUpgrading}
                whileTap={{ scale: 0.95 }}
                animate={upgradeStatus === 'success' ? { scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                className={clsx(
                    "w-28 h-28 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300",
                    selectedTargetItem
                      ? "bg-[#18181b] border-white/10 shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]"
                      : "bg-[#18181b]/50 border-dashed border-white/10 opacity-60"
                )}
            >
                {selectedTargetItem ? (
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ opacity: 1, scale: 1 }}
                     key={selectedTargetItem.id}
                     className="relative w-full h-full p-3"
                  >
                      <img src={selectedTargetItem.image} className="w-full h-full object-contain drop-shadow-2xl" alt="" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-white/10">
                         <Star size={8} className="text-yellow-400 fill-yellow-400" />
                         <span className="text-[10px] font-bold text-white">{selectedTargetItem.value}</span>
                      </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/20">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Plus size={16} />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider">Target</span>
                  </div>
                )}
            </motion.button>
        </div>


        {/* --- Middle: Blackhole Reactor --- */}
        <div className="relative z-30 flex items-center justify-center my-4">
            
            {/* Particle Container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]">
                <BlackholeParticles isActive={upgradeStatus === 'rolling'} intensity={0.5} />
            </div>

            {/* Main Interactive Circle */}
            <div 
                className="relative flex items-center justify-center" 
                style={{ width: circleSize, height: circleSize }}
            >
                {/* SVG Progress/Chance Bar */}
                {selectedTargetItem && (
                    <svg className="absolute inset-0 rotate-[-90deg] drop-shadow-2xl z-20 pointer-events-none" width={circleSize} height={circleSize}>
                        {/* Track */}
                        <circle
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            fill="none"
                            stroke="#1a1a1c"
                            strokeWidth={strokeWidth}
                        />
                        {/* Win Zone Arc */}
                        <motion.circle
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: winChance / 100 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            fill="none"
                            stroke={getChanceColor(winChance)}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                    </svg>
                )}

                {/* Rotating Needle Indicator */}
                {selectedTargetItem && (
                    <motion.div 
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{ rotate: rollSpring }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[4px]">
                           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white drop-shadow-[0_0_5px_white]" />
                        </div>
                    </motion.div>
                )}

                {/* Center Button */}
                <motion.button
                   disabled={isUpgrading}
                   onClick={() => {
                        if (!isUpgrading) {
                             if (!selectedUserItem) {
                                  setShowInventory(true);
                                  selectionChanged();
                             } else if (!selectedTargetItem) {
                                  setShowTargets(true);
                                  selectionChanged();
                             } else {
                                  handleUpgrade();
                             }
                        }
                   }}
                   whileTap={{ scale: 0.95 }}
                   className={clsx(
                      "w-40 h-40 rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-500 z-10",
                      // Background handling
                      upgradeStatus === 'rolling' ? "bg-black shadow-[0_0_60px_rgba(139,92,246,0.6)] scale-95" :
                      upgradeStatus === 'success' ? "bg-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.9)]" :
                      upgradeStatus === 'fail' ? "bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.6)]" :
                      (selectedUserItem && selectedTargetItem) ? "bg-[#18181b] shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-[#27272a]" :
                      "bg-[#121212] border-2 border-white/5 cursor-pointer"
                   )}
                >
                   {/* Inner Blackhole Gradient */}
                   {upgradeStatus === 'rolling' && (
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-purple-900/40 to-black animate-pulse" />
                   )}
                   
                   <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                       {isUpgrading ? (
                          <>
                             {upgradeStatus === 'rolling' && <Loader2 size={40} className="animate-spin text-white opacity-80" />}
                             {upgradeStatus === 'success' && <Zap size={48} className="text-white fill-white drop-shadow-[0_0_15px_white]" />}
                             {upgradeStatus === 'fail' && <X size={48} className="text-white drop-shadow-[0_0_15px_black]" />}
                          </>
                       ) : (selectedUserItem && selectedTargetItem) ? (
                          <>
                             <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Win Chance</span>
                             <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg" style={{ color: getChanceColor(winChance) }}>
                                {winChance.toFixed(2)}%
                             </div>
                             <div className="mt-2 px-4 py-1.5 bg-white/10 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upgrade</span>
                                <ArrowUpRight size={12} className="text-white" />
                             </div>
                          </>
                       ) : (
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1">
                                <RotateCw size={18} className="text-white/40" />
                             </div>
                             <div className="text-white/40 text-xs font-bold uppercase tracking-widest px-4 leading-tight">
                                Select Items<br/>to Upgrade
                             </div>
                          </div>
                       )}
                   </div>
                </motion.button>

            </div>
        </div>


        {/* --- Bottom: Source Slot --- */}
        <div className="relative z-20 w-full flex justify-center">
            <motion.button
                onClick={() => {
                  if (!isUpgrading) {
                      setShowInventory(true);
                      selectionChanged();
                  }
                }}
                disabled={isUpgrading}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    "w-24 h-24 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300",
                    selectedUserItem
                      ? "bg-[#18181b] border-white/10 shadow-lg"
                      : "bg-[#18181b]/50 border-dashed border-white/10 opacity-60"
                )}
            >
                {selectedUserItem ? (
                  <motion.div 
                     key={selectedUserItem.id}
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ 
                         opacity: upgradeStatus === 'rolling' ? 0 : 1, 
                         scale: upgradeStatus === 'rolling' ? 0 : 1,
                         rotate: upgradeStatus === 'rolling' ? 180 : 0
                     }}
                     transition={{ duration: 0.5 }}
                     className="relative w-full h-full p-3"
                  >
                      <img src={selectedUserItem.image} className="w-full h-full object-contain drop-shadow-xl" alt="" />
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/20">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <RotateCw size={16} />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider">Source</span>
                  </div>
                )}
            </motion.button>
        </div>

      </div>

      {/* --- Drawers & Modals --- */}
      
      {/* Inventory Drawer */}
      <Drawer 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
        title="Select Item to Upgrade"
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
        title="Select Target Item"
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

// --- Subcomponents ---

const Drawer: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-[#121212] rounded-t-[2rem] z-[70] max-h-[80vh] flex flex-col shadow-2xl ring-1 ring-white/10"
        >
          <div className="p-5 flex items-center justify-between border-b border-white/5">
            <h3 className="font-bold text-white text-lg tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={16} className="text-white/70" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto pb-safe">
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
    className="bg-[#1a1a1c] rounded-xl p-3 flex flex-col items-center gap-3 active:scale-95 transition-all group border border-white/5"
  >
     <div className="w-full aspect-square relative flex items-center justify-center">
        <img src={item.image} className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300" alt="" />
     </div>
     <div className="w-full">
        <div className="flex items-center justify-center gap-1.5 bg-white/5 rounded-md py-1 px-1.5">
           <Star size={10} className="fill-white text-white" />
           <p className="text-[10px] font-bold text-white text-center truncate w-full">{item.value}</p>
        </div>
     </div>
  </button>
);

const TargetCard: React.FC<{ item: Prize; onClick: () => void }> = ({ item, onClick }) => {
   const chanceColor = item.chance > 50 ? '#4ade80' : item.chance > 20 ? '#facc15' : '#ef4444';
   
   return (
      <button
        onClick={onClick}
        className="bg-[#1a1a1c] rounded-xl p-2 flex flex-col items-center gap-2 active:scale-95 transition-all group relative overflow-hidden border border-white/5"
      >
        <div className="absolute top-1.5 right-1.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10">
           {item.chance?.toFixed(2)}%
        </div>

        <div className="w-full aspect-square relative flex items-center justify-center p-2 mt-1">
           <img src={item.image} className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300" alt="" />
        </div>
        
        <div className="w-full px-1 pb-1">
            <div className="flex items-center justify-center gap-1 mb-2">
                <Star size={8} className="fill-white text-white" />
                <p className="text-[10px] font-bold text-white text-center truncate">{item.value}</p>
            </div>
            <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div 
                  className="h-full rounded-full" 
                  style={{ width: `${Math.min(item.chance || 0, 100)}%`, backgroundColor: chanceColor }} 
               />
            </div>
        </div>
      </button>
   );
};

export default UpgradePage;
