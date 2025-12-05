import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';

import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ProfilePage from './pages/ProfilePage';
import CrashGame from './pages/CrashGame';

function App() {
  const { tg, isTelegramWebApp } = useTelegram();

  useEffect(() => {
    if (isTelegramWebApp) {
      tg.ready();
      tg.expand();
      tg.requestFullscreen?.();
    }

    const updateSafeArea = () => {
      if (isTelegramWebApp) {
        const safeTop = tg.safeAreaInset?.top ?? 0;
        const contentTop = tg.contentSafeAreaInset?.top ?? 0;
        document.documentElement.style.setProperty('--tg-safe-area-inset-top', `${safeTop + contentTop}px`);
      } else {
        document.documentElement.style.setProperty('--tg-safe-area-inset-top', '0px');
      }
    };

    updateSafeArea();

    if (isTelegramWebApp) {
      tg.onEvent('safeAreaChanged', updateSafeArea);
      tg.onEvent('contentSafeAreaChanged', updateSafeArea);
      tg.onEvent('fullscreenChanged', updateSafeArea);
      tg.onEvent('viewportChanged', updateSafeArea);

      return () => {
        tg.offEvent('safeAreaChanged', updateSafeArea);
        tg.offEvent('contentSafeAreaChanged', updateSafeArea);
        tg.offEvent('fullscreenChanged', updateSafeArea);
        tg.offEvent('viewportChanged', updateSafeArea);
      };
    }
  }, [tg, isTelegramWebApp]);

  return (
    <Router basename="/banana-cases">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/cases" replace />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/crash" element={<CrashGame />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
