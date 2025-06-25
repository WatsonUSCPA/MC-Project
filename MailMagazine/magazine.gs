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
  email: 'retail@mcsquareofficials.com',
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

  // すべての商品を表示（5件制限や「他にも～」の誘導を削除）
  const displayProducts = filtered;

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

  if (displayProducts.length === 0) {
    html += '<tr><td style="text-align:center;color:#FF6B6B;">該当データがありません。</td></tr>';
  } else {
    displayProducts.forEach(row => {
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
      メール：retail@mcsquareofficials.com<br>
      <div style="margin-top:12px;color:#FF6B6B;">※価格は50cmあたりの単価です。</div>
    </div>
  `;
  return { subject, html };
}

// メール送信関数（エラーハンドリング付き）
function sendMagazineEmail(selectedMonth, recipientEmail, recipientName = '') {
  try {
    // メールアドレスの形式チェック
    if (!isValidEmail(recipientEmail)) {
      throw new Error('無効なメールアドレスです: ' + recipientEmail);
    }

    const mailData = getMagazineMail(selectedMonth);
    
    // 送信者情報を設定
    const senderName = COMPANY_INFO.name;
    const senderEmail = COMPANY_INFO.email;
    
    // メール送信オプション
    const options = {
      name: senderName,
      htmlBody: mailData.html,
      noReply: false
    };

    // メール送信
    GmailApp.sendEmail(recipientEmail, mailData.subject, '', options);
    
    return {
      success: true,
      message: 'メールを送信しました: ' + recipientEmail
    };
    
  } catch (error) {
    console.error('メール送信エラー:', error);
    return {
      success: false,
      message: 'メール送信に失敗しました: ' + error.message
    };
  }
}

// メールアドレスの形式チェック関数
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 複数のメールアドレスに一括送信
function sendBulkMagazineEmail(selectedMonth, emailList) {
  const results = [];
  
  for (let i = 0; i < emailList.length; i++) {
    const email = emailList[i].trim();
    if (email) {
      const result = sendMagazineEmail(selectedMonth, email);
      results.push({
        email: email,
        success: result.success,
        message: result.message
      });
      
      // 送信間隔を設けてサーバー負荷を軽減
      if (i < emailList.length - 1) {
        Utilities.sleep(1000); // 1秒待機
      }
    }
  }
  
  return results;
}

// 下書き保存機能
function saveDraft(selectedMonth, emailList, draftName = '') {
  try {
    const properties = PropertiesService.getScriptProperties();
    const draftData = {
      month: selectedMonth,
      emails: emailList,
      name: draftName || `${selectedMonth}の下書き`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 下書き一覧を取得
    const draftList = getDraftList();
    const draftId = draftName ? draftName.replace(/[^a-zA-Z0-9]/g, '_') : `draft_${Date.now()}`;
    
    // 下書きを保存
    properties.setProperty(`draft_${draftId}`, JSON.stringify(draftData));
    
    // 下書き一覧を更新
    draftList[draftId] = {
      name: draftData.name,
      month: selectedMonth,
      emailCount: emailList.length,
      createdAt: draftData.createdAt,
      updatedAt: draftData.updatedAt
    };
    properties.setProperty('draft_list', JSON.stringify(draftList));
    
    return {
      success: true,
      message: '下書きを保存しました',
      draftId: draftId
    };
    
  } catch (error) {
    console.error('下書き保存エラー:', error);
    return {
      success: false,
      message: '下書きの保存に失敗しました: ' + error.message
    };
  }
}

// 下書き一覧を取得
function getDraftList() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const draftListJson = properties.getProperty('draft_list');
    return draftListJson ? JSON.parse(draftListJson) : {};
  } catch (error) {
    console.error('下書き一覧取得エラー:', error);
    return {};
  }
}

// 下書きを読み込み
function loadDraft(draftId) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const draftJson = properties.getProperty(`draft_${draftId}`);
    
    if (!draftJson) {
      return {
        success: false,
        message: '下書きが見つかりません'
      };
    }
    
    const draftData = JSON.parse(draftJson);
    return {
      success: true,
      data: draftData
    };
    
  } catch (error) {
    console.error('下書き読み込みエラー:', error);
    return {
      success: false,
      message: '下書きの読み込みに失敗しました: ' + error.message
    };
  }
}

// 下書きを削除
function deleteDraft(draftId) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // 下書きデータを削除
    properties.deleteProperty(`draft_${draftId}`);
    
    // 下書き一覧から削除
    const draftList = getDraftList();
    delete draftList[draftId];
    properties.setProperty('draft_list', JSON.stringify(draftList));
    
    return {
      success: true,
      message: '下書きを削除しました'
    };
    
  } catch (error) {
    console.error('下書き削除エラー:', error);
    return {
      success: false,
      message: '下書きの削除に失敗しました: ' + error.message
    };
  }
}

// 下書きを更新
function updateDraft(draftId, selectedMonth, emailList) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const draftJson = properties.getProperty(`draft_${draftId}`);
    
    if (!draftJson) {
      return {
        success: false,
        message: '更新する下書きが見つかりません'
      };
    }
    
    const draftData = JSON.parse(draftJson);
    draftData.month = selectedMonth;
    draftData.emails = emailList;
    draftData.updatedAt = new Date().toISOString();
    
    // 下書きを更新
    properties.setProperty(`draft_${draftId}`, JSON.stringify(draftData));
    
    // 下書き一覧を更新
    const draftList = getDraftList();
    if (draftList[draftId]) {
      draftList[draftId].month = selectedMonth;
      draftList[draftId].emailCount = emailList.length;
      draftList[draftId].updatedAt = draftData.updatedAt;
      properties.setProperty('draft_list', JSON.stringify(draftList));
    }
    
    return {
      success: true,
      message: '下書きを更新しました'
    };
    
  } catch (error) {
    console.error('下書き更新エラー:', error);
    return {
      success: false,
      message: '下書きの更新に失敗しました: ' + error.message
    };
  }
}

// Gmail下書き保存機能
function saveGmailDraft(selectedMonth, emailList, draftName = '') {
  try {
    // Gmailの権限をテスト
    const testResult = testGmailAccess();
    if (!testResult.success) {
      return {
        success: false,
        message: 'Gmailアクセスエラー: ' + testResult.message
      };
    }

    // メルマガのHTMLと件名を生成
    const mailData = getMagazineMail(selectedMonth);
    const senderName = COMPANY_INFO.name;

    // 宛先は空欄で下書きを作成
    const draft = GmailApp.createDraft(
      '', // 宛先なし
      mailData.subject,
      '',
      {
        name: senderName,
        htmlBody: mailData.html
      }
    );

    const draftNameFinal = draftName || `${selectedMonth}メルマガ`;
    return {
      success: true,
      message: `Gmail下書きを保存しました: ${draftNameFinal}`,
      draftId: draft.getId(),
      recipients: '',
      subject: mailData.subject
    };
  } catch (error) {
    console.error('Gmail下書き保存エラー:', error);
    return {
      success: false,
      message: 'Gmail下書きの保存に失敗しました: ' + error.message
    };
  }
}

// Gmailアクセステスト機能
function testGmailAccess() {
  try {
    // 現在のユーザーのメールアドレスを取得
    const userEmail = Session.getActiveUser().getEmail();

    // Gmailの基本アクセステスト
    const drafts = GmailApp.getDrafts();
    const draftCount = drafts.length;

    // userProfile取得は不要
    return {
      success: true,
      message: 'Gmailアクセス正常',
      userEmail: userEmail,
      draftCount: draftCount
    };
  } catch (error) {
    console.error('Gmailアクセステストエラー:', error);
    return {
      success: false,
      message: error.message,
      errorCode: error.toString()
    };
  }
}

// 権限確認機能
function checkPermissions() {
  try {
    const permissions = {
      gmail: false,
      drive: false,
      spreadsheet: false,
      user: false
    };
    
    // Gmail権限チェック
    try {
      GmailApp.getDrafts();
      permissions.gmail = true;
    } catch (e) {
      console.error('Gmail権限エラー:', e);
    }
    
    // Drive権限チェック
    try {
      DriveApp.getRootFolder();
      permissions.drive = true;
    } catch (e) {
      console.error('Drive権限エラー:', e);
    }
    
    // Spreadsheet権限チェック
    try {
      SpreadsheetApp.getActiveSpreadsheet();
      permissions.spreadsheet = true;
    } catch (e) {
      console.error('Spreadsheet権限エラー:', e);
    }
    
    // ユーザー情報取得
    try {
      Session.getActiveUser().getEmail();
      permissions.user = true;
    } catch (e) {
      console.error('ユーザー権限エラー:', e);
    }
    
    return {
      success: true,
      permissions: permissions,
      userEmail: permissions.user ? Session.getActiveUser().getEmail() : '取得失敗'
    };
    
  } catch (error) {
    console.error('権限確認エラー:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Gmail下書き一覧を取得
function getGmailDraftList() {
  try {
    const drafts = GmailApp.getDrafts();
    const draftList = [];
    
    drafts.forEach(draft => {
      const message = draft.getMessage();
      const subject = message.getSubject();
      const recipients = message.getTo();
      const date = message.getDate();
      
      // メルマガ関連の下書きのみをフィルタ（件名に「メルマガ」や「新商品」が含まれるもの）
      if (subject.includes('メルマガ') || subject.includes('新商品') || subject.includes('分の')) {
        draftList.push({
          id: draft.getId(),
          subject: subject,
          recipients: recipients,
          date: date,
          recipientCount: recipients ? recipients.split(',').length : 0
        });
      }
    });
    
    // 日付順でソート（新しい順）
    draftList.sort((a, b) => b.date - a.date);
    
    return draftList;
    
  } catch (error) {
    console.error('Gmail下書き一覧取得エラー:', error);
    return [];
  }
}

// Gmail下書きを削除
function deleteGmailDraft(draftId) {
  try {
    const draft = GmailApp.getDraft(draftId);
    if (draft) {
      draft.deleteDraft();
      return {
        success: true,
        message: 'Gmail下書きを削除しました'
      };
    } else {
      return {
        success: false,
        message: '下書きが見つかりません'
      };
    }
    
  } catch (error) {
    console.error('Gmail下書き削除エラー:', error);
    return {
      success: false,
      message: 'Gmail下書きの削除に失敗しました: ' + error.message
    };
  }
} 