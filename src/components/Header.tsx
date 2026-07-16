import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/useAppStore';
import type { View } from '../types';
import SkyteOrb from './SkyteOrb';

const tabs: { view: View; key: 'nav.chat' | 'nav.dashboard' | 'nav.settings' }[] = [
  { view: 'chat', key: 'nav.chat' },
  { view: 'dashboard', key: 'nav.dashboard' },
  { view: 'settings', key: 'nav.settings' },
];

export default function Header() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const isThinking = useAppStore((s) => s.isThinking);

  const isClaudeMode = settings.apiKey !== '';

  return (
    <header className="header">
      <div className="wordmark">
        <SkyteOrb size="sm" active={isThinking} />
        Skyte AI
        <span className={`mode-badge${isClaudeMode ? ' claude' : ''}`}>
          {isClaudeMode ? t('mode.claude') : t('mode.demo')}
        </span>
      </div>

      <nav className="tab-nav">
        {tabs.map(({ view, key }) => (
          <button
            key={view}
            className={`tab-btn${activeView === view ? ' active' : ''}`}
            onClick={() => setActiveView(view)}
          >
            {t(key)}
          </button>
        ))}
      </nav>

      <div className="header-toggles">
        <button
          className="pill-btn"
          onClick={() =>
            setSettings({ language: settings.language === 'de' ? 'en' : 'de' })
          }
        >
          {settings.language === 'de' ? 'DE' : 'EN'}
        </button>
        <button
          className={`icon-btn${settings.voiceOutput ? ' on' : ''}`}
          title={t('header.voiceTooltip')}
          onClick={() => setSettings({ voiceOutput: !settings.voiceOutput })}
        >
          {settings.voiceOutput ? '🔊' : '🔇'}
        </button>
        <button
          className={`icon-btn${settings.theme === 'dark' ? ' on' : ''}`}
          title={t('header.themeTooltip')}
          onClick={() =>
            setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
          }
        >
          {settings.theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
