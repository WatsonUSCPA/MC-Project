import React from 'react';
import { Link } from 'react-router-dom';

// 購入前の最終確認（特定商取引法 第12条の6）
// お届け時期・支払時期・返品条件などを「購入へ進む」ボタンの直前に表示し、利用規約への同意を取る
// ※ 内容を変えるときは LegalNotice.tsx と create-checkout-session.js の CHECKOUT_NOTICE もそろえる

interface CheckoutNoticeProps {
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
}

const rowStyle: React.CSSProperties = { margin: '0 0 0.35em', paddingLeft: '1em', textIndent: '-1em' };

const CheckoutNotice: React.FC<CheckoutNoticeProps> = ({ agreed, onAgreeChange }) => (
  <div style={{ marginTop: 16, padding: '0.9em 1em', background: '#fafafa', border: '1px solid #eee', borderRadius: 10, fontSize: '0.85em', lineHeight: 1.6, color: '#555', textAlign: 'left' }}>
    <p style={{ margin: '0 0 0.5em', fontWeight: 700, color: '#333' }}>ご注文前にご確認ください</p>
    <p style={rowStyle}>・お届け：ご注文（決済完了）後、通常3〜5営業日以内に発送します</p>
    <p style={rowStyle}>・お支払い：クレジットカード（ご注文時に決済されます）</p>
    <p style={rowStyle}>・返品・交換：商品到着後7日以内の未使用・未開封品に限ります。お客様都合の場合の送料はお客様負担、不良品・誤配送の場合は当店負担です</p>
    <p style={rowStyle}>・キャンセル：商品発送前まで承ります</p>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: '0.7em', cursor: 'pointer', color: '#333', fontWeight: 600 }}>
      <input
        type="checkbox"
        checked={agreed}
        onChange={(e) => onAgreeChange(e.target.checked)}
        style={{ marginTop: '0.3em', width: 18, height: 18, flexShrink: 0 }}
      />
      <span>
        <Link to="/terms" target="_blank" rel="noopener">利用規約</Link>と
        <Link to="/legal" target="_blank" rel="noopener">特定商取引法に基づく表記</Link>（返品条件）を確認し、同意します
      </span>
    </label>
  </div>
);

export default CheckoutNotice;
