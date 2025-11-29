import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopLiveBar } from './TopLiveBar';

export const Layout: React.FC = () => {
  const location = useLocation();
  
  // Check if we are on a case detail page
  const isCaseDetailPage = /^\/cases\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] flex flex-col">
      {/* Hide TopLiveBar on detail page for immersive experience */}
      {!isCaseDetailPage && <TopLiveBar />}
      
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
      
      {/* Hide BottomNav on detail page */}
      {!isCaseDetailPage && <BottomNav />}
    </div>
  );
};
