import React, { useState } from 'react';
import { findPartner, partnerSns, PartnerSns, isHttpsUrl } from './partners';

const SNS_ITEMS: { key: keyof PartnerSns; label: string; className: string; icon: string }[] = [
  { key: 'twitter', label: 'X', className: 'twitter', icon: '🐦' },
  { key: 'instagram', label: 'Instagram', className: 'instagram', icon: '📸' },
  { key: 'facebook', label: 'Facebook', className: 'facebook', icon: '📘' },
  { key: 'line', label: 'LINE', className: 'line', icon: '💬' },
  { key: 'website', label: '公式サイト', className: 'website', icon: '🔗' },
];

/** 作り手のアイコン。未設定・読み込み失敗時は従来の汎用アバターに戻す */
export const PartnerAvatar: React.FC<{ partnerId?: string; name?: string }> = ({ partnerId, name }) => {
  const partner = findPartner(partnerId);
  const [failed, setFailed] = useState(false);
  if (partner?.icon && !failed) {
    return (
      <img
        className="author-avatar"
        src={partner.icon}
        alt={name || partner.shortName || partner.name}
        width={40}
        height={40}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className="author-avatar" aria-hidden="true">👤</span>;
};

/** 作り手行右の公式リンク。パートナーは partners.ts の確認済みURLを使い、Firestore の authorSNS は上書きする */
export const PartnerSnsIcons: React.FC<{ partnerId?: string; authorSNS?: PartnerSns | Record<string, string> | null }> = ({
  partnerId,
  authorSNS,
}) => {
  const links = partnerSns(findPartner(partnerId), authorSNS);
  const visible = SNS_ITEMS.filter((i) => isHttpsUrl(links[i.key]));
  if (!visible.length) return null;
  return (
    <span className="sns-icons">
      {visible.map((i) => (
        <a
          key={i.key}
          className={`sns-icon ${i.className}`}
          href={links[i.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={i.label}
          title={i.label}
          onClick={(e) => e.stopPropagation()}
        >
          {i.icon}
        </a>
      ))}
    </span>
  );
};
