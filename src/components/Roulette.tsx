import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Prize } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';

interface RouletteProps {
  items: Prize[];
  winningItem: Prize;
  onComplete: () => void;
  delay?: number;
}

const CARD_WIDTH = 140; // Width + margin
const VISIBLE_CARDS = 3; // Actually we show more, but this is for calculation center
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
      // We want the winner (index: EXTRA_CARDS) to be centered
      // Center of container is width / 2
      // Item center is CARD_WIDTH / 2
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
    <div className="relative w-full h-48 bg-[var(--tg-theme-secondary-bg-color)] border-y-4 border-[var(--tg-theme-button-color)] overflow-hidden mb-4 shadow-inner">
      {/* Center Indicator */}
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-400 z-20 -translate-x-1/2 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />

      <motion.div
        ref={containerRef}
        animate={controls}
        style={{ x, display: 'flex', paddingLeft: '50%' }} // Start from center-ish
        className="h-full items-center"
      >
        {rouletteItems.map((item, i) => (
          <div
            key={item.id}
            className="flex-shrink-0 p-1"
            style={{ width: CARD_WIDTH }}
          >
            <div 
                className="w-full h-36 bg-[#1e1e24] rounded-lg border-b-4 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ borderColor: item.color }}
            >
                <div className="w-24 h-24 mb-2">
                     <img src={item.image} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="absolute bottom-1 left-0 right-0 text-center">
                     <span className="text-[10px] font-bold px-1 bg-black/50 rounded text-white/90 truncate max-w-full block">
                         {item.name}
                     </span>
                </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

