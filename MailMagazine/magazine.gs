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

// 画像URLをGoogle Driveの公開URLに変換する関数
function getImageUrl(imgValue) {
  if (!imgValue) {
    // デフォルト画像
    return COMPANY_INFO.logoUrl;
  }
  // Cloudinaryなどの完全なURLの場合はそのまま返す
  if (imgValue.startsWith('http')) {
    return imgValue;
  }
  // それ以外（Google DriveのIDなど）は従来通り
  return `https://drive.google.com/uc?export=view&id=${imgValue}`;
}

// 会社情報（2行目に追加）
const COMPANY_INFO = {
  name: 'MC Square（エムシースクエア）',
  tel: '045-410-7023',
  instagram: '@mc.square_official',
  email: 'sales@mcsquareofficials.com',
  logoUrl: 'https://res.cloudinary.com/drjvxvhwl/image/upload/v1750049908/MC_square_Logo_fpsooy.png'
};

// メルマガHTMLを生成する関数
function getMagazineHtml(selectedMonth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('商品データ履歴');
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  // E列（メルマガ発行年月）でフィルタ
  // 1行目: 項目, 2行目: 会社info → 3行目以降をデータとして扱う
  const filtered = rows.slice(2).filter(row => {
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

  let html = `
  <div style="font-family:'Noto Sans JP',sans-serif;background:#FFF5F0;padding:16px;">
    <div style="max-width:420px;margin:0 auto;background:#FFF0E8;padding:16px 4vw 24px 4vw;border-radius:20px;box-shadow:0 4px 16px rgba(255,159,124,0.10);border:1px solid #FFD4C4;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${COMPANY_INFO.logoUrl}" alt="${COMPANY_INFO.name} ロゴ" style="max-width:120px;width:60vw;">
        <h2 style="color:#2D3436;font-size:1.2rem;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px 0;">${selectedMonth} メルマガ</h2>
        <div style="color:#636E72;font-size:1rem;">今月の新着商品をご紹介します！</div>
        <div style="color:#FF6B6B;font-size:0.95rem;margin-top:8px;">※価格は50cmあたりの単価です</div>
      </div>
      <table style="width:100%;max-width:400px;margin:0 auto;border-collapse:separate;border-spacing:0 16px;">
`;

  if (filtered.length === 0) {
    html += '<tr><td style="text-align:center;color:#FF6B6B;">該当データがありません。</td></tr>';
  } else {
    filtered.forEach(row => {
      const management = row[1] || '';
      const imgId = row[2] || '';
      const price = row[3] || '';
      const formattedPrice = price ? `¥${Number(price).toLocaleString()}` : '';
      const imageUrl = getImageUrl(imgId);

      html += `
        <tr>
          <td style="background:#fff;border-radius:20px;box-shadow:0 4px 16px rgba(255,159,124,0.10);border:1px solid #FFD4C4;padding:12px 8px;text-align:center;">
            <img src="${imageUrl}" alt="${management}" style="width:100%;max-width:200px;height:auto;object-fit:cover;border-radius:16px;border:1px solid #FFD4C4;background:#f8f8f8;display:block;margin:0 auto 8px auto;">
            <div style="color:#636E72;font-size:0.95rem;margin-bottom:4px;">管理番号: ${management}</div>
            <div style="color:#FF6B6B;font-size:1.1rem;font-weight:bold;margin-bottom:8px;">${formattedPrice}</div>
            <a href="https://www.mcsquareofficials.com/inventory.html" style="display:inline-block;background:#FF6B6B;color:white;padding:8px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">購入はこちら</a>
          </td>
        </tr>
      `;
    });
  }

  html += `
      </table>
      <div style="text-align:center;color:#636E72;font-size:0.9rem;margin:16px 0;">ご購入はウェブサイトからお願いします</div>
    </div>
  </div>
  `;
  return html;
}

// メルマガHTMLと件名を生成する関数
function getMagazineMail(selectedMonth) {
  const subject = `${selectedMonth}分の新商品です！`;
  const html = getMagazineHtml(selectedMonth) + `
    <div style="margin-top:32px;text-align:center;font-size:1rem;color:#636E72;">
      ご不明点があればお気軽にご連絡ください。<br>
      <b>MC Square（エムシースクエア）</b><br>
      電話：045-410-7023<br>
      Instagram：@mc.square_official<br>
      メール：sales@mcsquareofficials.com<br>
      <div style="margin-top:12px;color:#FF6B6B;">※価格は50cmあたりの単価です。</div>
    </div>
  `;
  return { subject, html };
} 