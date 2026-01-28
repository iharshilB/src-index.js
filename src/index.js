/**
 * MacroBot - Professional Macro-Economic Analysis Assistant
 * Cloudflare Worker Entry Point
 * 
 * Main handler for all incoming requests
 */

import { handleTelegramUpdate } from './telegram.js';
import { sendTelegramMessage } from './utils/messages.js';

/**
 * Main request handler
 */
export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request, env, ctx) {
    // Store environment for this request
    const environment = env;
    
    // Parse URL
    const url = new URL(request.url);
    
    // Handle Telegram webhook
    if (request.method === 'POST' && request.headers.get('content-type') === 'application/json') {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, environment);
        return new Response('OK', { status: 200 });
      } catch (error) {
        console.error('Error processing update:', error);
        return new Response('Error', { status: 500 });
      }
    }
    
    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('MacroBot is running ✅\n\nVersion: 1.0.0', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Webhook info endpoint
    if (request.method === 'GET' && url.pathname === '/webhook') {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${environment.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
        );
        const data = await response.json();
        return new Response(JSON.stringify(data, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Stats endpoint (admin only)
    if (request.method === 'GET' && url.pathname === '/stats') {
      try {
        let userCount = 0;
        if (environment.USER_DATA) {
          const keys = await environment.USER_DATA.list();
          userCount = keys.keys.length;
        }
        
        return new Response(
          JSON.stringify({
            status: 'operational',
            timestamp: new Date().toISOString(),
            userCount: userCount,
            environment: environment.ENVIRONMENT || 'production'
          }, null, 2),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  /**
   * Scheduled cron trigger
   * Runs daily at midnight UTC to reset user counters
   */
  async scheduled(event, env, ctx) {
    console.log('Running scheduled task: Daily user reset');
    
    try {
      if (env.USER_DATA) {
        const keys = await env.USER_DATA.list();
        
        for (const key of keys.keys) {
          const userData = await env.USER_DATA.get(key.name);
          if (userData) {
            const user = JSON.parse(userData);
            
            // Reset daily counter
            user.messageCount = 0;
            user.lastReset = new Date().toISOString();
            
            await env.USER_DATA.put(key.name, JSON.stringify(user));
          }
        }
        
        console.log(`Reset ${keys.keys.length} users`);
      }
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  }
};
