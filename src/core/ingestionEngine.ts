import { cleanKurdishText } from '../utils/textProcessor';
import { generateEmbedding } from '../services/embeddingService';
import { saveAcademicData } from '../services/databaseService';

export interface IngestionDocument {
  id: string;
  title: string;
  content: string;
}

/**
 * processDocumentBatch: Core ingestion function that cleans Kurdish text,
 * builds semantic vector embeddings, and registers documents securely into Firestore.
 */
export const processDocumentBatch = async (documents: IngestionDocument[]): Promise<void> => {
  console.log(`دەستپێکردنی پڕۆسەی ئیندێکسکردنی ${documents.length} پەڕگە...`);

  for (const doc of documents) {
    try {
      // 1. Clean Kurdish text standardizing unicode vowels and removing extra space
      const cleanText = cleanKurdishText(doc.content);

      // 2. Build multi-dimensional semantic search vector representation
      const vector = await generateEmbedding(cleanText);

      // 3. Persist the final academic text and vector embedding in Firestore
      await saveAcademicData('library_index', {
        title: doc.title,
        content: cleanText,
        embedding: vector,
        originalId: doc.id,
        processedAt: new Date().toISOString()
      });

      console.log(`سەرکەوتوو: ${doc.title} ئیندێکسکرا.`);
    } catch (error) {
      console.error(`هەڵە لە پەڕگەی ${doc.title}:`, error);
    }
  }
  console.log("پڕۆسەی وەرگرتنی داتا کۆتایی هات.");
};
