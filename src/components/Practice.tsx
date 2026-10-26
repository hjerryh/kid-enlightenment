import {
  ArrowRight,
  Check,
  ChevronLeft,
  Heart,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { categories, concepts } from '../data/curriculum';
import type { AgeBand } from '../data/curriculum';
import { buildMatchingPairs, createQuestions, shuffle } from '../lib/learning';
import type { PracticeConfig, SessionResult } from '../types';
import { useLanguage } from '../lib/i18n';

type PracticeProps = {
  config: PracticeConfig;
  ageBand: AgeBand;
  onAnswer: (id: string, correct: boolean) => void;
  onFinish: (result: SessionResult) => void;
  onExit: () => void;
  onListen: (text: string) => void;
  onWord: (id: string) => void;
};

export function Practice(props: PracticeProps) {
  const { t } = useLanguage();
  return (
    <div className="practice-shell">
      <header className="practice-header">
        <button className="back-link" onClick={props.onExit}>
          <ChevronLeft size={20} /> {t('Back to exploring', '返回探索')}
        </button>
        <a
          className="brand practice-brand"
          aria-label={t('Little World home', 'Little World 首页')}
          href="#"
          onClick={(event) => {
            event.preventDefault();
            props.onExit();
          }}
        >
          <img src="/icon.svg" alt="" />
          <span>
            little<span className="brand-light">world</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <span className="level-badge">
          {t(`Ages ${props.ageBand.replace('-', '–')}`, `${props.ageBand.replace('-', '–')} 岁`)}
        </span>
      </header>
      {props.config.kind === 'quiz' ? <Quiz {...props} /> : <Matching {...props} />}
    </div>
  );
}

function Quiz({ config, ageBand, onAnswer, onFinish, onListen }: PracticeProps) {
  const { language, t, localizeConcept, localizeCategory } = useLanguage();
  const [questions] = useState(() => {
    if (config.reviewIds?.length)
      return createQuestions(
        config.categoryId,
        ageBand,
        concepts.length,
        language,
        config.poolIds,
      ).filter((question) => config.reviewIds!.includes(question.answerId));
    return createQuestions(config.categoryId, ageBand, 6, language, config.poolIds);
  });
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const question = questions[index];
  const nextButton = useRef<HTMLButtonElement>(null);
  const listenRef = useRef(onListen);
  listenRef.current = onListen;
  useEffect(() => {
    if (question) listenRef.current(question.audioText);
  }, [question]);
  useEffect(() => {
    if (solved) nextButton.current?.focus();
  }, [solved]);
  if (!question)
    return (
      <div className="empty-state">
        <h1>{t('You’re all caught up!', '已经全部复习好啦！')}</h1>
        <p>{t('Let’s explore something new.', '再去找找新发现吧。')}</p>
      </div>
    );
  const category = localizeCategory(
    categories.find(
      (item) => item.id === concepts.find((item) => item.id === question.answerId)!.category,
    )!,
  );

  function choose(id: string) {
    if (solved || wrongIds.includes(id)) return;
    const correct = id === question.answerId;
    onAnswer(question.answerId, correct);
    if (correct) {
      setSolved(true);
      if (!wrongIds.length) setFirstTry((value) => value + 1);
    } else {
      setWrongIds((ids) => [...ids, id]);
      setReviewIds((ids) => [...new Set([...ids, question.answerId])]);
    }
  }
  function next() {
    if (index === questions.length - 1) {
      onFinish({ config, total: questions.length, firstTry, reviewIds });
      return;
    }
    setIndex((value) => value + 1);
    setSolved(false);
    setWrongIds([]);
  }
  return (
    <main className="quiz-content">
      <div className="session-progress">
        <span>{t('Listen & find', '听音找图')}</span>
        <div className="progress-track">
          <div style={{ width: `${((index + Number(solved)) / questions.length) * 100}%` }} />
        </div>
        <strong>
          {index + 1} <span>/ {questions.length}</span>
        </strong>
      </div>
      <div className="question-heading">
        <span className="pill" style={{ background: category.wash, color: category.color }}>
          {category.name}
        </span>
        <h1>{question.prompt}</h1>
        <button className="listen-button" onClick={() => onListen(question.audioText)}>
          <Volume2 size={23} /> {t('Listen again', '再听一次')}
        </button>
        <p>{t('Tap the picture that matches.', '点出符合提示的图片。')}</p>
      </div>
      <div className={`answer-grid ${question.optionIds.length === 2 ? 'two-options' : ''}`}>
        {question.optionIds.map((id) => {
          const concept = localizeConcept(concepts.find((item) => item.id === id)!);
          const isCorrect = solved && id === question.answerId;
          const isWrong = wrongIds.includes(id);
          return (
            <button
              key={question.id + id}
              className={`answer-card ${concept.category === 'numbers' ? 'number-answer-card' : ''} ${isCorrect ? 'answer-correct' : ''} ${isWrong ? 'answer-wrong' : ''}`}
              onClick={() => choose(id)}
              disabled={solved || isWrong}
              aria-label={t(`Choose ${concept.word}`, `选择${concept.word}`)}
            >
              <img src={concept.art} alt={concept.word} />
              <span className="answer-check">
                {isCorrect ? <Check size={23} /> : isWrong ? <RotateCcw size={20} /> : null}
              </span>
              {solved && <span className="answer-reveal">{concept.word}</span>}
            </button>
          );
        })}
      </div>
      <div
        className={`answer-feedback ${solved ? 'feedback-success' : wrongIds.length ? 'feedback-retry' : ''}`}
        aria-live="polite"
      >
        {solved ? (
          <>
            <div>
              <span className="feedback-icon">
                <Check size={22} />
              </span>
              <div>
                <strong>
                  {wrongIds.length
                    ? t('You found it. Nicely done!', '找到了，做得真棒！')
                    : t('That’s it. Wonderful!', '答对啦，真棒！')}
                </strong>
                <p>{t('One more little discovery.', '又收获了一个小发现。')}</p>
              </div>
            </div>
            <button ref={nextButton} className="button button-primary" onClick={next}>
              {index === questions.length - 1
                ? t('Finish adventure', '完成探索')
                : t('Next discovery', '下一个发现')}{' '}
              <ArrowRight size={18} />
            </button>
          </>
        ) : wrongIds.length ? (
          <>
            <div>
              <span className="feedback-icon">
                <Heart size={21} />
              </span>
              <div>
                <strong>{t('A good try. Let’s try again.', '勇敢尝试，再来一次吧。')}</strong>
                <p>
                  {t(
                    'Listen to the clue and pick another picture.',
                    '再听听提示，换一张图片试试。',
                  )}
                </p>
              </div>
            </div>
            <button
              className="button button-secondary"
              onClick={() => onListen(question.audioText)}
            >
              <Volume2 size={18} /> {t('Hear the clue', '听听提示')}
            </button>
          </>
        ) : (
          <span className="session-kind-note">
            <Sparkles size={17} />{' '}
            {t('Take your time. Curiosity is the important part.', '慢慢来，带着好奇心就很棒。')}
          </span>
        )}
      </div>
    </main>
  );
}

function Matching({ config, ageBand, onAnswer, onFinish, onWord }: PracticeProps) {
  const { language, t } = useLanguage();
  const [pairs] = useState(() =>
    buildMatchingPairs(config.categoryId, ageBand, language, config.poolIds),
  );
  const [right] = useState(() => shuffle(pairs));
  const [selected, setSelected] = useState<{ side: 'left' | 'right'; id: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [review, setReview] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const done = matched.length === pairs.length;
  function pick(side: 'left' | 'right', id: string) {
    if (matched.includes(id) || wrong.length) return;
    onWord(id);
    if (selected?.side === side && selected.id === id) {
      setSelected(null);
      return;
    }
    if (!selected || selected.side === side) {
      setSelected({ side, id });
      return;
    }
    if (selected.id === id) {
      setMatched((ids) => [...ids, id]);
      setSelected(null);
      onAnswer(id, true);
    } else {
      onAnswer(selected.id, false);
      setReview((ids) => [...new Set([...ids, selected.id])]);
      setWrong([`${selected.side}-${selected.id}`, `${side}-${id}`]);
      timer.current = setTimeout(() => {
        setWrong([]);
        setSelected(null);
      }, 850);
    }
  }
  return (
    <main className="matching-content">
      <div className="session-progress">
        <span>{t('Perfect pairs', '快乐配对')}</span>
        <div className="progress-track">
          <div style={{ width: `${(matched.length / pairs.length) * 100}%` }} />
        </div>
        <strong>
          {matched.length} <span>/ {pairs.length}</span>
        </strong>
      </div>
      <div className="question-heading">
        <span className="pill lavender-pill">
          {t('A MATCH MADE IN LITTLE WORLD', '给小伙伴找朋友')}
        </span>
        <h1>
          {done
            ? t('Every pair found its friend!', '每个小伙伴都找到朋友啦！')
            : t('Some things belong together.', '帮它们找到好朋友吧。')}
        </h1>
        <p>
          {ageBand === '3-4'
            ? t('Tap two pictures of the same thing.', '点出两张相同的图片。')
            : t(
                'Tap a picture, then its word. Tap a word to hear it.',
                '先点图片，再点对应的名称。点点文字可以听读音。',
              )}
        </p>
      </div>
      <div className="matching-board">
        {(['left', 'right'] as const).map((side) => (
          <div className="match-column" key={side}>
            {(side === 'left' ? pairs : right).map((pair) => {
              const isMatched = matched.includes(pair.id);
              return (
                <button
                  key={`${side}-${pair.id}`}
                  className={`match-card ${selected?.side === side && selected.id === pair.id ? 'match-selected' : ''} ${isMatched ? 'match-complete' : ''} ${wrong.includes(`${side}-${pair.id}`) ? 'match-wrong' : ''}`}
                  disabled={isMatched || Boolean(wrong.length)}
                  onClick={() => pick(side, pair.id)}
                  aria-label={t(
                    `${side === 'left' ? 'Picture' : ageBand === '3-4' ? 'Matching picture' : 'Word'}: ${pair.word}`,
                    `${side === 'left' ? '图片' : ageBand === '3-4' ? '配对图片' : '词语'}：${pair.word}`,
                  )}
                >
                  {side === 'left' || ageBand === '3-4' ? (
                    <img src={pair.art} alt={pair.word} />
                  ) : (
                    <>
                      <span className="match-word">{pair.word}</span>
                      <Volume2 size={21} />
                    </>
                  )}
                  {isMatched && (
                    <span className="pair-check">
                      <Check size={18} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className={`answer-feedback ${done ? 'feedback-success' : ''}`} aria-live="polite">
        {done ? (
          <>
            <div>
              <span className="feedback-icon">
                <Check size={22} />
              </span>
              <div>
                <strong>{t('Look at all those happy pairs!', '看看这些快乐的好朋友！')}</strong>
                <p>{t('Little connections, big learning.', '小小配对，满满收获。')}</p>
              </div>
            </div>
            <button
              className="button button-primary"
              onClick={() =>
                onFinish({
                  config,
                  total: pairs.length,
                  firstTry: pairs.length - review.length,
                  reviewIds: review,
                })
              }
            >
              {t('Finish adventure', '完成探索')} <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <span className="session-kind-note">
            {wrong.length ? (
              <>
                <Heart size={17} />{' '}
                {t(
                  'Almost! Let’s listen and try a different pair.',
                  '就快找到啦！听一听，换一对试试。',
                )}
              </>
            ) : (
              <>
                <Sparkles size={17} />{' '}
                {matched.length
                  ? t(
                      'Lovely. Keep finding those little connections.',
                      '真棒，继续帮它们找朋友吧。',
                    )
                  : t('Tap to listen. There’s no hurry.', '点一点，听一听，不用着急。')}
              </>
            )}
          </span>
        )}
      </div>
    </main>
  );
}

export function Celebration({
  result,
  onAgain,
  onReview,
  onExplore,
}: {
  result: SessionResult;
  onAgain: () => void;
  onReview: () => void;
  onExplore: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="celebration page-enter">
      <button
        className="icon-button celebration-close"
        aria-label={t('Back to exploring', '返回探索')}
        onClick={onExplore}
      >
        <X size={23} />
      </button>
      <div className="celebration-art">
        <span className="celebration-spark c-spark-one">✦</span>
        <span className="celebration-spark c-spark-two">✦</span>
        <span className="celebration-spark c-spark-three">✧</span>
        <img
          src="/art/fox-explorer.svg"
          alt={t('Pip celebrating your discoveries', 'Pip 正在庆祝你的新发现')}
        />
      </div>
      <span className="eyebrow">{t('A LITTLE ADVENTURE, COMPLETED', '一次小探索，圆满完成')}</span>
      <h1>{t('Look how you’ve grown!', '看看你的新收获！')}</h1>
      <p>
        {t(
          `You explored ${result.total} ${result.config.kind === 'match' ? 'happy pairs' : 'little discoveries'}. Pip is proud of your curiosity.`,
          `你完成了 ${result.total} ${result.config.kind === 'match' ? '组快乐配对' : '个小发现'}。Pip 为你的好奇心感到骄傲。`,
        )}
      </p>
      <div className="celebration-stats">
        <div>
          <strong>{result.total}</strong>
          <span>{t('discoveries practiced', '个发现已练习')}</span>
        </div>
        <div>
          <strong>{result.firstTry}</strong>
          <span>{t('found on your first try', '次一试就答对')}</span>
        </div>
      </div>
      <div className="celebration-actions">
        <button className="button button-primary" onClick={onExplore}>
          {t('Keep exploring', '继续探索')} <ArrowRight size={18} />
        </button>
        {result.reviewIds.length > 0 ? (
          <button className="button button-secondary" onClick={onReview}>
            <RotateCcw size={17} />{' '}
            {t(
              `Revisit ${result.reviewIds.length} ${result.reviewIds.length === 1 ? 'discovery' : 'discoveries'}`,
              `复习 ${result.reviewIds.length} 个发现`,
            )}
          </button>
        ) : (
          <button className="button button-secondary" onClick={onAgain}>
            <RotateCcw size={17} /> {t('Play again', '再玩一次')}
          </button>
        )}
      </div>
      <span className="session-kind-note">
        <Heart size={15} />{' '}
        {t('A little break is a lovely idea, too.', '休息一会儿，也是个好主意。')}
      </span>
    </div>
  );
}
