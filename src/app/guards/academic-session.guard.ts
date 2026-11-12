import { Injectable } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AcademicSessionGuard implements CanActivate {
  canActivate(): boolean | UrlTree {
    return true;
  }
}
