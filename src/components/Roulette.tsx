import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
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
const EXTRA_CARDS_BEFORE = 50;
const EXTRA_CARDS_AFTER = 20;

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
  const [isSpinning, setIsSpinning] = useState(false);
  const x = useMotionValue(0);
  const lastHapticIndex = useRef(0);
  const hasSpunRef = useRef(false);

  useEffect(() => {
    if (!idle || items.length === 0) return;
    
    hasSpunRef.current = false;
    controls.stop();
    
    const viewportWidth = viewportRef.current?.offsetWidth || 400;
    const minCards = Math.ceil(viewportWidth / CARD_WIDTH) + 4;
    const repeatCount = Math.max(5, Math.ceil(minCards / items.length) + 3);
    
    const loopItems: Prize[] = [];
    for (let i = 0; i < repeatCount; i++) {
      loopItems.push(...items.map(item => ({ ...item, id: `idle-${i}-${item.id}` })));
    }
    setRouletteItems(loopItems);
    setIsSpinning(false);
    
    const totalWidth = items.length * CARD_WIDTH;
    const startX = 0;
    
    x.set(startX);

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
    
    return () => {
      controls.stop();
    };
  }, [idle, items, controls, x]);

  useEffect(() => {
    if (idle || !winningItem || isSpinning || hasSpunRef.current) return;
    
    hasSpunRef.current = true;
    setIsSpinning(true);
    controls.stop();
    
    const generatedItems: Prize[] = [];
    const getRandom = () => items[Math.floor(Math.random() * items.length)];
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const bestItem = sorted[0];

    for (let i = 0; i < EXTRA_CARDS_BEFORE; i++) {
      generatedItems.push({ ...getRandom(), id: `roulette-before-${i}` });
    }
    
    if (Math.random() < 0.6 && bestItem.id !== winningItem.id) {
      generatedItems[EXTRA_CARDS_BEFORE - 1] = { ...bestItem, id: `bait-prev` };
    }

    generatedItems.push({ ...winningItem, id: `roulette-winner` });
    
    for (let i = 0; i < EXTRA_CARDS_AFTER; i++) {
      if (i === 0 && Math.random() < 0.5 && bestItem.id !== winningItem.id) {
        generatedItems.push({ ...bestItem, id: `bait-after` });
      } else {
        generatedItems.push({ ...getRandom(), id: `roulette-after-${i}` });
      }
    }
    
    setRouletteItems(generatedItems);
    
    const runAnimation = async () => {
      const viewportWidth = viewportRef.current?.offsetWidth || 0;
      const viewportCenter = viewportWidth / 2;
      const winnerIndex = EXTRA_CARDS_BEFORE;
      const winnerCenter = (winnerIndex * CARD_WIDTH) + (CARD_WIDTH / 2);
      
      const nearMissOffset = (Math.random() > 0.5 ? 1 : -1) * (CARD_WIDTH * 0.25 + Math.random() * CARD_WIDTH * 0.2);
      
      const startX = viewportCenter;
      const targetX = viewportCenter - winnerCenter + nearMissOffset;
      
      x.set(startX);
      
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      
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

    runAnimation();
  }, [winningItem, idle, items, controls, delay, onComplete, x, impactHeavy, isSpinning]);

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

  return (
    <div 
      ref={viewportRef}
      className="relative w-full h-full min-h-[80px] overflow-hidden select-none flex items-center"
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
            <div className="w-24 h-24 flex flex-col items-center justify-center relative">
              <img src={item.image} alt="" className="w-16 h-16 object-contain drop-shadow-2xl mb-1" />
              
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f0f10]/80 border border-white/10 backdrop-blur-md shadow-lg"
              >
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="font-black text-white tracking-wide text-xs">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
