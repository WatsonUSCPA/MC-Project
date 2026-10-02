const nodemailer = require('nodemailer');
const { verifyFirebaseIdToken, getBearerToken } = require('../lib/firebase-auth');

// メール設定テスト用。誰でも任意の宛先に送れてしまわないよう、
// 1) 環境変数 ENABLE_TEST_EMAIL=true のときだけ有効
// 2) ログイン中ユーザー本人（Firebase ID トークンで確認）のメールアドレスにだけ送信

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': (process.env.SITE_URL || process.env.URL || 'https://mcsquareofficials.com'),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (process.env.ENABLE_TEST_EMAIL !== 'true') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  }
  let user;
  try {
    user = await verifyFirebaseIdToken(getBearerToken(event.headers));
  } catch (e) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  if (!user.email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No email on account' }) };
  }

  try {
    const testEmail = user.email;

    // メール送信の設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // テストメールの内容
    const mailOptions = {
      from: `"MC Square" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🧪 メール設定テスト - MC Square',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
            <h1 style="color: #333;">🧪 メール設定テスト</h1>
            <p style="color: #666; font-size: 16px;">
              このメールが届いているということは、メール設定が正常に動作しています！
            </p>
            <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border-radius: 5px;">
              <p style="color: #155724; margin: 0; font-weight: bold;">
                ✅ メール送信機能が正常に動作しています
              </p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              送信日時: ${new Date().toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      `
    };

    // メール送信
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Test email sent successfully' 
      })
    };

  } catch (error) {
    console.error('Error sending test email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send test email',
        details: error.message 
      })
    };
  }
}; 