# Local Gemini writing setup

The development server starts the Angular UI and a separate, loopback-only Express API. The browser sends writing requests to the local API; Gemini credentials remain in the server process.

1. Copy `.env.example` to `.env` in the project root.
2. Set `GEMINI_API_KEY` in `.env` to the Gemini API key(s), separated by commas if using more than one.
3. Keep `.env` private. It is git-ignored; do not paste API keys into UI fields, frontend files, issue reports, or logs. If a key has been exposed, revoke it and create a replacement in your provider console.
4. Restart with `npm run dev`. The API reads `.env` when it starts.

In hosted environments, add `GEMINI_API_KEY` to the server's environment/Secrets manager instead of committing a `.env` file. No `GEMINI_API_KEY` or browser-local API-key setting is required for these subsection-writing endpoints.

When the key is missing, rejected, or over quota, writing requests fail with a visible error instead of returning empty content or marking the subsection complete.
