import React from 'react';
import { PARTNERS } from './partners';
import './CreatorFilter.css';

// クラフトキッチンの「つくり手（パートナー）」絞り込みチップ
// 選択状態は URL の ?creator=<partnerId> に保存するので、そのまま共有できる

export const ALL_CREATORS = '';

interface CreatorFilterProps {
  /** 選択中のパートナーid（'' = すべて） */
  value: string;
  onChange: (partnerId: string) => void;
  /** パートナーごとの件数（省略時は件数を表示しない） */
  counts?: Record<string, number>;
  /** すべての件数 */
  total?: number;
  label?: string;
}

const CreatorFilter: React.FC<CreatorFilterProps> = ({ value, onChange, counts, total, label = 'つくり手で絞り込む' }) => {
  const options = [
    { id: ALL_CREATORS, name: 'すべて', count: total },
    ...PARTNERS.map((p) => ({ id: p.id, name: p.shortName, count: counts ? counts[p.id] || 0 : undefined })),
  ];
  return (
    <nav className="creator-filter" aria-label={label}>
      <span className="creator-filter-label">{label}</span>
      <div className="creator-filter-chips">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id || 'all'}
              type="button"
              className={`creator-chip${active ? ' is-active' : ''}${o.id ? ` creator-chip-${o.id}` : ''}`}
              aria-pressed={active}
              onClick={() => onChange(o.id)}
            >
              <span className="creator-chip-name">{o.name}</span>
              {typeof o.count === 'number' && <span className="creator-chip-count">{o.count}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CreatorFilter;
