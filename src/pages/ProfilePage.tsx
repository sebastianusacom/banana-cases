import React, { useState, useEffect } from 'react';
import { useUserStore, type Prize } from '../store/userStore';
import { Star, PackageOpen, Download, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { UniversalMedia } from '../components/UniversalMedia';

const InventoryItem: React.FC<{ item: Prize; onSell: (id: string) => void }> = ({ item, onSell }) => {
    const { impactMedium } = useHaptics();
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        if (!item.wonAt) {
            setIsLocked(false);
            return;
        }

        const checkTime = () => {
            const now = Date.now();
            const unlockTime = item.wonAt! + 20 * 60 * 1000; // 20 minutes
            const diff = unlockTime - now;

            if (diff <= 0) {
                setIsLocked(false);
                setTimeLeft("");
            } else {
                setIsLocked(true);
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [item.wonAt]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="bg-white/5 rounded-2xl p-3 flex flex-col gap-3 group border border-white/5"
        >
            <div className="aspect-square bg-black/20 rounded-xl p-2 relative overflow-hidden">
                 <UniversalMedia src={item.image} alt={item.name} className="w-full h-full object-contain relative z-10" />
                 <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 z-20 border border-white/10">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-white">{item.value}</span>
                 </div>
            </div>

            <div>
                <p className="text-xs font-medium text-white/90 truncate text-center mb-3 px-1">{item.name}</p>
                
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            impactMedium();
                            onSell(item.id);
                        }}
                        className="h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                        Sell
                    </button>
                    
                    <button
                        disabled={isLocked}
                        className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                            isLocked 
                                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                : 'bg-white text-black hover:bg-white/90 shadow-sm'
                        }`}
                    >
                        {isLocked ? (
                            <>
                                <Clock size={12} />
                                <span className="tabular-nums">{timeLeft}</span>
                            </>
                        ) : (
                            <>
                                <Download size={12} />
                                <span>Get</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ProfilePage: React.FC = () => {
  const { stars, inventory, sellItem } = useUserStore();

  return (
    <div className="flex-1 overflow-y-auto pt-4 px-2">
      {/* User Stats */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden mx-auto">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl" />
          
          <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 font-medium">Balance</span>
              <div className="p-2 bg-white/20 rounded-full">
                  <Star size={20} fill="white" />
              </div>
          </div>
          <h2 className="text-4xl font-black tracking-tight flex items-baseline">
              {stars.toLocaleString()} <span className="text-lg ml-2 font-normal opacity-80">Stars</span>
          </h2>
      </div>

      {/* Inventory Header */}
      <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-bold flex items-center text-white">
              <PackageOpen className="mr-2 text-yellow-500" />
              Inventory <span className="ml-2 text-sm text-white/40 font-normal">({inventory.length})</span>
          </h3>
      </div>

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
          <div className="text-center py-20 text-white/20 bg-white/5 rounded-2xl border border-dashed border-white/10 mx-2">
              <p>No items yet. Go open some cases!</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 gap-3 pb-20">
              <AnimatePresence mode='popLayout'>
                  {inventory.map((item) => (
                      <InventoryItem key={item.id} item={item} onSell={sellItem} />
                  ))}
              </AnimatePresence>
          </div>
      )}
    </div>
  );
};

export default ProfilePage;
