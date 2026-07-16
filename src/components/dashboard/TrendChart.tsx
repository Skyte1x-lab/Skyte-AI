import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

const DAY_MS = 86400000;

export default function TrendChart() {
  const { t, language } = useTranslation();
  const plans = useAppStore((s) => s.plans);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = today.getTime() - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const count = plans.filter(
        (p) => p.status === 'done' && p.updatedAt >= dayStart && p.updatedAt < dayEnd,
      ).length;
      const label = new Date(dayStart).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'short',
      });
      counts.push({ label, count });
    }
    return counts;
  }, [plans, language]);

  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="trend-chart">
      {days.map((d, i) => (
        <div key={i} className="trend-bar-wrap" title={`${d.count}`}>
          <div className="trend-bar" style={{ height: `${(d.count / max) * 100}%` }}>
            {d.count > 0 && <span className="trend-bar-count">{d.count}</span>}
          </div>
          <span className="trend-bar-label">{d.label}</span>
        </div>
      ))}
      <p className="trend-chart-caption">{t('dashboard.trendCaption')}</p>
    </div>
  );
}
