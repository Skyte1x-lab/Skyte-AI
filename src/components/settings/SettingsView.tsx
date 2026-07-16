import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { Language } from '../../types';

const DEFAULT_ACCENT = '#D97757';

export default function SettingsView() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const clearChat = useAppStore((s) => s.clearChat);
  const resetAll = useAppStore((s) => s.resetAll);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const pushToast = useAppStore((s) => s.pushToast);

  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ttsSupported = 'speechSynthesis' in window;
  const notificationsSupported = typeof Notification !== 'undefined';

  const handleReset = () => {
    if (window.confirm(t('settings.resetConfirm'))) {
      resetAll();
      localStorage.removeItem('skyte-ai-storage');
    }
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyte-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      pushToast(ok ? '✅' : '⚠️', ok ? t('settings.importSuccess') : t('settings.importError'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNotificationsToggle = async (checked: boolean) => {
    if (!checked) {
      setSettings({ notificationsEnabled: false });
      return;
    }
    const permission = await Notification.requestPermission();
    setSettings({ notificationsEnabled: permission === 'granted' });
    if (permission !== 'granted') {
      pushToast('⚠️', t('settings.notificationsDenied'));
    }
  };

  return (
    <div className="settings-view">
      <h2>{t('settings.title')}</h2>

      <div className="settings-group">
        <h3>{t('settings.general')}</h3>
        <div className="settings-row">
          <label htmlFor="language-select">{t('settings.language')}</label>
          <select
            id="language-select"
            className="settings-select"
            value={settings.language}
            onChange={(e) =>
              setSettings({ language: e.target.value as Language })
            }
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="settings-row">
          <label htmlFor="voice-toggle">{t('settings.voiceOutput')}</label>
          <span className="switch">
            <input
              id="voice-toggle"
              type="checkbox"
              disabled={!ttsSupported}
              checked={settings.voiceOutput}
              onChange={(e) => setSettings({ voiceOutput: e.target.checked })}
            />
            <span className="switch-slider" />
          </span>
        </div>
        {!ttsSupported && (
          <p className="settings-hint">{t('settings.voiceUnsupported')}</p>
        )}
        <div className="settings-row">
          <label htmlFor="accent-color">{t('settings.accentColor')}</label>
          <div className="key-row">
            <input
              id="accent-color"
              type="color"
              className="color-input"
              value={settings.accentColor ?? DEFAULT_ACCENT}
              onChange={(e) => setSettings({ accentColor: e.target.value })}
            />
            <button className="pill-btn" onClick={() => setSettings({ accentColor: undefined })}>
              {t('settings.accentColorReset')}
            </button>
          </div>
        </div>
        <div className="settings-row">
          <label htmlFor="notifications-toggle">{t('settings.notifications')}</label>
          <span className="switch">
            <input
              id="notifications-toggle"
              type="checkbox"
              disabled={!notificationsSupported}
              checked={settings.notificationsEnabled}
              onChange={(e) => handleNotificationsToggle(e.target.checked)}
            />
            <span className="switch-slider" />
          </span>
        </div>
        {!notificationsSupported && (
          <p className="settings-hint">{t('settings.notificationsUnsupported')}</p>
        )}
        <p className="settings-hint">{t('settings.shortcutsHint')}</p>
      </div>

      <div className="settings-group">
        <h3>{t('settings.ai')}</h3>
        <label htmlFor="api-key">{t('settings.apiKey')}</label>
        <div className="key-row">
          <input
            id="api-key"
            className="settings-input"
            type={showKey ? 'text' : 'password'}
            value={settings.apiKey}
            placeholder="sk-ant-…"
            autoComplete="off"
            onChange={(e) => setSettings({ apiKey: e.target.value.trim() })}
          />
          <button className="pill-btn" onClick={() => setShowKey((v) => !v)}>
            {showKey ? t('settings.hide') : t('settings.show')}
          </button>
        </div>
        <p className="settings-hint">{t('settings.apiKeyHint')}</p>

        <div style={{ marginTop: 'var(--space-3)' }}>
          <label htmlFor="model">{t('settings.model')}</label>
          <input
            id="model"
            className="settings-input"
            type="text"
            value={settings.model}
            onChange={(e) => setSettings({ model: e.target.value.trim() })}
          />
        </div>
      </div>

      <div className="settings-group">
        <h3>{t('settings.data')}</h3>
        <div className="settings-row">
          <label>{t('settings.clearChat')}</label>
          <button className="pill-btn" onClick={clearChat}>
            {t('chat.clear')}
          </button>
        </div>
        <div className="settings-row">
          <label>{t('settings.export')}</label>
          <button className="pill-btn" onClick={handleExport}>
            {t('settings.exportButton')}
          </button>
        </div>
        <div className="settings-row">
          <label>{t('settings.import')}</label>
          <button className="pill-btn" onClick={() => fileInputRef.current?.click()}>
            {t('settings.importButton')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
        <div className="settings-row">
          <label>{t('settings.resetAll')}</label>
          <button className="danger-btn" onClick={handleReset}>
            {t('settings.resetAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
