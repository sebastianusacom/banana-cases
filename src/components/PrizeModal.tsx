import React from 'react';
import { motion } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { Star, Share2, Sparkles } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface PrizeModalProps {
  prizes: Prize[];
  onClose: () => void;
}

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 100 - 50;
  const randomRotate = Math.random() * 360;
  const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, scale: 0 }}
      animate={{ 
        y: [0, window.innerHeight], 
        x: [0, randomX * 5],
        rotate: [0, randomRotate * 2],
        opacity: [1, 1, 0],
        scale: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 2.5 + Math.random(), 
        delay, 
        ease: "easeOut" 
      }}
      style={{ backgroundColor: color }}
      className="absolute top-0 w-2 h-2 rounded-sm z-0 pointer-events-none"
    />
  );
};

const Confetti = () => {
  const pieces = Array.from({ length: 50 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10 flex justify-center">
      {pieces.map((_, i) => (
        <ConfettiPiece key={i} delay={Math.random() * 0.5} />
      ))}
    </div>
  );
};

const Sunburst = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 20, ease: "linear", repeat: Infinity }}
    className="absolute inset-[-50%] z-0 pointer-events-none opacity-20"
    style={{
      background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.1) 10deg, transparent 20deg, rgba(255, 255, 255, 0.1) 30deg, transparent 40deg, rgba(255, 255, 255, 0.1) 50deg, transparent 60deg, rgba(255, 255, 255, 0.1) 70deg, transparent 80deg, rgba(255, 255, 255, 0.1) 90deg, transparent 100deg, rgba(255, 255, 255, 0.1) 110deg, transparent 120deg, rgba(255, 255, 255, 0.1) 130deg, transparent 140deg, rgba(255, 255, 255, 0.1) 150deg, transparent 160deg, rgba(255, 255, 255, 0.1) 170deg, transparent 180deg, rgba(255, 255, 255, 0.1) 190deg, transparent 200deg, rgba(255, 255, 255, 0.1) 210deg, transparent 220deg, rgba(255, 255, 255, 0.1) 230deg, transparent 240deg, rgba(255, 255, 255, 0.1) 250deg, transparent 260deg, rgba(255, 255, 255, 0.1) 270deg, transparent 280deg, rgba(255, 255, 255, 0.1) 290deg, transparent 300deg, rgba(255, 255, 255, 0.1) 310deg, transparent 320deg, rgba(255, 255, 255, 0.1) 330deg, transparent 340deg, rgba(255, 255, 255, 0.1) 350deg, transparent 360deg)"
    }}
  />
);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#0f0f10]"
    >
      <Confetti />
      
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fbbf2415_0%,transparent_70%)] pointer-events-none" />
        <Sunburst />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative z-10"
        >
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-12 tracking-tight drop-shadow-lg text-center uppercase italic transform -skew-x-6">
            YOU WON!
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 z-10 w-full max-w-md max-h-[60vh] overflow-y-auto no-scrollbar">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ 
                type: "spring", 
                damping: 12, 
                stiffness: 200,
                delay: 0.3 + index * 0.1 
              }}
              className="flex flex-col items-center group"
            >
               <div className="relative mb-4">
                   {/* Glow effect behind item */}
                   <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full transform scale-150" />
                   
                   {/* Star burst effect behind item */}
                   <motion.div 
                     animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] opacity-50"
                   />

                   <div className="relative">
                     <img 
                      src={prize.image} 
                      alt={prize.name} 
                      className="w-48 h-48 object-contain drop-shadow-[0_0_30px_rgba(251,191,36,0.3)] relative z-10 transform transition-transform group-hover:scale-105 duration-300" 
                     />
                     {/* Shine effect overlay */}
                     <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '100%', opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 1, repeatDelay: 3 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-20 pointer-events-none"
                     />
                   </div>
               </div>
               
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.5 + index * 0.1 }}
                 className="text-center space-y-2"
               >
                   <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 px-6 py-2 rounded-full border border-yellow-500/20 backdrop-blur-sm">
                      <Star size={16} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                      <span className="text-xl font-black text-yellow-100 tracking-wide drop-shadow-md">{prize.value}</span>
                   </div>
                   <div className="text-white/60 text-sm font-medium flex items-center justify-center gap-1">
                     <Sparkles size={12} className="text-yellow-400" />
                     <span>Mythical Drop</span>
                     <Sparkles size={12} className="text-yellow-400" />
                   </div>
               </motion.div>
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
