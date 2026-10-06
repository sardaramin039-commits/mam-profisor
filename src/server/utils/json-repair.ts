export function getLastNonWhitespaceChar(str: string, index: number): string {
  for (let idx = index - 1; idx >= 0; idx--) {
    const c = str[idx];
    if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') {
      return c;
    }
  }
  return '';
}

export function repairJson(str: string): string {
  let repaired = '';
  let insideString = false;
  let escapeNext = false;
  let isKey = false;
  
  const stack: ('object' | 'array')[] = [];
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (escapeNext) {
      repaired += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      repaired += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      if (!insideString) {
        const lastChar = getLastNonWhitespaceChar(str, i);
        const currentContext = stack[stack.length - 1];
        
        if (currentContext === 'object' && (lastChar === '{' || lastChar === ',')) {
          isKey = true;
        } else {
          isKey = false;
        }
        
        insideString = true;
        repaired += char;
      } else {
        let isTerminal = false;
        let lookAheadIdx = i + 1;
        while (lookAheadIdx < str.length) {
          const aheadChar = str[lookAheadIdx];
          if (aheadChar === ' ' || aheadChar === '\t' || aheadChar === '\n' || aheadChar === '\r') {
            lookAheadIdx++;
            continue;
          }
          if (isKey) {
            if (aheadChar === ':') {
              isTerminal = true;
            }
          } else {
            if (aheadChar === ',' || aheadChar === '}' || aheadChar === ']') {
              isTerminal = true;
            }
          }
          break;
        }
        
        if (isTerminal) {
          insideString = false;
          repaired += char;
        } else {
          repaired += '\\"';
        }
      }
      continue;
    }
    
    if (insideString) {
      if (char === '\n') {
        repaired += '\\n';
      } else if (char === '\r') {
        repaired += '\\r';
      } else {
        repaired += char;
      }
    } else {
      if (char === ',') {
        let isTrailing = false;
        let lookAheadIdx = i + 1;
        while (lookAheadIdx < str.length) {
          const aheadChar = str[lookAheadIdx];
          if (aheadChar === ' ' || aheadChar === '\t' || aheadChar === '\n' || aheadChar === '\r') {
            lookAheadIdx++;
            continue;
          }
          if (aheadChar === '}' || aheadChar === ']') {
            isTrailing = true;
          }
          break;
        }
        if (isTrailing) {
          continue;
        }
      }
      
      repaired += char;
      
      if (char === '{') {
        stack.push('object');
      } else if (char === '}') {
        if (stack[stack.length - 1] === 'object') {
          stack.pop();
        }
      } else if (char === '[') {
        stack.push('array');
      } else if (char === ']') {
        if (stack[stack.length - 1] === 'array') {
          stack.pop();
        }
      }
    }
  }
  
  if (insideString) {
    repaired += '"';
  }
  
  while (stack.length > 0) {
    const popped = stack.pop();
    if (popped === 'object') {
      repaired += '}';
    } else if (popped === 'array') {
      repaired += ']';
    }
  }
  
  return repaired;
}

export function robustParseJson<T = any>(str: string): T {
  let cleaned = str.trim();
  
  if (cleaned.includes('```json')) {
    const parts = cleaned.split('```json');
    if (parts.length > 1) {
      cleaned = parts[1].split('```')[0].trim();
    }
  } else if (cleaned.includes('```')) {
    const parts = cleaned.split('```');
    if (parts.length > 1) {
      cleaned = parts[1].split('```')[0].trim();
    }
  }
  
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let start = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }
  
  if (start !== -1) {
    let end = -1;
    let insideString = false;
    let escapeNext = false;
    const stack: string[] = [];
    
    for (let i = start; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        insideString = !insideString;
        continue;
      }
      if (!insideString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}' || char === ']') {
          if (stack.length > 0) {
            stack.pop();
            if (stack.length === 0) {
              end = i;
              break;
            }
          }
        }
      }
    }
    
    if (end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    } else {
      cleaned = cleaned.substring(start);
    }
  }
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    try {
      const repaired = repairJson(cleaned);
      return JSON.parse(repaired) as T;
    } catch {
      try {
        return extractFieldsByRegex(cleaned) as unknown as T;
      } catch {
        throw err;
      }
    }
  }
}

export function extractFieldsByRegex(str: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const keyFinderRegex = /"?([a-zA-Z0-9_]+)"?\s*:/g;
  let match: RegExpExecArray | null;
  const keys: string[] = [];
  while ((match = keyFinderRegex.exec(str)) !== null) {
    const key = match[1];
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    const keyRegex = new RegExp(`"${key}"\\s*:\\s*`, 'i');
    let kMatch = str.match(keyRegex);
    if (!kMatch) {
      kMatch = str.match(new RegExp(`${key}\\s*:\\s*`, 'i'));
    }
    if (!kMatch || kMatch.index === undefined) continue;
    const startIdx = kMatch.index + kMatch[0].length;
    let remaining = str.substring(startIdx).trim();
    if (remaining.startsWith('"')) {
      remaining = remaining.substring(1);
      const closingQuoteRegex = /"(?=\s*(,|\}|\]|$))/g;
      const matchQuote = closingQuoteRegex.exec(remaining);
      let value = '';
      if (matchQuote) {
        value = remaining.substring(0, matchQuote.index);
      } else {
        value = remaining.replace(/"\s*}\s*$/, '').replace(/"$/, '');
      }
      result[key] = value;
    } else if (remaining.startsWith('[')) {
      const endBracket = remaining.indexOf(']');
      const rawArr = endBracket !== -1 ? remaining.substring(0, endBracket + 1) : remaining;
      const elements: string[] = [];
      const quoteMatches = rawArr.match(/"([^"]+)"/g);
      if (quoteMatches) {
        for (const m of quoteMatches) {
          elements.push(m.replace(/^"|"$/g, ''));
        }
      }
      result[key] = elements;
    } else {
      const endMatch = remaining.match(/^(true|false|[0-9.-]+)/i);
      if (endMatch) {
        const valStr = endMatch[1].trim();
        if (valStr.toLowerCase() === 'true') {
          result[key] = true;
        } else if (valStr.toLowerCase() === 'false') {
          result[key] = false;
        } else {
          result[key] = isNaN(Number(valStr)) ? valStr : Number(valStr);
        }
      } else {
        const endMatchGeneric = remaining.match(/^(.*?)(?:,|\s*\}|\s*\]|$)/s);
        if (endMatchGeneric) {
          const valClean = endMatchGeneric[1].trim();
          result[key] = isNaN(Number(valClean)) ? valClean : Number(valClean);
        }
      }
    }
  }
  return result;
}
