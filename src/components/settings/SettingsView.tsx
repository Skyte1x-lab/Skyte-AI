import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { Language } from '../../types';

export default function SettingsView() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const clearChat = useAppStore((s) => s.clearChat);
  const resetAll = useAppStore((s) => s.resetAll);

  const [showKey, setShowKey] = useState(false);
  const ttsSupported = 'speechSynthesis' in window;

  const handleReset = () => {
    if (window.confirm(t('settings.resetConfirm'))) {
      resetAll();
      localStorage.removeItem('skyte-ai-storage');
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
          <label>{t('settings.resetAll')}</label>
          <button className="danger-btn" onClick={handleReset}>
            {t('settings.resetAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
