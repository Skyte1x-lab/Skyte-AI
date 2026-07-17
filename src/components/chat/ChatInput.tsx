import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { VoiceEngine } from '../../hooks/useSpeechRecognition';

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
  micSupported: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  modelLoadProgress: number | null;
  interimTranscript: string;
  engine: VoiceEngine;
  onMicClick: () => void;
}

export default function ChatInput({
  disabled,
  onSend,
  micSupported,
  isListening,
  isTranscribing,
  modelLoadProgress,
  interimTranscript,
  engine,
  onMicClick,
}: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const micTitle = !micSupported
    ? t('chat.micUnsupported')
    : isTranscribing
      ? t('chat.micTranscribing')
      : modelLoadProgress !== null
        ? t('chat.micLoadingModel').replace('{percent}', String(modelLoadProgress))
        : engine === 'whisper'
          ? t('chat.micTooltipWhisper')
          : t('chat.micTooltip');

  const placeholder = isTranscribing
    ? t('chat.micTranscribing')
    : modelLoadProgress !== null
      ? t('chat.micLoadingModel').replace('{percent}', String(modelLoadProgress))
      : isListening
        ? t('chat.listening')
        : t('chat.placeholder');

  return (
    <div className="chat-input-bar">
      <button
        className={`icon-btn mic-btn${isListening ? ' listening' : ''}${isTranscribing || modelLoadProgress !== null ? ' busy' : ''}`}
        disabled={!micSupported || isTranscribing || modelLoadProgress !== null}
        title={micTitle}
        onClick={onMicClick}
      >
        <span className="mic-icon">{isTranscribing || modelLoadProgress !== null ? '⏳' : '🎤'}</span>
      </button>
      <textarea
        className="chat-textarea"
        rows={1}
        value={isListening && interimTranscript ? interimTranscript : text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={isListening || isTranscribing}
      />
      <button className="send-btn" disabled={disabled || !text.trim()} onClick={send}>
        {t('chat.send')}
      </button>
    </div>
  );
}
