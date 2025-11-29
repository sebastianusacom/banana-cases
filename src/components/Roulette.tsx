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
  const containerRef = useRef<HTMLDivElement>(null);
  const [rouletteItems, setRouletteItems] = useState<Prize[]>([]);
  
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
        
        const totalWidth = baseItems.length * CARD_WIDTH;
        controls.start({
            x: [0, -totalWidth],
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
    if (idle || rouletteItems.length === 0 || !winningItem) return;

    const startAnimation = async () => {
      x.set(0);
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      
      const containerWidth = containerRef.current?.offsetWidth || 0;
      // We want the center of the container to align with the center of the winning card.
      // The winning card is at index EXTRA_CARDS.
      // Its center position relative to the start of the strip is:
      // (EXTRA_CARDS * CARD_WIDTH) + (CARD_WIDTH / 2)
      
      // But we are moving the strip to the LEFT (negative x).
      // So we want to shift it by -(position of winning card center) + (container center)
      
      const winningCardCenter = (EXTRA_CARDS * CARD_WIDTH) + (CARD_WIDTH / 2);
      const containerCenter = containerWidth / 2;
      
      const targetX = -winningCardCenter + containerCenter;

      await controls.start({
        x: targetX,
        transition: {
          duration: 5.5,
          ease: [0.15, 0.85, 0.30, 1.0], // Custom cubic bezier for realistic friction
        },
      });

      impactHeavy();
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      onComplete();
    };

    startAnimation();
  }, [rouletteItems, controls, delay, onComplete, idle, x, impactHeavy, winningItem]);

  return (
    <div className="relative w-full h-full min-h-[120px] max-h-[180px] overflow-hidden select-none flex items-center justify-center">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0f0f10] via-[#0f0f10]/95 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0f0f10] via-[#0f0f10]/95 to-transparent z-10 pointer-events-none" />

      <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-yellow-500/50 z-30 -translate-x-1/2 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
         <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)]" />
         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)]" />
      </div>

      <motion.div
        ref={containerRef}
        animate={controls}
        style={{ x, display: 'flex' }}
        className="items-center pl-[50%]"
      >
        {rouletteItems.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 flex flex-col items-center justify-center relative"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          >
             <div className={clsx(
                 "flex flex-col items-center justify-center relative transition-all duration-300",
                 item.id.includes('winner') && !idle 
                    ? "scale-125 z-20" 
                    : "opacity-25 scale-75 grayscale"
             )}>
                 <img 
                    src={item.image} 
                    alt="" 
                    className={clsx(
                        "object-contain mb-1 transition-all duration-300",
                        item.id.includes('winner') && !idle 
                            ? "w-20 h-20 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                            : "w-14 h-14 drop-shadow-none"
                    )} 
                 />
                 
                 <motion.div 
                    layout
                    className={clsx(
                        "flex items-center gap-1.5 rounded-full backdrop-blur-md origin-center",
                        item.id.includes('winner') && !idle 
                            ? "px-3 py-1.5 bg-[#0f0f10] border-2 shadow-xl" 
                            : "px-2 py-0.5 bg-[#0f0f10]/60 border border-white/5"
                    )}
                    style={{ 
                        borderColor: item.id.includes('winner') && !idle ? item.color : 'rgba(255,255,255,0.05)' 
                    }}
                    animate={item.id.includes('winner') && !idle ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            `0 0 10px ${item.color}40`, 
                            `0 0 25px ${item.color}90`, 
                            `0 0 10px ${item.color}40`
                        ],
                    } : { scale: 1, boxShadow: 'none' }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                 >
                    <Star 
                        size={item.id.includes('winner') && !idle ? 16 : 10} 
                        className={clsx(
                            "fill-yellow-400",
                            item.id.includes('winner') && !idle ? "text-yellow-400" : "text-yellow-400/50"
                        )} 
                    />
                    <span className={clsx(
                        "font-black tracking-wide transition-all",
                        item.id.includes('winner') && !idle ? "text-base text-white" : "text-[10px] text-white/50"
                    )}>{item.value}</span>
                 </motion.div>
             </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
