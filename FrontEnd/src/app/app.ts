import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { FloatingMediaPlayerComponent } from './components/shared/floating-media-player/floating-media-player';
import { SidebarComponent } from './components/shared/sidebar/sidebar';
import { LayoutService } from './services/layout/layout.service';
import { AuthModalService } from './services/auth/auth-modal.service';
import { AuthModalComponent } from './components/shared/auth-modal/auth-modal';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, FloatingMediaPlayerComponent, SidebarComponent, AuthModalComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('tpf');

  constructor(
    public layoutService: LayoutService,
    public authModalService: AuthModalService
  ) {}
}
