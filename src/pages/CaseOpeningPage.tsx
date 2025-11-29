import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaseStore } from '../store/caseStore';
import { useUserStore, Prize } from '../store/userStore';
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
  const [completedCount, setCompletedCount] = useState(0);
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
      // Simple weighted random for now (can be improved)
      // In real app, this logic should be server-side
      const rand = Math.random();
      const items = [...caseItem.items].sort((a, b) => a.value - b.value); // Sort low to high value
      
      let winner;
      // Skew towards cheaper items
      if (rand > 0.98) winner = items[items.length - 1]; // Top item
      else if (rand > 0.90) winner = items[Math.floor(items.length * 0.8)];
      else if (rand > 0.60) winner = items[Math.floor(items.length * 0.5)];
      else winner = items[Math.floor(Math.random() * (items.length / 2))];

      if (!winner) winner = items[0]; // Fallback

      // Create a unique instance of the prize
      const prizeInstance = { ...winner, id: `won-${Date.now()}-${i}` };
      generatedPrizes.push(prizeInstance);
      addItem(prizeInstance); // Add to inventory immediately (or could wait till end)
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
    <div className="min-h-screen bg-[#1a1a1d] flex flex-col justify-center py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Opening {count}x {caseItem.name}</h1>
        <p className="text-gray-400 text-sm">Good Luck!</p>
      </div>

      <div className="space-y-8">
        {winningPrizes.map((prize, index) => (
            <Roulette
                key={index}
                items={caseItem.items}
                winningItem={prize}
                onComplete={handleRouletteComplete}
                delay={index * 0.5} // Stagger starts slightly
            />
        ))}
      </div>

      {showModal && (
        <PrizeModal prizes={winningPrizes} onClose={handleClose} />
      )}
    </div>
  );
};

export default CaseOpeningPage;

