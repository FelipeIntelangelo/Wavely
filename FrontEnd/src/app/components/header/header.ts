import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { UserService } from '../../services/client/user-service';
import { UserSearchDTO } from '../../models/user/userSearchDTO';
import { User } from '../../models/user/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { LayoutService } from '../../services/layout/layout.service';
import { NotificationBell } from '../notification-bell/notification-bell';
import { AuthModalService } from '../../services/auth/auth-modal.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, FormsModule, NotificationBell],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit{
  searchQuery: string = '';
  showDropdown: boolean = false;
  searchResults: UserSearchDTO[] = []; // Resultados de usuarios filtrados a mostrar
  podcastResults: PodcastSearchDTO[] = []; // Resultados de podcasts filtrados a mostrar
  error: string | null = null;
  isLoggedIn: boolean = false;
  user: User | null = null;
  showProfileMenu: boolean = false;
  showMobileSearch: boolean = false;
  showMobileSearchPopdown: boolean = false;

  constructor(
    private userService: UserService,
    private podcastService: PodcastService,
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef,
    private layoutService: LayoutService,
    private authModalService: AuthModalService
  ) {}

  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.userService.getCurrentUserProfile().subscribe({
          next: (user) => {
            this.user = user;
          },
          error: (err) => {
            this.error = err.message;
            this.authService.logout(); // For security reasons, if the profile cannot be loaded, log out
          },
        });
      } else {
        this.user = null;
      }
    });
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showProfileMenu = false;
    }
  }

  logout(): void {
    this.showProfileMenu = false; // Close the menu on logout
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openLoginModal(): void {
    this.authModalService.open('login');
  }

  onSearchFocus() {
    // En mobile, abrir pop-down en lugar de solo mostrar dropdown
    if (window.innerWidth <= 767) {
      this.showMobileSearchPopdown = true;
      setTimeout(() => {
        const mobileInput = document.querySelector('.mobile-search-popdown-input') as HTMLInputElement;
        if (mobileInput) {
          mobileInput.focus();
        }
      }, 100);
    } else {
      this.showDropdown = true;
    }
  }

  onSearchIconClick(event?: MouseEvent): void {
    // Prevenir el comportamiento por defecto para que no quite el foco del input
    if (event) {
      event.preventDefault();
    }
    
    // En mobile, abrir pop-down al hacer click en la lupa
    if (window.innerWidth <= 767) {
      this.showMobileSearchPopdown = true;
      setTimeout(() => {
        const mobileInput = document.querySelector('.mobile-search-popdown-input') as HTMLInputElement;
        if (mobileInput) {
          mobileInput.focus();
        }
      }, 100);
    } else {
      // En desktop, ejecutar la búsqueda como el Enter
      this.onSearchButton();
    }
  }

  closeMobileSearchPopdown(): void {
    this.showMobileSearchPopdown = false;
    this.showDropdown = false;
    this.searchQuery = '';
  }

  onSearchInput(event: Event) {
    const dinamicValue = event.target as HTMLInputElement;
    this.searchQuery = dinamicValue.value;
    
    if (this.searchQuery.length > 0) {
      this.showDropdown = true;
      const queryClean = this.searchQuery.trim().toLowerCase();

      // Trae los usuarios buscando por nickname
      this.userService.getUsersDTO(queryClean, 0, 5).subscribe({
        next: (pageResponse) => {
          this.searchResults = pageResponse.content;
        },
        error: (err) => {
          this.error = err?.message || 'Error al buscar usuarios';
          this.searchResults = [];
        }
      });

      // Trae los podcasts filtrando por título
      this.podcastService.getAllFiltered(queryClean, undefined, undefined, false, 0, 5).subscribe({
        next: (pageResponse) => {
          this.podcastResults = pageResponse.content;
        },
        error: (err) => {
          this.error = err?.message || 'Error al buscar podcasts';
          this.podcastResults = [];
        }
      });

    } else {
      this.searchResults = [];
      this.podcastResults = [];
    }
  }

  onSearchBlur() {
    // En mobile, no cerrar el dropdown si el popdown está abierto
    if (window.innerWidth <= 767 && this.showMobileSearchPopdown) {
      return;
    }
    setTimeout(() => {
      this.showDropdown = false;
    }, 300);
  }

  onSearchButton(){
    const term = this.searchQuery.trim();
    if (term) {
      this.showDropdown = false;
      this.showMobileSearch = false;
      this.router.navigate(['/search', term]);
      this.searchQuery = ''; // Limpiar el input después de la búsqueda
    }
  }

  toggleMobileSearch(): void {
    this.showMobileSearch = !this.showMobileSearch;
    if (this.showMobileSearch) {
      // Focus en el input móvil después de que se muestre
      setTimeout(() => {
        const mobileInput = document.querySelector('.mobile-search-input') as HTMLInputElement;
        if (mobileInput) {
          mobileInput.focus();
        }
      }, 100);
    } else {
      this.showDropdown = false;
      this.searchQuery = '';
    }
  }

  closeMobileSearch(): void {
    this.showMobileSearch = false;
    this.showDropdown = false;
    this.searchQuery = '';
  }

  onMobileSearchBlur(): void {
    // Cerrar después de un pequeño delay para permitir clicks en resultados
    setTimeout(() => {
      if (!this.showDropdown) {
        this.closeMobileSearch();
      }
    }, 300);
  }

  selectResult(result: any) {
    // navegar al perfil publico(DTO) del usuario usando rutas paramétricas
    if (result && result.id) {
      this.router.navigate(['/profile', result.id]);
    }
    this.showDropdown = false;
    this.closeMobileSearch();
    this.closeMobileSearchPopdown();
  }

  selectPodcast(podcast: PodcastSearchDTO) {
    // navegar al podcast específico usando rutas paramétricas
    if (podcast && podcast.id) {
      this.router.navigate(['/podcast', podcast.id]); // Asumiendo que tienes una ruta para podcasts
    }
    this.showDropdown = false;
    this.closeMobileSearch();
    this.closeMobileSearchPopdown();
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  onProfileImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = img.parentElement;
    if (container) {
      img.remove();
      const placeholder = document.createElement('div');
      placeholder.className = 'user-image-placeholder profile-placeholder';
      container.appendChild(placeholder);
    }
  }
}

