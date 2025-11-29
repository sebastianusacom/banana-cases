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
  price: number;
}

const LIVE_ITEMS = [
  { name: 'Nail Bracelet', image: 'https://i.postimg.cc/d3t4JyLw/Nail-Bracelet.png', value: 9400, color: '#d32ce6' },
  { name: 'Snoop Dogg', image: 'https://i.postimg.cc/2y82CZVY/Snoop-Dogg.png', value: 350, color: '#5e98d9' },
  { name: 'Diamond Ring', image: 'https://i.postimg.cc/ZnKVJdCk/Diamond-Ring.png', value: 2000, color: '#8847ff' },
  { name: 'Plush Pepe', image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png', value: 100000, color: '#eab308' },
];

export const TopLiveBar: React.FC = () => {
  const [drops, setDrops] = useState<LiveDrop[]>([]);
  const { stars, addStars } = useUserStore();
  const { impactLight } = useHaptics();

  useEffect(() => {
    const addDrop = () => {
      const item = LIVE_ITEMS[Math.floor(Math.random() * LIVE_ITEMS.length)];
      const newDrop: LiveDrop = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 1000)}`,
        itemName: item.name,
        itemImage: item.image,
        rarityColor: item.color,
        price: item.value,
      };
      setDrops((prev) => [newDrop, ...prev].slice(0, 8));
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
      {/* Minimal Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f10] to-transparent backdrop-blur-[2px] -z-10" />
      
      {/* Left Side: Live Feed */}
      <div className="flex items-center flex-1 overflow-hidden mr-4 pointer-events-auto h-full">
          {/* Minimal Live Badge */}
          <div className="flex items-center gap-2 mr-4 flex-shrink-0 opacity-80">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Live</span>
          </div>

          <div className="flex items-center gap-3 overflow-hidden w-full relative h-full">
            
            <AnimatePresence initial={false} mode="popLayout">
              {drops.map((drop) => (
                <motion.div
                  layout
                  key={drop.id}
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                  className="flex-shrink-0 flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative w-8 h-8">
                    {/* Rarity Glow */}
                    <div 
                        className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"
                        style={{ backgroundColor: drop.rarityColor }} 
                    />
                    {/* Image Container */}
                    <div 
                        className="w-full h-full rounded-md overflow-hidden bg-[#1c1c1e] relative z-10"
                    >
                        <img src={drop.itemImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-0.5 bg-[#1c1c1e]/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/5">
                     <Star size={8} className="text-yellow-400 fill-yellow-400" />
                     <span className="text-[9px] font-bold text-white/90 tabular-nums leading-none">
                        {drop.price}
                     </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Fixed Fade Mask - Higher Z-Index and placed after content */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0f0f10] to-transparent z-20 pointer-events-none" />
          </div>
      </div>

      {/* Right Side: Minimal Balance Capsule */}
      <div className="pointer-events-auto flex-shrink-0">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md pl-3 pr-1 py-1 rounded-full border border-white/5 transition-all hover:bg-black/40">
             <div className="flex items-center gap-1.5">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-white/90 tabular-nums">
                    {stars.toLocaleString()}
                </span>
             </div>
             <button 
                onClick={handleAddStars}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
             >
                <Plus size={10} className="text-white/80" />
             </button>
        </div>
      </div>

    </div>
  );
};
