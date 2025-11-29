import React from 'react';
import { motion } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { Star, Share2 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface PrizeModalProps {
  prizes: Prize[];
  onClose: () => void;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({ prizes, onClose }) => {
  const { sellItem } = useUserStore();
  const { impactMedium, notificationSuccess } = useHaptics();

  // Calculate total value of prizes
  const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);

  const handleSellAll = () => {
    impactMedium();
    prizes.forEach(p => sellItem(p.id));
    notificationSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#1c1c1e] rounded-[2rem] p-1 relative overflow-hidden border border-white/5 shadow-2xl"
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 pointer-events-none z-20">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>

        <div className="relative z-10 bg-[#0f0f10] rounded-[1.9rem] p-6 flex flex-col items-center">
            {/* Prizes Grid */}
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {prizes.map((prize) => (
                <motion.div
                  key={prize.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="relative group"
                >
                   {/* Glow */}
                   <div className="absolute inset-0 bg-[var(--tg-theme-button-color)] opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity" style={{ backgroundColor: prize.color }} />
                   
                   <div 
                        className="w-24 h-24 bg-[#1c1c1e] rounded-2xl border border-white/10 p-2 relative z-10 flex items-center justify-center"
                        style={{ borderColor: prize.color }}
                   >
                        <img src={prize.image} alt={prize.name} className="w-full h-full object-contain drop-shadow-lg" />
                   </div>
                   <div className="text-center mt-2">
                       <p className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: prize.color }}>{prize.rarity}</p>
                       <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-white">{prize.value}</span>
                       </div>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3 w-full">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl bg-[var(--tg-theme-button-color)] text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 relative overflow-hidden"
                onClick={() => {
                    impactMedium();
                    // Share
                }}
              >
                <Share2 size={18} />
                <span>Share</span>
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSellAll}
                  className="py-3 rounded-xl bg-[#1c1c1e] text-white font-medium text-sm border border-white/5 hover:bg-white/5 transition-colors"
                >
                  Sell {totalValue} <Star size={10} className="inline -mt-0.5 fill-current" />
                </button>
                <button
                  onClick={() => {
                      impactMedium();
                      onClose();
                  }}
                  className="py-3 rounded-xl bg-[#1c1c1e] text-[var(--tg-theme-hint-color)] font-medium text-sm border border-white/5 hover:bg-white/5 transition-colors"
                >
                  Keep
                </button>
              </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

