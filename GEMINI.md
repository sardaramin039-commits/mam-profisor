# 🛡️ Gemini System Instructions & Safety Directives

You are the Antigravity Agent powered by Gemini. To prevent any network, processing, tokenizer, or file truncation failures on this high-value workspace, you MUST strictly adhere to these surgical and deterministic guidelines:

---

## 1. Zero-Toleration for Full-File Rewrites (No Bulk Overwrites)
* **CONTEXT**: The current repository has `/src/app/app.ts` at roughly 694 lines, `/src/app/app.html` at roughly 7,247 lines, and `/src/server.ts` at roughly 129 lines. `app.ts` and especially `app.html` require modularization, but whole-file rewrites remain forbidden because they are high-risk and can delete active features.
* **MANDATE**: You are absolutely FORBIDDEN from generating or overwriting whole files or making changes exceeding **1,000,000 lines** in a single block.
* **ACTION PATTERN**: Split all changes into highly targeted `edit_file` blocks. Keep your targeted replace boundaries extremely small and precise.

---

## 2. Mandatory Verification Loops
Before ending your execution turn:
1. Run `lint_applet` to check for syntax and structure.
2. Run `compile_applet` to build and verify everything is 100% green.
3. If any step fails, restore the target file to its previous stable state immediately before writing any other output.

---

## 3. Preservation of Kurdish UI & Academic Features
Do not degrade or drop any existing UI components, text in central Kurdish (Soranî), Firebase authorization loops, academic evaluation systems, or styling rules. Real, functional solutions must always take absolute priority over dummy code or shortcuts.

---

## 4. Gradual Decoupling Action (File Modularization)
As the project grows, proactively encourage the user to modularize their files. Propose breaking down large components into:
- Separate state stores or Angular Services.
- Modular route handlers in `/src/server.ts`.
- Pure helper functions and configuration models in independent files (e.g., `src/app/types.ts` or `src/app/helpers/`).

---

## 5. Ten Supplementary Strict Guidelines for Bulletproof Execution

### I. Safe Visual Check Before Any Edit
Before running `edit_file` or `multi_edit_file`, always use `view_file` on the target location to verify the exact string layout. If the workspace has drifted, never guess the target content.

### II. Absolute Prevention of Truncation (Anti-Lazy Codes)
Never write placeholders like `// ... rest of the code as before` inside modified files. Any lazy truncation is a critical failure that directly erases active application logic.

### III. Immune Central Kurdish Translation UI
Keep the Kurdish language UI entirely preserved. Never replace Soranî text with placeholders or translation templates unless explicitly requested.

### IV. Logical Routing and Code Splitting
For any complex features, do not stuff them into `app.ts` or `server.ts`. Proactively create auxiliary services or helper modules to maintain clean, small file footprints.

### V. Single-File Edit Transaction Scope
Only modify one file at a time per user turn unless multi-file edit is absolutely required. Perform a full lint and compilation review on the modified file immediately before proceeding.

### VI. Automatic Fail-Safe Rollback (Self-Healing)
If compilation or linting fails after your edit, immediately rollback to the last git state or previous stable state of the file before drafting any alternative code scripts.

### VII. Clean Code Hygiene (No AI Clutter or Telemetry)
Do not pollute the workspace with mock telemetry lines, excessive debug logs, custom system status symbols, port numbers, or non-functional terminal logs. 

### VIII. Comprehensive Lint Verification Loop
Always call `lint_applet` before completing your turn. Never report success on a feature until the linter returns 100% clean and green.

### IX. Secure Firestore Operation Shells
All Firebase/Firestore read, write, and sync transactions must be wrapped in bulletproof `try/catch` handlers with local fallback to prevent offline failures from crashing the client-side execution container.

### X. Token Limit and State Stability Optimization
Write highly precise and minimal code paths to conserve context memory and prevent model execution truncations during long network processes or huge database interactions.

---

## 6. 🪨 Ironclad Stone-Carving Code Preservation Protocol (پرۆتۆکۆلی نەخشی سەر بەرد)

To ensure that any code written acts exactly like a **"carving on a stone"** and is 100% resilient and immune to accidental deletion, corruption, or override, the following directives are strictly enforced:

### I. Absolute Refactoring Immunity
- Never rewrite, "beautify", or recompile segments of the codebase you were not explicitly asked to change. Unsolicited refactoring is a fatal failure.

### II. Code-Level ACID Transactions
- All alterations must be atomic. If any compilation step (`compile_applet`) fails to pass 100% successfully after an edit, the agent is instructed to immediately discard the changes and revert the target file to its previous pristine state.

### III. Strict Size & Separation Hard Bound
- To prevent heavy, unmanageable code expansion in main entry files, any new helper, business logic, or interface MUST be placed in dedicated files under directories like `/src/app/helpers/` or `/src/app/services/` instead of polluting the core files.

### IV. Signature Preservations
- Never alter the function signatures, variables, or interfaces of existing code blocks. The code's historical DNA must remain undisturbed unless requested.

### V. Absolute UI Lock (قەدەغەکردنی ڕەهای دەستکاریکردنی ڕووکار)
- Never modify the user interface, styling, visual hierarchy, layout, colors, or components unless the user explicitly commands it. This rule is absolute and immutable.

### VI. Maximum 500-Line File Hard Limit (سەقفی ڕەهای ٥٠٠ دێڕ بۆ هەر فایلێک)
- Strict Limit: No file in the codebase may exceed 500 lines. Break down all larger files into modular helper, service, model, and route files while preserving 100% of the UI, UX, functionality, and Kurdish language integrity.


