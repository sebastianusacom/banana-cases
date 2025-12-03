import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gift, User } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const { selectionChanged } = useHaptics();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { to: '/cases', icon: Gift, label: 'Cases' },
    { to: '/profile', icon: User, label: 'Profile' }
  ];

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.to === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ease-out',
      'hover:scale-105 active:scale-95',
      isActive
        ? 'text-white scale-110'
        : 'text-[var(--tg-theme-hint-color)] hover:text-white/80'
    );

  const handleNavClick = (index: number) => {
    setActiveIndex(index);
    selectionChanged();
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="relative flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl pointer-events-auto overflow-hidden">
        {/* Liquid Morph Background */}
        <div
          className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.8) 0%, rgba(245,158,11,0.6) 50%, rgba(234,179,8,0.8) 100%)',
            transform: `translateX(${activeIndex * 100 + activeIndex * 24}px)`,
            clipPath: activeIndex === 0
              ? 'polygon(0% 0%, 45% 0%, 55% 0%, 100% 0%, 100% 100%, 55% 100%, 45% 100%, 0% 100%)'
              : 'polygon(0% 0%, 55% 0%, 65% 0%, 100% 0%, 100% 100%, 65% 100%, 55% 100%, 0% 100%)',
            filter: 'blur(0.5px) brightness(1.1)',
            boxShadow: '0 0 30px rgba(234,179,8,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        />

        {/* Liquid Surface Reflection */}
        <div
          className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)',
            transform: `translateX(${activeIndex * 100 + activeIndex * 24}px)`,
            clipPath: activeIndex === 0
              ? 'polygon(10% 0%, 35% 0%, 45% 0%, 90% 0%, 90% 40%, 45% 40%, 35% 40%, 10% 40%)'
              : 'polygon(10% 0%, 45% 0%, 55% 0%, 90% 0%, 90% 40%, 55% 40%, 45% 40%, 10% 40%)',
          }}
        />

        {/* Liquid Ripple Effect */}
        <div
          className="absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pointer-events-none animate-liquid-ripple"
          style={{
            background: `radial-gradient(circle at ${activeIndex === 0 ? '30%' : '70%'} 50%, rgba(234,179,8,0.3) 0%, transparent 50%)`,
            transform: `translateX(${activeIndex * 100 + activeIndex * 24}px)`
          }}
        />

        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={navItemClass}
              onClick={() => handleNavClick(index)}
            >
              <Icon size={22} strokeWidth={2.5} />
            </NavLink>
          );
        })}

        <div className="w-px h-8 bg-white/10 relative z-10" />
      </nav>
    </div>
  );
};
