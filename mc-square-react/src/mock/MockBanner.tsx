import React, { useEffect } from 'react';
import './Mock.css';

// 検討用モックページの共通バナー
// - 本番に出ていない・内容は未確定であることを常に表示する
// - 表示中は検索エンジンに載せない（robots: noindex）
const MockBanner: React.FC<{ note?: string }> = ({ note }) => {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="mock-banner" role="note">
      <b>検討用モック</b>
      <span>{note || '内容は未確定です。本番サイトには出ていません。'}</span>
    </div>
  );
};

export default MockBanner;
