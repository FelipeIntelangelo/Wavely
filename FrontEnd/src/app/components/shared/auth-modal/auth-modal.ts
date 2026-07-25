import { Component } from '@angular/core';
import { AuthModalService } from '../../../services/auth/auth-modal.service';
import { Login } from '../../../pages/auth/login/login';
import { Register } from '../../../pages/auth/register/register';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [Login, Register],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModalComponent {
  constructor(public authModalService: AuthModalService) {}

  close(): void {
    this.authModalService.close();
  }

  setMode(mode: 'login' | 'register'): void {
    this.authModalService.mode.set(mode);
  }
}
