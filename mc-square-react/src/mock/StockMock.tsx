import React, { useEffect, useRef, useState } from 'react';
import MockBanner from './MockBanner';
import './Mock.css';

// 在庫・配信承認の管理画面（モック）
// データはすべてこのファイル内のサンプル。Firebase・スプレッドシートには読み書きしない。

type Pane = 'home' | 'stock' | 'orders' | 'new' | 'approve';

interface StockItem { id: string; name: string; comp: string; width: number; price: number; qty: number; }
interface Order { no: string; date: string; customer: string; items: [string, number][]; shipped: boolean; }
interface Draft { id: number; channel: 'LINE' | 'ニュースレター'; from: string; title: string; body: string; status: '承認待ち' | '承認済' | '差し戻し'; }

const initialStock: StockItem[] = [
  { id: 'S-001', name: '国産コットン 小花柄', comp: '綿100%', width: 110, price: 1980, qty: 42 },
  { id: 'S-002', name: 'アメリカンコットン ストライプ', comp: '綿100%', width: 110, price: 2200, qty: 4.5 },
  { id: 'S-003', name: '国産コットン ギンガム', comp: '綿100%', width: 110, price: 1320, qty: 68 },
  { id: 'S-004', name: 'アメリカンコットン フローラル', comp: '綿100%', width: 110, price: 2420, qty: 0 },
  { id: 'S-005', name: '国産コットン ドット', comp: '綿100%', width: 110, price: 1100, qty: 12 },
];

const initialOrders: Order[] = [
  { no: '#0001', date: '10/03', customer: 'サンプル A 様', items: [['S-001', 2]], shipped: false },
  { no: '#0002', date: '10/03', customer: 'サンプル B 様', items: [['S-003', 1.5], ['S-005', 1]], shipped: false },
  { no: '#0003', date: '10/04', customer: 'サンプル C 様', items: [['S-002', 2.5]], shipped: false },
];

const initialDrafts: Draft[] = [
  { id: 1, channel: 'LINE', from: '在庫登録', title: '新着：国産コットン 小花柄', body: '【新着】国産コットン 小花柄（綿100%・110cm幅）が入荷しました。\n会員の方には先にお知らせしています。', status: '承認待ち' },
  { id: 2, channel: 'ニュースレター', from: '在庫登録', title: '今月の新着まとめ', body: '今月入荷した生地をまとめてご紹介します。\n※残りわずかの生地もあります。', status: '承認待ち' },
];

const yen = (n: number) => '¥' + n.toLocaleString('ja-JP');
const level = (q: number): [string, string] => (q <= 0 ? ['bad', '欠品'] : q <= 5 ? ['warn', '残りわずか'] : ['ok', '十分']);

const panes: { key: Pane; label: string }[] = [
  { key: 'home', label: 'ホーム' },
  { key: 'stock', label: '在庫' },
  { key: 'orders', label: '注文' },
  { key: 'new', label: '新着を登録' },
  { key: 'approve', label: '配信の承認' },
];

const StockMock: React.FC = () => {
  const [pane, setPane] = useState<Pane>('home');
  const [stock, setStock] = useState(initialStock);
  const [orders, setOrders] = useState(initialOrders);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: 'アメリカンコットン チェック', comp: '綿100%', width: 110, price: 2200, qty: 30, channel: '両方' });

  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const notify = (m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };
  const nameOf = (id: string) => stock.find((s) => s.id === id)?.name || id;

  const ship = (no: string) => {
    const order = orders.find((o) => o.no === no);
    if (!order) return;
    setOrders(orders.map((o) => (o.no === no ? { ...o, shipped: true } : o)));
    setStock(stock.map((s) => {
      const line = order.items.find(([id]) => id === s.id);
      return line ? { ...s, qty: Math.max(0, +(s.qty - line[1]).toFixed(1)) } : s;
    }));
    notify(`${no} を出荷済にしました。在庫を減らしました`);
  };

  const setDraftStatus = (id: number, status: Draft['status']) => {
    setDrafts(drafts.map((d) => (d.id === id ? { ...d, status } : d)));
    notify(status === '承認済' ? '承認しました（モックなので配信はされません）' : '差し戻しました');
  };

  const register = (e: React.FormEvent) => {
    e.preventDefault();
    const id = 'S-' + String(stock.length + 1).padStart(3, '0');
    setStock([{ id, name: form.name, comp: form.comp, width: form.width, price: form.price, qty: form.qty }, ...stock]);
    const body = `【新着】${form.name}（${form.comp}・${form.width}cm幅）が入荷しました。\n${yen(form.price)} / m`;
    const channels: Draft['channel'][] = form.channel === '両方' ? ['LINE', 'ニュースレター'] : [form.channel as Draft['channel']];
    const now = Date.now();
    setDrafts([
      ...channels.map((channel, i) => ({ id: now + i, channel, from: '在庫登録', title: '新着：' + form.name, body, status: '承認待ち' as const })),
      ...drafts,
    ]);
    setPane('approve');
    notify(`${id} を登録し、配信の下書きを作りました`);
  };

  const pending = orders.filter((o) => !o.shipped).length;
  const low = stock.filter((s) => s.qty <= 5);
  const waiting = drafts.filter((d) => d.status === '承認待ち').length;

  return (
    <div className="mock-page">
      <MockBanner note="在庫・配信承認の管理画面の案です。データはすべてサンプルで、どこにも保存・送信されません。" />
      <div className="mock-app">
        <nav className="mock-side" aria-label="管理メニュー">
          {panes.map((p) => (
            <button key={p.key} type="button" aria-current={pane === p.key} onClick={() => setPane(p.key)}>
              {p.label}
              {p.key === 'orders' && pending > 0 && <span className="mock-badge">{pending}</span>}
              {p.key === 'approve' && waiting > 0 && <span className="mock-badge">{waiting}</span>}
            </button>
          ))}
        </nav>

        <div className="mock-main">
          {pane === 'home' && (
            <>
              <h2>今日の状況</h2>
              <div className="mock-kpis">
                <div className="mock-kpi"><b>{pending}</b><span>未出荷の注文</span></div>
                <div className="mock-kpi"><b>{low.length}</b><span>残りわずか・欠品</span></div>
                <div className="mock-kpi"><b>{waiting}</b><span>承認待ちの配信</span></div>
                <div className="mock-kpi"><b>{stock.length}</b><span>登録中の生地</span></div>
              </div>
              <div className="mock-card">
                <h3>やること</h3>
                <ul className="mock-todo">
                  {waiting > 0 && <li><span className="mock-pill warn">承認</span><button type="button" className="mock-link" onClick={() => setPane('approve')}>配信の承認が {waiting} 件あります</button></li>}
                  {pending > 0 && <li><span className="mock-pill info">出荷</span><button type="button" className="mock-link" onClick={() => setPane('orders')}>未出荷の注文が {pending} 件あります</button></li>}
                  {low.map((s) => (
                    <li key={s.id}><span className={`mock-pill ${level(s.qty)[0]}`}>在庫</span><button type="button" className="mock-link" onClick={() => setPane('stock')}>{s.name}：{level(s.qty)[1]}（{s.qty.toFixed(1)}m）</button></li>
                  ))}
                </ul>
              </div>
              <p className="mock-note">役割の想定：ご両親が在庫と新着を登録 → Wataru がニュースレターと LINE を最終承認。</p>
            </>
          )}

          {pane === 'stock' && (
            <>
              <h2>在庫</h2>
              <div className="mock-table-wrap">
                <table className="mock-table">
                  <thead><tr><th>品番</th><th>生地</th><th>幅</th><th>価格 / m</th><th className="num">在庫 (m)</th><th>状態</th></tr></thead>
                  <tbody>
                    {stock.map((s) => (
                      <tr key={s.id}>
                        <td className="mono">{s.id}</td>
                        <td>{s.name}<div className="mock-note">{s.comp}</div></td>
                        <td className="num">{s.width}cm</td>
                        <td className="num">{yen(s.price)}</td>
                        <td className="num">{s.qty.toFixed(1)}</td>
                        <td><span className={`mock-pill ${level(s.qty)[0]}`}>{level(s.qty)[1]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mock-note">今のスプレッドシートに「在庫 (m)」の列を足し、出荷すると自動で減る形を想定。5m 以下で「残りわずか」。</p>
            </>
          )}

          {pane === 'orders' && (
            <>
              <h2>注文</h2>
              <div className="mock-table-wrap">
                <table className="mock-table">
                  <thead><tr><th>注文番号</th><th>日付</th><th>お客様</th><th>内容</th><th>状態</th><th></th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.no}>
                        <td className="mono">{o.no}</td>
                        <td>{o.date}</td>
                        <td>{o.customer}</td>
                        <td>{o.items.map(([id, m]) => <div key={id}>{nameOf(id)} {m}m</div>)}</td>
                        <td><span className={`mock-pill ${o.shipped ? 'ok' : 'info'}`}>{o.shipped ? '出荷済' : '未出荷'}</span></td>
                        <td>{!o.shipped && <button type="button" className="mock-btn mock-btn-sm" onClick={() => ship(o.no)}>出荷済にする</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mock-note">「出荷済にする」を押すと、在庫の数量が減ります（この画面の中だけ）。</p>
            </>
          )}

          {pane === 'new' && (
            <>
              <h2>新着を登録</h2>
              <form className="mock-form" onSubmit={register}>
                <label htmlFor="mock-name">生地の名前<input id="mock-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
                <label htmlFor="mock-comp">素材<input id="mock-comp" value={form.comp} onChange={(e) => setForm({ ...form, comp: e.target.value })} /></label>
                <label htmlFor="mock-width">幅 (cm)<input id="mock-width" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: +e.target.value })} /></label>
                <label htmlFor="mock-price">価格 / m (円)<input id="mock-price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></label>
                <label htmlFor="mock-qty">入荷数量 (m)<input id="mock-qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: +e.target.value })} /></label>
                <label htmlFor="mock-channel">配信先
                  <select id="mock-channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                    <option value="両方">LINE とニュースレター</option>
                    <option value="LINE">LINE のみ</option>
                    <option value="ニュースレター">ニュースレターのみ</option>
                  </select>
                </label>
                <div className="mock-form-full">
                  <button type="submit" className="mock-btn">在庫に登録して、配信の下書きを作る</button>
                  <span className="mock-note">下書きは「配信の承認」に入り、承認されるまで送られません。</span>
                </div>
              </form>
            </>
          )}

          {pane === 'approve' && (
            <>
              <h2>配信の承認</h2>
              {drafts.map((d) => (
                <article className="mock-card" key={d.id}>
                  <div className="mock-draft-meta">
                    <span className={`mock-pill ${d.status === '承認待ち' ? 'warn' : d.status === '承認済' ? 'ok' : 'bad'}`}>{d.status}</span>
                    <span className="mock-pill info">{d.channel}</span>
                    <span className="mock-note">作成：{d.from}</span>
                  </div>
                  <h3>{d.title}</h3>
                  <pre className="mock-draft-body">{d.body}</pre>
                  {d.status === '承認待ち' && (
                    <div className="mock-actions">
                      <button type="button" className="mock-btn mock-btn-sm" onClick={() => setDraftStatus(d.id, '承認済')}>承認して予約</button>
                      <button type="button" className="mock-btn mock-btn-sm mock-btn-ghost" onClick={() => setDraftStatus(d.id, '差し戻し')}>差し戻す</button>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </div>
      </div>
      {toast && <div className="mock-toast" role="status">{toast}</div>}
    </div>
  );
};

export default StockMock;
