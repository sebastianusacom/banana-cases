import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';

interface LiveDrop {
  id: string;
  username: string;
  itemName: string;
  itemImage: string;
  rarityColor: string;
}

export const TopLiveBar: React.FC = () => {
  const [drops, setDrops] = useState<LiveDrop[]>([]);

  // Mock live feed updates
  useEffect(() => {
    const addDrop = () => {
      const newDrop: LiveDrop = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 10000)}`,
        itemName: `Banana Skin ${Math.floor(Math.random() * 100)}`,
        itemImage: 'https://placehold.co/40x40/png',
        rarityColor: ['#b0c3d9', '#5e98d9', '#4b69ff', '#8847ff', '#d32ce6'][
          Math.floor(Math.random() * 5)
        ],
      };
      setDrops((prev) => [newDrop, ...prev].slice(0, 10));
    };

    const interval = setInterval(addDrop, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--tg-theme-secondary-bg-color)] border-b border-[var(--tg-theme-hint-color)]/10 overflow-hidden z-50 flex items-center px-2">
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full">
        <AnimatePresence initial={false}>
          {drops.map((drop) => (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex-shrink-0 flex items-center bg-[var(--tg-theme-bg-color)] rounded-full pr-3 p-0.5 border border-white/5"
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden mr-2 border-2"
                style={{ borderColor: drop.rarityColor }}
              >
                <img src={drop.itemImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-[var(--tg-theme-hint-color)] leading-tight">
                  {drop.username}
                </span>
                <span
                  className="text-[10px] font-bold leading-tight truncate max-w-[80px]"
                  style={{ color: drop.rarityColor }}
                >
                  {drop.itemName}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

