import { ArrowRight, AudioLines, Layers3, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { categories } from '../data/curriculum';
import type { AgeBand, CategoryId } from '../data/curriculum';
import type { PracticeConfig } from '../types';
import { useLanguage } from '../lib/i18n';
import { animalIdsByGroup } from '../data/animals';
import { AnimalGroupFilter } from './AnimalGroupFilter';
import type { AnimalGroupSelection } from './AnimalGroupFilter';

export function PlayPage({
  ageBand,
  onStart,
}: {
  ageBand: AgeBand;
  onStart: (config: PracticeConfig) => void;
}) {
  const { t, localizeCategory } = useLanguage();
  const [topic, setTopic] = useState<CategoryId | 'all'>('all');
  const [animalGroup, setAnimalGroup] = useState<AnimalGroupSelection>('all');
  const poolIds =
    topic === 'animals' && animalGroup !== 'all' ? animalIdsByGroup[animalGroup] : undefined;
  function chooseTopic(category: CategoryId | 'all') {
    setTopic(category);
    setAnimalGroup('all');
  }
  return (
    <div className="page-enter">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} /> {t('A LITTLE PLAY, A LOT OF LEARNING', '开心玩一玩，学会新发现')}
          </div>
          <h1>{t('Ready, set, discover.', '准备好，出发探索！')}</h1>
          <p className="page-description">
            {t(
              'Small games for growing minds. There’s no hurry here.',
              '小游戏陪伴成长，慢慢来就好。',
            )}
          </p>
        </div>
        <span className="level-badge">
          {t(`Ages ${ageBand.replace('-', '–')}`, `${ageBand.replace('-', '–')} 岁`)}
        </span>
      </div>
      <div className="section-heading">
        <h2>{t('First, pick your adventure', '先选一个喜欢的主题')}</h2>
      </div>
      <div className="filter-row game-filters">
        <button
          className={`filter-chip ${topic === 'all' ? 'active' : ''}`}
          onClick={() => chooseTopic('all')}
        >
          {t('A bit of everything', '每样都试试')}
        </button>
        {categories.map((category) => (
          <button
            className={`filter-chip ${topic === category.id ? 'active' : ''}`}
            key={category.id}
            onClick={() => chooseTopic(category.id)}
          >
            {localizeCategory(category).name}
          </button>
        ))}
      </div>
      {topic === 'animals' && (
        <AnimalGroupFilter selected={animalGroup} onChange={setAnimalGroup} />
      )}
      <div className="game-grid">
        <section className="game-card listen-game">
          <div className="game-art">
            <span className="game-orbit orbit-one" />
            <span className="game-orbit orbit-two" />
            <img src="/art/apple.svg" alt="" />
            <span className="game-art-bubble">
              <AudioLines size={40} />
            </span>
            <img className="small-game-art" src="/art/pear.svg" alt="" />
          </div>
          <div className="game-card-copy">
            <span className="eyebrow">
              {t('LISTEN · THINK · DISCOVER', '听一听 · 想一想 · 找一找')}
            </span>
            <h2>{t('Listen & find', '听音找图')}</h2>
            <p>
              {t(
                'Listen to Pip’s clue, then tap the matching picture. Every try is a chance to learn.',
                '听听 Pip 的提示，点出对应的图片。每次尝试都是学习的机会。',
              )}
            </p>
            <div className="game-details">
              <span>
                {ageBand === '3-4'
                  ? t('2 picture choices', '2 张图片选一选')
                  : t('4 picture choices', '4 张图片选一选')}
              </span>
              <span>{t('6 little questions', '6 道小问题')}</span>
            </div>
            <button
              className="button button-primary"
              onClick={() => onStart({ kind: 'quiz', categoryId: topic, poolIds })}
            >
              {t('Let’s listen', '开始听一听')} <ArrowRight size={18} />
            </button>
          </div>
        </section>
        <section className="game-card match-game">
          <div className="game-art">
            <span className="sample-match match-one">
              <img src="/art/rabbit.svg" alt="" />
            </span>
            <span className="sample-match match-two">
              {ageBand === '3-4' ? (
                <img src="/art/rabbit.svg" alt="" />
              ) : (
                <>
                  <Layers3 size={29} />
                  <span>{t('Rabbit', '兔子')}</span>
                </>
              )}
            </span>
            <span className="mini-spark">✦</span>
          </div>
          <div className="game-card-copy">
            <span className="eyebrow">
              {t('NOTICE · MATCH · REMEMBER', '看一看 · 配一配 · 记一记')}
            </span>
            <h2>{t('Perfect pairs', '快乐配对')}</h2>
            <p>
              {ageBand === '3-4'
                ? t(
                    'Find two pictures of the same thing. Tap, listen, and bring each pair together.',
                    '找出两张相同的图片。点一点、听一听，让它们成为好朋友。',
                  )
                : t(
                    'Match each picture with its English word. Tap a word to hear what it says.',
                    '把图片和对应的中文名称配在一起。点点文字，就能听到读音。',
                  )}
            </p>
            <div className="game-details">
              <span>
                {ageBand === '3-4'
                  ? t('3 happy pairs', '3 组快乐配对')
                  : t('4 happy pairs', '4 组快乐配对')}
              </span>
              <span>{t('Take your time', '按自己的节奏来')}</span>
            </div>
            <button
              className="button button-dark"
              onClick={() => onStart({ kind: 'match', categoryId: topic, poolIds })}
            >
              {t('Let’s match', '开始配一配')} <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
      <div className="play-footer">
        <img src="/art/fox-explorer.svg" alt={t('Pip the fox', '小狐狸 Pip')} />
        <div>
          <h3>{t('“We learn by trying!”', '“试一试，就会有收获！”')}</h3>
          <p>
            {t(
              'No timer. No losing. Just another little discovery.',
              '不用计时，不怕答错，每一步都有小发现。',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
