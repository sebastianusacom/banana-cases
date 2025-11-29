import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaseStore } from '../store/caseStore';
import { useUserStore } from '../store/userStore';
import type { Prize } from '../store/userStore';
import { Roulette } from '../components/Roulette';
import { PrizeModal } from '../components/PrizeModal';
import { useHaptics } from '../hooks/useHaptics';

const CaseOpeningPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('caseId');
  const count = parseInt(searchParams.get('count') || '1', 10);
  
  const { getCaseById } = useCaseStore();
  const { addItem, subtractStars, isDemoMode } = useUserStore();
  const { notificationSuccess, impactHeavy } = useHaptics();

  const caseItem = getCaseById(caseId || '');
  const [winningPrizes, setWinningPrizes] = useState<Prize[]>([]);
  const [, setCompletedCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Determine winnings on mount
  useEffect(() => {
    if (!caseItem || hasStarted) return;
    
    const totalPrice = caseItem.price * count;
    
    // Deduct cost if not demo
    if (!isDemoMode) {
        const success = subtractStars(totalPrice);
        if (!success) {
            navigate('/cases'); // Should not happen due to check in detail page
            return;
        }
    }

    const generatedPrizes: Prize[] = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      const items = [...caseItem.items].sort((a, b) => a.value - b.value); 
      
      let winner;
      if (rand > 0.98) winner = items[items.length - 1];
      else if (rand > 0.90) winner = items[Math.floor(items.length * 0.8)];
      else if (rand > 0.60) winner = items[Math.floor(items.length * 0.5)];
      else winner = items[Math.floor(Math.random() * (items.length / 2))];

      if (!winner) winner = items[0]; 

      const prizeInstance = { ...winner, id: `won-${Date.now()}-${i}` };
      generatedPrizes.push(prizeInstance);
      addItem(prizeInstance); 
    }
    
    setWinningPrizes(generatedPrizes);
    setHasStarted(true);
  }, [caseItem, count, isDemoMode, subtractStars, navigate, addItem, hasStarted]);

  if (!caseItem || winningPrizes.length === 0) return null;

  const handleRouletteComplete = () => {
    setCompletedCount((prev) => {
        const newCount = prev + 1;
        if (newCount === count) {
            setTimeout(() => {
                impactHeavy();
                notificationSuccess();
                setShowModal(true);
            }, 500);
        }
        return newCount;
    });
  };

  const handleClose = () => {
      navigate('/profile');
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f10] z-50 flex flex-col">
       {/* Dark Overlay Background with subtle glow */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0f0f10] to-[#0f0f10]" />
       
       <div className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4 backdrop-blur-md">
                Opening In Progress
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                {count}x <span className="text-[var(--tg-theme-button-color)]">{caseItem.name}</span>
            </h1>
          </div>

          <div className="space-y-8">
            {winningPrizes.map((prize, index) => (
                <Roulette
                    key={index}
                    items={caseItem.items}
                    winningItem={prize}
                    onComplete={handleRouletteComplete}
                    delay={index * 0.5} 
                />
            ))}
          </div>
       </div>

      {showModal && (
        <PrizeModal prizes={winningPrizes} onClose={handleClose} />
      )}
    </div>
  );
};

export default CaseOpeningPage;
