// Handle Telegram webhook
if (request.method === 'POST' && request.headers.get('content-type') === 'application/json') {
  try {
    const update = await request.json();
    
    // DEBUG: Log received message
    console.log('Received:', update.message?.text);
    
    // Send immediate reply for ANY message
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Send reply directly (bypass other functions)
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Echo: ${text}`
        })
      });
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error', { status: 500 });
  }
}
