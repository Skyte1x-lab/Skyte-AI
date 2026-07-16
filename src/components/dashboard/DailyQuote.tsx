import { useTranslation } from '../../i18n/useTranslation';
import { getQuoteOfTheDay } from '../../lib/quotes';

export default function DailyQuote() {
  const { language } = useTranslation();
  const quote = getQuoteOfTheDay(language);

  return (
    <div className="daily-quote">
      <span className="daily-quote-icon">💬</span>
      <span className="daily-quote-text">{quote}</span>
    </div>
  );
}
