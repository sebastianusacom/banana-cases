import React from 'react';
import { useUserStore } from '../store/userStore';
import { Star, PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

const ProfilePage: React.FC = () => {
  const { stars, inventory, sellItem } = useUserStore();
  const { impactMedium } = useHaptics();

  return (
    <div className="pt-4 px-2">
      {/* User Stats */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
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
          <h3 className="text-xl font-bold flex items-center">
              <PackageOpen className="mr-2 text-[#eab308]" />
              Inventory <span className="ml-2 text-sm text-[var(--tg-theme-hint-color)] font-normal">({inventory.length})</span>
          </h3>
      </div>

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
          <div className="text-center py-20 text-[var(--tg-theme-hint-color)] bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl border border-dashed border-white/10">
              <p>No items yet. Go open some cases!</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 gap-3">
              {inventory.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    key={item.id}
                    className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3 border border-white/5 flex flex-col"
                  >
                      <div 
                        className="w-full aspect-square mb-3 rounded-lg bg-black/20 p-2 relative overflow-hidden group"
                      >
                           <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white" />
                           <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      
                      <div className="flex-1">
                          <p className="font-bold text-sm mb-1 truncate text-white">{item.name}</p>
                          <div className="flex items-center text-xs text-[var(--tg-theme-hint-color)] mb-3">
                              <Star size={10} className="mr-1 text-yellow-400" /> {item.value}
                          </div>
                      </div>

                      <button
                        onClick={() => {
                            impactMedium();
                            sellItem(item.id);
                        }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                          Sell for {item.value} Stars
                      </button>
                  </motion.div>
              ))}
          </div>
      )}
    </div>
  );
};

export default ProfilePage;

