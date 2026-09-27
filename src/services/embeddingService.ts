/**
 * Secure client-and-server-safe embedding generator service.
 * Proxies embedding generation to the secure backend endpoint.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // If running in server-side Node.js environment with Direct Gemini key
    if (typeof window === 'undefined') {
      try {
        const apiKey = typeof process !== 'undefined' ? process.env['GEMINI_API_KEY'] : undefined;
        if (apiKey) {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: text,
            config: { outputDimensionality: 768 }
          });
          return response.embeddings?.[0]?.values || [];
        }
      } catch (nodeErr) {
        console.error('Node native embedding generation error:', nodeErr);
      }
    }

    // Client-side/standard fallback: Invoke the secure Express backend proxy
    const response = await fetch('/api/generate_embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || 'سەرکەوتوو نەبوو لە پڕۆسەکردنی ڤێکتەر');
    }
    
    const data = await response.json();
    return data.embedding || [];
  } catch (error) {
    console.error('generateEmbedding failed:', error);
    throw error;
  }
}
