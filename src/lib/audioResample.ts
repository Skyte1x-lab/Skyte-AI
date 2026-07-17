const WHISPER_SAMPLE_RATE = 16000;

/**
 * Decodes a recorded audio Blob (webm/opus, mp4/aac, ogg — whatever the
 * browser's MediaRecorder produced) and resamples it to mono 16kHz Float32
 * PCM, the format Whisper expects. OfflineAudioContext handles both the
 * resampling and the channel downmix for us.
 */
export async function blobToFloat32Mono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
  const decodeCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  } finally {
    void decodeCtx.close();
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * WHISPER_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, frames, WHISPER_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
