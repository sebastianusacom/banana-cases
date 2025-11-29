import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveDrop {
  id: string;
  username: string;
  itemName: string;
  itemImage: string;
  rarityColor: string;
}

export const TopLiveBar: React.FC = () => {
  const [drops, setDrops] = useState<LiveDrop[]>([]);

  useEffect(() => {
    const addDrop = () => {
      const newDrop: LiveDrop = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 1000)}`,
        itemName: `Skin #${Math.floor(Math.random() * 999)}`,
        itemImage: 'https://placehold.co/40x40/png',
        rarityColor: ['#b0c3d9', '#5e98d9', '#4b69ff', '#8847ff', '#d32ce6'][
          Math.floor(Math.random() * 5)
        ],
      };
      setDrops((prev) => [newDrop, ...prev].slice(0, 10));
    };

    const interval = setInterval(addDrop, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-40 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      <div className="flex items-center h-full px-4 space-x-3 overflow-hidden pointer-events-auto mask-image-linear-gradient">
        <AnimatePresence initial={false} mode="popLayout">
          {drops.map((drop) => (
            <motion.div
              layout
              key={drop.id}
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex-shrink-0 flex items-center bg-white/10 backdrop-blur-md rounded-full pr-3 pl-1 py-1 border border-white/5 shadow-lg"
            >
              <div
                className="w-6 h-6 rounded-full overflow-hidden mr-2 border border-white/20"
              >
                <img src={drop.itemImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <span
                  className="text-[10px] font-bold leading-tight"
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
