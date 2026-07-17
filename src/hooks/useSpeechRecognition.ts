import { useNativeSpeechRecognition } from './useNativeSpeechRecognition';
import { useWhisperFallback } from './useWhisperFallback';
import type { Language } from '../types';

export type VoiceEngine = 'native' | 'whisper' | 'unsupported';

/**
 * Unified voice-input hook. Prefers native browser SpeechRecognition
 * (Chrome, Edge, Safari/macOS, Android Chrome — instant, streaming interim
 * results). Where that API doesn't exist at all (Firefox, iOS Safari), it
 * transparently switches to an in-browser Whisper model (see
 * useWhisperFallback.ts) so voice input still works — just as a
 * record-then-transcribe step instead of live streaming.
 */
export function useSpeechRecognition(
  language: Language,
  onFinalTranscript: (text: string) => void,
) {
  const native = useNativeSpeechRecognition(language, onFinalTranscript);
  const whisper = useWhisperFallback(language, onFinalTranscript, !native.isSupported);

  if (native.isSupported) {
    return {
      isSupported: true,
      isListening: native.isListening,
      isTranscribing: false,
      interimTranscript: native.interimTranscript,
      modelLoadProgress: null as number | null,
      error: native.error,
      start: native.start,
      stop: native.stop,
      engine: 'native' as VoiceEngine,
    };
  }

  if (whisper.isSupported) {
    return {
      isSupported: true,
      isListening: whisper.isListening,
      isTranscribing: whisper.isTranscribing,
      interimTranscript: '',
      modelLoadProgress: whisper.modelLoadProgress,
      error: whisper.error,
      start: whisper.start,
      stop: whisper.stop,
      engine: 'whisper' as VoiceEngine,
    };
  }

  return {
    isSupported: false,
    isListening: false,
    isTranscribing: false,
    interimTranscript: '',
    modelLoadProgress: null as number | null,
    error: null as 'not-allowed' | 'other' | null,
    start: () => {},
    stop: () => {},
    engine: 'unsupported' as VoiceEngine,
  };
}
