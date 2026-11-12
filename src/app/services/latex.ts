import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LatexService {
  convertToLatex(title: string, discipline: string, chapters: { title: string; content: string }[]): string {
    let latexStr = `\\documentclass[12pt,a4paper]{article}\n`;
    latexStr += `\\usepackage[utf8]{utf8}\n`;
    latexStr += `\\usepackage{amsmath,amsfonts,amssymb}\n\n`;
    latexStr += `\\title{${title}}\n`;
    latexStr += `\\author{ڕشتەی: ${discipline}}\n`;
    latexStr += `\\date{\\today}\n\n`;
    latexStr += `\\begin{document}\n`;
    latexStr += `\\maketitle\n\n`;

    chapters.forEach((ch) => {
      latexStr += `\\section{${ch.title}}\n`;
      latexStr += `${ch.content || ''}\n\n`;
    });

    latexStr += `\\end{document}`;
    return latexStr;
  }
}
