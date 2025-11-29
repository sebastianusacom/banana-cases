import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';

import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const { tg } = useTelegram();

  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.requestFullscreen?.();
    
    if (tg.themeParams.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    }

    const updateSafeArea = () => {
      const safeTop = tg.safeAreaInset?.top ?? 0;
      const contentTop = tg.contentSafeAreaInset?.top ?? 0;
      document.documentElement.style.setProperty('--tg-safe-area-inset-top', `${safeTop + contentTop}px`);
    };

    updateSafeArea();

    const onFullscreenChanged = () => {
      setTimeout(updateSafeArea, 100);
    };

    (tg as any).onEvent?.('fullscreenChanged', onFullscreenChanged);
    (tg as any).onEvent?.('safeAreaChanged', updateSafeArea);
    (tg as any).onEvent?.('contentSafeAreaChanged', updateSafeArea);

    return () => {
      (tg as any).offEvent?.('fullscreenChanged', onFullscreenChanged);
      (tg as any).offEvent?.('safeAreaChanged', updateSafeArea);
      (tg as any).offEvent?.('contentSafeAreaChanged', updateSafeArea);
    };
  }, [tg]);

  return (
    <Router basename="/banana-cases">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/cases" replace />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
