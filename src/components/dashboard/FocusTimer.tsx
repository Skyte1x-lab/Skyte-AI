import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNowTick } from '../../hooks/useNowTick';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

const PRESETS = [5, 15, 25, 45];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playBeep() {
  if (typeof AudioContext === 'undefined') return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
  osc.onended = () => ctx.close();
}

export default function FocusTimer() {
  const { t, language } = useTranslation();
  const focusTimer = useAppStore((s) => s.focusTimer);
  const startFocusTimer = useAppStore((s) => s.startFocusTimer);
  const stopFocusTimer = useAppStore((s) => s.stopFocusTimer);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const voiceOutput = useAppStore((s) => s.settings.voiceOutput);
  const { speak } = useSpeechSynthesis(language);

  useNowTick(1000);

  const [customMinutes, setCustomMinutes] = useState('10');
  const firedForRef = useRef<number | null>(null);

  const isRunning = focusTimer.targetEndAt !== null;
  const remainingSeconds = focusTimer.targetEndAt
    ? Math.max(0, Math.round((focusTimer.targetEndAt - Date.now()) / 1000))
    : 0;
  const progress =
    focusTimer.durationSeconds > 0 ? 1 - remainingSeconds / focusTimer.durationSeconds : 0;

  useEffect(() => {
    if (
      isRunning &&
      remainingSeconds === 0 &&
      focusTimer.targetEndAt !== null &&
      firedForRef.current !== focusTimer.targetEndAt
    ) {
      firedForRef.current = focusTimer.targetEndAt;
      playBeep();
      if (voiceOutput) speak(t('dashboard.timer.done'));
      stopFocusTimer();
    }
  }, [isRunning, remainingSeconds, focusTimer.targetEndAt, voiceOutput, speak, stopFocusTimer, t]);

  const handleStart = (minutes: number) => {
    if (minutes > 0) startFocusTimer(minutes * 60);
  };

  const handleCustomStart = (e: FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(customMinutes, 10);
    if (Number.isFinite(minutes) && minutes > 0 && minutes <= 180) {
      startFocusTimer(minutes * 60);
    }
  };

  return (
    <div className="timer-widget">
      {isRunning ? (
        <>
          <div className="timer-display">{formatTime(remainingSeconds)}</div>
          <div className="timer-progress">
            <div
              className="timer-progress-fill"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <div className="timer-actions">
            <button className="card-btn" onClick={() => setFocusMode(true)}>
              🧠 {t('dashboard.focusMode.enter')}
            </button>
            <button className="danger-btn" onClick={stopFocusTimer}>
              {t('dashboard.timer.stop')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="empty-hint">{t('dashboard.timer.idle')}</p>
          <div className="timer-presets">
            {PRESETS.map((m) => (
              <button key={m} className="card-btn" onClick={() => handleStart(m)}>
                {m} min
              </button>
            ))}
          </div>
          <form className="add-form" onSubmit={handleCustomStart}>
            <input
              type="number"
              min={1}
              max={180}
              className="settings-input"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
            />
            <button type="submit">{t('dashboard.timer.start')}</button>
          </form>
        </>
      )}
    </div>
  );
}
