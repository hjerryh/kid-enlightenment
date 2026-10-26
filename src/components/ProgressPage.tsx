import { ArrowRight, BookOpen, Flag, Leaf, Sparkles, Sprout, Star } from 'lucide-react';
import { categories, concepts } from '../data/curriculum';
import type { Concept } from '../data/curriculum';
import { dayStreak, localDate } from '../lib/progress';
import type { Progress } from '../lib/progress';
import { ConceptCard } from './Explore';
import { useLanguage } from '../lib/i18n';

export function ProgressPage({
  progress,
  onExplore,
  onOpen,
}: {
  progress: Progress;
  onExplore: () => void;
  onOpen: (concept: Concept) => void;
}) {
  const { t, localizeCategory } = useLanguage();
  const practiced = Object.values(progress.attempts).filter(
    (attempt) => attempt.correct > 0,
  ).length;
  const sessions = Object.values(progress.days).reduce((total, day) => total + day.sessions, 0);
  const recent = progress.discovered
    .slice(-4)
    .reverse()
    .map((id) => concepts.find((concept) => concept.id === id)!);
  const badges = [
    {
      name: t('First little step', '迈出第一步'),
      text: t('Discover your first word', '认识第一个事物'),
      threshold: 1,
      icon: Sprout,
    },
    {
      name: t('Curious mind', '好奇小脑袋'),
      text: t('Discover 6 words', '认识 6 个事物'),
      threshold: 6,
      icon: Sparkles,
    },
    {
      name: t('World explorer', '世界探索家'),
      text: t('Discover 18 words', '认识 18 个事物'),
      threshold: 18,
      icon: Flag,
    },
    {
      name: t('Big little world', '小世界大收获'),
      text: t(`Discover all ${concepts.length} words`, `认识全部 ${concepts.length} 个事物`),
      threshold: concepts.length,
      icon: Star,
    },
  ];
  return (
    <div className="page-enter">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            <Sprout size={15} />{' '}
            {t('GROWING, ONE DISCOVERY AT A TIME', '每一个小发现，都在陪你长大')}
          </div>
          <h1>{t('Your little discoveries.', '我的小小发现。')}</h1>
          <p className="page-description">
            {t(
              'Every new word is a little seed of something wonderful.',
              '每认识一样新事物，就种下一颗美好的小种子。',
            )}
          </p>
        </div>
        <button className="button button-secondary" onClick={onExplore}>
          {t('Explore more', '发现更多')} <ArrowRight size={17} />
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon peach">
            <BookOpen size={23} />
          </span>
          <strong>
            {progress.discovered.length}
            <small> / {concepts.length}</small>
          </strong>
          <span>{t('words discovered', '个事物已认识')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon sage">
            <Leaf size={23} />
          </span>
          <strong>{practiced}</strong>
          <span>{t('words practiced correctly', '个事物已答对')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon lavender">
            <Flag size={23} />
          </span>
          <strong>{sessions}</strong>
          <span>{t('adventures completed', '次探索已完成')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon butter">
            <Sparkles size={23} />
          </span>
          <strong>
            {dayStreak(progress)}
            <small>{t(' days', ' 天')}</small>
          </strong>
          <span>{t('of recent exploring', '连续探索')}</span>
        </div>
      </div>
      <section className="progress-topics">
        <div className="section-heading">
          <div>
            <h2>{t('A little growth, everywhere', '每个主题，都有小进步')}</h2>
            <p>
              {t(
                'Discovered in a card or game. Practiced by finding the right answer.',
                '看卡片、玩游戏来认识事物，答对问题来完成练习。',
              )}
            </p>
          </div>
        </div>
        <div className="topic-progress-grid">
          {categories.map((category) => {
            const items = concepts.filter((concept) => concept.category === category.id);
            const found = items.filter((item) => progress.discovered.includes(item.id)).length;
            const done = items.filter((item) => progress.attempts[item.id]?.correct > 0).length;
            return (
              <div className="topic-progress-card" key={category.id}>
                <div className="topic-progress-icon" style={{ background: category.wash }}>
                  <img src={category.icon} alt="" />
                </div>
                <div>
                  <div className="topic-progress-title">
                    <strong>{localizeCategory(category).name}</strong>
                    <span>
                      {found}/{items.length}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      style={{
                        width: `${(found / items.length) * 100}%`,
                        background: category.color,
                      }}
                    />
                  </div>
                  <p>{t(`${done} practiced correctly`, `${done} 个已答对`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="badge-section">
        <div className="section-heading">
          <div>
            <h2>{t('Little moments to celebrate', '值得庆祝的小时刻')}</h2>
            <p>
              {t(
                'There’s no race. These will grow along with you.',
                '不用和别人比赛，徽章会陪你一起长大。',
              )}
            </p>
          </div>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <div
              className={`achievement ${progress.discovered.length >= badge.threshold ? 'achievement-unlocked' : ''}`}
              key={badge.name}
            >
              <div className="achievement-medal">
                <badge.icon size={29} />
              </div>
              <h3>{badge.name}</h3>
              <p>{badge.text}</p>
              <span>
                {progress.discovered.length >= badge.threshold
                  ? t('Discovered!', '已获得！')
                  : t('Still growing', '慢慢成长中')}
              </span>
            </div>
          ))}
        </div>
      </section>
      {recent.length > 0 ? (
        <section>
          <div className="section-heading">
            <h2>{t('Your latest discoveries', '最近的小发现')}</h2>
          </div>
          <div className="concept-grid highlight-grid">
            {recent.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} discovered onOpen={onOpen} />
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-discoveries">
          <img src="/art/fox-explorer.svg" alt="" />
          <div>
            <h2>{t('Your story starts with a little curiosity.', '带上好奇心，开始你的故事。')}</h2>
            <p>
              {t(
                'Pick a topic and tap a picture. Your discoveries will grow right here.',
                '选个主题，点点图片，你的小发现会在这里慢慢积累。',
              )}
            </p>
            <button className="button button-primary" onClick={onExplore}>
              {t('Find your first discovery', '寻找第一个发现')} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyActivity({ progress }: { progress: Progress }) {
  const { language, t } = useLanguage();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = localDate(date);
    return {
      key,
      label: date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }),
      words: progress.days[key]?.words.length ?? 0,
    };
  });
  return (
    <div
      className="weekly-chart"
      aria-label={t('Words practiced correctly over the last seven days', '最近七天答对的事物数量')}
    >
      {days.map((day) => (
        <div className="weekly-day" key={day.key}>
          <span>{day.words}</span>
          <div className="weekly-bar">
            <i
              style={{
                height: `${Math.max(3, Math.min(100, (day.words / Math.max(progress.dailyGoal, ...days.map((item) => item.words))) * 100))}%`,
              }}
            />
          </div>
          <span>{day.label}</span>
        </div>
      ))}
    </div>
  );
}
