import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gift, User, Rocket, Dices } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useCrashGameStore } from '../store/crashGameStore';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();
  const { hasBet, phase } = useCrashGameStore();
  
  // Disable navigation when player has a bet and round is flying
  const isDisabled = hasBet && phase === 'flying';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
      isActive 
        ? 'text-white bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' 
        : 'text-[var(--tg-theme-hint-color)] hover:bg-white/5'
    );

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className={clsx(
        "flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl pointer-events-auto transition-opacity duration-300",
        isDisabled && "opacity-30 pointer-events-none"
      )}>
        <NavLink
          to="/cases"
          className={navItemClass}
          onClick={() => !isDisabled && selectionChanged()}
          onClickCapture={(e) => isDisabled && e.preventDefault()}
        >
          <Gift size={22} strokeWidth={2.5} />
        </NavLink>

        <div className="w-px h-8 bg-white/10" />

        <NavLink
          to="/crash"
          className={navItemClass}
          onClick={() => !isDisabled && selectionChanged()}
          onClickCapture={(e) => isDisabled && e.preventDefault()}
        >
          <Rocket size={22} strokeWidth={2.5} />
        </NavLink>

        <div className="w-px h-8 bg-white/10" />

        <div className={navItemClass({ isActive: false })}>
          <Dices size={22} strokeWidth={2.5} />
        </div>

        <div className="w-px h-8 bg-white/10" />

        <NavLink
          to="/profile"
          className={navItemClass}
          onClick={() => !isDisabled && selectionChanged()}
          onClickCapture={(e) => isDisabled && e.preventDefault()}
        >
          <User size={22} strokeWidth={2.5} />
        </NavLink>
      </nav>
    </div>
  );
};
