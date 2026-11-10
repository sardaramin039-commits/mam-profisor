import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiLiveClientService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;

  public isConnected = signal<boolean>(false);
  public isRecording = signal<boolean>(false);
  public isModelSpeaking = signal<boolean>(false);
  public lastTranscript = signal<string>('');

  /**
   * Connect to the server-side Live API WebSocket gateway (/api/live)
   */
  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected.set(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.audio) {
              this.playAudioChunk(data.audio);
            }
            if (data.interrupted) {
              this.stopAudioPlayback();
            }
            if (data.transcript) {
              this.lastTranscript.set(data.transcript);
            }
          } catch (e) {
            console.warn('Error parsing Live API websocket message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('Live API WebSocket error:', err);
          this.isConnected.set(false);
          reject(err);
        };

        this.ws.onclose = () => {
          this.isConnected.set(false);
          this.stopRecording();
          this.stopAudioPlayback();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Start capturing microphone at 16kHz and streaming to the server
   */
  public async startRecording(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // 16kHz context for capture per Live API specification
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);

    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording() || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const base64 = this.pcmFloat32ToBase64(inputData);
      this.ws.send(JSON.stringify({ audio: base64 }));
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);
    this.isRecording.set(true);
  }

  /**
   * Stop capturing microphone audio
   */
  public stopRecording(): void {
    this.isRecording.set(false);

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
  }

  /**
   * Send real-time text input to the active Live API session
   */
  public sendText(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  /**
   * Disconnect the Live API WebSocket session
   */
  public disconnect(): void {
    this.stopRecording();
    this.stopAudioPlayback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected.set(false);
  }

  /**
   * Play 24kHz PCM audio chunk received from server
   */
  private playAudioChunk(base64Audio: string): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
        this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
        this.nextStartTime = this.outputAudioCtx.currentTime;
      }

      const binaryStr = window.atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Convert 16-bit PCM little-endian to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      const now = this.outputAudioCtx.currentTime;
      const startTime = Math.max(now, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.isModelSpeaking.set(true);
      source.onended = () => {
        if (this.outputAudioCtx && this.outputAudioCtx.currentTime >= this.nextStartTime - 0.05) {
          this.isModelSpeaking.set(false);
        }
      };
    } catch (err) {
      console.warn('Live API audio playback error:', err);
    }
  }

  private stopAudioPlayback(): void {
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
    this.nextStartTime = 0;
    this.isModelSpeaking.set(false);
  }

  private pcmFloat32ToBase64(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < uint8Array.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(uint8Array.subarray(i, i + chunk)));
    }
    return window.btoa(binary);
  }
}
