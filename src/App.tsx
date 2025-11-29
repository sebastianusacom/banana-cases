import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';

import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ProfilePage from './pages/ProfilePage';
import CaseOpeningPage from './pages/CaseOpeningPage';

function App() {
  const { tg } = useTelegram();

  useEffect(() => {
    tg.ready();
    tg.expand();
    // Ensure dark mode colors match Telegram theme
    if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    }
  }, [tg]);

  return (
    <Router basename="/banana-cases">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/cases" replace />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/opening" element={<CaseOpeningPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
