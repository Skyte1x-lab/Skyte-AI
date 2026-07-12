import { useAppStore } from '../store/useAppStore';
import { translations, type TranslationKey } from './translations';

export function useTranslation() {
  const language = useAppStore((s) => s.settings.language);
  const t = (key: TranslationKey): string => translations[language][key];
  return { t, language };
}
