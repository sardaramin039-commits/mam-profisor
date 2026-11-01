#!/usr/bin/env python3
import os
import sys
import subprocess
import time

def escape_ps(s):
    res = []
    for ch in s:
        if ch == '\\':
            res.append('\\\\')
        elif ch == '(':
            res.append('\\(')
        elif ch == ')':
            res.append('\\)')
        elif ch == '\t':
            res.append('    ')
        else:
            code = ord(ch)
            if 32 <= code <= 126:
                res.append(ch)
            else:
                res.append('?')
    return ''.join(res)

def get_source_files(root_dir):
    extensions = {'.ts', '.html', '.css', '.json', '.mjs', '.js'}
    ignored_dirs = {'node_modules', '.git', '.angular', 'dist', 'coverage', '.cache', 'tmp'}
    
    files_list = []
    
    priority_files = [
        'package.json',
        'tsconfig.json',
        'angular.json',
        'src/lib/gemini/LevelProfiles.ts',
        'src/lib/gemini/CoreEngine.ts',
        'src/lib/gemini/BlueprintAgent.ts',
        'src/lib/gemini/CitationManager.ts',
        'src/lib/gemini/WriterAgent.ts',
        'src/server.ts',
        'src/main.ts',
        'src/app/app.ts',
        'src/app/app.html',
        'src/app/app-controller-base.ts',
        'src/app/app-controller-actions.ts',
        'src/app/app-template-section-base.ts',
        'src/app/app-view-imports.ts',
        'src/app/app-template-sections.ts'
    ]
    
    for pf in priority_files:
        full_path = os.path.join(root_dir, pf)
        if os.path.isfile(full_path):
            files_list.append(pf)
            
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs and not d.startswith('.')]
        
        for f in sorted(filenames):
            ext = os.path.splitext(f)[1].lower()
            if ext in extensions:
                rel = os.path.relpath(os.path.join(dirpath, f), root_dir)
                if rel not in files_list:
                    files_list.append(rel)
                    
    return files_list

def main():
    root_dir = os.path.abspath("/app/applet")
    ps_file = "/tmp/codebase.ps"
    pdf_dest = os.path.join(root_dir, "public", "mam-professor-codebase.pdf")
    pdf_root = os.path.join(root_dir, "mam-professor-codebase.pdf")
    
    print(f"Scanning codebase in {root_dir}...")
    files = get_source_files(root_dir)
    print(f"Found {len(files)} source files.")
    
    with open(ps_file, "w", encoding="ascii", errors="replace") as out:
        out.write("""%!PS-Adobe-3.0
%%Title: Mam Professor Academic Suite - Complete Source Code
%%Creator: Mam Professor PDF Builder
%%Pages: (atend)
%%BoundingBox: 0 0 595 842
%%DocumentPaperSizes: A4
%%Orientation: Portrait
%%EndComments

/A4Width 595 def
/A4Height 842 def
/LeftMargin 36 def
/RightMargin 559 def
/TopMargin 802 def
/BottomMargin 40 def
/LineHeight 9.5 def

/HeaderFont /Helvetica-Bold findfont 8 scalefont def
/FooterFont /Helvetica findfont 7 scalefont def
/LineNumFont /Courier findfont 7.5 scalefont def
/CodeFont /Courier findfont 7.5 scalefont def
/CoverTitleFont /Helvetica-Bold findfont 22 scalefont def
/CoverSubtitleFont /Helvetica-Bold findfont 13 scalefont def
/CoverBodyFont /Helvetica findfont 10 scalefont def

/drawHeader {
    HeaderFont setfont
    0.2 0.3 0.5 setrgbcolor
    LeftMargin 812 moveto
    (Mam Professor | Academic Thesis & Research Platform) show
    RightMargin (File: ) stringwidth pop currentFileName stringwidth pop add sub 812 moveto
    (File: ) show
    currentFileName show
    
    0.7 0.7 0.7 setrgbcolor
    0.5 setlinewidth
    LeftMargin 806 moveto RightMargin 806 lineto stroke
} bind def

/drawFooter {
    FooterFont setfont
    0.7 0.7 0.7 setrgbcolor
    0.5 setlinewidth
    LeftMargin 36 moveto RightMargin 36 lineto stroke
    
    0.4 0.4 0.4 setrgbcolor
    LeftMargin 26 moveto
    (Source Code Repository | Kurdish Academic Thesis Engine | Node.js + Angular + Express) show
    
    RightMargin 40 sub 26 moveto
    (Page ) show
    pageNum (      ) cvs show
} bind def

/startNewPage {
    /pageNum pageNum 1 add def
    drawHeader
    drawFooter
    /currentY 792 def
} bind def

/pr {
    currentY BottomMargin LineHeight add le {
        showpage
        startNewPage
    } if
    LineNumFont setfont
    0.55 0.55 0.55 setrgbcolor
    LeftMargin currentY moveto
    show
    CodeFont setfont
    0.08 0.1 0.18 setrgbcolor
    LeftMargin 32 add currentY moveto
    show
    /currentY currentY LineHeight sub def
} bind def

/banner {
    currentY BottomMargin LineHeight 3 mul add le {
        showpage
        startNewPage
    } if
    0.93 0.95 0.98 setrgbcolor
    LeftMargin currentY 16 sub RightMargin LeftMargin sub 20 rectfill
    0.2 0.3 0.6 setrgbcolor
    0.5 setlinewidth
    LeftMargin currentY 16 sub RightMargin LeftMargin sub 20 rectstroke
    HeaderFont setfont
    0.1 0.2 0.5 setrgbcolor
    LeftMargin 6 add currentY 4 sub moveto
    show
    /currentY currentY 24 sub def
} bind def

/pageNum 0 def
/currentFileName () def
/currentY 792 def

%%EndProlog
""")
        # COVER PAGE
        out.write("""
%%Page: Cover 1
/pageNum 1 def
0.1 0.15 0.3 setrgbcolor
LeftMargin 730 moveto
CoverTitleFont setfont
(MAM PROFESSOR ACADEMIC PLATFORM) show

0.3 0.4 0.6 setrgbcolor
LeftMargin 705 moveto
CoverSubtitleFont setfont
(Complete Production Source Codebase Documentation) show

0.8 0.8 0.8 setrgbcolor
0.75 setlinewidth
LeftMargin 690 moveto RightMargin 690 lineto stroke

0.2 0.2 0.2 setrgbcolor
CoverBodyFont setfont
LeftMargin 660 moveto (Platform: Kurdish Academic Thesis & Research Writing Engine) show
LeftMargin 642 moveto (Stack: Angular 20+, Express.js, TypeScript, Gemini 2.5 AI SDK, Tailwind CSS) show
LeftMargin 624 moveto (Repository Files: """ + str(len(files)) + """ Source Files) show
LeftMargin 606 moveto (Date: October 2026 | Kurdish Academic Digital Lab) show

LeftMargin 560 moveto CoverSubtitleFont setfont (TABLE OF MAJOR ARCHITECTURAL MODULES:) show
CoverBodyFont setfont
LeftMargin 535 moveto (1. Gemini AI Academic Engine: src/lib/gemini/ (Profiles, Blueprint, Writer, Citation)) show
LeftMargin 515 moveto (2. Server Infrastructure: src/server/ (Express, Routes, Services, Middleware)) show
LeftMargin 495 moveto (3. Angular Workspace Core: src/app/ (AppRoot, Controller, Store, Header, Shell)) show
LeftMargin 475 moveto (4. Academic Suite Modules: src/app/features/ (Editor, Harvard, Plagiarism, Defense)) show
LeftMargin 455 moveto (5. Research & Methodology Lab: src/app/features/ (RAG, Python Sandbox, Citation)) show
LeftMargin 435 moveto (6. Digital Library & Cloud Integration: Google Drive, Sheets, Keep, Workspace) show

FooterFont setfont
0.5 0.5 0.5 setrgbcolor
LeftMargin 50 moveto (Mam Professor Academic Lab - Copyright 2026. All rights reserved.) show
showpage
""")

        page_count = 1
        
        for file_idx, rel_path in enumerate(files):
            full_path = os.path.join(root_dir, rel_path)
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content_lines = f.readlines()
            except Exception:
                continue

            escaped_rel_path = escape_ps(rel_path)
            
            page_count += 1
            out.write(f"\n%%Page: {page_count} {page_count}\n")
            out.write(f"/currentFileName ({escaped_rel_path}) def\n")
            out.write("startNewPage\n")
            
            banner_text = f"FILE: {escaped_rel_path}  [{len(content_lines)} lines]"
            out.write(f"({banner_text}) banner\n")
            
            for line_no, line in enumerate(content_lines, 1):
                clean_line = line.rstrip('\r\n')
                if len(clean_line) > 115:
                    clean_line = clean_line[:112] + "..."
                escaped_text = escape_ps(clean_line)
                line_str = f"{line_no:4d} | "
                out.write(f"({line_str}) ({escaped_text}) pr\n")
            
            out.write("showpage\n")
            
        out.write(f"\n%%Trailer\n%%Pages: {page_count}\n%%EOF\n")

    ps_mb = os.path.getsize(ps_file) / 1024 / 1024
    print(f"PostScript generated ({ps_mb:.2f} MB).")
    print("Compiling to PDF with ps2pdf (Ghostscript)...")
    
    cmd = [
        "ps2pdf",
        "-dPDFSETTINGS=/printer",
        "-dCompatibilityLevel=1.4",
        ps_file,
        pdf_dest
    ]
    subprocess.run(cmd, check=True)
    
    subprocess.run(["cp", pdf_dest, pdf_root], check=True)
    
    size_mb = os.path.getsize(pdf_dest) / 1024 / 1024
    print(f"SUCCESS: Created PDF at {pdf_dest} ({size_mb:.2f} MB)")
    print(f"Also available at {pdf_root}")

if __name__ == "__main__":
    main()
