import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Case } from '../store/caseStore';
import { useHaptics } from '../hooks/useHaptics';
import { Star } from 'lucide-react';

interface CaseCardProps {
  caseItem: Case;
  variant?: 'default' | 'yellow';
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, variant = 'default' }) => {
  const { selectionChanged } = useHaptics();

  const bgClass = variant === 'yellow'
    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-yellow-500/30 group-hover:from-yellow-500/30 group-hover:to-orange-600/30'
    : 'bg-white/5 backdrop-blur-md border border-white/10 group-hover:bg-white/10';

  const glowClass = variant === 'yellow'
    ? 'bg-yellow-400 blur-[50px] opacity-30'
    : 'bg-[#eab308] opacity-20 blur-[40px]';

  return (
    <Link to={`/cases/${caseItem.id}`} onClick={() => selectionChanged()}>
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.96 }}
        className="group relative flex flex-col items-center p-5 rounded-[2rem] overflow-hidden transition-all duration-300 h-full"
      >
        {/* Background */}
        <div className={`absolute inset-0 rounded-[2rem] transition-colors duration-300 ${bgClass}`} />
        
        {/* Glow Effect behind image */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full group-hover:opacity-30 transition-opacity ${glowClass}`} />

        {/* Image */}
        <div className="w-28 h-28 mb-4 relative z-10 drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <img
            src={caseItem.image}
            alt={caseItem.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text Content */}
        <div className="relative z-10 text-center w-full">
          <h3 className="text-base font-semibold tracking-tight mb-1 text-white/90">
            {caseItem.name}
          </h3>
          
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--tg-theme-hint-color)]">
            <span className="text-yellow-400">
              {caseItem.price === 0 ? 'FREE' : caseItem.price}
            </span>
            {caseItem.price > 0 && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
