import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Info, Star } from 'lucide-react';
import { useCaseStore } from '../store/caseStore';
import { useUserStore } from '../store/userStore';
import { useHaptics } from '../hooks/useHaptics';
import { useTelegram } from '../hooks/useTelegram';
import clsx from 'clsx';

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById } = useCaseStore();
  const { stars, isDemoMode, toggleDemoMode } = useUserStore();
  const { selectionChanged, impactLight, impactMedium } = useHaptics();
  const { tg } = useTelegram();

  const caseItem = getCaseById(id || '');
  const [count, setCount] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!caseItem) {
      navigate('/cases');
    }
  }, [caseItem, navigate]);

  if (!caseItem) return null;

  const totalPrice = caseItem.price * count;
  const canAfford = stars >= totalPrice;

  const handleOpen = () => {
    if (!isDemoMode && !canAfford) {
      tg.showAlert("You don't have enough stars!");
      return;
    }
    impactMedium();
    navigate(`/opening?caseId=${caseItem.id}&count=${count}`);
  };

  const handleCountChange = (newCount: 1 | 2 | 3) => {
    selectionChanged();
    setCount(newCount);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            impactLight();
            navigate(-1);
          }}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full">
           <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-yellow-400' : 'bg-green-500'}`} />
           <span className="text-xs font-medium uppercase">{isDemoMode ? 'Demo' : 'Real'}</span>
        </div>
      </div>

      {/* Case Visual */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-48 h-48 mb-4 relative">
             <div className="absolute inset-0 bg-[var(--tg-theme-button-color)] blur-3xl opacity-20 rounded-full" />
             <img src={caseItem.image} alt={caseItem.name} className="w-full h-full object-contain relative z-10" />
        </div>
        <h1 className="text-2xl font-bold mb-1">{caseItem.name}</h1>
        <div className="flex items-center text-yellow-400 font-medium">
            <span className="mr-1">{caseItem.price}</span> <Star size={16} fill="currentColor" />
        </div>
      </motion.div>

      {/* Demo Toggle */}
      <div className="flex justify-center mb-8">
          <button
            onClick={() => {
                impactLight();
                toggleDemoMode();
            }}
            className="text-xs text-[var(--tg-theme-link-color)] hover:underline flex items-center"
          >
              <Info size={12} className="mr-1" />
              Switch to {isDemoMode ? 'Real' : 'Demo'} Mode
          </button>
      </div>

      {/* Count Selection */}
      <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 mb-6">
        <p className="text-sm text-[var(--tg-theme-hint-color)] mb-3 text-center">Select Quantity</p>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((c) => (
            <button
              key={c}
              onClick={() => handleCountChange(c as 1 | 2 | 3)}
              className={clsx(
                'py-3 rounded-xl font-bold text-lg transition-all duration-200 border-2',
                count === c
                  ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10 text-[var(--tg-theme-button-color)]'
                  : 'border-transparent bg-black/20 text-[var(--tg-theme-hint-color)]'
              )}
            >
              x{c}
            </button>
          ))}
        </div>
      </div>

      {/* Open Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className={clsx(
            "w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center space-x-2 mb-8",
            !isDemoMode && !canAfford ? 'bg-gray-600 opacity-50' : 'bg-[var(--tg-theme-button-color)]'
        )}
      >
        <span>Open for {totalPrice}</span>
        <Star size={20} fill="currentColor" className="text-yellow-300" />
      </motion.button>

      {/* Contents Preview */}
      <div>
        <h3 className="font-bold mb-4 px-2">Case Contents</h3>
        <div className="grid grid-cols-3 gap-3">
            {caseItem.items.sort((a,b) => b.value - a.value).map((item) => (
                <div key={item.id} className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-2 flex flex-col items-center relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-transparent" style={{ borderRightColor: item.color }} />
                    <div className="w-full aspect-square mb-2 bg-black/10 rounded-lg p-1">
                         <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-center leading-tight line-clamp-2 opacity-80" style={{ color: item.color }}>{item.name}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;

