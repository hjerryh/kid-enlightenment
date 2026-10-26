import { animalGroups, animalIdsByGroup } from '../data/animals';
import { useLanguage } from '../lib/i18n';

export type AnimalGroupSelection = (typeof animalGroups)[number]['id'] | 'all';

export function AnimalGroupFilter({
  selected,
  onChange,
}: {
  selected: AnimalGroupSelection;
  onChange: (group: AnimalGroupSelection) => void;
}) {
  const { t } = useLanguage();
  const total = animalGroups.reduce((count, group) => count + animalIdsByGroup[group.id].length, 0);
  return (
    <div className="animal-group-section">
      <span className="animal-group-label">{t('Animal families', '动物小天地')}</span>
      <div
        className="filter-row animal-group-filters"
        role="group"
        aria-label={t('Animal groups', '动物分类')}
      >
        <button
          type="button"
          className={`filter-chip ${selected === 'all' ? 'active' : ''}`}
          aria-pressed={selected === 'all'}
          onClick={() => onChange('all')}
        >
          {t('All animals', '全部动物')} <span className="filter-count">{total}</span>
        </button>
        {animalGroups.map((group) => (
          <button
            type="button"
            key={group.id}
            className={`filter-chip ${selected === group.id ? 'active' : ''}`}
            aria-pressed={selected === group.id}
            onClick={() => onChange(group.id)}
          >
            {t(group.name, group.zhName)}
            <span className="filter-count">{animalIdsByGroup[group.id].length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
