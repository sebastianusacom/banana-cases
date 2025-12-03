import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gift, User } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { motion } from 'framer-motion';
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
      'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 z-10',
      isActive
        ? 'text-white'
        : 'text-[var(--tg-theme-hint-color)] hover:bg-white/5'
    );

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="relative flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl pointer-events-auto overflow-hidden">
        {/* Liquid morphing background */}
        <motion.div
          className="absolute top-3 bottom-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-[0_0_25px_rgba(234,179,8,0.5)]"
          animate={{
            left: activeIndex === 0 ? '24px' : 'calc(100% - 80px)',
            width: '56px'
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
            velocity: 0
          }}
          layout
        />

        {/* Liquid blob effect */}
        <motion.div
          className="absolute top-2 bottom-2 bg-gradient-to-r from-yellow-300/60 to-yellow-400/60 rounded-full blur-sm"
          animate={{
            left: activeIndex === 0 ? '22px' : 'calc(100% - 82px)',
            width: '60px',
            scale: [1, 1.05, 1],
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            mass: 0.9,
            scale: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }
          }}
        />

        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={navItemClass}
              onClick={() => selectionChanged()}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              >
                <Icon size={22} strokeWidth={2.5} />
              </motion.div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
