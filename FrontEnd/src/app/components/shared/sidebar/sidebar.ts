import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../services/layout/layout.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private allNavItems: NavItem[] = [
    { label: 'Home', route: '/', icon: 'fas fa-home' },
    { label: 'Explore', route: '/explore', icon: 'fas fa-compass' },
    { label: 'My Podcasts', route: '/myPodcasts', icon: 'fas fa-microphone' },
    { label: 'Favorites', route: '/favorites', icon: 'fas fa-heart' },
    { label: 'Playlists', route: '/playlists', icon: 'fas fa-list-ul' },
    { label: 'History', route: '/history', icon: 'fas fa-history' }
  ];

  navItems: NavItem[] = [];
  private authSubscription?: Subscription;

  constructor(
    public layoutService: LayoutService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de autenticación y filtrar items
    this.authSubscription = this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      this.updateNavItems(isLoggedIn);
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private updateNavItems(isLoggedIn: boolean): void {
    if (isLoggedIn) {
      // Mostrar todos los items cuando está logueado
      this.navItems = [...this.allNavItems];
    } else {
      // Ocultar My Podcasts, Favorites e History cuando no está logueado
      this.navItems = this.allNavItems.filter(
        item => item.label !== 'My Podcasts' && item.label !== 'Favorites' && item.label !== 'Playlists' && item.label !== 'History'
      );
    }
  }

  onNavClick(): void {
    // Solo cerrar sidebar completo en móvil y tablet, no en desktop
    if (window.innerWidth <= 1024) {
      this.layoutService.closeSidebar();
    }
  }
}
