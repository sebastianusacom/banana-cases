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

const CARD_WIDTH = 140; 
const CARD_HEIGHT = 140;
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
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      onComplete();
    };

    startAnimation();
  }, [rouletteItems, controls, delay, onComplete, idle, x, impactHeavy, winningItem]);

  return (
    <div className="relative w-full h-52 overflow-hidden mb-2 select-none flex items-center justify-center">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#1c1c1e] via-[#1c1c1e]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#1c1c1e] via-[#1c1c1e]/90 to-transparent z-10 pointer-events-none" />

      <div className="absolute top-6 bottom-6 left-1/2 w-0.5 bg-yellow-400/20 z-20 -translate-x-1/2">
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
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
                 "w-28 h-28 flex flex-col items-center justify-center relative transition-all",
                 item.id.includes('winner') && !idle 
                    ? "scale-110 z-10" 
                    : "opacity-40 scale-90 grayscale-[0.8]"
             )}>
                 <img src={item.image} alt="" className="w-20 h-20 object-contain drop-shadow-2xl mb-2" />
                 
                 <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm"
                    style={{ borderColor: item.id.includes('winner') && !idle ? item.color : 'transparent' }}
                 >
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-white">{item.value}</span>
                 </div>
             </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
