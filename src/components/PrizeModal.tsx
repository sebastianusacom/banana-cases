import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Prize } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { Star, Share2, Sparkles } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface PrizeModalProps {
  prizes: Prize[];
  onClose: () => void;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({ prizes, onClose }) => {
  const { sellItem } = useUserStore();
  const { impactMedium, notificationSuccess } = useHaptics();
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Calculate total value of prizes
  const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
    setShowParticles(true);
  }, []);

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
      className="fixed inset-0 z-50 flex flex-col bg-[#0f0f10] overflow-hidden"
    >
      {/* Animated Background Gradient */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          background: [
            "radial-gradient(circle at 20% 50%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Particles */}
      <AnimatePresence>
        {showParticles && particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ scale: 0, opacity: 0, x: particle.x, y: particle.y }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: particle.y - 100,
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeOut"
            }}
            className="absolute pointer-events-none"
          >
            <Sparkles size={12} className="text-yellow-400 fill-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 relative overflow-hidden z-10">
        {/* Background Ambient */}
        <motion.div
          animate={{
            boxShadow: [
              "inset 0 0 100px rgba(234, 179, 8, 0.05)",
              "inset 0 0 150px rgba(234, 179, 8, 0.1)",
              "inset 0 0 100px rgba(234, 179, 8, 0.05)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"
        />
        
        <motion.h2
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{
            scale: [0.5, 1.2, 1],
            opacity: 1,
            y: 0,
            textShadow: [
              "0 0 20px rgba(234, 179, 8, 0.5)",
              "0 0 40px rgba(234, 179, 8, 0.8)",
              "0 0 20px rgba(234, 179, 8, 0.5)"
            ]
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            textShadow: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
          className="text-3xl font-black text-white mb-12 z-10 tracking-tight relative"
        >
          YOU WON!
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles size={20} className="text-yellow-400 fill-yellow-400" />
          </motion.div>
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-6 z-10 w-full max-w-md max-h-[60vh] overflow-y-auto no-scrollbar">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={{
                scale: 0,
                opacity: 0,
                y: 100,
                rotateY: -90,
                x: index % 2 === 0 ? -50 : 50
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                rotateY: 0,
                x: 0
              }}
              transition={{
                type: "spring",
                damping: 12,
                stiffness: 150,
                delay: index * 0.15
              }}
              whileHover={{
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              className="flex flex-col items-center relative group"
            >
              {/* Prize Glow Effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(234, 179, 8, 0.3)",
                    "0 0 60px rgba(234, 179, 8, 0.6)",
                    "0 0 30px rgba(234, 179, 8, 0.3)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.1
                }}
                className="absolute inset-0 rounded-full pointer-events-none"
              />

               <div className="flex items-center justify-center relative mb-4">
                   <motion.img
                    src={prize.image}
                    alt={prize.name}
                    animate={{
                      filter: [
                        "brightness(1) saturate(1)",
                        "brightness(1.2) saturate(1.3)",
                        "brightness(1) saturate(1)"
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.2
                    }}
                    className="w-40 h-40 object-contain drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300"
                   />

                   {/* Floating Sparkles Around Prize */}
                   {[...Array(3)].map((_, sparkleIndex) => (
                     <motion.div
                       key={sparkleIndex}
                       animate={{
                         x: [0, Math.random() * 60 - 30, 0],
                         y: [0, Math.random() * 60 - 30, 0],
                         scale: [0, 1, 0],
                         opacity: [0, 1, 0]
                       }}
                       transition={{
                         duration: 2 + Math.random(),
                         repeat: Infinity,
                         delay: index * 0.3 + sparkleIndex * 0.5
                       }}
                       className="absolute pointer-events-none"
                       style={{
                         top: `${20 + sparkleIndex * 20}%`,
                         left: `${20 + sparkleIndex * 25}%`
                       }}
                     >
                       <Sparkles size={8} className="text-yellow-300 fill-yellow-300" />
                     </motion.div>
                   ))}
               </div>

               <motion.div
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: index * 0.1 + 0.3 }}
                 className="text-center space-y-1"
               >
                   <motion.div
                     whileHover={{ scale: 1.05 }}
                     className="flex items-center justify-center gap-1.5 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm"
                   >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      </motion.div>
                      <span className="text-lg font-black text-white tracking-wide">{prize.value}</span>
                   </motion.div>
               </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions Footer */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        className="w-full p-6 pb-10 bg-[#0f0f10] border-t border-white/5 space-y-3 z-20"
      >
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 30px rgba(234, 179, 8, 0.4)"
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(234, 179, 8, 0.2)",
                "0 0 40px rgba(234, 179, 8, 0.4)",
                "0 0 20px rgba(234, 179, 8, 0.2)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
            className="w-full py-4 rounded-2xl bg-[#eab308] text-white font-bold text-lg shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 relative overflow-hidden"
            onClick={() => {
                impactMedium();
                // Share logic here
            }}
          >
            <motion.div
              animate={{
                x: [0, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
            />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Share2 size={20} />
            </motion.div>
            <span>Share (2x Luck)</span>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-2 right-2"
            >
              <Sparkles size={12} className="text-white" />
            </motion.div>
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(234, 179, 8, 0.5)",
                boxShadow: "0 0 20px rgba(234, 179, 8, 0.2)"
              }}
              onClick={handleSellAll}
              className="py-4 rounded-2xl bg-[#1c1c1e] text-white font-bold text-base border border-white/10 active:bg-white/5 transition-all duration-300 flex items-center justify-center gap-1 relative overflow-hidden group"
            >
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.1), transparent)",
                    "linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.2), transparent)",
                    "linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.1), transparent)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span>Sell for {totalValue}</span>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
              </motion.div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(255, 255, 255, 0.3)"
              }}
              onClick={() => {
                  impactMedium();
                  onClose();
              }}
              className="py-4 rounded-2xl bg-[#1c1c1e] text-[var(--tg-theme-hint-color)] font-bold text-base border border-white/10 active:bg-white/5 transition-all duration-300 relative overflow-hidden group"
            >
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent)",
                    "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                    "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative z-10">Keep Prize</span>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1 right-1"
              >
                <Sparkles size={10} className="text-yellow-400" />
              </motion.div>
            </motion.button>
          </div>
      </motion.div>
    </motion.div>
  );
};
