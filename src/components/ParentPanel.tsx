import {
  Check,
  ChevronRight,
  Download,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  Volume2,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { concepts } from '../data/curriculum';
import type { AgeBand } from '../data/curriculum';
import type { Progress } from '../lib/progress';
import { WeeklyActivity } from './ProgressPage';
import { useLanguage } from '../lib/i18n';

export function ParentPanel({
  progress,
  onUpdate,
  offlineReady,
  onReset,
  storageWarning,
}: {
  progress: Progress;
  onUpdate: (patch: Partial<Progress>) => void;
  offlineReady: boolean;
  onReset: () => void;
  storageWarning: boolean;
}) {
  const { language, setLanguage, t } = useLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [challenge] = useState(() => ({
    a: 11 + Math.floor(Math.random() * 7),
    b: 7 + Math.floor(Math.random() * 7),
  }));
  const [resetConfirm, setResetConfirm] = useState(false);
  if (!unlocked)
    return (
      <div className="parent-gate">
        <span className="gate-icon">
          <LockKeyhole size={30} />
        </span>
        <span className="eyebrow">{t('A MOMENT FOR GROWN-UPS', '请家长来帮忙')}</span>
        <h2>{t('Parents’ corner', '家长专区')}</h2>
        <p>
          {t('Little settings for your little learner.', '为小小学习者调整设置。')}
          <br />
          {t('Please solve this to continue.', '请完成这道题后继续。')}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (Number(answer) === challenge.a + challenge.b && answer.trim()) {
              setUnlocked(true);
            } else {
              setError(true);
            }
          }}
        >
          <label htmlFor="parent-answer">
            {challenge.a} + {challenge.b} = ?
          </label>
          <input
            id="parent-answer"
            aria-label={t('Answer to parent check', '家长验证答案')}
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setError(false);
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            autoComplete="off"
            placeholder={t('Your answer', '请输入答案')}
          />
          {error && (
            <span className="form-error" role="alert">
              {t('That’s not quite right. Please try again.', '答案还不对，请再试一次。')}
            </span>
          )}
          <button className="button button-primary" type="submit">
            {t('Continue', '继续')} <ChevronRight size={18} />
          </button>
        </form>
        <span className="gate-footnote">
          {t(
            'A small gate for children, not a security password.',
            '这是供家长进入的小验证，并非安全密码。',
          )}
        </span>
      </div>
    );
  return (
    <div className="parent-settings">
      <span className="eyebrow">
        {t('A LITTLE GUIDANCE, A LOT OF GROWTH', '一点引导，陪伴成长')}
      </span>
      <h2>{t('Parents’ corner', '家长专区')}</h2>
      <p className="settings-intro">
        {t('Gentle learning, at your child’s own pace.', '轻松学习，尊重孩子自己的节奏。')}
      </p>
      <section className="settings-section">
        <h3>{t('Learning language', '学习语言')}</h3>
        <p>
          {t(
            'Switch the interface, words, clues, and audio together. Your progress stays with you.',
            '界面、认知内容、题目和语音一起切换，学习进度会保留。',
          )}
        </p>
        <div className="goal-options" role="radiogroup" aria-label={t('Language', '语言')}>
          {(['en', 'zh'] as const).map((option) => (
            <button
              type="button"
              role="radio"
              aria-checked={language === option}
              className={`filter-chip ${language === option ? 'active' : ''}`}
              key={option}
              onClick={() => setLanguage(option)}
            >
              {option === 'en' ? 'English' : '简体中文'}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h3>{t('Choose their learning stage', '选择学习阶段')}</h3>
        <p>
          {t(
            'Age is a guide. Pick the stage that feels right.',
            '年龄仅作参考，选择适合孩子的阶段。',
          )}
        </p>
        <div className="age-selector" role="radiogroup" aria-label={t('Learning age', '学习年龄')}>
          {(
            [
              {
                id: '3-4',
                name: t('Little listeners', '听听认认'),
                text: t('2 pictures · simple names', '2 张图片 · 简单名称'),
              },
              {
                id: '5-6',
                name: t('Curious explorers', '好奇探索'),
                text: t('4 pictures · descriptive clues', '4 张图片 · 描述提示'),
              },
              {
                id: '7-8',
                name: t('Big thinkers', '思考发现'),
                text: t('4 pictures · facts & connections', '4 张图片 · 知识与联系'),
              },
            ] as { id: AgeBand; name: string; text: string }[]
          ).map((age) => (
            <button
              type="button"
              role="radio"
              aria-checked={progress.ageBand === age.id}
              className={`age-option ${progress.ageBand === age.id ? 'age-selected' : ''}`}
              key={age.id}
              onClick={() => onUpdate({ ageBand: age.id })}
            >
              <span className="age-number">
                {age.id.replace('-', '–')} <small>{t('years', '岁')}</small>
              </span>
              <strong>{age.name}</strong>
              <span>{age.text}</span>
              {progress.ageBand === age.id && <Check size={16} />}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h3>{t('A gentle daily goal', '轻松的每日目标')}</h3>
        <p>
          {t(
            'Count different words practiced correctly, never minutes on a screen.',
            '按答对的不同事物计数，鼓励收获，不追求屏幕时长。',
          )}
        </p>
        <div
          className="goal-options"
          role="radiogroup"
          aria-label={t('Daily word goal', '每日认知目标')}
        >
          {[6, 12, 18].map((goal) => (
            <button
              type="button"
              role="radio"
              aria-checked={progress.dailyGoal === goal}
              className={`filter-chip ${progress.dailyGoal === goal ? 'active' : ''}`}
              key={goal}
              onClick={() => onUpdate({ dailyGoal: goal })}
            >
              {t(`${goal} words`, `${goal} 个事物`)}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section sound-setting">
        <div>
          <h3>
            <Volume2 size={18} /> {t('English audio', '中文语音')}
          </h3>
          <p>
            {t('Recorded words and clues, ready to listen to.', '点击即可播放名称和题目提示。')}
          </p>
        </div>
        <button
          className={`toggle ${progress.sound ? 'toggle-on' : ''}`}
          role="switch"
          aria-checked={progress.sound}
          aria-label={t('English audio', '中文语音')}
          onClick={() => onUpdate({ sound: !progress.sound })}
        >
          <span />
        </button>
      </section>
      <section className="settings-section">
        <h3>{t('This week’s little discoveries', '本周的小发现')}</h3>
        <WeeklyActivity progress={progress} />
      </section>
      <div className="parent-info">
        <ShieldCheck size={23} />
        <div>
          <strong>{t('Made for learning, made for privacy', '专注学习，保护隐私')}</strong>
          <p>
            {t(
              'No ads, accounts, microphones, or tracking. Progress stays in this browser on this device. iPad and phone progress are separate.',
              '没有广告，无需账号，不使用麦克风或追踪。学习进度保存在本设备的浏览器中，iPad 和手机分别记录。',
            )}
          </p>
          {storageWarning && (
            <p className="form-error">
              {t(
                'Your browser is blocking saved storage. Progress may be lost when you leave.',
                '浏览器阻止了本地保存，离开后可能无法保留进度或语言设置。',
              )}
            </p>
          )}
        </div>
      </div>
      <div className="parent-info">
        <WifiOff size={23} />
        <div>
          <strong>
            {offlineReady
              ? t('Ready for offline adventures', '离线探索已准备好')
              : t('Preparing offline adventures', '正在准备离线探索')}
          </strong>
          <p>
            {offlineReady
              ? t(
                  `All ${concepts.length} pictures, words, and practice clues are saved for offline use.`,
                  `全部 ${concepts.length} 个事物的图片、名称和练习提示已保存，可离线使用。`,
                )
              : t(
                  'The published app saves its pictures and audio after the first visit. Offline saving is not available in the development preview.',
                  '正式版本首次访问后会保存图片和语音。开发预览模式不提供离线保存。',
                )}
          </p>
        </div>
      </div>
      <div className="parent-info">
        <Download size={23} />
        <div>
          <strong>
            {t('Keep Little World on your home screen', '把 Little World 放到主屏幕')}
          </strong>
          <p>
            {t(
              'On iPad or iPhone: open in Safari, tap Share, then “Add to Home Screen”. On Android: open the browser menu and choose “Install app” or “Add to Home screen”.',
              'iPad 或 iPhone：在 Safari 中打开，点击分享，再选择“添加到主屏幕”。安卓手机：打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。',
            )}
          </p>
        </div>
      </div>
      <div className="reset-area">
        {resetConfirm ? (
          <>
            <p>
              {t(
                'Clear learning progress and reset the age, daily goal, and audio settings on this device? This cannot be undone.',
                '清除本设备的学习进度，并重置年龄、每日目标和语音设置？此操作无法撤销。',
              )}
            </p>
            <div>
              <button className="button button-secondary" onClick={() => setResetConfirm(false)}>
                {t('Keep our discoveries', '保留学习记录')}
              </button>
              <button
                className="button button-danger"
                onClick={() => {
                  onReset();
                  setResetConfirm(false);
                }}
              >
                {t('Clear local progress', '清除本地进度')}
              </button>
            </div>
          </>
        ) : (
          <button className="text-danger" onClick={() => setResetConfirm(true)}>
            <Trash2 size={15} /> {t('Reset this device’s progress', '重置本设备的学习进度')}
          </button>
        )}
      </div>
    </div>
  );
}
