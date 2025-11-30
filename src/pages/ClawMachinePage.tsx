import React from 'react';
import { ClawMachine } from '../components/ClawMachine';
import { motion } from 'framer-motion';

const ClawMachinePage: React.FC = () => {
  return (
    <div className="min-h-screen pb-24 pt-6 bg-[#0f0f10] text-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ClawMachine />
      </motion.div>
    </div>
  );
};

export default ClawMachinePage;

