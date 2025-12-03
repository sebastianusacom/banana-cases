import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gift, User } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();
  const location = useLocation();

  const isCasesActive = location.pathname === '/cases';
  const isProfileActive = location.pathname === '/profile';

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="relative flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl pointer-events-auto overflow-hidden">
        {/* Liquid morph background */}
        <div
          className={clsx(
            'absolute top-1 bottom-1 transition-all duration-500 ease-out rounded-full',
            'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
            'shadow-[0_0_25px_rgba(234,179,8,0.5)] blur-[0.5px]',
            isCasesActive
              ? 'left-1 right-[calc(50%+12px)]'
              : isProfileActive
              ? 'left-[calc(50%+12px)] right-1'
              : 'left-1/2 right-1/2 w-0 opacity-0'
          )}
          style={{
            transform: isCasesActive
              ? 'translateX(0) scaleX(1)'
              : isProfileActive
              ? 'translateX(0) scaleX(1)'
              : 'translateX(0) scaleX(0)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Secondary liquid layer for depth */}
        <div
          className={clsx(
            'absolute top-2 bottom-2 transition-all duration-700 ease-out rounded-full',
            'bg-gradient-to-r from-yellow-300/60 via-yellow-400/60 to-yellow-500/60',
            'shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]',
            isCasesActive
              ? 'left-2 right-[calc(50%+10px)]'
              : isProfileActive
              ? 'left-[calc(50%+10px)] right-2'
              : 'left-1/2 right-1/2 w-0 opacity-0'
          )}
          style={{
            transform: isCasesActive
              ? 'translateX(0) scaleX(1)'
              : isProfileActive
              ? 'translateX(0) scaleX(1)'
              : 'translateX(0) scaleX(0)',
          }}
        />

        <NavLink
          to="/cases"
          className={clsx(
            'relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
            isCasesActive
              ? 'text-white scale-105'
              : 'text-[var(--tg-theme-hint-color)] hover:text-white/80 hover:scale-102'
          )}
          onClick={() => selectionChanged()}
        >
          <Gift size={22} strokeWidth={2.5} />
        </NavLink>

        <div className="relative z-10 w-px h-8 bg-white/10 transition-opacity duration-300" />

        <NavLink
          to="/profile"
          className={clsx(
            'relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
            isProfileActive
              ? 'text-white scale-105'
              : 'text-[var(--tg-theme-hint-color)] hover:text-white/80 hover:scale-102'
          )}
          onClick={() => selectionChanged()}
        >
          <User size={22} strokeWidth={2.5} />
        </NavLink>
      </nav>
    </div>
  );
};
