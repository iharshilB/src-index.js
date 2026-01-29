/**
 * MACRO ANALYSIS TELEGRAM BOT
 * Cloudflare Workers Entry Point
 * 
 * DESIGN PHILOSOPHY:
 * - Reliability > features
 * - Never fail silently
 * - Institutional tone, no trading signals
 * - Graceful fallbacks are features
 */

import { handleWebhook } from './telegram/webhook.js';
import { logRequest, logError } from './utils/logger.js';

/**
 * Main Worker fetch handler
 * Execution chain: Telegram → Webhook → Worker → Logic → API → Analysis → Response
 */
export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    
    try {
      // Log incoming request
      logRequest(request, env);
      
      // Route to Telegram webhook handler
      const response = await handleWebhook(request, env, ctx);
      
      // Log response time
      const duration = Date.now() - start;
      console.log(`Request completed in ${duration}ms`);
      
      return response;
      
    } catch (error) {
      logError('Worker fetch failed', error, env);
      
      // NEVER fail silently - always respond to Telegram
      return new Response(
        JSON.stringify({
          method: 'sendMessage',
          chat_id: extractChatId(request),
          text: 'Service experiencing temporary constraints. I\'ll reassess conditions shortly.',
          parse_mode: 'Markdown'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200 // Always 200 to Telegram to prevent retries
        }
      );
    }
  }
};

/**
 * Extract chat_id from request for error fallback
 */
function extractChatId(request) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chat_id');
    return chatId || null;
  } catch {
    return null;
  }
}
