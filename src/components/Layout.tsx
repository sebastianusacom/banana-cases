import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopLiveBar } from './TopLiveBar';
import { useTelegram } from '../hooks/useTelegram';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { isTelegramWebApp } = useTelegram();
  const isOpeningPage = location.pathname.includes('/opening');
  const isCaseDetailPage = /^\/cases\/[^/]+$/.test(location.pathname);
  const shouldHideBottomNav = isOpeningPage || isCaseDetailPage;

  return (
    <div
      className="h-screen bg-[#0f0f10] text-white flex flex-col overflow-hidden"
      style={{
        paddingTop: isTelegramWebApp
          ? 'calc(var(--tg-safe-area-inset-top) + 4rem)'
          : '4rem'
      }}
    >
      <TopLiveBar />
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
      {!shouldHideBottomNav && <BottomNav />}
    </div>
  );
};
