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
  private audioQueue: Int16Array[] = [];
  private isPlaying: boolean = false;
  private nextPlayTime: number = 0;

  constructor(
    private onMessage: (event: XAIEvent) => void,
    private onError: (error: Error) => void
  ) {}

  async init(instructions: string) {
    try {
      console.log('[xAI] Initializing realtime client (WebSocket)');

      // 1) Get ephemeral token from Supabase Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('xai-realtime-token');
      if (invokeError) throw invokeError;
      
      const token = data?.value || data?.client_secret?.value;
      if (!token) {
        throw new Error('Failed to get xAI ephemeral token');
      }

      // 2) Establish WebSocket connection
      this.ws = new WebSocket('wss://api.x.ai/v1/realtime');

      this.ws.onopen = () => {
        console.log('[xAI] WebSocket connected, authenticating...');
        // Authenticate
        this.sendEvent({
          type: 'session.authenticate',
          token: token
        });

        // Configure session as per xAI documentation
        this.sendEvent({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: instructions,
            voice: 'Leo',
            audio: {
              input: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                }
              },
              output: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                }
              }
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
          },
        });
      };

      this.ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          
          if (event.type === 'session.created' || event.type === 'session.updated') {
            this.isConnected = true;
            console.log('[xAI] Session active');
          }

          if (event.type === 'response.output_audio.delta') {
            this.handleAudioDelta(event.delta);
          }

          this.onMessage(event);
        } catch (err) {
          console.error('[xAI] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[xAI] WebSocket error:', e);
        this.onError(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('[xAI] WebSocket closed');
        this.disconnect();
      };

      // 3) Setup Audio Recording
      console.log('[xAI] Requesting microphone access...');
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[xAI] Microphone access granted');
      } catch (err: any) {
        console.error('[xAI] Microphone access denied:', err);
        throw new Error(`Microphone access denied: ${err.message}`);
      }

      console.log('[xAI] Initializing AudioContext...');
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        console.log('[xAI] AudioContext initialized at', this.audioContext.sampleRate, 'Hz');
      } catch (err: any) {
        console.error('[xAI] AudioContext initialization failed:', err);
        throw new Error(`AudioContext failed: ${err.message}`);
      }

      this.input = this.audioContext.createMediaStreamSource(this.localStream);
      
      // ScriptProcessor for 24kHz PCM16 mono
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64 encode and send
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        this.sendEvent({
          type: 'input_audio_buffer.append',
          audio: base64
        });
      };

      this.input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

    } catch (err: any) {
      console.error('[xAI] Initialization error:', err);
      this.onError(err instanceof Error ? err : new Error(String(err)));
      this.disconnect();
    }
  }

  private handleAudioDelta(base64Delta: string) {
    if (!this.audioContext) return;

    const binary = atob(base64Delta);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  sendEvent(event: XAIEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('[xAI] WebSocket not ready for event:', event.type);
    }
  }

  disconnect() {
    console.log('[xAI] Disconnecting');
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.input) {
      this.input.disconnect();
      this.input = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }

  getIsConnected() {
    return this.isConnected;
  }
}
