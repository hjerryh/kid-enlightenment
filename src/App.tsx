import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Gamepad2,
  Heart,
  Leaf,
  LockKeyhole,
  Sparkles,
  Sprout,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { categories, concepts } from './data/curriculum';
import type { Concept } from './data/curriculum';
import { playSpeech, playWord, setAudioEnabled, stopAudio } from './lib/audio';
import { useLanguage } from './lib/i18n';
import {
  freshProgress,
  localDate,
  parseProgress,
  recordAnswer,
  recordDiscovery,
  recordSession,
  STORAGE_KEY,
} from './lib/progress';
import type { Progress } from './lib/progress';
import type { Page, PracticeConfig, SessionResult } from './types';
import { Explore } from './components/Explore';
import { PlayPage } from './components/PlayPage';
import { ProgressPage } from './components/ProgressPage';
import { Modal } from './components/Modal';
import { ParentPanel } from './components/ParentPanel';
import { Celebration, Practice } from './components/Practice';

function loadProgress() {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    return freshProgress();
  }
}

const navigation = [
  { id: 'explore' as const, label: 'Explore', chinese: '探索世界', icon: Compass },
  { id: 'play' as const, label: 'Play & learn', chinese: '玩中学', icon: Gamepad2 },
  { id: 'progress' as const, label: 'My discoveries', chinese: '我的发现', icon: Sprout },
];

export default function App() {
  const { language, setLanguage, t, localizeConcept, localizeCategory, languageStorageWarning } =
    useLanguage();
  const [progress, setProgress] = useState(loadProgress);
  const [page, setPage] = useState<Page>('explore');
  const [selectedConcept, setConcept] = useState<Concept | null>(null);
  const [conceptPoolIds, setConceptPoolIds] = useState<readonly string[] | undefined>();
  const concept = selectedConcept ? localizeConcept(selectedConcept) : null;
  const [showParent, setShowParent] = useState(false);
  const [practice, setPractice] = useState<PracticeConfig | null>(null);
  const [practiceKey, setPracticeKey] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [today, setToday] = useState(localDate);
  const audioRun = useRef(0);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todayCount = progress.days[today]?.words.length ?? 0;
  const goalPercent = Math.min(100, (todayCount / progress.dailyGoal) * 100);
  const notify = useCallback((message: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(message);
    toastTimeout.current = setTimeout(() => setToast(''), 5000);
  }, []);
  useEffect(
    () => () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      stopAudio();
    },
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageWarning(true);
    }
  }, [progress]);
  useEffect(() => {
    setAudioEnabled(progress.sound);
    if (!progress.sound) setPlayingId(null);
  }, [progress.sound]);
  useEffect(() => {
    audioRun.current += 1;
    setPlayingId(null);
    setToast('');
  }, [language]);
  useEffect(() => {
    const timer = setInterval(() => setToday(localDate()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator)
      navigator.serviceWorker.ready
        .then(() => setOfflineReady(true))
        .catch(() => setOfflineReady(false));
    const failure = () => setOfflineReady(false);
    window.addEventListener('offline-unavailable', failure);
    return () => window.removeEventListener('offline-unavailable', failure);
  }, []);
  const listenWord = useCallback(
    (id: string) => {
      if (!progress.sound) {
        notify(
          t(
            'Sound is off. Turn it on to hear English audio.',
            '声音已关闭。打开声音就能听中文朗读。',
          ),
        );
        return;
      }
      const run = ++audioRun.current;
      setPlayingId(id);
      playWord(id, language)
        .catch(() =>
          notify(
            t(
              'Audio could not play. Tap the speaker to try again.',
              '暂时无法播放。点一下小喇叭再试试。',
            ),
          ),
        )
        .finally(() => {
          if (audioRun.current === run) setPlayingId(null);
        });
    },
    [notify, progress.sound, language, t],
  );
  const listenText = useCallback(
    (text: string) => {
      if (!progress.sound) {
        notify(t('Sound is off. Turn it on to hear the clue.', '声音已关闭。打开声音就能听线索。'));
        return;
      }
      playSpeech(text, language).catch(() =>
        notify(
          t('Audio could not play. Tap “Listen again” to try.', '暂时无法播放。点“再听一遍”试试。'),
        ),
      );
    },
    [notify, progress.sound, language, t],
  );
  const openConcept = (item: Concept, poolIds?: readonly string[]) => {
    setConcept(item);
    setConceptPoolIds(poolIds);
    setProgress((previous) => recordDiscovery(previous, item.id));
    listenWord(item.id);
  };
  function navigate(next: Page) {
    stopAudio();
    setPage(next);
    setResult(null);
    window.scrollTo({ top: 0 });
  }
  function startPractice(config: PracticeConfig) {
    stopAudio();
    setConcept(null);
    setResult(null);
    setPractice(config);
    setPracticeKey((key) => key + 1);
    window.scrollTo({ top: 0 });
  }
  function finishPractice(nextResult: SessionResult) {
    stopAudio();
    setPractice(null);
    setResult(nextResult);
    setProgress((previous) => recordSession(previous));
    if (progress.sound) playWord('well-done', language).catch(() => {});
    window.scrollTo({ top: 0 });
  }
  const updateSettings = (patch: Partial<Progress>) =>
    setProgress((previous) => ({ ...previous, ...patch }));
  const closeConcept = () => {
    stopAudio();
    setPlayingId(null);
    setConcept(null);
  };
  const navItems = navigation.map((item) => (
    <button
      key={item.id}
      className={`nav-link ${page === item.id && !result ? 'nav-active' : ''}`}
      onClick={() => navigate(item.id)}
      aria-current={page === item.id && !result ? 'page' : undefined}
    >
      <item.icon size={21} strokeWidth={1.8} />
      <span>{t(item.label, item.chinese)}</span>
      {page === item.id && !result && <i />}
    </button>
  ));

  return (
    <>
      {practice ? (
        <Practice
          key={`${practiceKey}-${language}`}
          config={practice}
          ageBand={progress.ageBand}
          onAnswer={(id, correct) => setProgress((previous) => recordAnswer(previous, id, correct))}
          onFinish={finishPractice}
          onExit={() => setLeaveConfirm(true)}
          onListen={listenText}
          onWord={listenWord}
        />
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <button
              className="brand"
              onClick={() => navigate('explore')}
              aria-label={t('Little World home', 'Little World 首页')}
            >
              <img src="/icon.svg" alt="" />
              <span>
                little<span className="brand-light">world</span>
                <span className="brand-dot">.</span>
              </span>
            </button>
            <div className="sidebar-tagline">
              {t('A little place to grow.', '在小小世界里，慢慢长大。')}
            </div>
            <span className="nav-label">{t('YOUR LITTLE WORLD', '你的小小世界')}</span>
            <nav aria-label={t('Main navigation', '主导航')}>{navItems}</nav>
            <div className="sidebar-bottom">
              <div className="daily-goal">
                <span className="goal-flower">
                  <Sparkles size={23} />
                </span>
                <div className="daily-goal-heading">
                  <strong>{t('A little every day', '每天发现一点点')}</strong>
                  <span>
                    {todayCount >= progress.dailyGoal
                      ? t('Today’s goal, all grown!', '今天的小目标完成啦！')
                      : t('Small steps. Happy discoveries.', '小小脚步，快乐发现。')}
                  </span>
                </div>
                <div className="goal-line">
                  <span>{t('Today’s little goal', '今天的小目标')}</span>
                  <strong>
                    {todayCount}
                    <span> / {progress.dailyGoal}</span>
                  </strong>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${goalPercent}%` }} />
                </div>
                <span className="goal-note">
                  {todayCount >= progress.dailyGoal
                    ? t('A lovely moment to take a break.', '休息一下，也很棒。')
                    : t('words practiced correctly', '个词语已答对')}
                </span>
              </div>
              <button className="parent-link" onClick={() => setShowParent(true)}>
                <LockKeyhole size={17} /> {t('Parents’ corner', '家长专区')}{' '}
                <ArrowRight size={15} />
              </button>
              <div className="sidebar-footnote">
                <Heart size={12} /> {t('Made for little minds.', '为好奇的小脑袋而做。')}
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="topbar-context">
                <span className="context-leaf">
                  <Leaf size={17} />
                </span>
                <span>{t('LET CURIOSITY GROW', '让好奇心慢慢发芽')}</span>
              </div>
              <button
                className="mobile-brand brand"
                onClick={() => navigate('explore')}
                aria-label={t('Little World home', 'Little World 首页')}
              >
                <img src="/icon.svg" alt="" />
                <span>
                  little<span className="brand-light">world</span>
                  <span className="brand-dot">.</span>
                </span>
              </button>
              <div className="topbar-actions">
                <div
                  className="language-switch"
                  role="group"
                  aria-label={t('App language', '应用语言')}
                >
                  <button
                    type="button"
                    lang="zh-CN"
                    aria-pressed={language === 'zh'}
                    onClick={() => setLanguage('zh')}
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    lang="en"
                    aria-pressed={language === 'en'}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </button>
                </div>
                <button
                  className="sound-toggle"
                  onClick={() => updateSettings({ sound: !progress.sound })}
                  aria-label={
                    progress.sound
                      ? t('Turn sound off', '关闭声音')
                      : t('Turn sound on', '打开声音')
                  }
                  aria-pressed={progress.sound}
                >
                  {progress.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span>
                    {progress.sound ? t('Sound on', '声音开启') : t('Sound off', '声音关闭')}
                  </span>
                </button>
                <span className="topbar-divider" />
                <button
                  className="learner-profile"
                  aria-label={t(
                    `Learning stage: ages ${progress.ageBand.replace('-', ' to ')}. Open parents’ corner`,
                    `学习阶段：${progress.ageBand.replace('-', '至')}岁。打开家长专区`,
                  )}
                  onClick={() => setShowParent(true)}
                >
                  <span className="profile-avatar">
                    <img src="/icon.svg" alt="" />
                  </span>
                  <span>
                    {t('Little explorer', '小小探索家')}
                    <small>
                      {t(
                        `Ages ${progress.ageBand.replace('-', '–')}`,
                        `${progress.ageBand.replace('-', '–')} 岁`,
                      )}
                    </small>
                  </span>
                </button>
              </div>
            </header>
            <main className="main-content" id="main-content">
              {result ? (
                <Celebration
                  result={result}
                  onExplore={() => navigate('explore')}
                  onAgain={() => startPractice(result.config)}
                  onReview={() =>
                    startPractice({
                      kind: 'quiz',
                      categoryId: result.config.categoryId,
                      poolIds: result.config.poolIds,
                      reviewIds: result.reviewIds,
                    })
                  }
                />
              ) : page === 'explore' ? (
                <Explore progress={progress} onOpen={openConcept} onStart={startPractice} />
              ) : page === 'play' ? (
                <PlayPage ageBand={progress.ageBand} onStart={startPractice} />
              ) : (
                <ProgressPage
                  progress={progress}
                  onExplore={() => navigate('explore')}
                  onOpen={openConcept}
                />
              )}
              <footer className="main-footer">
                <span>
                  <Sprout size={14} /> {t('Big discoveries, little steps.', '小小脚步，大大发现。')}
                </span>
                <span>
                  {t(
                    'Made for ages 3–8 · No ads. Just wonder.',
                    '适合 3–8 岁 · 没有广告，只有好奇。',
                  )}
                </span>
              </footer>
            </main>
          </div>
          <nav className="mobile-nav" aria-label={t('Mobile navigation', '手机导航')}>
            {navItems}
            <button className="nav-link" onClick={() => setShowParent(true)}>
              <LockKeyhole size={20} />
              <span>{t('Parents', '家长')}</span>
            </button>
          </nav>
        </div>
      )}
      {concept && (
        <Modal
          onClose={closeConcept}
          label={t(`${concept.word} discovery`, `认识${concept.word}`)}
          className="concept-modal"
        >
          <div
            className="detail-art"
            style={{ background: categories.find((item) => item.id === concept.category)!.wash }}
          >
            <span className="pill detail-topic">
              {localizeCategory(categories.find((item) => item.id === concept.category)!).name}
            </span>
            <img src={concept.art} alt={concept.word} />
            <span className="detail-spark" aria-hidden="true">
              ✧
            </span>
          </div>
          <div className="detail-copy">
            <div className="detail-title">
              <h2>{concept.word}</h2>
              <button
                className={`word-speaker ${playingId === concept.id ? 'is-playing' : ''}`}
                onClick={() => listenWord(concept.id)}
                aria-label={t(`Listen to ${concept.word}`, `听一听${concept.word}`)}
              >
                <Volume2 size={26} />
              </button>
            </div>
            <p>{concept.description}</p>
            {progress.ageBand === '7-8' && (
              <div className="did-you-know">
                <Sparkles size={18} />
                <span>{concept.fact}</span>
              </div>
            )}
            <span className="detail-status" aria-live="polite">
              {playingId === concept.id ? (
                <>
                  <Volume2 size={14} /> {t('Listening…', '听一听……')}
                </>
              ) : (
                <>
                  <Check size={14} /> {t('A new connection, made.', '又认识了一位新朋友。')}
                </>
              )}
            </span>
            <div className="detail-controls">
              <button
                className="button button-secondary"
                aria-label={t('Previous discovery', '上一个发现')}
                onClick={() => {
                  const siblings = concepts.filter(
                    (item) =>
                      item.category === concept.category &&
                      (!conceptPoolIds || conceptPoolIds.includes(item.id)),
                  );
                  const index = siblings.findIndex((item) => item.id === concept.id);
                  openConcept(
                    siblings[(index - 1 + siblings.length) % siblings.length],
                    conceptPoolIds,
                  );
                }}
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  const siblings = concepts.filter(
                    (item) =>
                      item.category === concept.category &&
                      (!conceptPoolIds || conceptPoolIds.includes(item.id)),
                  );
                  const index = siblings.findIndex((item) => item.id === concept.id);
                  openConcept(siblings[(index + 1) % siblings.length], conceptPoolIds);
                }}
              >
                {t('Next discovery', '下一个发现')} <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showParent && (
        <Modal
          onClose={() => setShowParent(false)}
          label={t('Parents’ corner', '家长专区')}
          className="parent-modal"
        >
          <ParentPanel
            progress={progress}
            onUpdate={updateSettings}
            offlineReady={offlineReady}
            storageWarning={storageWarning || languageStorageWarning}
            onReset={() => {
              setProgress(freshProgress());
              notify(
                t(
                  'This device’s progress has been cleared. A fresh little start.',
                  '这台设备的学习进度已清空。一起重新出发吧。',
                ),
              );
            }}
          />
        </Modal>
      )}
      {leaveConfirm && (
        <Modal
          label={t('Leave adventure', '离开探索')}
          onClose={() => setLeaveConfirm(false)}
          className="leave-modal"
        >
          <span className="gate-icon">
            <Leaf size={29} />
          </span>
          <h2>{t('A little break?', '休息一下吗？')}</h2>
          <p>
            {storageWarning
              ? t(
                  'Your browser cannot save progress. Your discoveries will stay here for this visit.',
                  '浏览器暂时无法保存进度。本次打开期间，发现记录仍会保留。',
                )
              : t(
                  'Your discoveries so far are saved. You can start a new adventure whenever you’re ready.',
                  '你的发现已经保存好啦。准备好后，随时可以开始新的探索。',
                )}
          </p>
          <div className="leave-actions">
            <button className="button button-primary" onClick={() => setLeaveConfirm(false)}>
              {t('Keep playing', '继续玩')} <ArrowRight size={16} />
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                stopAudio();
                setPractice(null);
                setLeaveConfirm(false);
              }}
            >
              {storageWarning ? t('Leave adventure', '离开探索') : t('Save & leave', '保存并离开')}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button aria-label={t('Dismiss notification', '关闭提示')} onClick={() => setToast('')}>
            <X size={17} />
          </button>
        </div>
      )}
    </>
  );
}
