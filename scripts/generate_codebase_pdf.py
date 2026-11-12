#!/usr/bin/env python3
import os
import sys
import zlib
import time
from datetime import datetime

class PDFBuilder:
    def __init__(self):
        self.objects = []
        self.page_ids = []
        
        # Object 1: Catalog (will be updated)
        self.add_raw(b"<< /Type /Catalog /Pages 2 0 R >>")
        # Object 2: Pages (placeholder, updated at end)
        self.add_raw(b"")
        # Object 3: F1 - Courier (code font)
        self.f1_id = self.add_raw(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>")
        # Object 4: F2 - Courier-Bold (code bold / line numbers)
        self.f2_id = self.add_raw(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>")
        # Object 5: F3 - Helvetica-Bold (headings / headers)
        self.f3_id = self.add_raw(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
        # Object 6: F4 - Helvetica (normal text)
        self.f4_id = self.add_raw(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

    def add_raw(self, b):
        self.objects.append(b)
        return len(self.objects)

    def add_stream(self, stream_bytes):
        comp = zlib.compress(stream_bytes)
        dict_and_stream = (
            f"<< /Length {len(comp)} /Filter /FlateDecode >>\nstream\n".encode("ascii")
            + comp
            + b"\nendstream"
        )
        return self.add_raw(dict_and_stream)

    def add_page(self, stream_bytes):
        stream_id = self.add_stream(stream_bytes)
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            f"/Contents {stream_id} 0 R "
            f"/Resources << /Font << "
            f"/F1 {self.f1_id} 0 R /F2 {self.f2_id} 0 R "
            f"/F3 {self.f3_id} 0 R /F4 {self.f4_id} 0 R "
            f">> >> >>"
        ).encode("ascii")
        page_id = self.add_raw(page_dict)
        self.page_ids.append(page_id)
        return page_id

    def build(self, out_path):
        # Update Pages object
        kids_str = " ".join(f"{pid} 0 R" for pid in self.page_ids)
        pages_dict = f"<< /Type /Pages /Kids [{kids_str}] /Count {len(self.page_ids)} >>".encode("ascii")
        self.objects[1] = pages_dict

        # Write final PDF
        with open(out_path, "wb") as f:
            f.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
            offsets = []
            for i, obj in enumerate(self.objects, 1):
                offsets.append(f.tell())
                f.write(f"{i} 0 obj\n".encode("ascii"))
                f.write(obj)
                f.write(b"\nendobj\n")
            xref_pos = f.tell()
            f.write(f"xref\n0 {len(self.objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
            for off in offsets:
                f.write(f"{off:010d} 00000 n \n".encode("ascii"))
            trailer = (
                f"trailer\n<< /Size {len(self.objects) + 1} /Root 1 0 R >>\n"
                f"startxref\n{xref_pos}\n%%EOF\n"
            )
            f.write(trailer.encode("ascii"))

def escape_pdf(text):
    out = []
    for ch in text:
        if ch == '\\':
            out.append('\\\\')
        elif ch == '(':
            out.append('\\(')
        elif ch == ')':
            out.append('\\)')
        elif ch == '\t':
            out.append('    ')
        else:
            code = ord(ch)
            if 32 <= code <= 126:
                out.append(ch)
            elif 160 <= code <= 255:
                out.append(f'\\{code:03o}')
            else:
                out.append(' ')
    return ''.join(out)

def get_source_files(root_dir):
    valid_exts = {'.ts', '.html', '.css', '.json', '.mjs', '.js', '.md', '.sql'}
    ignored_dirs = {'node_modules', '.git', '.angular', 'dist', 'coverage', '.cache', 'tmp', 'public'}
    
    # Core architectural priority files
    priority = [
        'package.json',
        'angular.json',
        'tsconfig.json',
        'tsconfig.app.json',
        'firestore.rules',
        'firebase-blueprint.json',
        'src/main.ts',
        'src/server.ts',
        'src/main.server.ts',
        'src/app/app.ts',
        'src/app/app.html',
        'src/app/app.routes.ts',
        'src/app/app.config.ts'
    ]
    
    files = []
    for pf in priority:
        if os.path.isfile(os.path.join(root_dir, pf)):
            files.append(pf)
            
    discovered = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs and not d.startswith('.')]
        for f in sorted(filenames):
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_exts:
                rel = os.path.relpath(os.path.join(dirpath, f), root_dir)
                if rel not in files and not rel.startswith('dist') and not rel.startswith('.angular'):
                    discovered.append(rel)
                    
    discovered.sort()
    files.extend(discovered)
    return files

def generate_pdf():
    root = os.getcwd()
    # Normalize if run from scripts/
    if os.path.basename(root) == 'scripts':
        root = os.path.dirname(root)
        
    print(f"Scanning project files in {root}...")
    files = get_source_files(root)
    print(f"Total source files to document: {len(files)}")
    
    pdf = PDFBuilder()
    
    # 1. COVER PAGE
    cover = []
    cover.append("0.1 0.15 0.35 rg 0 0 595 842 re f") # dark elegant background
    cover.append("1 1 1 rg")
    cover.append("BT /F3 24 Tf 50 750 Td (MAM PROFESSOR ACADEMIC PLATFORM) Tj ET")
    cover.append("0.7 0.85 1 rg")
    cover.append("BT /F4 13 Tf 50 725 Td (Complete Production Codebase & Architecture Reference) Tj ET")
    cover.append("1 1 1 RG 1 w 50 710 m 545 710 l S")
    
    cover.append("0.9 0.95 1 rg")
    cover.append("BT /F4 10 Tf 50 670 Td (Platform: Kurdish Academic Research, Writing & Editorial Platform) Tj ET")
    cover.append("BT /F4 10 Tf 50 652 Td (Architecture: Angular 20 Zoneless, TypeScript Strict, Node/Express, Tailwind CSS 4) Tj ET")
    cover.append(f"BT /F4 10 Tf 50 634 Td (Included Files: {len(files)} Complete Source Files) Tj ET")
    cover.append(f"BT /F4 10 Tf 50 616 Td (Build Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}) Tj ET")
    cover.append("BT /F4 10 Tf 50 598 Td (Integrations: Gemini 2.5 AI SDK, Firebase Firestore, Cloud SQL, Workspace APIs) Tj ET")
    
    cover.append("1 1 1 RG 0.5 w 50 575 m 545 575 l S")
    cover.append("0.7 0.85 1 rg")
    cover.append("BT /F3 12 Tf 50 545 Td (TABLE OF ARCHITECTURAL MODULES:) Tj ET")
    
    modules = [
        "1. Core Application Shell: src/app/ (Root, Shell, Header, Controller, Router, State)",
        "2. Advanced Research Engine: src/app/features/advanced-research/ (Toulmin, Synthesis, Agents)",
        "3. Academic Suite Tools: src/app/features/ (Harvard, Plagiarism, Defense, Methods Lab)",
        "4. Kurdish Digital Library: src/services/kurdish-books-catalog.ts & 40 scholarly archives",
        "5. Backend API Services: src/server/ (Express Routes, Gemini SDK, Security, Embeddings)",
        "6. Verification Gates: scripts/ (Anti-hallucination audits, Line limits, Smoke tests)"
    ]
    y_mod = 520
    for mod in modules:
        cover.append(f"0.9 0.95 1 rg BT /F4 9.5 Tf 50 {y_mod} Td ({escape_pdf(mod)}) Tj ET")
        y_mod -= 20
        
    cover.append("0.6 0.7 0.9 rg")
    cover.append("BT /F4 8.5 Tf 50 50 Td (Copyright 2026 Mam Professor Academic Laboratory. All rights reserved.) Tj ET")
    pdf.add_page("\n".join(cover).encode("ascii"))
    
    # 2. FILE CONTENT PAGES
    total_lines_counted = 0
    lines_per_page = 72
    
    for file_idx, rel_path in enumerate(files, 1):
        full_path = os.path.join(root, rel_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.readlines()
        except Exception as e:
            continue
            
        total_lines_counted += len(content)
        chunks = [content[i:i + lines_per_page] for i in range(0, max(1, len(content)), lines_per_page)]
        
        for chunk_idx, chunk in enumerate(chunks, 1):
            page_cmds = []
            # Background
            page_cmds.append("1 1 1 rg 0 0 595 842 re f")
            
            # Header
            page_cmds.append("0.2 0.3 0.5 rg BT /F3 8 Tf 36 814 Td (Mam Professor Academic Platform | Codebase Documentation) Tj ET")
            esc_rel = escape_pdf(rel_path)
            page_cmds.append(f"0.4 0.4 0.5 rg BT /F4 7.5 Tf 360 814 Td (File: {esc_rel}) Tj ET")
            page_cmds.append("0.8 0.8 0.85 RG 0.5 w 36 808 m 559 808 l S")
            
            # If first chunk of file, draw file banner
            cur_y = 794
            start_line_no = (chunk_idx - 1) * lines_per_page + 1
            if chunk_idx == 1:
                page_cmds.append("0.94 0.96 0.99 rg 36 780 523 16 re f")
                page_cmds.append("0.3 0.4 0.65 RG 0.5 w 36 780 523 16 re S")
                banner_text = f"FILE [{file_idx}/{len(files)}]: {esc_rel}  ({len(content)} lines)"
                page_cmds.append(f"0.15 0.25 0.55 rg BT /F3 8 Tf 42 785 Td ({escape_pdf(banner_text)}) Tj ET")
                cur_y = 768
                
            # Render lines of code
            for l_idx, line in enumerate(chunk):
                line_no = start_line_no + l_idx
                raw_code = line.rstrip('\r\n')
                if len(raw_code) > 105:
                    raw_code = raw_code[:102] + "..."
                esc_code = escape_pdf(raw_code)
                line_prefix = f"{line_no:4d} | "
                
                # Line number in light gray, code in dark charcoal
                page_cmds.append(f"0.55 0.55 0.6 rg BT /F2 7.2 Tf 36 {cur_y} Td ({line_prefix}) Tj ET")
                page_cmds.append(f"0.12 0.14 0.2 rg BT /F1 7.2 Tf 68 {cur_y} Td ({esc_code}) Tj ET")
                cur_y -= 9.5
                
            # Footer
            page_cmds.append("0.8 0.8 0.85 RG 0.5 w 36 34 m 559 34 l S")
            page_cmds.append("0.5 0.5 0.5 rg BT /F4 7 Tf 36 24 Td (Kurdish Academic Thesis & Research Engine | Production Release) Tj ET")
            curr_pg = len(pdf.page_ids) + 1
            page_cmds.append(f"0.4 0.4 0.5 rg BT /F4 7 Tf 500 24 Td (Page {curr_pg}) Tj ET")
            
            pdf.add_page("\n".join(page_cmds).encode("ascii"))
            
    # Output paths
    pub_dir = os.path.join(root, "public")
    os.makedirs(pub_dir, exist_ok=True)
    pdf_dest = os.path.join(pub_dir, "mam-professor-codebase.pdf")
    
    print(f"Writing complete PDF with {len(pdf.page_ids)} pages...")
    pdf.build(pdf_dest)
    
    # Also copy to dist/app/browser if it exists
    dist_browser = os.path.join(root, "dist", "app", "browser")
    if os.path.isdir(dist_browser):
        import shutil
        shutil.copyfile(pdf_dest, os.path.join(dist_browser, "mam-professor-codebase.pdf"))
        
    size_mb = os.path.getsize(pdf_dest) / 1024 / 1024
    print(f"SUCCESS: Generated {pdf_dest} ({size_mb:.2f} MB, {len(pdf.page_ids)} pages, {len(files)} files, {total_lines_counted} lines).")

if __name__ == "__main__":
    generate_pdf()
