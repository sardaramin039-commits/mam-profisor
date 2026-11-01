import { WebSocketServer } from 'ws';
import { Modality } from '@google/genai';
import { getGeminiClient } from './gemini.service';

export function setupGeminiLiveWebSocket(wss: WebSocketServer): void {
  wss.on('connection', async (clientWs: any) => {
    try {
      const ai = getGeminiClient();
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are an intelligent, scholarly Kurdish academic assistant for thesis research.',
        },
        callbacks: {
          onmessage: (message: any) => {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }
        }
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else if (parsed.text) {
            session.sendRealtimeInput({
              text: parsed.text
            });
          }
        } catch (err) {
          console.warn('Live API socket message parse error:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {}
      });
    } catch (err) {
      console.error('Failed to establish Live API session:', err);
      try {
        clientWs.send(JSON.stringify({ error: 'Failed to connect to Live API session' }));
        clientWs.close();
      } catch {}
    }
  });
}
