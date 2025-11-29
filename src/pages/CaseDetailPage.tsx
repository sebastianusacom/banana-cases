import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Info, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen pb-32 pt-6">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-8 px-2">
        <button
          onClick={() => {
            impactLight();
            navigate(-1);
          }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-md"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button 
            onClick={toggleDemoMode}
            className={clsx(
                "px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all",
                isDemoMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-green-500/10 border-green-500/20 text-green-500"
            )}
        >
            <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", isDemoMode ? "bg-yellow-500" : "bg-green-500")} />
            {isDemoMode ? 'Demo Mode' : 'Real Mode'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-64 h-64 mb-6"
        >
            {/* Glow behind case */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--tg-theme-button-color)] opacity-30 blur-[60px] rounded-full" />
            
            <img 
                src={caseItem.image} 
                alt={caseItem.name} 
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl" 
            />
        </motion.div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight text-center">{caseItem.name}</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <span className="text-yellow-400 font-bold text-lg">{caseItem.price}</span>
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-[#1c1c1e]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl">
        
        <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-medium text-[var(--tg-theme-hint-color)]">Quantity</span>
             <div className="flex bg-black/20 p-1 rounded-xl">
                {[1, 2, 3].map((c) => (
                    <button
                        key={c}
                        onClick={() => handleCountChange(c as 1 | 2 | 3)}
                        className={clsx(
                            "w-10 h-8 rounded-lg text-sm font-bold transition-all",
                            count === c ? "bg-[var(--tg-theme-button-color)] text-white shadow-lg" : "text-[var(--tg-theme-hint-color)] hover:text-white"
                        )}
                    >
                        {c}x
                    </button>
                ))}
             </div>
        </div>

        <div className="h-px w-full bg-white/5 mb-6" />

        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleOpen}
            className={clsx(
                "w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all relative overflow-hidden group",
                !isDemoMode && !canAfford 
                    ? 'bg-white/5 text-[var(--tg-theme-hint-color)] cursor-not-allowed' 
                    : 'bg-[var(--tg-theme-button-color)] text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.4)]'
            )}
        >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <span>Open Case</span>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <span className="text-sm opacity-90">{totalPrice} Stars</span>
        </motion.button>
      </div>

      {/* Possible Drops */}
      <div className="mt-8">
         <div className="flex items-center gap-2 mb-4 px-2 opacity-60">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Possible Drops</span>
         </div>
         
         <div className="grid grid-cols-3 gap-3">
            {caseItem.items.sort((a,b) => b.value - a.value).map((item) => (
                <div key={item.id} className="group relative bg-white/5 rounded-2xl p-3 border border-white/5 overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundColor: item.color }} />
                    
                    <div className="w-full aspect-square mb-2 bg-black/20 rounded-xl p-2">
                         <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="h-1 w-8 rounded-full mb-2 opacity-50" style={{ backgroundColor: item.color }} />
                    <p className="text-[10px] font-medium leading-tight line-clamp-1 opacity-80">{item.name}</p>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;
