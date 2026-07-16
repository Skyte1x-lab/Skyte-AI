import { useEffect } from 'react';
import Header from './components/Header';
import ToastStack from './components/ToastStack';
import ChatView from './components/chat/ChatView';
import DashboardView from './components/dashboard/DashboardView';
import SettingsView from './components/settings/SettingsView';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const activeView = useAppStore((s) => s.activeView);
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        {activeView === 'chat' && <ChatView />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'settings' && <SettingsView />}
      </main>
      <ToastStack />
    </div>
  );
}
