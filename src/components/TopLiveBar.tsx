import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { Star, Plus } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface LiveDrop {
  id: string;
  username: string;
  itemName: string;
  itemImage: string;
  rarityColor: string;
}

export const TopLiveBar: React.FC = () => {
  const [drops, setDrops] = useState<LiveDrop[]>([]);
  const { stars, addStars } = useUserStore();
  const { impactLight } = useHaptics();

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

  const handleAddStars = () => {
      impactLight();
      addStars(1000); // Simple replenish for now
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#0f0f10]/95 backdrop-blur-md border-b border-white/5 shadow-lg h-14 flex items-center justify-between px-4">
      
      {/* Left Side: Live Indicator & Drops */}
      <div className="flex items-center flex-1 overflow-hidden mr-4">
          <div className="flex items-center gap-2 mr-4 flex-shrink-0">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Live</span>
          </div>

          <div className="flex items-center space-x-2 overflow-hidden mask-image-linear-gradient w-full">
            <AnimatePresence initial={false} mode="popLayout">
              {drops.map((drop) => (
                <motion.div
                  layout
                  key={drop.id}
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex-shrink-0 flex items-center bg-white/5 rounded-full pr-2 pl-1 py-0.5 border border-white/5"
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden mr-1.5 border border-white/10">
                    <img src={drop.itemImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-medium truncate max-w-[60px]" style={{ color: drop.rarityColor }}>
                    {drop.itemName}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
      </div>

      {/* Right Side: Balance */}
      <div className="flex items-center gap-2 flex-shrink-0 pl-2 border-l border-white/5">
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                <span>{stars.toLocaleString()}</span>
                <Star size={12} className="fill-yellow-400" />
            </div>
         </div>
         <button 
            onClick={handleAddStars}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
         >
            <Plus size={14} />
         </button>
      </div>

    </div>
  );
};
