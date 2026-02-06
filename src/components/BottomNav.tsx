import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Gift, User, Rocket, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { useCrashGameStore } from '../store/crashGameStore';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();
  const { hasBet } = useCrashGameStore();
  const [isUpgradeSpinning, setIsUpgradeSpinning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  
  const navItems = [
    { path: '/cases', icon: Gift },
    { path: '/crash', icon: Rocket },
    { path: '/upgrade', icon: TrendingUp },
    { path: '/profile', icon: User },
  ];
  
  const [isMounted, setIsMounted] = useState(false);
  
  // Listen for upgrade spinning events
  useEffect(() => {
    const handleUpgradeSpinStart = () => setIsUpgradeSpinning(true);
    const handleUpgradeSpinEnd = () => setIsUpgradeSpinning(false);

    window.addEventListener('upgrade-spin-start', handleUpgradeSpinStart);
    window.addEventListener('upgrade-spin-end', handleUpgradeSpinEnd);

    return () => {
      window.removeEventListener('upgrade-spin-start', handleUpgradeSpinStart);
      window.removeEventListener('upgrade-spin-end', handleUpgradeSpinEnd);
    };
  }, []);
  
  // Slide-in animation on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Disable navigation when player has a bet placed (or queued) or when upgrade is spinning
  const isDisabled = hasBet || isUpgradeSpinning;

  return (
    <div className={clsx(
      "fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none",
      "transform transition-transform duration-500 ease-out",
      isMounted ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <nav 
        ref={navRef}
        className={clsx(
          "relative flex items-center gap-4 px-4 py-3 bg-white/5 backdrop-blur-md rounded-full shadow-2xl pointer-events-auto transition-opacity duration-300",
          isDisabled && "opacity-30 pointer-events-none"
        )}
      >
        {/* Border gradient */}
        <div 
          className="absolute inset-0 rounded-full p-[1px] pointer-events-none bg-gradient-to-b from-white/50 to-transparent z-0"
          style={{
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
          }}
        />
        
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 z-10',
                isActive 
                  ? 'text-white scale-110' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              onClick={() => !isDisabled && selectionChanged()}
              onClickCapture={(e) => isDisabled && e.preventDefault()}
            >
              <span className="relative z-10">
                <Icon size={22} strokeWidth={2.5} />
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] z-0"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  drag="x"
                  dragConstraints={navRef}
                  dragElastic={0.2}
                  dragSnapToOrigin
                  onDragEnd={(_, info) => {
                     // item width 56px (w-14) + gap 16px (gap-4) = 72px
                     const pitch = 72;
                     const offset = info.offset.x;
                     const steps = Math.round(offset / pitch);
                     const targetIndex = Math.max(0, Math.min(navItems.length - 1, index + steps));
                     
                     if (targetIndex !== index) {
                         selectionChanged();
                         navigate(navItems[targetIndex].path);
                     }
                  }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
