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
  private silenceGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private localStream: MediaStream | null = null;
  private isConnected: boolean = false;
  private nextPlayTime: number = 0;
  private allowMicStreaming: boolean = false;
  private didTriggerGreeting: boolean = false;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isInterrupted: boolean = false;
  private currentResponseId: string | null = null;
  private lastInterruptedResponseId: string | null = null;

  constructor(
    private onMessage: (event: XAIEvent) => void,
    private onError: (error: Error) => void,
    private onToolCall?: (name: string, args: any) => Promise<any>
  ) {}

  async init(instructions: string, tools?: any[]) {
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
      const wsUrl = `${proxyUrl}/?token=${token}&model=grok-beta`;
      console.log(`[xAI] Connecting to: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('%c[xAI] Proxy Socket Open. Sending session.update...', 'color: #10b981; font-weight: bold');

        // Configure session immediately (xAI won't send session.updated until we do)
        this.sendEvent({
          type: 'session.update',
          session: {
            model: 'grok-beta', // Explicitly set model in session
            modalities: ['text', 'audio'],
            instructions,
            voice: 'leo',
            tools: tools || [],
            tool_choice: 'auto',
            audio: {
              input: { format: { type: 'audio/pcm', rate: 24000 } },
              output: { format: { type: 'audio/pcm', rate: 24000 } },
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 400,
            },
          },
        });
      };

      this.ws.onmessage = async (e) => {
        try {
          const event = JSON.parse(e.data);
          
          // Handle logs sent from the worker
          if (event.type === 'worker_log') {
            console.log('%c' + event.message, 'color: #94a3b8; font-style: italic');
            return;
          }

          console.log('%c[xAI] Event:', 'color: #8b5cf6', event.type, event);
          
          // Keepalive
          if (event.type === 'ping') {
            this.onMessage(event);
            return;
          }

          // Consider the connection "live" once we have a conversation/session on the server.
          if (event.type === 'conversation.created') {
            this.isConnected = true;
          }

          if (event.type === 'session.created' || event.type === 'session.updated') {
            console.log('%c[xAI] Session Status:', 'color: #10b981; font-weight: bold', {
              type: event.type,
              voice: event.session?.voice,
              model: event.session?.model,
              vad: event.session?.turn_detection
            });
            this.isConnected = true;

            // Trigger greeting ONLY after session is updated with our instructions and voice.
            if (event.type === 'session.updated' && !this.didTriggerGreeting) {
              this.didTriggerGreeting = true;
              console.log('%c[xAI] Session updated. Triggering initial greeting...', 'color: #10b981');
              this.sendEvent({ 
                type: 'response.create'
              } as any);
            }
          }

          if (event.type === 'response.created') {
            // This is a TRUE barge-in or a new turn.
            // Mark the previous response as interrupted so we don't play any more of its chunks.
            if (this.currentResponseId) {
              this.lastInterruptedResponseId = this.currentResponseId;
            }
            
            this.currentResponseId = event.response?.id;
            this.isInterrupted = false; 
            this.nextPlayTime = 0;
            
            // Hard stop all previous sources immediately.
            this.activeSources.forEach(source => {
              try { source.stop(); } catch (e) {}
            });
            this.activeSources.clear();

            if (this.masterGain && this.audioContext) {
              const now = this.audioContext.currentTime;
              this.masterGain.gain.cancelScheduledValues(now);
              this.masterGain.gain.setValueAtTime(1, now);
            }

            console.log('%c[xAI] Response Created (Turn Start):', 'color: #10b981', {
              id: event.response?.id,
              voice: event.response?.voice,
              status: event.response?.status
            });
          }

          if (event.type === 'input_audio_buffer.speech_started') {
            this.fadeAndStop();
          }

          if (event.type === 'input_audio_buffer.speech_stopped') {
            console.log('%c[xAI] Speech stopped. Fading back in...', 'color: #10b981');
            this.isInterrupted = false; 
            
            if (this.masterGain && this.audioContext) {
              const now = this.audioContext.currentTime;
              // Fade back in over 400ms if no new response has taken over
              this.masterGain.gain.cancelScheduledValues(now);
              this.masterGain.gain.exponentialRampToValueAtTime(1, now + 0.4);
            }
          }

          if (event.type === 'error') {
            console.error('[xAI] Server error:', event.error);
            this.onError(new Error(event.error?.message || 'xAI server error'));
          }

          if (event.type === 'response.output_audio.delta') {
            // Once we have assistant audio, we can safely enable mic streaming (prevents feedback loop from
            // keeping VAD permanently "speech_started" before the first greeting).
            if (!this.allowMicStreaming) {
              this.allowMicStreaming = true;
              console.log('%c[xAI] Assistant audio started; enabling mic streaming', 'color: #10b981');
            }
            this.handleAudioDelta(event.delta, event.response_id);
          }

          if (event.type === 'response.function_call_arguments.done') {
            const { name, call_id, arguments: argsJson } = event;
            console.log(`%c[xAI] Tool Call: ${name}`, 'color: #f59e0b; font-weight: bold', argsJson);
            
            const args = JSON.parse(argsJson);
            let output = { error: 'Tool not implemented' };
            
            if (this.onToolCall) {
              try {
                output = await this.onToolCall(name, args);
              } catch (err: any) {
                output = { error: err.message };
              }
            }

            this.sendEvent({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id,
                output: JSON.stringify(output)
              }
            });
            this.sendEvent({ type: 'response.create' });
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

      // 6) Setup Recording Pipeline (mic -> processor -> zero-gain -> destination)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);

      this.input = this.audioContext.createMediaStreamSource(this.localStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.silenceGain = this.audioContext.createGain();
      this.silenceGain.gain.value = 0;
      
      this.processor.onaudioprocess = (e) => {
        // Don't stream mic audio until we're ready (after greeting begins / server is ready)
        if (!this.allowMicStreaming) return;
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
      this.processor.connect(this.silenceGain);
      this.silenceGain.connect(this.audioContext.destination);

    } catch (err: any) {
      console.error('%c[xAI] Init Failed:', 'color: #ef4444; font-weight: bold', err);
      this.onError(err instanceof Error ? err : new Error(String(err)));
      this.disconnect();
    }
  }

  private handleAudioDelta(base64Delta: string, responseId?: string) {
    if (!this.audioContext || !this.masterGain) return;
    
    // Ignore audio ONLY if it belongs to a response we've explicitly killed.
    // We NO LONGER check this.isInterrupted here, because we want audio to keep 
    // scheduling in the background during a potential false-positive fade.
    if (responseId && responseId === this.lastInterruptedResponseId) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

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
    source.connect(this.masterGain);
    
    // Track active sources so we can stop them on interruption
    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);

    const now = this.audioContext.currentTime;
    if (this.nextPlayTime < now) this.nextPlayTime = now;
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  private async fadeAndStop() {
    if (!this.masterGain || !this.audioContext || this.isInterrupted) return;
    
    console.log('%c[xAI] Speech started. Fading out...', 'color: #f59e0b');
    this.isInterrupted = true;
    
    const now = this.audioContext.currentTime;
    
    // Softer fade out over 400ms
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    
    // We NO LONGER reset nextPlayTime here or set lastInterruptedResponseId.
    // We allow the audio deltas to keep scheduling in silence.
    // If it was just noise, we'll fade back in.
    // If it was a real barge-in, response.created will do the hard cut.
  }

  sendEvent(event: XAIEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  disconnect() {
    this.isConnected = false;
    this.allowMicStreaming = false;
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.input) { this.input.disconnect(); this.input = null; }
    if (this.silenceGain) { this.silenceGain.disconnect(); this.silenceGain = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }

  getIsConnected() { return this.isConnected; }
}
