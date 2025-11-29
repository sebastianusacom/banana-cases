import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopLiveBar } from './TopLiveBar';

export const Layout: React.FC = () => {
  const location = useLocation();
  // Hide top/bottom bars on specific pages if needed (e.g. full screen animation)
  const isOpeningPage = location.pathname.includes('/opening');
  // Also hide BottomNav on Case Detail Page (/cases/:id)
  const isCaseDetailPage = /^\/cases\/[^/]+$/.test(location.pathname);
  const shouldHideBottomNav = isOpeningPage || isCaseDetailPage;

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] pb-24 flex flex-col" style={{ paddingTop: 'calc(var(--tg-safe-area-inset-top) + 4rem)' }}>
      <TopLiveBar />
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
      {!shouldHideBottomNav && <BottomNav />}
    </div>
  );
};
