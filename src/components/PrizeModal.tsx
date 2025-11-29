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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[var(--tg-theme-bg-color)] rounded-3xl p-6 relative overflow-hidden border border-white/10"
      >
        {/* Confetti / Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none" />

        <h2 className="text-3xl font-black text-center mb-6 uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          {prizes.length > 1 ? 'Awesome Pull!' : 'Nice Catch!'}
        </h2>

        <div className="flex justify-center space-x-4 mb-8 overflow-x-auto">
          {prizes.map((prize) => (
            <motion.div
              key={prize.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 mb-2 border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative" style={{ borderColor: prize.color }}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                <img src={prize.image} alt={prize.name} className="w-full h-full object-contain drop-shadow-lg relative z-10" />
              </div>
              <p className="font-bold text-sm" style={{ color: prize.color }}>{prize.name}</p>
              <div className="flex items-center text-xs text-yellow-400">
                  <Star size={10} fill="currentColor" className="mr-1" /> {prize.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg flex items-center justify-center space-x-2"
            onClick={() => {
                impactMedium();
                // Share logic would go here
            }}
          >
            <Share2 size={20} />
            <span>Share for 2x Luck</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSellAll}
              className="py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] font-medium text-sm border border-white/5 hover:bg-white/5 transition-colors"
            >
              Sell for {totalValue} Stars
            </button>
            <button
              onClick={() => {
                  impactMedium();
                  onClose();
              }}
              className="py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)] font-medium text-sm border border-white/5 hover:bg-white/5 transition-colors"
            >
              Keep Items
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

