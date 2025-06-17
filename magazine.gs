// スプレッドシートを開いたときにカスタムメニューを追加
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('メルマガ作成')
    .addItem('サイドバーを開く', 'showSidebar')
    .addToUi();
}

// サイドバーを表示
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('メルマガ作成する');
  SpreadsheetApp.getUi().showSidebar(html);
}

// メルマガ発行年月のリストを取得（重複なし、空行除外、日付形式も対応）
function getMagazineMonths() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('商品データ履歴');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 5, lastRow - 1, 1).getValues(); // E列
  const months = values
    .map(row => {
      const val = row[0];
      if (!val) return null;
      if (val instanceof Date) {
        // 日付型の場合
        return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy/MM');
      } else if (typeof val === 'string' && val.match(/^\d{4}\/\d{2}/)) {
        // 文字列で "yyyy/MM" または "yyyy/MM/dd"
        return val.slice(0, 7);
      } else {
        return null;
      }
    })
    .filter(e => e)
    .filter((v, i, a) => a.indexOf(v) === i); // 重複排除
  return months;
}

// 選択した年月のデータを取得し、inventory.html風のリッチなメールHTMLを生成
function getMagazineHtml(selectedMonth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('商品データ履歴');
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  // E列（メルマガ発行年月）でフィルタ
  const filtered = rows.filter(row => {
    const date = row[4];
    let month = '';
    if (!date) return false;
    if (date instanceof Date) {
      month = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM');
    } else if (typeof date === 'string' && date.match(/^\d{4}\/\d{2}/)) {
      month = date.slice(0, 7);
    }
    return month === selectedMonth;
  });

  // メール用リッチHTML
  let html = `
  <div style="font-family:'Noto Sans JP',sans-serif;background:#FFF5F0;padding:32px;">
    <div style="max-width:700px;margin:0 auto;background:#FFF0E8;padding:32px 24px 24px 24px;border-radius:20px;box-shadow:0 4px 16px rgba(255,159,124,0.10);border:1px solid #FFD4C4;">
      <div style="text-align:center;margin-bottom:32px;">
        <img src="https://res.cloudinary.com/drjxvhwv/image/upload/v1750049908/MC_square_Logo_fps" alt="MC Square ロゴ" style="max-width:120px;display:block;margin:0 auto 12px auto;">
        <h2 style="color:#2D3436;font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px 0;">${selectedMonth} メルマガ</h2>
        <div style="color:#636E72;font-size:1rem;">今月の新着商品をご紹介します！</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:24px;justify-content:center;">
  `;

  if (filtered.length === 0) {
    html += '<div style="text-align:center;color:#FF6B6B;">該当データがありません。</div>';
  } else {
    filtered.forEach(row => {
      const name = row[0] || '';
      const management = row[1] || '';
      const img = row[2] || '';
      const price = row[3] || '';
      html += `
        <div style="background:#fff;border-radius:20px;box-shadow:0 4px 16px rgba(255,159,124,0.10);border:1px solid #FFD4C4;width:220px;padding:18px 12px 16px 12px;display:flex;flex-direction:column;align-items:center;">
          <img src="${img}" alt="${management}" style="width:120px;height:120px;object-fit:cover;border-radius:16px;border:1px solid #FFD4C4;background:#f8f8f8;margin-bottom:12px;">
          <div style="font-size:1.1rem;font-weight:bold;color:#2D3436;margin-bottom:4px;">${name}</div>
          <div style="color:#636E72;font-size:0.95rem;margin-bottom:4px;">管理番号: ${management}</div>
          <div style="color:#FF6B6B;font-size:1.05rem;font-weight:bold;">${price}</div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  </div>
  `;
  return html;
} 