import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Case } from '../store/caseStore';
import { useHaptics } from '../hooks/useHaptics';

interface CaseCardProps {
  caseItem: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  const { selectionChanged } = useHaptics();

  return (
    <Link to={`/cases/${caseItem.id}`} onClick={() => selectionChanged()}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 flex flex-col items-center relative overflow-hidden border border-white/5 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
        
        <div className="w-32 h-32 mb-4 relative z-10">
          <img
            src={caseItem.image}
            alt={caseItem.name}
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>

        <h3 className="text-lg font-bold mb-1 relative z-10">{caseItem.name}</h3>
        <div className="bg-[var(--tg-theme-button-color)] text-white px-3 py-1 rounded-full text-sm font-medium relative z-10">
          {caseItem.price} Stars
        </div>
      </motion.div>
    </Link>
  );
};

