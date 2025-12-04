import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Case } from '../store/caseStore';
import { useHaptics } from '../hooks/useHaptics';
import { Star, Timer } from 'lucide-react';
import { UniversalMedia } from './UniversalMedia';

interface CaseCardProps {
  caseItem: Case;
  variant?: 'default' | 'yellow';
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, variant = 'default' }) => {
  const { selectionChanged } = useHaptics();
  const isYellow = variant === 'yellow';

  const bgClass = isYellow
    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-yellow-500/30 group-hover:from-yellow-500/30 group-hover:to-orange-600/30'
    : 'bg-white/5 backdrop-blur-md border border-white/10 group-hover:bg-white/10';

  const glowClass = isYellow
    ? 'bg-yellow-400 blur-[50px] opacity-30 left-1/4'
    : 'bg-[#eab308] opacity-20 blur-[40px] left-1/2';

  return (
    <Link to={`/cases/${caseItem.id}`} onClick={() => selectionChanged()}>
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.96 }}
        className={`group relative flex ${isYellow ? 'flex-row items-center p-4' : 'flex-col items-center p-5'} rounded-[2rem] overflow-hidden transition-all duration-300 h-full`}
      >
        {/* Background */}
        <div className={`absolute inset-0 rounded-[2rem] transition-colors duration-300 ${bgClass}`} />
        
        {/* Glow Effect behind image */}
        <div className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full group-hover:opacity-30 transition-opacity ${glowClass}`} />

        {/* Image/Lottie Container */}
        <div className={`${isYellow ? 'w-20 h-20 mr-4' : 'w-28 h-28 mb-4'} relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
          {caseItem.lottie ? (
            <div className="relative w-full h-full">
              <img
                src={caseItem.image}
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-80 blur-[0.5px] scale-125 z-0"
              />
              <div className="relative w-full h-full z-10">
                <UniversalMedia
                  src={caseItem.lottie}
                  alt={caseItem.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : (
            <img
              src={caseItem.image}
              alt={caseItem.name}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Text Content */}
        <div className={`relative z-10 ${isYellow ? 'text-left' : 'text-center w-full'}`}>
          <h3 className="text-base font-semibold tracking-tight mb-1 text-white/90">
            {caseItem.name}
          </h3>
          
          <div className={`flex ${isYellow ? 'justify-start' : 'justify-center'} items-center gap-1.5 text-sm font-medium text-[var(--tg-theme-hint-color)]`}>
            <div className="inline-flex items-center gap-1.5 bg-yellow-500 px-3 py-1 rounded-full">
              <span className="text-white font-bold">
                {caseItem.price === 0 ? 'FREE' : caseItem.price}
              </span>
              {caseItem.price > 0 && <Star size={12} className="fill-white text-white" />}
            </div>
          </div>

          {isYellow && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Timer size={12} className="text-white/70" />
              <span className="text-xs font-medium text-white/90">24:00:00</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};
