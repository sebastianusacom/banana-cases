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
      setDrops((prev) => [newDrop, ...prev].slice(0, 8)); // Keep fewer for cleaner look
    };

    const interval = setInterval(addDrop, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddStars = () => {
      impactLight();
      addStars(1000);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between pointer-events-none">
      {/* Glass Background with Gradient Fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f10] via-[#0f0f10]/95 to-transparent backdrop-blur-xl -z-10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Left Side: Live Feed */}
      <div className="flex items-center flex-1 overflow-hidden mr-4 pointer-events-auto h-full">
          <div className="flex items-center gap-2 mr-3 flex-shrink-0 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-500">Live</span>
          </div>

          <div className="flex items-center gap-2 overflow-hidden w-full relative">
            {/* Fade mask for drops */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0f0f10] to-transparent z-10" />
            
            <AnimatePresence initial={false} mode="popLayout">
              {drops.map((drop) => (
                <motion.div
                  layout
                  key={drop.id}
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                  className="flex-shrink-0 flex items-center bg-[#1c1c1e] rounded-full pr-3 pl-1 py-1 border border-white/5 shadow-sm relative overflow-hidden group"
                >
                   {/* Rarity Glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
                    style={{ backgroundColor: drop.rarityColor }} 
                  />

                  <div className="w-5 h-5 rounded-full overflow-hidden mr-2 border border-white/10 bg-black/20 relative z-10">
                    <img src={drop.itemImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center min-w-[50px] relative z-10">
                     <span className="text-[9px] font-bold leading-none truncate" style={{ color: drop.rarityColor }}>
                        {drop.itemName}
                     </span>
                     <span className="text-[8px] text-gray-500 leading-none truncate mt-0.5">
                        {drop.username}
                     </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
      </div>

      {/* Right Side: Balance Capsule */}
      <div className="pointer-events-auto flex-shrink-0">
        <div className="flex items-center gap-1 pl-1 pr-1 py-1 bg-[#1c1c1e] rounded-full border border-white/10 shadow-lg">
             <div className="flex items-center gap-1.5 px-2">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-white tabular-nums tracking-tight">
                    {stars.toLocaleString()}
                </span>
             </div>
             <button 
                onClick={handleAddStars}
                className="w-6 h-6 rounded-full bg-gradient-to-b from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 flex items-center justify-center border border-white/5 transition-all active:scale-95"
             >
                <Plus size={12} className="text-white/70" />
             </button>
        </div>
      </div>

    </div>
  );
};
