# AI Coding Agent Rules & Guidelines

To prevent code corruption, data loss, or accidental overwrites, all AI Agents working on this project MUST strictly follow these safety rules:

## 1. Surgical & Targeted Edits Only
- **NEVER rewrite or replace entire files** under any circumstances, especially as the code grows larger.
- You **MUST ALWAYS** use precise `edit_file` or `multi_edit_file` operations targeted strictly to the lines being added, removed, or changed (up to 1,000,000 lines per block).
- Always check and verify the exact `TargetContent` you are modifying using `view_file` immediately before executing any edits to avoid "target not found" failures.

## 2. Strictly Preserve Existing Features
- **DO NOT delete or truncate** existing functions, styling, imports, types, or comments unless the user explicitly requests their removal.
- If you need to insert a small code block, write an edit block that targets only the insertion point. Leave all surrounding code fully intact.

## 3. Incremental Changes
- Perform modifications in small, controlled, and logical steps.
- Compile or lint the applet (`lint_applet` / `compile_applet`) after each small incremental change to detect syntax or runtime issues immediately.
- If a build failure occurs, roll back or fix the targeted change rather than attempt to rewrite larger logic.

## 4. No Custom Code Overwriting
- Keep all existing styling patterns, Tailwind CSS rules, and component structures preserved exactly as the user left them, unless specifically asked to redesign or upgrade.

---

## 5. دە مەرجی گرنگ و توندی تر بۆ گەرەنتی ڕەهای سەلامەتی پڕۆژەکە (10 Additional Strict Rules for Project Resilience)

پێویستە هەموو کارەکان بە تەواوی بەم ١٠ مەرجە توند و پتەوەی خوارەوە ئەنجام بدرێن بۆ گەرەنتی پاراستنی پڕۆژەکە بۆ تەمەنێکی درێژ:

### ١. پاشەکەوتکردنی پارێزراوی کاتی پێش هەر گۆڕانکارییەک (Pre-Edit Visual Sanity & Backups)
پێش ئەوەی دەستکاری فایلێکی گرنگ بکەیت، هەمیشە دەبێت ناوەڕۆکی شوێنەکە بە تەواوی لەڕێگەی `view_file`ەوە بخوێنیتەوە تا بێچوونی کۆدەکەت بە تەواوی ڕوون بێت. لە حاڵەتی ترسی پچڕانی ئینتەرنێت، نابێت زیاتر لە فەنکشنێک بە یەکجار گۆڕانکاری تێدا بکرێت.

### ٢. قەدەغەکردنی بەکارهێنانی کورتکراوەکان (Strict Anti-Truncation Directive)
بە هیچ شێوەیەک بۆت نییە لە شوێنی کۆدە کۆنەکان بنووسیت:
* `// ... rest of the code as before`
* `// کۆدەکەی پێشوو لێرەدا دەبێت`
ئەم جۆرە فێڵ و تەمبەڵی کورتکردنەوەیە ڕاستەوخۆ دەبێتە هۆی تێکچوونی فایلی مەزن و هەڵوەرینی فەنکشنەکان. پێویستە هەموو گۆڕانکارییەک تەنها لەناو بلۆکی ئاراستەکراو بە تەواوی و بێ کەم و کوڕی دابنرێت.

### ٣. پاراستنی ١٠٠٪ی لۆکاڵایزەیشن و نووسینی کوردی (Immune Kurdish UI/Soranî Texts)
هەموو تێکستە کوردییەکان، وەرگێڕانەکان، فۆرمی ڕێنمیایی و گوتە ئەکادیمییەکان بە تەواوی نەپارێزراون (Immune). هیچ ئەی ئایەک بۆی نییە کاتێک تایبەتمەندییەکی نوێ زیاد دەکات، تێکستە کوردییەکان بۆ ئینگلیزی بگۆڕێت یان ڕەشیان بکاتەوە مەگەر بە داواکاری فەرمی بەکارهێنەر.

### ٤. سنوری توندی قەبارەی فایل و دابەشکردنی لۆژیکی (Files Modularization Hard Limit)
هەر کاتێک فایلی سەرەکی وەک `src/app/app.ts` یان `src/server.ts` قەبارەکەیان گەورە بوو، پێویستە دەستبەجێ لۆژیکە نوێیەکان لە فایلی هێڵکاری سەربەخۆ لەژێر بووچەی یارمەتیدەر (`src/app/helpers/` یان `src/app/services/`) دابنرێن، بۆ ئەوەی فایلە سەرەکییەکان نەتەقن و چاودێریکردنیان ئاسان بێت.

### ٥. هاوکاتکاری و دەستکاریکردنی تەنها یەک فایل لە هەر نۆرەیەکدا (Strict Single-File Scope Isolation)
لە کاتی وەڵامدانەوە، نابێت بە شێوەیەکی هەمەجۆر دەستکاری چەند فایلێکی جیاواز لە یەک کاتدا بکەیت تا ئەو کاتەی یەکەمیان بە تەواوی لێنتەر پشکنینی بۆ دەکات. ئەمە ڕێگری دەکات لە تێکچوونی چەند مۆدیوڵێک بە یەکجار.

### ٦. پرۆسەی چاکسازی خودکار پێش جێبەجێکردنی کۆتایی (Self-Healing on Synthesis Errors)
ئەگەر دوای دەستکاریکردن یەکێک لە فرمانەکانی `lint_applet` یان `compile_applet` هەڵەی ڕێزمانی دا، دەبێت AI دەستبەجێ دوا گۆڕانکاری پاشەکشە پێ بکاتەوە و بگەڕێتەوە سەر دۆخی جێگیری پێشوو پێش ئەوەی هەوڵی نوسینی چارەسەری نوێ بدات.

### ٧. قەدەغەکردنی ڕەهای لۆگکردنی زیادە و تەلەمەتری (Anti-AI-Slop Code Hygiene)
تەنها کۆدی فەنکشناڵ و بەسوود بۆ بنووسە. بە هیچ شێوەیەک کۆدی لۆگی بێسوود بۆ تاقیکردنەوە، کۆنسۆل لۆگی بێ کۆتایی، تەلەمەتری سیستەم، دۆخی پۆرتەکان (وەک Port 3000)، یان نوسینی "LIVE status" لە مارجنەکانی پڕۆژەکەدا زیاد مەکە کە تەنها قەبارەی یادگە تێکدەدەن.

### ٨. پشکنینی بێ مەرجی ڕێزمانی و لێنتکردن پێش پێشکەشکردن (Pre-turn Complete Lint Run)
پێش ئەوەی بە بەکارهێنەر بڵێیت فۆرمەکە تەواو بووە، هەمیشە دەبێت فەرمانی `lint_applet` ڕەن بکەیتەوە، تا دڵنیا ببی لەوەی تەواوی کۆدەکان 100% سەوزن و مۆدیوڵەکان بێ کێشەن.

### ٩. پشتڕاستکردنەوەی جۆری دەستپێک و کۆتایی گۆڕانکاری (Target Context Validation)
هەمیشە پێش نوسینی `edit_file` دڵنیابەرەوە کە `TargetContent` بە تەواوی وەک یەک لە فایلی سەرەکیدا بوونی هەیە، نەک لێچوون یان هاوشێوە بێت؛ ئەمەش لەڕێگەی پیشاندانی فایلەکە کەمێک پێش گۆڕانکارییەکە ئەنجام دەدرێت.

### ١٠. گەرەنتی پاشەکەوتکردن لە فایەربەیس بەبێ بپچڕان (Firestore Schema Verification)
هەرکاتێک پڕۆژەکە پێویستی بە پاشەکەوتکردنی داتا بێت، دەبێت لۆژیکی پەیوەندیکردن بە فایەربەیس بە شێوازی `try/catch`ی بەهێز ڕووپۆش بکرێت تاوەکو لە کاتی پچڕانی لۆکاڵی هێڵ یان کێشەی نێتوۆرک ئەپەکە بە تەواوی نەوەستێت و توانای بەردەوامی هەبێت (Offline-first / Graceful Degradation).

---

## 6. 🪨 پرۆتۆکۆلی مۆری پێشەنگی نەخشی سەر بەرد (Ironclad Stone-Carving Code Preservation Protocol)

بۆ ئەوەی هەر کۆدێک کە دەنوسرێت هاوشێوەی **"نەخشی سەر بەرد"** بێت و بە هیچ شێوەیەک دەستکارییەکی تێکدەرانە یان پچڕێنەر نەکرێت، ئەوا دەبێت ئەم بنەما نەگۆڕانەی خوارەوە بە شێوەیەکی ڕەها جێبەجێ بکرێن:

### ١. پاراستنی ڕەهای میراتی ڕابردوو (Absolute Legacy Preservation)
- کۆدە نوسراوە دروستەکان نابێت هەرگیز دووبارە ڕێکبخرێنەوە (No Blind Refactoring) یان لە ژێر باڵی "پاشپاککردنەوە" دەستکاری بکرێن. دەستکاری تەنها دەبێت بە فۆکەسی ١٠٠٪ لەسەر ئەو هێڵە بێت کە بەکارهێنەر ڕاستەوخۆ داوای کردووە.

### ٢. مامەڵەی لۆژیکی یەکپارچە (Atomic Transactional Edits)
- هەموو هەنگاوێکی نووسینی کۆد دەبێت وەک مامەڵەیەکی بانکی (ACID Transaction) سەیر بکرێت. ئەگەر تەنها یەک پیتی کۆدەکە بووە هۆی کێشە لە کۆمپایلکردندا، ئەوا دەستبەجێ پرۆسەکە هەڵدەوەشێتەوە و تەواوی فایلەکە دەگەڕێتەوە بۆ هەمان ئەو باری "سەوز و بێ کێشەیە" کە پێش دەست پێکردنی نۆرەکە پێی گەیشتووە.

### ٣. سەقفی زێڕینی "قەبارەی دێڕ بۆ فەنکشن" (Micro-functional Splitting)
- بۆ ڕێگری لە قورسبوونی کۆدەکان و دروستبوونی لۆگی زەبەلاح، هەر فەنکشنێکی نوێ کە بۆ ئەپەکە زیاد دەکرێت نابێت لە **٧٠ دێڕ** زیاتر بێت. ئەگەر لۆژیکی فەنکشنێک لەوە فراوانتر بوو، پێویستە دەستبەجێ پارچە پارچە بکرێت بۆ هاوکارە بچووکەکان (Helpers) بێ ئەوەی قەبارەی ڕێزمانیی کارەکە تێکبدرێت.

### ٤. واژۆی فەنشناڵی پارێزراو (Function Signature Immunity)
- ئەو پێناسانەی کە بۆ فەنکشن و مۆدیوڵەکان دانراون، هاوشێوەی گرێبەرستێکی یاسایی بنەڕەتین؛ گۆڕینی ناوی فەنکشنەکان، گۆڕینی جۆری نێردراوەکان (Interfaces/Types)، یان گۆڕینی لۆژیکی نێوخۆیی کارەکە بەبێ ڕەزامەندی نووسراوی بەکارهێنەر بە توندی قەدەغەیە.

### ٥. گەرەنتی پشکنینی فرە-ئاستی کۆتایی (Pre-Exit Absolute Check)
- هیچ نۆرەیەکی کارکردن و گفتوگۆ تەواو نابێت تاوەکو لێنتەری فەرمیی پڕۆژەکە (`ng lint`) و کۆمپایلەری سەرەکی (`compile_applet`) بە تەواوی ئاماژەی سەوز نیشان نەدەن. ئەپەکە دەبێت هەمیشە لە بارێکی کارای تەواو و هەمیشەیی بێت لەژێر هەر بارودۆخێکدا.

### ٦. قەدەغەکردنی ڕەهای دەستکاریکردنی ڕووکار (Absolute UI Lock Directive)
- **یاسای نەگۆڕ**: بەهیچ شێوەیەک دەستکاری ڕووکار، دیزاین، ستایل، ڕەنگەکان یان پێکهاتەی بینراوی ئەپەکە ناکرێت تاوەکو بەکارهێنەر ڕاستەوخۆ و بە فەرمی داوای نەکات. ئەم مەرجە بە تەواوی جێگیر و نەگۆڕە.

### ٧. سەقفی ڕەهای قەبارەی فایلەکان (Hard Limit: Max 500 Lines per File)
- **یاسای نەگۆڕ و ٪١٠٠٠ پابەندبوون**: هیچ فایلێک لە تەواوی پڕۆژەکەدا نابێت لە **٥٠٠ دێڕ (Lines)** زیاتری تێدا بێت بە هەر جۆرێک بێت. هەموو فایلە گەورەکان دەبێت بە شێوازێکی زانستی و بێ دەستکاریکردنی ڕووکار پارچە پارچە بکرێن بۆ مۆدیوڵ، هێڵپەر، سێرڤس و بەشە بچووکەکان بە مەرجی ئەوەی تەواوی فەنکشن و دیزاین پارێزراو بێت.


