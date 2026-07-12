import { useEffect, useRef, useState } from 'react';
import { getAssistantReply } from '../../ai/assistant';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { ChatMessage } from '../../types';
import SkyteOrb from '../SkyteOrb';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

export default function ChatView() {
  const { t, language } = useTranslation();
  const chatHistory = useAppStore((s) => s.chatHistory);
  const isThinking = useAppStore((s) => s.isThinking);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const voiceOutput = useAppStore((s) => s.settings.voiceOutput);

  const { speak, cancel } = useSpeechSynthesis(language);

  // Only messages that arrive after mount get the typing animation.
  const [animateIds, setAnimateIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = (text: string, via: 'text' | 'voice') => {
    if (isThinking) return;
    cancel();
    addChatMessage({ role: 'user', content: text, via });
    void getAssistantReply(text);
  };

  const speech = useSpeechRecognition(language, (transcript) => {
    sendMessage(transcript, 'voice');
  });

  const handleMicClick = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      cancel();
      speech.start();
    }
  };

  // Track which assistant messages are new (added while this view is mounted).
  const knownIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(chatHistory.map((m) => m.id));
      return;
    }
    const fresh = chatHistory.filter(
      (m) => m.role === 'assistant' && !knownIdsRef.current!.has(m.id),
    );
    for (const m of chatHistory) knownIdsRef.current.add(m.id);
    if (fresh.length > 0) {
      setAnimateIds((prev) => {
        const next = new Set(prev);
        for (const m of fresh) next.add(m.id);
        return next;
      });
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  const handleRevealDone = (message: ChatMessage) => {
    if (voiceOutput) speak(message.content);
  };

  return (
    <div className="chat-view">
      <div className="chat-messages">
        {chatHistory.length === 0 ? (
          <div className="chat-empty">
            <SkyteOrb size="lg" listening={speech.isListening} />
            <h2>{t('chat.emptyTitle')}</h2>
            <p>{t('chat.emptySubtitle')}</p>
            <div className="chat-empty-examples">
              {(['chat.example1', 'chat.example2', 'chat.example3'] as const).map(
                (key) => (
                  <button
                    key={key}
                    className="example-chip"
                    onClick={() => sendMessage(t(key), 'text')}
                  >
                    {t(key)}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          chatHistory.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              animate={animateIds.has(message.id)}
              onRevealDone={handleRevealDone}
            />
          ))
        )}
        {isThinking && (
          <div className="typing-indicator" aria-label="thinking">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {speech.error === 'not-allowed' && (
        <p className="empty-hint" style={{ textAlign: 'center' }}>
          {t('chat.micDenied')}
        </p>
      )}

      <ChatInput
        disabled={isThinking}
        onSend={(text) => sendMessage(text, 'text')}
        micSupported={speech.isSupported}
        isListening={speech.isListening}
        interimTranscript={speech.interimTranscript}
        onMicClick={handleMicClick}
      />
    </div>
  );
}
