/**
 * Environment configuration manager for both Node server and browser environments.
 * Uses conditional checks to ensure client-side safety.
 */
export const config = {
  firebase: {
    apiKey: typeof process !== 'undefined' ? process.env?.['FIREBASE_API_KEY'] : undefined,
    projectId: typeof process !== 'undefined' ? process.env?.['PROJECT_ID'] : undefined,
  },
  gemini: {
    apiKey: typeof process !== 'undefined' ? process.env?.['GEMINI_API_KEY'] : undefined,
  },
  app: {
    port: typeof process !== 'undefined' ? (Number(process.env?.['PORT']) || 3000) : 3000,
    environment: typeof process !== 'undefined' ? (process.env?.['NODE_ENV'] || 'development') : 'development'
  }
};
