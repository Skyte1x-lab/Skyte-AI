// Runs in-browser speech-to-text (Whisper, via transformers.js/ONNX-WASM) off
// the main thread. Only ever loaded in browsers without native
// SpeechRecognition (Firefox, iOS Safari) — see useWhisperFallback.ts.
//
// `self` here is typed as `Worker` (not `DedicatedWorkerGlobalScope`) purely
// to reuse the existing DOM lib types without pulling in the "webworker" lib,
// which would conflict with the "DOM" lib already used by the rest of the
// app. The runtime object is the same either way.
const ctx = self as unknown as Worker;

type IncomingMessage = {
  type: 'transcribe';
  audio: Float32Array;
  language: 'de' | 'en';
};

type OutgoingMessage =
  | { type: 'progress'; percent: number }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string };

function post(message: OutgoingMessage) {
  ctx.postMessage(message);
}

type TranscriptionResult = { text?: string } | { text?: string }[];
type Transcriber = (
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<TranscriptionResult>;

let transcriberPromise: Promise<Transcriber> | null = null;

function loadTranscriber(): Promise<Transcriber> {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowLocalModels = false;

      const fileProgress = new Map<string, { loaded: number; total: number }>();
      const reportProgress = () => {
        let loaded = 0;
        let total = 0;
        for (const p of fileProgress.values()) {
          loaded += p.loaded;
          total += p.total;
        }
        if (total > 0) post({ type: 'progress', percent: Math.min(100, Math.round((loaded / total) * 100)) });
      };

      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (data: {
          status: string;
          file?: string;
          loaded?: number;
          total?: number;
        }) => {
          if (!data.file) return;
          if (data.status === 'progress') {
            fileProgress.set(data.file, { loaded: data.loaded ?? 0, total: data.total ?? 1 });
            reportProgress();
          } else if (data.status === 'done') {
            const existing = fileProgress.get(data.file);
            fileProgress.set(data.file, { loaded: existing?.total ?? 1, total: existing?.total ?? 1 });
            reportProgress();
          }
        },
      });
      return transcriber as unknown as Transcriber;
    })();
  }
  return transcriberPromise;
}

ctx.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const { type, audio, language } = event.data;
  if (type !== 'transcribe') return;

  try {
    const transcriber = await loadTranscriber();
    const output = await transcriber(audio, {
      language: language === 'de' ? 'german' : 'english',
      task: 'transcribe',
    });
    const text = Array.isArray(output) ? output[0]?.text : output?.text;
    post({ type: 'result', text: typeof text === 'string' ? text.trim() : '' });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
});
