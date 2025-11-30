import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useCaseStore } from '../store/caseStore';
import { useUserStore, type Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { Gamepad2, AlertCircle } from 'lucide-react';

interface PitItem extends Prize {
  uniqueId: string;
  x: number; // percent 0-100
  rotation: number;
  scale: number;
}

export const ClawMachine: React.FC = () => {
  const { getCaseById } = useCaseStore();
  const { addItem } = useUserStore();
  const { impactLight, impactHeavy, notificationSuccess } = useHaptics();
  
  const [pitItems, setPitItems] = useState<PitItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<'idle' | 'moving' | 'dropping' | 'grabbing' | 'rising' | 'won' | 'lost'>('idle');
  const [caughtItem, setCaughtItem] = useState<PitItem | null>(null);
  const [message, setMessage] = useState<string>('');
  
  const clawControls = useAnimation();
  const clawX = useMotionValue(50); // percent
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize items
  useEffect(() => {
    const starterCase = getCaseById('case-1');
    if (!starterCase) return;

    const newItems: PitItem[] = [];
    const items = starterCase.items;
    
    // Generate ~15 items based on weights
    for (let i = 0; i < 15; i++) {
      const rand = Math.random() * 100;
      let accum = 0;
      let selectedItem = items[items.length - 1];
      
      for (const item of items) {
        accum += item.chance;
        if (rand <= accum) {
          selectedItem = item;
          break;
        }
      }
      
      newItems.push({
        ...selectedItem,
        uniqueId: `pit-${i}-${Date.now()}`,
        x: 10 + Math.random() * 80, // Keep within 10-90%
        rotation: Math.random() * 40 - 20,
        scale: 0.9 + Math.random() * 0.2
      });
    }
    
    // Ensure at least one of each type exists for visibility
    items.forEach((item) => {
        if (!newItems.find(i => i.id === item.id)) {
            newItems.push({
                ...item,
                uniqueId: `force-${item.id}`,
                x: 10 + Math.random() * 80,
                rotation: Math.random() * 40 - 20,
                scale: 0.9 + Math.random() * 0.2
            });
        }
    });

    setPitItems(newItems.sort((a, b) => a.x - b.x)); // visual layering?
  }, [getCaseById]);

  const startGame = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setGameState('moving');
    setCaughtItem(null);
    setMessage('');
    impactLight();
  };
  
  // Refactored movement logic to use MotionValue for easier reading
  useEffect(() => {
    if (gameState === 'moving') {
      const duration = 2000; // ms for one sweep
      const start = Date.now();
      
      const animate = () => {
        if (gameState !== 'moving') return;
        const elapsed = Date.now() - start;
        const progress = (elapsed % (duration * 2)) / duration;
        const value = progress <= 1 ? progress * 100 : (2 - progress) * 100;
        
        clawX.set(value);
        requestAnimationFrame(animate);
      };
      const handle = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(handle);
    }
  }, [gameState, clawX]);


  const handleDrop = async () => {
    if (gameState !== 'moving') return;
    
    impactHeavy();
    setGameState('dropping');
    
    // 1. Drop Animation
    await clawControls.start({
      top: '75%',
      transition: { duration: 1.5, ease: 'linear' }
    });

    // 2. Check collision
    const finalX = clawX.get();
    const hitItem = pitItems.find(item => Math.abs(item.x - finalX) < 10); // 10% tolerance
    
    setGameState('grabbing');
    await new Promise(r => setTimeout(r, 500)); // Grab animation time

    if (hitItem) {
      setCaughtItem(hitItem);
      // Remove from pit visually temporarily
      setPitItems(prev => prev.filter(i => i.uniqueId !== hitItem.uniqueId));
    }

    setGameState('rising');
    
    // 3. Rise Animation
    // We need to simulate "slipping" during the rise
    const riseDuration = 1.5;
    
    if (hitItem) {
        // Calculate success chance
        // Max chance (common) ~50 -> 95% success
        // Min chance (rare) ~0.1 -> 5% success
        const successRate = 0.05 + (0.90 * (hitItem.chance / 50));
        const isSuccess = Math.random() < successRate;
        
        if (!isSuccess) {
            // Fail halfway
            await clawControls.start({
                top: '40%',
                transition: { duration: riseDuration / 2, ease: 'linear' }
            });
            
            // Drop item
            setCaughtItem(null);
            setPitItems(prev => [...prev, hitItem]); // Put it back
            impactLight();
            setMessage('Slipped!');
            
            await clawControls.start({
                top: '5%',
                transition: { duration: riseDuration / 2, ease: 'linear' }
            });
            
            setGameState('lost');
        } else {
            // Full rise
            await clawControls.start({
                top: '5%',
                transition: { duration: riseDuration, ease: 'linear' }
            });
            setGameState('won');
            notificationSuccess();
            setMessage(`You won ${hitItem.name}!`);
            addItem(hitItem);
        }
    } else {
        // Just rise
        await clawControls.start({
            top: '5%',
            transition: { duration: riseDuration, ease: 'linear' }
        });
        setGameState('lost');
        setMessage('Missed!');
    }
    
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center w-full h-full max-w-md mx-auto p-4">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <Gamepad2 /> Claw Machine
        </h2>
        <div className="text-sm text-white/50 bg-white/10 px-3 py-1 rounded-full">
            100 <span className="text-yellow-400">★</span> / play
        </div>
      </div>

      {/* Machine Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-[#1c1c1e] rounded-xl overflow-hidden border-4 border-[#3a3a3c] shadow-2xl"
      >
        {/* Background Grid/Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        {/* Claw Rig */}
        <motion.div
            className="absolute top-0 w-2 h-full bg-white/10 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: useTransform(clawX, (x) => `${x}%`) }}
        >
             {/* The String */}
             <motion.div 
                animate={clawControls}
                initial={{ top: '5%' }}
                className="absolute w-1 bg-gray-400 left-1/2 -translate-x-1/2 bottom-full"
                style={{ height: '1000px' }} // Long string going up
             />
             
             {/* The Claw */}
             <motion.div 
                animate={clawControls}
                initial={{ top: '5%' }}
                className="absolute -translate-x-1/2 flex flex-col items-center z-20"
             >
                <div className="w-16 h-12 bg-gray-700 rounded-t-lg border-b-4 border-gray-800 shadow-lg relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                {/* Claw Arms */}
                <div className="relative w-20 h-16">
                    <motion.div 
                        className="absolute left-0 top-0 w-2 h-16 bg-gray-400 origin-top-right rounded-bl-xl"
                        animate={{ rotate: gameState === 'grabbing' || caughtItem ? 25 : 45 }}
                    />
                    <motion.div 
                        className="absolute right-0 top-0 w-2 h-16 bg-gray-400 origin-top-left rounded-br-xl"
                        animate={{ rotate: gameState === 'grabbing' || caughtItem ? -25 : -45 }}
                    />
                </div>
                
                {/* Caught Item */}
                {caughtItem && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-16 mt-2"
                    >
                         <img src={caughtItem.image} alt="" className="w-12 h-12 object-contain drop-shadow-xl" />
                    </motion.div>
                )}
             </motion.div>
        </motion.div>

        {/* Items Pit */}
        <div className="absolute bottom-0 w-full h-32 px-4 flex items-end justify-center">
            {pitItems.map((item) => (
                <motion.div
                    key={item.uniqueId}
                    className="absolute bottom-2"
                    style={{ 
                        left: `${item.x}%`, 
                        zIndex: Math.floor(item.x),
                        x: '-50%' 
                    }}
                >
                    <motion.img 
                        src={item.image} 
                        alt="" 
                        className="w-16 h-16 object-contain drop-shadow-lg"
                        style={{ 
                            rotate: item.rotation,
                            scale: item.scale
                        }}
                        whileHover={{ scale: 1.2, zIndex: 100 }}
                    />
                </motion.div>
            ))}
        </div>
        
        {/* Message Overlay */}
        {message && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
             >
                <div className="bg-[#1c1c1e] border border-yellow-500/30 p-6 rounded-2xl text-center shadow-2xl">
                    <div className="text-2xl font-bold text-white mb-2">{message}</div>
                    {gameState === 'won' && caughtItem && (
                        <div className="flex flex-col items-center gap-2">
                            <img src={caughtItem.image} className="w-20 h-20 object-contain" />
                            <span className="text-yellow-400 font-bold">+{caughtItem.value} Stars</span>
                        </div>
                    )}
                </div>
             </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 w-full">
        {!isPlaying && gameState !== 'won' && gameState !== 'lost' ? (
            <button
                onClick={startGame}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95"
            >
                PLAY (100 Stars)
            </button>
        ) : gameState === 'won' || gameState === 'lost' ? (
             <button
                onClick={() => {
                    setGameState('idle');
                    setIsPlaying(false);
                    setMessage('');
                    setCaughtItem(null);
                    startGame();
                }}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-xl transition-all active:scale-95"
            >
                PLAY AGAIN
            </button>
        ) : (
            <button
                onClick={handleDrop}
                disabled={gameState !== 'moving'}
                className={`w-full py-8 rounded-full font-black text-2xl tracking-widest shadow-lg transition-all active:scale-95 ${
                    gameState === 'moving' 
                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
            >
                {gameState === 'moving' ? 'GRAB!' : '...'}
            </button>
        )}
      </div>
      
      <div className="mt-6 flex items-start gap-3 text-xs text-white/30 bg-white/5 p-4 rounded-lg">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>
            Rarity affects grip strength! Common items are easy to grab, but Legendary items are heavy and might slip from the claw. Good luck!
        </p>
      </div>
    </div>
  );
};
