const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

  console.log('Function invoked:', event.path);
  console.log('Request body:', event.body);

  try {
    const { line_items, mode, success_url, cancel_url, metadata } = JSON.parse(event.body);

    if (!line_items || line_items.length === 0) {
      console.error('Validation Error: line_items are missing.');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cart is empty.' })
      };
    }

    console.log('Creating Stripe session with items:', line_items.length);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode,
      success_url,
      cancel_url,
      metadata,
      currency: 'jpy',
      locale: 'ja',
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
    });

    console.log('Stripe session created successfully. ID:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error('Stripe error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '決済セッションの作成に失敗しました',
        details: error.message 
      })
    };
  }
}; 