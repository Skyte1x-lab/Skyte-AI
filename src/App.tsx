import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import ToastStack from './components/ToastStack';
import ChatView from './components/chat/ChatView';
import DashboardView from './components/dashboard/DashboardView';
import SettingsView from './components/settings/SettingsView';
import { useAppStore } from './store/useAppStore';
import type { View } from './types';

const VIEW_ORDER: View[] = ['chat', 'dashboard', 'settings'];

export default function App() {
  const activeView = useAppStore((s) => s.activeView);
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const prevIndexRef = useRef(VIEW_ORDER.indexOf(activeView));
  const [direction, setDirection] = useState<'from-right' | 'from-left'>('from-right');

  useEffect(() => {
    const newIndex = VIEW_ORDER.indexOf(activeView);
    if (newIndex !== prevIndexRef.current) {
      setDirection(newIndex > prevIndexRef.current ? 'from-right' : 'from-left');
      prevIndexRef.current = newIndex;
    }
  }, [activeView]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div key={activeView} className={`view-transition ${direction}`}>
          {activeView === 'chat' && <ChatView />}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>
      <ToastStack />
    </div>
  );
}
