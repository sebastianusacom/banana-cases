import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';
import { Star } from 'lucide-react';

interface RouletteProps {
  items: Prize[];
  winningItem?: Prize;
  onComplete: () => void;
  delay?: number;
  idle?: boolean;
}

const CARD_WIDTH = 120; 
const CARD_HEIGHT = 120;
const EXTRA_CARDS = 40;

export const Roulette: React.FC<RouletteProps> = ({
  items,
  winningItem,
  onComplete,
  delay = 0,
  idle = false
}) => {
  const { impactLight, impactHeavy } = useHaptics();
  const controls = useAnimation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [rouletteItems, setRouletteItems] = useState<Prize[]>([]);
  const [showWinnerEffect, setShowWinnerEffect] = useState(false);
  
  useEffect(() => {
    if (idle) {
        const baseItems = items.length > 0 ? items : [];
        if (baseItems.length === 0) return;

        const repeatCount = Math.max(3, Math.ceil(20 / baseItems.length));
        const loopItems = [];
        for(let i=0; i < repeatCount + 2; i++) {
            loopItems.push(...baseItems.map(item => ({...item, id: `idle-${i}-${item.id}`})));
        }
        setRouletteItems(loopItems);
        setShowWinnerEffect(false);
        
        const viewportWidth = viewportRef.current?.offsetWidth || 400;
        const totalWidth = baseItems.length * CARD_WIDTH;
        const startX = viewportWidth / 2;
        
        controls.start({
            x: [startX, startX - totalWidth],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: totalWidth / 50,
                    ease: "linear",
                }
            }
        });
        return;
    }

    if (!winningItem) return;

    setShowWinnerEffect(false);
    const generatedItems: Prize[] = [];
    const getRandom = () => items[Math.floor(Math.random() * items.length)];
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const bestItem = sorted[0];

    for (let i = 0; i < EXTRA_CARDS; i++) {
      generatedItems.push({ ...getRandom(), id: `roulette-${i}` });
    }
    
    if (Math.random() < 0.5 && bestItem.id !== winningItem.id) {
      generatedItems[EXTRA_CARDS - 1] = { ...bestItem, id: `bait-prev` };
    }

    generatedItems.push({ ...winningItem, id: `roulette-winner` });
    
    for (let i = 0; i < 5; i++) {
       if (i === 0 && Math.random() < 0.4 && bestItem.id !== winningItem.id) {
           generatedItems.push({ ...bestItem, id: `bait-after` });
       } else {
           generatedItems.push({ ...getRandom(), id: `roulette-after-${i}` });
       }
    }
    
    setRouletteItems(generatedItems);
  }, [items, winningItem, idle, controls]);

  const x = useMotionValue(0);
  const lastHapticIndex = useRef(0);

  useEffect(() => {
    if (idle) return;
    const unsubscribe = x.on("change", (latest) => {
        const index = Math.abs(Math.floor(latest / CARD_WIDTH));
        if (index !== lastHapticIndex.current) {
            impactLight();
            lastHapticIndex.current = index;
        }
    });
    return () => unsubscribe();
  }, [x, impactLight, idle]);

  useEffect(() => {
    // Prevent starting animation if we're in game mode but still have idle items
    const hasIdleItems = rouletteItems.some(item => item.id.startsWith('idle-'));
    if (idle || rouletteItems.length === 0 || !winningItem || (!idle && hasIdleItems)) return;

    const startAnimation = async () => {
      const viewportWidth = viewportRef.current?.offsetWidth || 0;
      const viewportCenter = viewportWidth / 2;
      const winnerIndex = EXTRA_CARDS;
      const winnerCenter = (winnerIndex * CARD_WIDTH) + (CARD_WIDTH / 2);
      const startX = viewportCenter - (CARD_WIDTH / 2);
      const targetX = viewportCenter - winnerCenter;
      
      x.set(startX);
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));

      await controls.start({
        x: targetX,
        transition: {
          duration: 5.5,
          ease: [0.15, 0.85, 0.30, 1.0],
        },
      });

      setShowWinnerEffect(true);
      impactHeavy();
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      onComplete();
    };

    startAnimation();
  }, [rouletteItems, controls, delay, onComplete, idle, x, impactHeavy, winningItem]);

  return (
    <div 
      ref={viewportRef}
      className="relative w-full h-full min-h-[120px] max-h-[180px] overflow-hidden select-none flex items-center"
    >
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0f0f10] via-[#0f0f10]/95 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0f0f10] via-[#0f0f10]/95 to-transparent z-10 pointer-events-none" />

      <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-yellow-500/50 z-30 -translate-x-1/2 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
         <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)]" />
         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)]" />
      </div>

      <motion.div
        animate={controls}
        style={{ x, display: 'flex' }}
        className="items-center"
      >
        {rouletteItems.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 flex flex-col items-center justify-center relative"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          >
             <div className={clsx(
                 "w-24 h-24 flex flex-col items-center justify-center relative transition-all duration-300",
                 item.id.includes('winner') && !idle && showWinnerEffect
                    ? "scale-110 z-10 opacity-100" 
                    : showWinnerEffect && !idle
                        ? "opacity-30 scale-85 grayscale-[0.9]"
                        : "opacity-100 scale-95"
             )}>
                 <img src={item.image} alt="" className="w-16 h-16 object-contain drop-shadow-2xl mb-1" />
                 
                 <motion.div 
                    layout
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f0f10]/80 border border-white/10 backdrop-blur-md shadow-lg origin-center"
                    style={{ 
                        borderColor: item.id.includes('winner') && !idle && showWinnerEffect ? item.color : 'rgba(255,255,255,0.1)' 
                    }}
                    animate={item.id.includes('winner') && !idle && showWinnerEffect ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                            `0 0 0px ${item.color}00`, 
                            `0 0 20px ${item.color}80`, 
                            `0 0 0px ${item.color}00`
                        ],
                        borderColor: [item.color, '#ffffff', item.color]
                    } : { scale: 1, boxShadow: 'none' }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                 >
                    <Star size={item.id.includes('winner') && !idle && showWinnerEffect ? 14 : 12} className="text-yellow-400 fill-yellow-400" />
                    <span className={clsx(
                        "font-black text-white tracking-wide transition-all",
                        item.id.includes('winner') && !idle && showWinnerEffect ? "text-sm" : "text-xs"
                    )}>{item.value}</span>
                 </motion.div>
             </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
