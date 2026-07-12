import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ChatMessage } from '../../types';

const CHARS_PER_TICK = 30;
const TICK_MS = 40;

interface Props {
  message: ChatMessage;
  /** Animate the text reveal (only for freshly received assistant messages). */
  animate: boolean;
  /** Called once when the reveal animation finishes (used to trigger TTS). */
  onRevealDone?: (message: ChatMessage) => void;
}

export default function MessageBubble({ message, animate, onRevealDone }: Props) {
  const { t } = useTranslation();
  const [visibleChars, setVisibleChars] = useState(
    animate ? 0 : message.content.length,
  );
  const doneRef = useRef(!animate);

  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      setVisibleChars((n) => {
        const next = n + CHARS_PER_TICK;
        if (next >= message.content.length) {
          clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            onRevealDone?.(message);
          }
          return message.content.length;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, message.id]);

  return (
    <div className={`bubble ${message.role}`}>
      {message.content.slice(0, visibleChars)}
      {message.via === 'voice' && (
        <span className="bubble-meta">🎤 {t('chat.viaVoice')}</span>
      )}
    </div>
  );
}
