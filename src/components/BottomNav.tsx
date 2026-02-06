import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gift, User, Rocket, TrendingUp } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useCrashGameStore } from '../store/crashGameStore';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();
  const { hasBet } = useCrashGameStore();
  const [isUpgradeSpinning, setIsUpgradeSpinning] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  
  const navItems = [
    { path: '/cases', icon: Gift },
    { path: '/crash', icon: Rocket },
    { path: '/upgrade', icon: TrendingUp },
    { path: '/profile', icon: User },
  ];
  
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
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
  
  // Update sliding indicator position when route changes
  useEffect(() => {
    const activeIndex = navItems.findIndex(item => location.pathname === item.path);
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      const activeItem = itemRefs.current[activeIndex];
      const navElement = navRef.current;
      
      if (activeItem && navElement) {
        const navRect = navElement.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        
        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
        });
      }
    }
  }, [location.pathname]);
  
  // Disable navigation when player has a bet placed (or queued) or when upgrade is spinning
  const isDisabled = hasBet || isUpgradeSpinning;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 z-10',
      isActive 
        ? 'text-white bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' 
        : 'text-white/60 hover:text-white hover:bg-white/5'
    );

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
        {/* Sliding indicator */}
        <div
          className="absolute h-14 rounded-full bg-yellow-500/20 transition-all duration-500 ease-out pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
        
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
          return (
            <NavLink
              key={item.path}
              to={item.path}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={navItemClass}
              onClick={() => !isDisabled && selectionChanged()}
              onClickCapture={(e) => isDisabled && e.preventDefault()}
            >
              <Icon size={22} strokeWidth={2.5} />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
