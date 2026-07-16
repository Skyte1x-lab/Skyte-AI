import { useEffect, useMemo } from 'react';
import { useNowTick } from '../hooks/useNowTick';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import NeuralBackground from './NeuralBackground';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode() {
  const { t } = useTranslation();
  const focusModeActive = useAppStore((s) => s.focusModeActive);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const focusTimer = useAppStore((s) => s.focusTimer);
  const plans = useAppStore((s) => s.plans);

  useNowTick(1000);

  useEffect(() => {
    if (!focusModeActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusModeActive, setFocusMode]);

  const topPlan = useMemo(() => {
    const open = plans.filter((p) => p.status !== 'done' && !p.archived);
    return [...open].sort((a, b) => {
      const prio = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (prio !== 0) return prio;
      return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);
    })[0];
  }, [plans]);

  if (!focusModeActive) return null;

  const isRunning = focusTimer.targetEndAt !== null;
  const remainingSeconds = focusTimer.targetEndAt
    ? Math.max(0, Math.round((focusTimer.targetEndAt - Date.now()) / 1000))
    : 0;

  return (
    <div className="focus-mode">
      <NeuralBackground active={isRunning} messageCount={0} />
      <button className="focus-mode-close" onClick={() => setFocusMode(false)}>
        ✕ {t('dashboard.focusMode.exit')}
      </button>
      <div className="focus-mode-content">
        {isRunning ? (
          <div className="focus-mode-timer">{formatTime(remainingSeconds)}</div>
        ) : (
          <p className="focus-mode-idle">{t('dashboard.focusMode.noTimer')}</p>
        )}
        {topPlan && (
          <div className="focus-mode-plan">
            <span className="focus-mode-plan-label">{t('dashboard.focusMode.topTask')}</span>
            <span className="focus-mode-plan-title">{topPlan.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
