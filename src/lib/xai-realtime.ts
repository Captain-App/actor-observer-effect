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
      console.log('%c[xAI] Starting WebRTC Initialization...', 'color: #3b82f6; font-weight: bold');

      // 1) Get ephemeral token
      console.log('[xAI] Step 1: Fetching token from Supabase...');
      const { data, error: invokeError } = await supabase.functions.invoke('xai-realtime-token');
      if (invokeError) {
        console.error('[xAI] Supabase invocation error:', invokeError);
        throw invokeError;
      }
      
      const token = data?.value || data?.client_secret?.value;
      if (!token) {
        console.error('[xAI] No token found in response:', data);
        throw new Error('Failed to get xAI ephemeral token');
      }
      console.log('[xAI] Ephemeral token acquired');

      // 2) Request microphone access FIRST
      console.log('[xAI] Step 2: Requesting microphone permission...');
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[xAI] Microphone access granted');
      } catch (err: any) {
        console.error('[xAI] Microphone permission denied:', err);
        throw new Error(`Microphone access denied: ${err.message}`);
      }

      // 3) Create PeerConnection
      console.log('[xAI] Step 3: Creating RTCPeerConnection...');
      this.pc = new RTCPeerConnection();

      // Handle AI voice stream
      this.pc.ontrack = (e) => {
        console.log('%c[xAI] Received AI audio track!', 'color: #10b981; font-weight: bold');
        this.audioEl.srcObject = e.streams[0];
        this.audioEl.play().catch(err => console.error('[xAI] Audio play blocked:', err));
      };

      // Add local voice track
      this.localStream.getTracks().forEach(track => {
        console.log('[xAI] Adding local track to PeerConnection:', track.kind);
        this.pc!.addTrack(track, this.localStream!);
      });

      // 4) Setup Data Channel for events
      console.log('[xAI] Step 4: Creating data channel "oai-events"...');
      this.dc = this.pc.createDataChannel('oai-events');
      
      this.dc.onopen = () => {
        console.log('%c[xAI] Data Channel Open!', 'color: #10b981; font-weight: bold');
        this.isConnected = true;
        
        console.log('[xAI] Step 7: Sending session.update...');
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
      };

      this.dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('%c[xAI] Incoming Event:', 'color: #8b5cf6', event.type, event);
          this.onMessage(event);
        } catch (err) {
          console.error('[xAI] Failed to parse data channel message:', err);
        }
      };

      // 5) WebRTC Offer/Answer via xAI API
      console.log('[xAI] Step 5: Creating SDP Offer...');
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      console.log('[xAI] Step 6: Exchanging SDP with xAI (POST https://api.x.ai/v1/realtime)...');
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
        const errText = await sdpResponse.text();
        console.error('[xAI] SDP Exchange Failed:', sdpResponse.status, errText);
        throw new Error(`xAI API error (${sdpResponse.status}): ${errText}`);
      }

      const answerSdp = await sdpResponse.text();
      console.log('[xAI] Received SDP Answer from xAI');
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log('%c[xAI] WebRTC Handshake Complete!', 'color: #10b981; font-weight: bold');

    } catch (err: any) {
      console.error('%c[xAI] Initialization Failed:', 'color: #ef4444; font-weight: bold', err);
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
    console.log('[xAI] Disconnecting...');
    this.isConnected = false;
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
  }

  getIsConnected() {
    return this.isConnected;
  }
}
