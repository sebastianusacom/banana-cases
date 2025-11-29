import React from 'react';
import { useCaseStore } from '../store/caseStore';
import { CaseCard } from '../components/CaseCard';
import { motion } from 'framer-motion';

const CasesPage: React.FC = () => {
  const { cases } = useCaseStore();

  return (
    <div className="pt-6 px-2 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center relative"
      >
        <div className="inline-block mb-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          Season 1
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          Loot<span className="text-[var(--tg-theme-button-color)]">Box</span>
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] text-sm font-medium max-w-[200px] mx-auto leading-relaxed">
          Premium mock skins awaiting for you.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {cases.map((caseItem, index) => (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            <CaseCard caseItem={caseItem} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CasesPage;
