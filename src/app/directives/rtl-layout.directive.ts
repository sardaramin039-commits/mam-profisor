import { Directive, ElementRef, inject, OnInit } from '@angular/core';

@Directive({
  selector: '[appRtlLayout]',
  standalone: true
})
export class RtlLayoutDirective implements OnInit {
  private el = inject(ElementRef);

  ngOnInit(): void {
    this.el.nativeElement.setAttribute('dir', 'rtl');
    this.el.nativeElement.classList.add('font-sans');
  }
}
