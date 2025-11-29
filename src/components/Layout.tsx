import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopLiveBar } from './TopLiveBar';

export const Layout: React.FC = () => {
  const location = useLocation();
  // Hide top/bottom bars on specific pages if needed (e.g. full screen animation)
  const isOpeningPage = location.pathname.includes('/opening');

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] pb-24 pt-16">
      <TopLiveBar />
      <main className="w-full max-w-md mx-auto">
        <Outlet />
      </main>
      {!isOpeningPage && <BottomNav />}
    </div>
  );
};
