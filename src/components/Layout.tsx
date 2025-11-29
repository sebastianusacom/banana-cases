import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopLiveBar } from './TopLiveBar';
import clsx from 'clsx';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isOpeningPage = location.pathname.includes('/opening');
  const isCaseDetailPage = /^\/cases\/[^/]+$/.test(location.pathname);
  const shouldHideBottomNav = isOpeningPage || isCaseDetailPage;

  return (
    <div 
      className={clsx(
        "h-[100dvh] bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] flex flex-col overflow-hidden",
        !shouldHideBottomNav && "pb-24"
      )} 
      style={{ paddingTop: 'calc(var(--tg-safe-area-inset-top) + 4rem)' }}
    >
      <TopLiveBar />
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
      {!shouldHideBottomNav && <BottomNav />}
    </div>
  );
};
