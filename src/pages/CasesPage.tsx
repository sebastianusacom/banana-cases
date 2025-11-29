import React from 'react';
import { useCaseStore, type Case } from '../store/caseStore';
import { CaseCard } from '../components/CaseCard';
import { motion } from 'framer-motion';

const freeCase: Case = {
  id: 'free-case',
  name: 'Free Case',
  image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
  price: 0,
  items: []
};

const CasesPage: React.FC = () => {
  const { cases } = useCaseStore();

  return (
    <div className="pt-6 px-2 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center relative"
      >
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2"
        >
          <CaseCard caseItem={freeCase} variant="yellow" />
        </motion.div>

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
