import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToFloat32Mono16k } from '../lib/audioResample';
import type { Language } from '../types';

type ProgressMessage = { type: 'progress'; percent: number };
type ResultMessage = { type: 'result'; text: string };
type ErrorMessage = { type: 'error'; message: string };
type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage;

function isWhisperCapable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof WebAssembly !== 'undefined' &&
    typeof OfflineAudioContext !== 'undefined'
  );
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported?.(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Client-side speech-to-text for browsers without native SpeechRecognition
 * (Firefox, iOS Safari): records the mic via MediaRecorder, then runs a
 * Whisper model entirely in a Web Worker (transformers.js/ONNX-WASM). No
 * server, no API key — the model is fetched from the Hugging Face CDN once
 * and cached by the browser after that.
 */
export function useWhisperFallback(
  language: Language,
  onFinalTranscript: (text: string) => void,
  enabled: boolean,
) {
  const isSupported = enabled && isWhisperCapable();
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState<number | null>(null);
  const [error, setError] = useState<'not-allowed' | 'other' | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const languageRef = useRef(language);
  languageRef.current = language;

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL('../workers/whisperWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        setModelLoadProgress(msg.percent);
      } else if (msg.type === 'result') {
        setModelLoadProgress(null);
        setIsTranscribing(false);
        if (msg.text) onFinalRef.current(msg.text);
      } else if (msg.type === 'error') {
        setModelLoadProgress(null);
        setIsTranscribing(false);
        setError('other');
      }
    };
    workerRef.current = worker;
    return worker;
  }, []);

  const start = useCallback(async () => {
    if (!isSupported || recorderRef.current) return;
    setError(null);
    ensureWorker();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        if (blob.size === 0) return;

        try {
          const audio = await blobToFloat32Mono16k(blob);
          setIsTranscribing(true);
          ensureWorker().postMessage(
            { type: 'transcribe', audio, language: languageRef.current },
            [audio.buffer],
          );
        } catch {
          setError('other');
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('not-allowed');
      } else {
        setError('other');
      }
    }
  }, [isSupported, ensureWorker]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    setIsListening(false);
    if (recorder.state !== 'inactive') recorder.stop();
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      workerRef.current?.terminate();
    };
  }, []);

  return { isSupported, isListening, isTranscribing, modelLoadProgress, error, start, stop };
}
