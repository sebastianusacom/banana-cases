import React from 'react';
import { useCaseStore, type Case } from '../store/caseStore';
import { CaseCard } from '../components/CaseCard';
import { motion } from 'framer-motion';

const freeCase: Case = {
  id: 'free-case',
  name: 'Free Case',
  image: 'https://i.postimg.cc/90FJc7rV/Plush-Pepe.png',
  price: 0,
  items: [
    {
      id: 'free-banana-1',
      name: 'Common Banana',
      image: 'https://i.postimg.cc/d3t4JyLw/Nail-Bracelet.png',
      value: 50,
      chance: 70,
    },
    {
      id: 'free-banana-2',
      name: 'Uncommon Banana',
      image: 'https://i.postimg.cc/2y82CZVY/Snoop-Dogg.png',
      value: 150,
      chance: 25,
    },
    {
      id: 'free-banana-3',
      name: 'Rare Banana',
      image: 'https://i.postimg.cc/ZnKVJdCk/Diamond-Ring.png',
      value: 500,
      chance: 5,
    },
  ]
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
