export default {
  async fetch(request, env) {
    // 1. Check if it's a POST request (Telegram webhooks are always POST)
    if (request.method === 'POST') {
      try {
        const update = await request.json();
        
        // Use 'env.macrobot' to match your Cloudflare Dashboard binding
        const botToken = env.macrobot; 
        
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const userText = update.message.text;
          
          // Use 'await' to ensure the message sends before the worker shuts down
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ Qwen code fixed! You said: ${userText}`
            })
          });
        }
        
        return new Response('OK', { status: 200 });
      } catch (error) {
        // If it crashes, this will show up in your 'Logs' tab
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    
    return new Response('Send a POST request from Telegram!', { status: 200 });
  }
};
