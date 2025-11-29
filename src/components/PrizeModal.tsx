import React from 'react';
import { motion } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { Star, Share2 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

interface PrizeModalProps {
  prizes: Prize[];
  onClose: () => void;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({ prizes, onClose }) => {
  const { sellItem } = useUserStore();
  const { impactMedium, notificationSuccess } = useHaptics();

  // Calculate total value of prizes
  const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);
  const bestRarity = prizes.reduce((prev, current) => {
     const rarityOrder = { common: 0, uncommon: 1, rare: 2, mythical: 3, legendary: 4 };
     return rarityOrder[current.rarity] > rarityOrder[prev.rarity] ? current : prev;
  }, prizes[0]);

  const handleSellAll = () => {
    impactMedium();
    prizes.forEach(p => sellItem(p.id));
    notificationSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       {/* Backdrop with heavy blur */}
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="absolute inset-0 bg-black/80 backdrop-blur-xl"
       />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Glow Effect based on best rarity */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 blur-[80px] rounded-full pointer-events-none"
            style={{ backgroundColor: bestRarity.color }}
        />

        <div className="bg-[#151516] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
            {/* Header Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Content */}
            <div className="relative p-6 flex flex-col items-center">
                
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="mb-6"
                >
                   <h2 className="text-4xl font-black uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 tracking-tighter drop-shadow-sm">
                      {prizes.length > 1 ? 'Jackpot!' : 'You Won!'}
                   </h2>
                </motion.div>

                {/* Prizes Grid/Row */}
                <div className={clsx(
                    "w-full grid gap-3 mb-8",
                    prizes.length === 1 ? "grid-cols-1 max-w-[200px]" : 
                    prizes.length === 2 ? "grid-cols-2" : "grid-cols-3"
                )}>
                    {prizes.map((prize, idx) => (
                        <motion.div
                            key={prize.id}
                            initial={{ y: 20, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (idx * 0.1) }}
                            className="group relative"
                        >
                            <div 
                                className="aspect-square rounded-2xl bg-[#1c1c1e] border border-white/10 p-3 flex items-center justify-center relative overflow-hidden shadow-lg"
                                style={{ borderColor: `${prize.color}40` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                <div 
                                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-50" 
                                    style={{ backgroundColor: `${prize.color}10` }}
                                />
                                
                                <img src={prize.image} alt={prize.name} className="w-full h-full object-contain drop-shadow-lg relative z-10" />
                            </div>
                            
                            <div className="text-center mt-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5" style={{ color: prize.color }}>
                                    {prize.rarity}
                                </p>
                                <p className="text-xs font-bold text-white leading-tight line-clamp-1 mb-1">{prize.name}</p>
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-yellow-400 tabular-nums">{prize.value}</span>
                                    <Star size={8} className="fill-yellow-400 text-yellow-400" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#007aff] to-[#0051a8] text-white font-bold text-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 relative overflow-hidden group"
                        onClick={() => {
                            impactMedium();
                        }}
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <Share2 size={18} />
                        <span>Share Reward</span>
                    </motion.button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSellAll}
                            className="py-3 rounded-xl bg-[#1c1c1e] text-white font-medium text-sm border border-white/10 hover:bg-[#2c2c2e] transition-colors flex flex-col items-center justify-center gap-0.5"
                        >
                            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Quick Sell</span>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <span className="font-bold text-base">+{totalValue}</span>
                                <Star size={12} className="fill-yellow-400" />
                            </div>
                        </button>
                        
                        <button
                            onClick={() => {
                                impactMedium();
                                onClose();
                            }}
                            className="py-3 rounded-xl bg-[#1c1c1e] text-white font-medium text-sm border border-white/10 hover:bg-[#2c2c2e] transition-colors flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">📦</span>
                            <span>Keep All</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
