import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';

interface RouletteProps {
  items: Prize[];
  winningItem: Prize;
  onComplete: () => void;
  delay?: number;
}

const CARD_WIDTH = 140; // Width + margin
const EXTRA_CARDS = 25; // How many random cards before the winner

export const Roulette: React.FC<RouletteProps> = ({
  items,
  winningItem,
  onComplete,
  delay = 0,
}) => {
  const { impactLight } = useHaptics();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rouletteItems, setRouletteItems] = useState<Prize[]>([]);
  
  // Generate the strip of items
  useEffect(() => {
    const generatedItems: Prize[] = [];
    // Add random items before
    for (let i = 0; i < EXTRA_CARDS; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      generatedItems.push({ ...randomItem, id: `roulette-${i}` });
    }
    // Add winning item (and maybe some near misses around it)
    generatedItems.push({ ...winningItem, id: `roulette-winner` });
    // Add random items after
    for (let i = 0; i < 5; i++) {
       const randomItem = items[Math.floor(Math.random() * items.length)];
       generatedItems.push({ ...randomItem, id: `roulette-after-${i}` });
    }
    setRouletteItems(generatedItems);
  }, [items, winningItem]);

  const x = useMotionValue(0);
  const lastHapticIndex = useRef(0);

  useEffect(() => {
    // Trigger haptics on scroll
    const unsubscribe = x.on("change", (latest) => {
        const index = Math.abs(Math.floor(latest / CARD_WIDTH));
        if (index !== lastHapticIndex.current) {
            impactLight();
            lastHapticIndex.current = index;
        }
    });
    return () => unsubscribe();
  }, [x, impactLight]);


  useEffect(() => {
    if (rouletteItems.length === 0) return;

    const startAnimation = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      
      // Calculate target position
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const centerOffset = containerWidth / 2 - CARD_WIDTH / 2;
      
      // Add a random offset within the card for realism (not perfectly centered)
      const randomOffset = (Math.random() * 0.6 - 0.3) * CARD_WIDTH; 
      
      const targetX = -(EXTRA_CARDS * CARD_WIDTH) + centerOffset + randomOffset;

      await controls.start({
        x: targetX,
        transition: {
          duration: 4, // 4 seconds spin
          ease: [0.15, 0.85, 0.35, 1.0], // Custom bezier for "spin down" feel
        },
      });

      onComplete();
    };

    startAnimation();
  }, [rouletteItems, controls, delay, onComplete]);

  return (
    <div className="relative w-full h-48 bg-black/40 backdrop-blur-sm border-y border-white/10 overflow-hidden mb-6 shadow-inner">
      {/* Center Indicator */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-400 z-30 -translate-x-1/2 shadow-[0_0_15px_rgba(250,204,21,1)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rotate-45 z-30 shadow-lg" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-yellow-400 rotate-45 z-30 shadow-lg" />

      {/* Fade Gradients */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0f0f10] to-transparent z-20" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0f0f10] to-transparent z-20" />

      <motion.div
        ref={containerRef}
        animate={controls}
        style={{ x, display: 'flex', paddingLeft: '50%' }} // Start from center-ish
        className="h-full items-center"
      >
        {rouletteItems.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 p-2"
            style={{ width: CARD_WIDTH }}
          >
            <div 
                className="w-full h-36 bg-[#1e1e24] rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group"
            >
                {/* Rarity Glow Background */}
                <div 
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ backgroundColor: item.color }}
                />
                
                <div className="w-24 h-24 mb-2 relative z-10">
                     <img src={item.image} alt="" className="w-full h-full object-contain drop-shadow-md" />
                </div>
                
                <div 
                    className="absolute bottom-0 left-0 right-0 h-1 w-full"
                    style={{ backgroundColor: item.color }}
                />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
