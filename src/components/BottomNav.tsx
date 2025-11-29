import React from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
      isActive 
        ? 'text-white bg-[var(--tg-theme-button-color)] shadow-[0_0_20px_rgba(0,122,255,0.4)] scale-110' 
        : 'text-[var(--tg-theme-hint-color)] hover:bg-white/5'
    );

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="flex items-center gap-6 px-6 py-3 bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto">
        <NavLink
          to="/cases"
          className={navItemClass}
          onClick={() => selectionChanged()}
        >
          <Briefcase size={22} strokeWidth={2.5} />
        </NavLink>
        
        <div className="w-px h-8 bg-white/10" />

        <NavLink
          to="/profile"
          className={navItemClass}
          onClick={() => selectionChanged()}
        >
          <User size={22} strokeWidth={2.5} />
        </NavLink>
      </nav>
    </div>
  );
};
