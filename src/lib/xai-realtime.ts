import { supabase } from './supabase';

export interface XAIEvent {
  type: string;
  [key: string]: any;
}

export class XAIRealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private localStream: MediaStream | null = null;
  private isConnected: boolean = false;
  private nextPlayTime: number = 0;

  constructor(
    private onMessage: (event: XAIEvent) => void,
    private onError: (error: Error) => void
  ) {}

  async init(instructions: string) {
    try {
      console.log('%c[xAI] Starting Initialization (via Cloudflare Proxy)...', 'color: #3b82f6; font-weight: bold');

      // 1) Get ephemeral token
      const { data, error: invokeError } = await supabase.functions.invoke('xai-realtime-token');
      if (invokeError) throw invokeError;
      
      const token = data?.value || data?.client_secret?.value;
      if (!token) throw new Error('Failed to get xAI ephemeral token');
      console.log('[xAI] Token acquired');

      // 2) Request microphone
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[xAI] Microphone granted');
      } catch (err: any) {
        throw new Error(`Microphone access denied: ${err.message}`);
      }

      // 3) Establish WebSocket connection via Proxy
      const proxyUrl = 'wss://xai-realtime-proxy.captainapp.workers.dev';
      const wsUrl = `${proxyUrl}/?token=${token}`;
      console.log(`[xAI] Connecting to: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('%c[xAI] Proxy Socket Open. Waiting for worker logs...', 'color: #10b981; font-weight: bold');
      };

      this.ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          
          // Handle logs sent from the worker
          if (event.type === 'worker_log') {
            console.log('%c' + event.message, 'color: #94a3b8; font-style: italic');
            return;
          }

          console.log('%c[xAI] Event:', 'color: #8b5cf6', event.type, event);
          
          if (event.type === 'session.created' || event.type === 'session.updated') {
            console.log('%c[xAI] Session Active!', 'color: #10b981; font-weight: bold');
            this.isConnected = true;
            
            // Send initial config after session is created
            this.sendEvent({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: instructions,
                voice: 'Leo',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                turn_detection: { type: 'server_vad' }
              },
            });
          }

          if (event.type === 'error') {
            console.error('[xAI] Server error:', event.error);
            this.onError(new Error(event.error?.message || 'xAI server error'));
          }

          if (event.type === 'response.output_audio.delta') {
            this.handleAudioDelta(event.delta);
          }

          this.onMessage(event);
        } catch (err) {
          console.error('[xAI] Non-JSON or malformed message:', e.data);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[xAI] WebSocket Error Observed');
        this.onError(new Error('WebSocket connection error'));
      };

      this.ws.onclose = (e) => {
        console.warn('[xAI] WebSocket Closed. Code:', e.code, 'Reason:', e.reason);
        this.disconnect();
      };

      // 6) Setup Recording Pipeline
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      this.input = this.audioContext.createMediaStreamSource(this.localStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
        }));
      };

      this.input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

    } catch (err: any) {
      console.error('%c[xAI] Init Failed:', 'color: #ef4444; font-weight: bold', err);
      this.onError(err instanceof Error ? err : new Error(String(err)));
      this.disconnect();
    }
  }

  private handleAudioDelta(base64Delta: string) {
    if (!this.audioContext) return;
    const binary = atob(base64Delta);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    const now = this.audioContext.currentTime;
    if (this.nextPlayTime < now) this.nextPlayTime = now;
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  sendEvent(event: XAIEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  disconnect() {
    this.isConnected = false;
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.input) { this.input.disconnect(); this.input = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }

  getIsConnected() { return this.isConnected; }
}
