import { useEffect, useRef, useState } from 'react';
import FocusMode from './components/FocusMode';
import Header from './components/Header';
import ToastStack from './components/ToastStack';
import ChatView from './components/chat/ChatView';
import DashboardView from './components/dashboard/DashboardView';
import SettingsView from './components/settings/SettingsView';
import { useReminderNotifications } from './hooks/useReminderNotifications';
import { darkenRgb, hexToRgb } from './lib/color';
import { useAppStore } from './store/useAppStore';
import type { View } from './types';

const VIEW_ORDER: View[] = ['chat', 'dashboard', 'settings'];

export default function App() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const theme = useAppStore((s) => s.settings.theme);
  const accentColor = useAppStore((s) => s.settings.accentColor);

  useReminderNotifications();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement.style;
    const rgb = accentColor ? hexToRgb(accentColor) : null;
    if (accentColor && rgb) {
      root.setProperty('--color-accent', accentColor);
      root.setProperty('--color-accent-rgb', rgb.join(', '));
      root.setProperty('--color-accent-hover', darkenRgb(rgb, 0.15));
      root.setProperty('--color-accent-soft', `rgba(${rgb.join(', ')}, 0.15)`);
    } else {
      root.removeProperty('--color-accent');
      root.removeProperty('--color-accent-rgb');
      root.removeProperty('--color-accent-hover');
      root.removeProperty('--color-accent-soft');
    }
  }, [accentColor]);

  const prevIndexRef = useRef(VIEW_ORDER.indexOf(activeView));
  const [direction, setDirection] = useState<'from-right' | 'from-left'>('from-right');

  useEffect(() => {
    const newIndex = VIEW_ORDER.indexOf(activeView);
    if (newIndex !== prevIndexRef.current) {
      setDirection(newIndex > prevIndexRef.current ? 'from-right' : 'from-left');
      prevIndexRef.current = newIndex;
    }
  }, [activeView]);

  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveView('chat');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveView('dashboard');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveView('settings');
      } else if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setActiveView('chat');
        requestAnimationFrame(() => {
          document.querySelector<HTMLTextAreaElement>('.chat-textarea')?.focus();
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setActiveView]);

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
      <FocusMode />
    </div>
  );
}
