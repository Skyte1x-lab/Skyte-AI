import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';

/** Strip markdown symbols and emojis so TTS reads cleanly. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/[*_`#>~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useSpeechSynthesis(language: Language) {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();

      const cleaned = cleanForSpeech(text);
      if (!cleaned) return;

      const langCode = language === 'de' ? 'de-DE' : 'en-US';
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = langCode;

      const voice =
        voicesRef.current.find((v) => v.lang === langCode) ??
        voicesRef.current.find((v) => v.lang.startsWith(language));
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, language],
  );

  useEffect(() => cancel, [cancel]);

  return { isSupported, isSpeaking, speak, cancel };
}
