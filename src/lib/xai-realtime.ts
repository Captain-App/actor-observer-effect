import { supabase } from './supabase';

export interface XAIEvent {
  type: string;
  [key: string]: any;
}

export class XAIRealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private localStream: MediaStream | null = null;
  private isConnected: boolean = false;

  constructor(
    private onMessage: (event: XAIEvent) => void,
    private onError: (error: Error) => void
  ) {
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
  }

  async init(instructions: string) {
    try {
      console.log('[xAI] Initializing realtime client');

      // 1) Get ephemeral token from Supabase Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('xai-realtime-token');
      
      if (invokeError) throw invokeError;
      
      // xAI response has 'value' directly at the root, or within client_secret
      console.log('[xAI] Token response data:', JSON.stringify(data));
      const token = data?.value || data?.client_secret?.value;
      if (!token) {
        console.error('[xAI] Invalid token response. Available keys:', Object.keys(data || {}));
        throw new Error('Failed to get xAI ephemeral token');
      }

      // 2) Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3) Create PeerConnection
      this.pc = new RTCPeerConnection();

      // Handle remote tracks (AI voice)
      this.pc.ontrack = (e) => {
        console.log('[xAI] Received remote audio track');
        this.audioEl.srcObject = e.streams[0];
        this.audioEl.play().catch(err => console.error('[xAI] Audio play blocked:', err));
      };

      // Add local audio track
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });

      // 4) Data channel for events
      this.dc = this.pc.createDataChannel('oai-events'); // Using oai-events as per compatible spec
      
      this.dc.addEventListener('open', () => {
        console.log('[xAI] Data channel open');
        this.isConnected = true;
        
        // Send initial session configuration
        this.sendEvent({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: instructions,
            voice: 'Leo', // Using the Leo voice as requested (case sensitive)
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
          },
        });
      });

      this.dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          this.onMessage(event);
        } catch (err) {
          console.error('[xAI] Failed to parse message:', err);
        }
      });

      // 5) WebRTC Offer/Answer via xAI Realtime API
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const baseUrl = 'https://api.x.ai/v1/realtime';
      const model = 'grok-beta';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`xAI API error (${sdpResponse.status}): ${errorText}`);
      }

      const answer = { type: 'answer' as RTCSdpType, sdp: await sdpResponse.text() };
      await this.pc.setRemoteDescription(answer);

      console.log('[xAI] WebRTC connection established');
    } catch (err: any) {
      console.error('[xAI] Initialization error detailed:', {
        name: err.name,
        message: err.message,
        error: err
      });
      this.onError(err instanceof Error ? err : new Error(String(err)));
      this.disconnect();
    }
  }

  sendEvent(event: XAIEvent) {
    if (this.dc?.readyState === 'open') {
      this.dc.send(JSON.stringify(event));
    } else {
      console.warn('[xAI] Data channel not ready for event:', event.type);
    }
  }

  disconnect() {
    console.log('[xAI] Disconnecting');
    this.isConnected = false;
    this.dc?.close();
    this.pc?.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
    this.dc = null;
    this.pc = null;
    this.localStream = null;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

