import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
  micSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  onMicClick: () => void;
}

export default function ChatInput({
  disabled,
  onSend,
  micSupported,
  isListening,
  interimTranscript,
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

  return (
    <div className="chat-input-bar">
      <button
        className={`icon-btn mic-btn${isListening ? ' listening' : ''}`}
        disabled={!micSupported}
        title={micSupported ? t('chat.micTooltip') : t('chat.micUnsupported')}
        onClick={onMicClick}
      >
        🎤
      </button>
      <textarea
        className="chat-textarea"
        rows={1}
        value={isListening && interimTranscript ? interimTranscript : text}
        placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={isListening}
      />
      <button className="send-btn" disabled={disabled || !text.trim()} onClick={send}>
        {t('chat.send')}
      </button>
    </div>
  );
}
