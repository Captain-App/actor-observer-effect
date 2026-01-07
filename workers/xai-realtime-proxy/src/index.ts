/**
 * xAI Grok Realtime Proxy Worker
 * 
 * Proxies WebSocket connections to xAI's Realtime API.
 * Extracts ephemeral token and model from query parameters.
 */

export interface Env {
  XAI_REALTIME_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // 1. Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'xai-realtime-proxy' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. WebSocket upgrade check
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    // 3. Extract configuration from query params
    const token = url.searchParams.get('token');
    const model = url.searchParams.get('model') || 'grok-beta';

    if (!token) {
      return new Response('Missing token query parameter', { status: 400 });
    }

    // 4. Connect to xAI Realtime API
    // xAI uses the same WebSocket subprotocol pattern as OpenAI for passing the API key
    const xaiWsUrl = `${env.XAI_REALTIME_URL}?model=${model}`;
    
    console.log(`[Proxy] Connecting to xAI: ${xaiWsUrl} with token starting with ${token.substring(0, 10)}`);
    
    let xaiWs: WebSocket;
    try {
      xaiWs = new WebSocket(xaiWsUrl, [
        'realtime',
        `openai-insecure-api-key.${token}`,
        'openai-beta.realtime-v1',
      ]);
    } catch (e: any) {
      console.error('[Proxy] Error creating xAI WebSocket:', e);
      return new Response(`Error creating xAI WebSocket: ${e.message}`, { status: 500 });
    }

    // 5. Create WebSocket pair for the client
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // 6. Proxy logic
    
    // Queue for messages received before xAI connection is ready
    const pendingMessages: (string | ArrayBuffer)[] = [];
    let xaiReady = false;
    
    // xAI -> Client
    xaiWs.addEventListener('message', (event) => {
      try {
        console.log(`[Proxy] xAI -> Client: ${event.data.toString().substring(0, 100)}...`);
        server.send(event.data);
      } catch (e) {
        console.error('[Proxy] Error sending to client:', e);
      }
    });

    xaiWs.addEventListener('open', () => {
      console.log('[Proxy] Connected to xAI');
      xaiReady = true;
      
      // Flush any queued messages
      if (pendingMessages.length > 0) {
        console.log(`[Proxy] Flushing ${pendingMessages.length} queued messages to xAI`);
        for (const msg of pendingMessages) {
          try {
            xaiWs.send(msg);
          } catch (e) {
            console.error('[Proxy] Error flushing queued message:', e);
          }
        }
        pendingMessages.length = 0;
      }
      
      server.send(JSON.stringify({ 
        type: 'worker_log', 
        message: 'Connected to xAI Realtime API via Proxy' 
      }));
    });

    xaiWs.addEventListener('error', (e) => {
      console.error('[Proxy] xAI WebSocket error:', e);
      server.send(JSON.stringify({ 
        type: 'error', 
        error: 'xAI connection error',
        details: e instanceof Error ? e.message : 'Unknown WebSocket error'
      }));
    });

    xaiWs.addEventListener('close', (e) => {
      console.log('[Proxy] xAI connection closed:', e.code, e.reason);
      server.send(JSON.stringify({
        type: 'worker_log',
        message: `xAI connection closed: ${e.code} ${e.reason}`
      }));
      server.close(e.code, e.reason);
    });

    // Client -> xAI
    server.addEventListener('message', (event) => {
      try {
        console.log(`[Proxy] Client -> xAI: ${event.data.toString().substring(0, 100)}...`);
        if (xaiReady && xaiWs.readyState === WebSocket.OPEN) {
          xaiWs.send(event.data);
        } else {
          // Queue the message to be sent when xAI connection is ready
          console.log(`[Proxy] xAI not ready yet (state: ${xaiWs.readyState}), queueing message`);
          pendingMessages.push(event.data);
          server.send(JSON.stringify({
            type: 'worker_log',
            message: `Message queued (xAI connecting...)`
          }));
        }
      } catch (e) {
        console.error('[Proxy] Error sending to xAI:', e);
      }
    });

    server.addEventListener('close', (e) => {
      console.log('[Proxy] Client connection closed:', e.code, e.reason);
      xaiWs.close(e.code, e.reason);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};

