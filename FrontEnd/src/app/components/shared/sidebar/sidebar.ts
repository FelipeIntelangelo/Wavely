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
    { label: 'Inicio', route: '/', icon: 'fas fa-home' },
    { label: 'Explorar', route: '/explore', icon: 'fas fa-compass' },
    { label: 'Siguiendo', route: '/following', icon: 'fas fa-users' },
    { label: 'Mis Podcasts', route: '/myPodcasts', icon: 'fas fa-microphone' },
    { label: 'Favoritos', route: '/favorites', icon: 'fas fa-heart' },
    { label: 'Playlists', route: '/playlists', icon: 'fas fa-list-ul' },
    { label: 'Historial', route: '/history', icon: 'fas fa-history' }
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
      // Ocultar rutas protegidas cuando no está logueado
      this.navItems = this.allNavItems.filter(
        item => !['Siguiendo', 'Mis Podcasts', 'Favoritos', 'Playlists', 'Historial'].includes(item.label)
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
