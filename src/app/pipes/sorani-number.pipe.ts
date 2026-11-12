import { Pipe, PipeTransform } from '@angular/core';

export function toSoraniNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const latinToSoraniDigits: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return str.replace(/[0-9]/g, w => latinToSoraniDigits[w] || w);
}

@Pipe({
  name: 'soraniNumber',
  standalone: true
})
export class SoraniNumberPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return toSoraniNumber(value);
  }
}

