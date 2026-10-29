import { GoogleGenAI } from '@google/genai';

export async function discoverGoogleSearchSources(
  topic: string,
  discipline: string,
  getGeminiClient?: () => GoogleGenAI
): Promise<any[]> {
  if (!getGeminiClient || process.env['GEMINI_ENABLE_GOOGLE_SEARCH_GROUNDING'] === 'false') return [];
  try {
    const response = await getGeminiClient().models.generateContent({
      model: 'flash',
      contents: `Search the web for credible academic and primary sources about: ${topic}. Discipline: ${discipline}. Prefer university, government, archive, journal, and publisher pages. Do not invent authors, publication years, DOI, or titles.`,
      config: { temperature: 0.1, tools: [{ googleSearch: {} }] }
    });
    const candidates = (response as unknown as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }> }).candidates || [];
    const chunks = candidates.flatMap(candidate => candidate.groundingMetadata?.groundingChunks || []);
    return chunks.flatMap((chunk, index) => {
      const url = String(chunk.web?.uri || '').trim();
      const title = String(chunk.web?.title || '').trim();
      if (!(url.startsWith('https://') || url.startsWith('http://')) || !title) return [];
      return [{ id: `GOOGLE-SEARCH-${index + 1}`, title, url, authors: [], year: 'n.d.', sourceType: 'GoogleSearch', verificationStatus: 'retrieved-not-verified', snippet: '', peerReviewed: false }];
    });
  } catch {
    console.warn('Google Search grounding was unavailable; academic index discovery will continue.');
    return [];
  }
}
