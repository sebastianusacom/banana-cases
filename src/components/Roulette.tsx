import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

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
    if (idle || !winningItem) {
        setRouletteItems(items.slice(0, 15));
        return;
    }

    const generatedItems: Prize[] = [];
    const getRandom = () => items[Math.floor(Math.random() * items.length)];

    for (let i = 0; i < EXTRA_CARDS; i++) {
      generatedItems.push({ ...getRandom(), id: `roulette-${i}` });
    }
    
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const bestItem = sorted[0];
    
    if (Math.random() < 0.4 && bestItem.id !== winningItem.id) {
        const pos = EXTRA_CARDS - 1;
        generatedItems[pos] = { ...bestItem, id: `bait-${pos}` };
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
  }, [items, winningItem, idle]);

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
      const centerOffset = containerWidth / 2 - CARD_WIDTH / 2;
      
      const randomOffset = (Math.random() * 0.4 - 0.2) * CARD_WIDTH; 
      const targetX = -(EXTRA_CARDS * CARD_WIDTH) + centerOffset + randomOffset;

      await controls.start({
        x: targetX,
        transition: {
          duration: 5.5,
          ease: [0.15, 0.85, 0.30, 1.0],
        },
      });

      impactHeavy();
      onComplete();
    };

    startAnimation();
  }, [rouletteItems, controls, delay, onComplete, idle, x, impactHeavy, winningItem]);

  return (
    <div className="relative w-full h-44 overflow-hidden mb-2 select-none flex items-center justify-center">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent z-10 pointer-events-none" />

      <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent z-20 -translate-x-1/2 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-yellow-400" />
         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-yellow-400" />
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
                 "w-24 h-24 rounded-2xl bg-[#252527] flex items-center justify-center p-4 relative transition-all",
                 item.id.includes('winner') && !idle 
                    ? "shadow-[0_0_30px_rgba(255,255,255,0.15)] bg-[#2c2c2e] scale-105 z-10 border border-white/10" 
                    : "opacity-60 scale-90 grayscale-[0.5]"
             )}>
                 <img src={item.image} alt="" className="w-full h-full object-contain drop-shadow-lg" />
                 
                 <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50"
                    style={{ backgroundColor: item.color, boxShadow: `0 -4px 10px ${item.color}` }}
                 />
             </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
