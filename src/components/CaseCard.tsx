import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Case } from '../store/caseStore';
import { useHaptics } from '../hooks/useHaptics';
import { Star, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { UniversalMedia } from './UniversalMedia';

interface CaseCardProps {
  caseItem: Case;
  variant?: 'default' | 'yellow';
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, variant = 'default' }) => {
  const { selectionChanged } = useHaptics();
  const isYellow = variant === 'yellow';
  const isFree = caseItem.price === 0;

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

        {caseItem.tag && (() => {
          const IconComponent = (LucideIcons as any)[caseItem.tag!.icon] as LucideIcon;
          return (
            <div className={`absolute ${isYellow ? 'top-2 left-1/2 -translate-x-1/2' : 'top-[8.7rem] left-1/2 -translate-x-1/2'} flex items-center gap-0.5 px-1.5 py-0.5 rounded-full z-20 overflow-hidden whitespace-nowrap`}
              style={{
                background: 'linear-gradient(135deg,rgb(255, 255, 255) 0%, #a8a8a8 50%,rgb(182, 182, 182) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4)',
              }}>
              <div 
                className="absolute inset-0 opacity-70"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                }}
              />
              {IconComponent && <IconComponent size={8} className={caseItem.tag.iconColor} style={{ position: 'relative', zIndex: 1 }} />}
              <span className="text-gray-900 font-black text-[10px] leading-none tracking-tight uppercase relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                {caseItem.tag.text}
              </span>
            </div>
          );
        })()}

        {/* Image/Lottie Container */}
        <div className={`${isYellow ? 'w-20 h-20 mr-4' : 'w-28 h-28 mb-4'} relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 overflow-visible`}>
          {caseItem.lottie ? (
            <div className="relative w-full h-full overflow-visible">
              <img
                src={caseItem.image}
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-80 scale-125 z-0"
              />
              <img
                src={caseItem.image}
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-80 blur-[3px] scale-125 z-[1]"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, transparent 40%, black 70%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 40%, black 70%)',
                }}
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
        <div className={`relative z-10 ${isYellow ? 'text-left' : 'text-center w-full mt-2'}`}>
          <h3 className="text-base font-semibold tracking-tight mb-1 text-white/90">
            {caseItem.name}
          </h3>
          
          {isYellow && (
            <div className="mb-2 inline-flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Timer size={12} className="text-white/70" />
              <span className="text-xs font-medium text-white/90">24:00:00</span>
            </div>
          )}

          <div className={`flex ${isYellow ? 'justify-start' : 'justify-center'} items-center gap-1.5 text-sm font-medium text-[var(--tg-theme-hint-color)]`}>
            {isFree ? (
              <motion.div
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 px-3 py-1 rounded-full"
              >
                <span className="text-white font-black text-sm tracking-wider uppercase drop-shadow-sm">
                  FREE
                </span>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Star size={12} className="fill-white text-white drop-shadow-sm" />
                </motion.div>
              </motion.div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 px-3 py-1 rounded-full">
                <span className="text-white font-black text-sm tracking-wider drop-shadow-sm">
                  {caseItem.price}
                </span>
                <Star size={12} className="fill-white text-white drop-shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
