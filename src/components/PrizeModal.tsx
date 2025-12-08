import React from 'react';
import { motion } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { Star, Share2 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { UniversalMedia } from './UniversalMedia';

interface PrizeModalProps {
  prizes: Prize[];
  onClose: () => void;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({ prizes, onClose }) => {
  const { sellItem } = useUserStore();
  const { impactMedium, notificationSuccess } = useHaptics();

  // Calculate total value of prizes
  const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);

  const handleSellAll = async () => {
    impactMedium();
    await Promise.all(prizes.map(p => sellItem(p.id)));
    notificationSuccess();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#0f0f10]"
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
        
        <h2 className="text-3xl font-black text-white mb-12 z-10 tracking-tight">YOU WON!</h2>

        <div className="flex flex-wrap justify-center gap-6 z-10 w-full max-w-md max-h-[60vh] overflow-y-auto no-scrollbar">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 200,
                delay: index * 0.1 
              }}
              className="flex flex-col items-center"
            >
               <div className="flex items-center justify-center relative mb-4">
                   <UniversalMedia 
                    src={prize.lottie || prize.image} 
                    alt={prize.name} 
                    className="w-40 h-40 object-contain drop-shadow-2xl relative z-10" 
                   />
               </div>
               
               <div className="text-center space-y-1">
                   <div className="flex items-center justify-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xl shadow-xl">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-black text-white tracking-wide">{prize.value}</span>
                   </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="w-full p-6 pb-10 bg-[#0f0f10] border-t border-white/5 space-y-3 z-20">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-[#eab308] text-white font-bold text-lg shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 relative overflow-hidden"
            onClick={() => {
                impactMedium();
                // Share logic here
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            <Share2 size={20} />
            <span>Share (2x Luck)</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSellAll}
              className="py-4 rounded-2xl bg-[#1c1c1e] text-white font-bold text-base border border-white/10 active:bg-white/5 transition-colors flex items-center justify-center gap-1"
            >
              <span>Sell for {totalValue}</span>
              <Star size={12} className="fill-white text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                  impactMedium();
                  onClose();
              }}
              className="py-4 rounded-2xl bg-[#1c1c1e] text-[var(--tg-theme-hint-color)] font-bold text-base border border-white/10 active:bg-white/5 transition-colors"
            >
              Keep Prize
            </motion.button>
          </div>
      </div>
    </motion.div>
  );
};
