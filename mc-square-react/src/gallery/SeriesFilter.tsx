import React from 'react';
import './CreatorFilter.css';

// 「シリーズで探す」絞り込み（つくり手の絞り込みとは別）
// レシピの series: string[] に入っている id で絞り込む。URL は ?series=<id>
// シリーズを増やすときは SERIES に1行足し、レシピに series: ['<id>'] を付ける

export interface SeriesDef { id: string; name: string; description: string; }

export const SERIES: SeriesDef[] = [
  { id: 'usanko-club', name: 'うさんこクラブ', description: 'うさんこクラブの布を使った作品' },
  { id: 'hagire', name: 'はぎれ活用', description: 'はぎれ・余り布を活用した作品' },
  { id: 'pouch', name: 'ポーチ', description: 'いろいろな形・サイズのポーチ作品' },
  { id: 'bag', name: 'バッグ', description: 'トート・ポシェット・ショルダーなどのバッグ作品' },
  { id: 'liberty', name: 'リバティ', description: 'リバティ（タナローン）を使った作品' },
  { id: 'under-30', name: '30分以内で作れる', description: '30分以内を目安に作れる時短作品' },
  { id: 'school', name: '入園入学', description: 'レッスンバッグや上履き入れなどの通園・通学グッズ' },
  { id: 'hand-sew', name: '手縫いOK', description: 'ミシンなし・手縫いだけで作れる作品' },
  { id: 'christmas', name: 'クリスマス', description: 'クリスマスに飾れる・贈れる作品' },
  { id: 'beginner', name: '初心者向け', description: '初めての方でも挑戦しやすい作品' },
];

export const findSeries = (id?: string | null) => SERIES.find((s) => s.id === id);

interface SeriesFilterProps {
  value: string;
  onChange: (seriesId: string) => void;
  counts: Record<string, number>;
}

const SeriesFilter: React.FC<SeriesFilterProps> = ({ value, onChange, counts }) => {
  // 該当レシピがあるシリーズだけ表示（0件のうちは段ごと出さない）
  const visible = SERIES.filter((s) => (counts[s.id] || 0) > 0 || value === s.id);
  if (visible.length === 0) return null;
  return (
    <nav className="creator-filter series-filter" aria-label="シリーズで探す">
      <span className="creator-filter-label">シリーズで探す</span>
      <div className="creator-filter-chips">
        {visible.map((s) => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`creator-chip creator-chip-series${active ? ' is-active' : ''}`}
              aria-pressed={active}
              title={s.description}
              onClick={() => onChange(active ? '' : s.id)}
            >
              <span className="creator-chip-name">{s.name}</span>
              <span className="creator-chip-count">{counts[s.id] || 0}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default SeriesFilter;
