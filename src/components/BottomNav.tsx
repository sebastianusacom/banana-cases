import React from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex flex-col items-center justify-center w-full h-full transition-colors duration-200',
      isActive ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--tg-theme-secondary-bg-color)] border-t border-[var(--tg-theme-hint-color)]/10 flex items-center justify-around z-50 pb-safe">
      <NavLink
        to="/cases"
        className={navItemClass}
        onClick={() => selectionChanged()}
      >
        <Briefcase size={24} />
        <span className="text-xs mt-1 font-medium">Cases</span>
      </NavLink>
      <NavLink
        to="/profile"
        className={navItemClass}
        onClick={() => selectionChanged()}
      >
        <User size={24} />
        <span className="text-xs mt-1 font-medium">Profile</span>
      </NavLink>
    </nav>
  );
};

