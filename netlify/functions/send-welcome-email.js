const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POSTリクエストのみ処理
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, displayName } = JSON.parse(event.body);

    // メール送信の設定
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // メールの内容
    const mailOptions = {
      from: `"MC Square" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎨 クラフトキッチンへようこそ！会員登録が完了しました',
      html: `
        <div style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎨</div>
              <h1 style="color: #333; margin: 0; font-size: 24px;">クラフトキッチン</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">手作りのある暮らし</p>
            </div>

            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">会員登録完了のお知らせ</h2>
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                ${displayName || 'ユーザー'}様<br><br>
                クラフトキッチンへの会員登録が完了いたしました。<br>
                これで作品の投稿や、他のユーザーの作品を楽しむことができます。
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">🎯 できること</h3>
              <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>自分の作品を投稿・共有</li>
                <li>他のユーザーの作品を閲覧・いいね</li>
                <li>作り方の詳細を動画やテキストで説明</li>
                <li>おすすめ商品の紹介</li>
                <li>手作りコミュニティとの交流</li>
              </ul>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://mc-square.netlify.app/gallery" 
                 style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                🎨 ギャラリーを見る
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">📧 お問い合わせ</h3>
              <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.5;">
                ご不明な点がございましたら、お気軽にお問い合わせください。<br>
                <strong>MC Square（エムシースクエア）</strong><br>
                電話：045-410-7023<br>
                Instagram：@mc.square_official<br>
                メール：retail@mcsquareofficials.com
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ※このメールは自動送信されています。<br>
                ※返信はできませんのでご了承ください。
              </p>
            </div>
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
        message: 'Welcome email sent successfully' 
      })
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send welcome email',
        details: error.message 
      })
    };
  }
}; 