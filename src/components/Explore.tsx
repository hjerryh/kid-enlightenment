import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  Compass,
  Headphones,
  Play,
  Search,
  Sparkles,
  Sprout,
  Volume2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { categories, concepts } from '../data/curriculum';
import { animalGroups, animalIdsByGroup, animalGroupById } from '../data/animals';
import { AnimalGroupFilter } from './AnimalGroupFilter';
import type { CategoryId, Concept } from '../data/curriculum';
import type { Progress } from '../lib/progress';
import type { PracticeConfig } from '../types';
import { useLanguage } from '../lib/i18n';
import {
  localizeConcept as conceptInLanguage,
  localizeCategory as categoryInLanguage,
} from '../data/localization';

const highlights = ['apple', 'rabbit', 'three', 'star'];
const artGroups: Record<CategoryId, string[]> = {
  fruits: ['apple', 'banana', 'orange'],
  animals: ['rabbit', 'lion', 'elephant'],
  colors: ['red', 'yellow', 'blue'],
  numbers: ['one', 'two', 'three'],
  shapes: ['circle', 'triangle', 'square'],
  everyday: ['sun', 'tree', 'house'],
};

export function ConceptCard({
  concept: originalConcept,
  discovered,
  onOpen,
}: {
  concept: Concept;
  discovered: boolean;
  onOpen: (concept: Concept) => void;
}) {
  const { t, localizeConcept, localizeCategory } = useLanguage();
  const concept = localizeConcept(originalConcept);
  const category = localizeCategory(categories.find((item) => item.id === concept.category)!);
  return (
    <button
      className={`concept-card ${concept.category === 'numbers' ? 'number-concept-card' : ''}`}
      onClick={() => onOpen(concept)}
      aria-label={t(`Discover ${concept.word}`, `认识${concept.word}`)}
    >
      <div className="concept-art" style={{ background: category.wash }}>
        {discovered && (
          <span className="discovered-dot" title={t('Discovered', '已认识')}>
            <Sprout size={14} />
          </span>
        )}
        <img src={concept.art} alt="" loading="lazy" />
        <span className="concept-sound">
          <Volume2 size={17} />
        </span>
      </div>
      <span className="concept-name">{concept.word}</span>
      <span className="concept-category">
        {concept.numberValue !== undefined
          ? concept.numberValue
          : concept.id === 'dragon'
            ? t('Mythical animal', '传说中的动物')
            : category.name}
      </span>
    </button>
  );
}

export function Explore({
  progress,
  onOpen,
  onStart,
}: {
  progress: Progress;
  onOpen: (concept: Concept, poolIds?: readonly string[]) => void;
  onStart: (config: PracticeConfig) => void;
}) {
  const { t, localizeCategory } = useLanguage();
  const localizedCategories = categories.map(localizeCategory);
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState('');
  const [animalGroup, setAnimalGroup] = useState<(typeof animalGroups)[number]['id'] | 'all'>(
    'all',
  );
  const selectedAnimalGroup = animalGroups.find((group) => group.id === animalGroup);
  const practicePool =
    categoryId === 'animals' && animalGroup !== 'all' ? animalIdsByGroup[animalGroup] : undefined;
  const selected = localizedCategories.find((category) => category.id === categoryId);
  const filtered = concepts.filter(
    (concept) =>
      (!categoryId || concept.category === categoryId) &&
      (categoryId !== 'animals' ||
        animalGroup === 'all' ||
        animalGroupById[concept.id] === animalGroup) &&
      (concept.word.toLowerCase().includes(query.trim().toLowerCase()) ||
        (concept.numberValue !== undefined && String(concept.numberValue) === query.trim()) ||
        conceptInLanguage(concept, 'zh').word.toLowerCase().includes(query.trim().toLowerCase()) ||
        categoryInLanguage(
          categories.find((c) => c.id === concept.category)!,
          'zh',
        )
          .name.toLowerCase()
          .includes(query.trim().toLowerCase()) ||
        categories
          .find((c) => c.id === concept.category)!
          .name.toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  const browsing = Boolean(categoryId || query.trim());
  function goCategory(id: CategoryId) {
    setCategoryId(id);
    setAnimalGroup('all');
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return (
    <div className="page-enter">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            <span className="tiny-sun">✳</span>{' '}
            {t('A LITTLE CURIOSITY GOES A LONG WAY', '小小好奇心，发现大世界')}
          </div>
          <h1>
            {selected
              ? t(`Let’s explore ${selected.name.toLowerCase()}.`, `一起认识${selected.name}吧。`)
              : query.trim()
                ? t('What will you discover?', '会有什么新发现呢？')
                : t('Hello, little explorer.', '你好，小小探索家。')}
          </h1>
          <p className="page-description">
            {selected
              ? selected.subtitle + t('.', '。')
              : t('Big discoveries start with little steps.', '每一步小探索，都藏着大惊喜。')}
          </p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input
            aria-label={t('Search discoveries', '搜索认知内容')}
            placeholder={t('Find something new…', '寻找新发现…')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label={t('Clear search', '清空搜索')} onClick={() => setQuery('')}>
              <X size={17} />
            </button>
          )}
        </label>
      </div>
      {!browsing && (
        <>
          <section className="hero" aria-label={t('Your next adventure', '开启下一次探索')}>
            <div className="hero-copy">
              <span className="pill hero-label">
                <Sprout size={15} /> {t('MADE FOR CURIOUS LITTLE MINDS', '陪伴每一颗好奇的小脑袋')}
              </span>
              <h2>
                {t('A little world.', '小小世界，')}
                <br />
                {t('A lot to discover', '大大发现')}
                <span className="orange-period">{t('.', '。')}</span>
              </h2>
              <p>
                {t('Meet new words, make new connections,', '认识新事物，找到新联系，')}
                <br className="desktop-break" />{' '}
                {t('and let your curiosity lead the way.', '跟着好奇心，一起去探索。')}
              </p>
              <button
                className="button button-primary"
                onClick={() => onStart({ kind: 'quiz', categoryId: 'all' })}
              >
                <Play size={17} fill="currentColor" /> {t('Let’s play & learn', '边玩边学')}{' '}
                <ArrowRight size={18} />
              </button>
              <span className="hero-footnote">
                <Headphones size={14} /> {t('Listen. Discover. Play.', '听一听，认一认，玩一玩。')}
              </span>
            </div>
            <div className="hero-art">
              <img
                src="/art/discovery-scene.svg"
                alt={t(
                  'A friendly fox exploring a world of plants, shapes, and little discoveries',
                  '友善的小狐狸正在探索植物、形状和各种新事物',
                )}
              />
              <span className="floating-label">
                <span>{t('Hi, I’m Pip!', '你好，我是 Pip！')}</span>
                <span className="hello-wave">✦</span>
              </span>
            </div>
            <span className="hero-spark spark-one" aria-hidden="true">
              ✦
            </span>
            <span className="hero-spark spark-two" aria-hidden="true">
              ✧
            </span>
          </section>
          <section className="topic-section" aria-labelledby="topics-title">
            <div className="section-heading">
              <div>
                <h2 id="topics-title">
                  {t('A world to explore', '一起探索世界')}{' '}
                  <span className="section-count">{categories.length}</span>
                </h2>
                <p>
                  {t(
                    'Pick a little adventure. See where it takes you.',
                    '选一个喜欢的主题，看看会发现什么。',
                  )}
                </p>
              </div>
              <span className="subtle-label">
                <Compass size={15} /> {t('Explore at your own pace', '按自己的节奏探索')}
              </span>
            </div>
            <div className="topic-grid">
              {localizedCategories.map((category, index) => {
                const total = concepts.filter((concept) => concept.category === category.id).length;
                const found = concepts.filter(
                  (concept) =>
                    concept.category === category.id && progress.discovered.includes(concept.id),
                ).length;
                return (
                  <button
                    className={`topic-card topic-${category.id}`}
                    key={category.id}
                    style={
                      {
                        '--topic-wash': category.wash,
                        '--topic-color': category.color,
                        '--item-index': index,
                      } as CSSProperties
                    }
                    onClick={() => goCategory(category.id)}
                    aria-label={t(`Explore ${category.name}`, `探索${category.name}`)}
                  >
                    <span className="topic-card-top">
                      <span className="topic-number">0{index + 1}</span>
                      <span className="topic-arrow">
                        <ArrowUpRight size={18} />
                      </span>
                    </span>
                    <span className="topic-illustrations" aria-hidden="true">
                      {artGroups[category.id].map((id, imageIndex) => (
                        <img
                          key={id}
                          src={concepts.find((concept) => concept.id === id)!.art}
                          className={`topic-item topic-item-${imageIndex}`}
                          alt=""
                        />
                      ))}
                    </span>
                    <span className="topic-bottom">
                      <span>
                        <strong>{category.name}</strong>
                        <span className="topic-caption">
                          {t(`${total} little discoveries`, `${total} 个小发现`)}
                        </span>
                      </span>
                      <span
                        className="topic-count-progress"
                        aria-label={t(
                          `${found} of ${total} discovered`,
                          `已认识 ${found} 个，共 ${total} 个`,
                        )}
                      >
                        <span>
                          {found}/{total}
                        </span>
                        <span className="topic-count-track">
                          <i style={{ width: `${(found / total) * 100}%` }} />
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="favorites-section" aria-labelledby="favorites-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow small-eyebrow">
                  {t('LITTLE THINGS, BIG WONDER', '小小事物，满满惊喜')}
                </span>
                <h2 id="favorites-title">
                  {t('A few favorites to start with', '从这些小伙伴开始')}
                </h2>
              </div>
              <span className="subtle-label">
                <Volume2 size={15} /> {t('Tap a picture to listen', '点点图片，听听声音')}
              </span>
            </div>
            <div className="concept-grid highlight-grid">
              {highlights.map((id) => {
                const concept = concepts.find((item) => item.id === id)!;
                return (
                  <ConceptCard
                    key={id}
                    concept={concept}
                    onOpen={onOpen}
                    discovered={progress.discovered.includes(id)}
                  />
                );
              })}
            </div>
          </section>
          <div className="gentle-note">
            <span className="gentle-icon">
              <Sprout size={21} />
            </span>
            <div>
              <strong>
                {t('Little by little is a lovely way to grow.', '一点一点，慢慢长大。')}
              </strong>
              <p>
                {t(
                  'A few happy minutes of exploring can make a big difference.',
                  '每天快乐探索几分钟，小小收获也很棒。',
                )}
              </p>
            </div>
            <Sparkles size={24} />
          </div>
        </>
      )}
      {browsing && (
        <section className="browse-section">
          <button
            className="back-link"
            onClick={() => {
              setCategoryId(null);
              setQuery('');
            }}
          >
            <ChevronLeft size={17} /> {t('All adventures', '所有主题')}
          </button>
          {selected && (
            <div className="category-intro" style={{ background: selected.wash }}>
              <img src={selected.icon} alt="" />
              <div>
                <span className="eyebrow">{t('YOUR NEXT LITTLE ADVENTURE', '下一场小探索')}</span>
                <h2>{selected.name}</h2>
                <p>
                  {t(
                    'Tap a picture, listen closely, and discover something new.',
                    '点点图片，仔细听听，认识新事物。',
                  )}
                </p>
              </div>
              <button
                className="button button-primary"
                onClick={() =>
                  onStart({ kind: 'quiz', categoryId: selected.id, poolIds: practicePool })
                }
              >
                <Play size={16} fill="currentColor" />{' '}
                {selectedAnimalGroup && selected.id === 'animals'
                  ? t(
                      `Practice ${selectedAnimalGroup.name.toLowerCase()}`,
                      `练习${selectedAnimalGroup.zhName}`,
                    )
                  : t(`Practice ${selected.name.toLowerCase()}`, `练习${selected.name}`)}
              </button>
            </div>
          )}
          <div className="filter-row">
            <button
              className={!categoryId ? 'filter-chip active' : 'filter-chip'}
              onClick={() => {
                setCategoryId(null);
                setAnimalGroup('all');
              }}
            >
              {t('Everything', '全部')}
            </button>
            {localizedCategories.map((category) => (
              <button
                className={categoryId === category.id ? 'filter-chip active' : 'filter-chip'}
                key={category.id}
                onClick={() => {
                  setCategoryId(category.id);
                  setAnimalGroup('all');
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
          {categoryId === 'animals' && (
            <AnimalGroupFilter selected={animalGroup} onChange={setAnimalGroup} />
          )}
          <p className="result-count">
            {t(
              `${filtered.length} ${filtered.length === 1 ? 'discovery' : 'discoveries'}`,
              `${filtered.length} 个发现`,
            )}
            {query.trim() && t(` for “${query.trim()}”`, `，搜索“${query.trim()}”`)}
          </p>
          {filtered.length ? (
            <div
              className={`concept-grid browse-grid ${categoryId === 'numbers' ? 'number-browse-grid' : ''}`}
            >
              {filtered.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  discovered={progress.discovered.includes(concept.id)}
                  onOpen={(item) => onOpen(item, practicePool)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={36} />
              <h2>{t('Something else to discover?', '换个词，继续找找吧？')}</h2>
              <p>{t('Try a word like apple, blue, or cat.', '试试搜索苹果、蓝色或猫。')}</p>
              <button
                className="button button-secondary"
                onClick={() => {
                  setQuery('');
                  setCategoryId(null);
                }}
              >
                {t('Explore all topics', '探索所有主题')} <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
