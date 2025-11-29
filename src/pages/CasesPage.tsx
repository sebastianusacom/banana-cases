import React from 'react';
import { useCaseStore } from '../store/caseStore';
import { CaseCard } from '../components/CaseCard';
import { motion } from 'framer-motion';

const CasesPage: React.FC = () => {
  const { cases } = useCaseStore();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          BANANA CASES
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] text-sm">
          Open cases, win skins, become legendary.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {cases.map((caseItem, index) => (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <CaseCard caseItem={caseItem} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CasesPage;

