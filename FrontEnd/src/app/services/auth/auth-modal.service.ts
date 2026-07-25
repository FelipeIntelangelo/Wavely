import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  isOpen = signal<boolean>(false);
  mode = signal<'login' | 'register'>('login');

  open(mode: 'login' | 'register' = 'login'): void {
    this.mode.set(mode);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
