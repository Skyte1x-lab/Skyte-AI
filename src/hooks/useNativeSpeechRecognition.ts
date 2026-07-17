import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';

// The Web Speech API is not part of TS's DOM lib, so declare what we use.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const RecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

/**
 * Native browser speech recognition (Chrome, Edge, Safari on macOS, Android
 * Chrome). Firefox and iOS Safari don't implement this API at all — that gap
 * is covered by the Whisper-in-the-browser fallback in useWhisperFallback.ts.
 */
export function useNativeSpeechRecognition(
  language: Language,
  onFinalTranscript: (text: string) => void,
) {
  const isSupported = Boolean(RecognitionCtor);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<'not-allowed' | 'other' | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!RecognitionCtor || recognitionRef.current) return;
    setError(null);
    setInterimTranscript('');

    const recognition = new RecognitionCtor();
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) setInterimTranscript(interim);
      if (final.trim()) {
        setInterimTranscript('');
        onFinalRef.current(final.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('not-allowed');
      else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('other');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [language]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return { isSupported, isListening, interimTranscript, error, start, stop };
}
