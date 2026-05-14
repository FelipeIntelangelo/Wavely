import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/client/user-service';
import { User } from '../../models/user/user';
import { UserSearchDTO } from '../../models/user/userSearchDTO';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { AlertService } from '../../services/ui/alert.service';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastTotalDTO } from '../../models/podcast/podcast-total-dto';
import { PodcastDTO } from '../../models/podcast/podcast-dto';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  user: User | UserSearchDTO | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isAdmin: boolean = false;
  isOwnProfile: boolean = false;
  currentUserId: number | null = null;
  activeTab: 'podcasts' | 'favorites' = 'podcasts';
  podcastsData: PodcastTotalDTO[] = [];
  favoritesData: PodcastDTO[] = [];
  private sub = new Subscription();

  constructor(
    private userService: UserService, 
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private podcastService: PodcastService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap.subscribe((params) => {
        this.isLoading = true;
        this.error = null;
        const idParam = params.get('id');
        const id = idParam ? Number(idParam) : null;

        if (id !== null && !isNaN(id)) { // Check if id is a valid number
          // Cargar usuario actual primero para comparar
          this.loadCurrentUser(() => {
            this.userService.getUserById(id).subscribe({
              next: (data) => {
                this.checkIfOwnProfile(data.id);
                this.handleLoadSuccess(data, true);
              },
              error: (err) => this.handleLoadError('Failed to load user by id.', err)
            });
          });
        } else {
          // Sin ID = perfil propio
          this.userService.getCurrentUserProfile().subscribe({
            next: (data) => {
              this.currentUserId = data.id;
              this.isOwnProfile = true;
              if (this.isFullUser(data) && data.credential.roles.includes('ADMIN')) {
                this.isAdmin = true;
              }
              this.handleLoadSuccess(data, false);
            },
            error: (err) => this.handleLoadError('Failed to load user profile.', err)
          });
        }
      })
    );
  }

  private loadCurrentUser(callback?: () => void): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        if (user.credential.roles.includes('ADMIN')) {
          this.isAdmin = true;
        }
        if (callback) callback();
      },
      error: () => {
        this.currentUserId = null;
        this.isAdmin = false;
        if (callback) callback();
      }
    });
  }

  private checkIfOwnProfile(profileUserId: number): void {
    this.isOwnProfile = this.currentUserId !== null && this.currentUserId === profileUserId;
  }


  async deleteAccount(event: Event): Promise<void> {
    event.preventDefault();
    
    const confirmed = await this.alertService.confirm(
      '¿Eliminar cuenta?',
      '¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      this.userService.deleteCurrentUser().subscribe({
        next: () => {
          this.alertService.success('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.');
          this.authService.logout();
          this.router.navigate(['/']);
        },
        error: (err) => {
          // Extraer el mensaje de error de la API
          let errorMessage = 'No se pudo eliminar la cuenta. Intentá nuevamente.';
          
          if (err?.error?.error) {
            // Si el error viene en formato {"error": "mensaje"}
            errorMessage = err.error.error;
          } else if (typeof err?.error === 'string') {
            // Si el error es un string directo
            try {
              const parsed = JSON.parse(err.error);
              errorMessage = parsed.error || errorMessage;
            } catch {
              errorMessage = err.error;
            }
          } else if (err?.message) {
            errorMessage = err.message;
          }
          this.alertService.error('Error', errorMessage);
          console.error(err);
        }
      });
    }
  }


  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  isFullUser(value: User | UserSearchDTO | null): value is User {
    return !!value && 'credential' in value;
  }

  setActiveTab(tab: 'podcasts' | 'favorites'): void {
    this.activeTab = tab;
  }

  navigateToPodcast(podcastId: number): void {
    this.router.navigate(['/podcast', podcastId]);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Ocultar la imagen con error
    img.style.display = 'none';
    // Mostrar el placeholder si existe
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    } else {
      // Si no existe placeholder, crear uno
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'image-placeholder';
      placeholderDiv.innerHTML = '<i class="fas fa-podcast"></i>';
      img.parentElement?.appendChild(placeholderDiv);
    }
  }

  private handleLoadSuccess(data: User | UserSearchDTO, shouldScroll: boolean): void {
    this.user = data;
    
    // Cargar podcasts siempre
    if (this.isOwnProfile) {
      // Si es el perfil propio, usar getMyPodcasts y getMyFavorites
      this.loadMyPodcasts();
      this.loadMyFavorites();
    } else {
      // Si es otro usuario, buscar podcasts por userId
      this.loadUserPodcasts(data.id);
    }
    
    this.isLoading = false;
    
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private loadMyPodcasts(): void {
    this.podcastService.getMyPodcasts().subscribe({
      next: (podcasts) => {
        this.podcastsData = podcasts;
        if (podcasts.length > 0) {
          this.activeTab = 'podcasts';
        }
      },
      error: (err) => {
        console.error('Error loading my podcasts:', err);
        this.podcastsData = [];
      }
    });
  }

  private loadMyFavorites(): void {
    this.userService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.favoritesData = favorites;
        if (favorites.length > 0 && this.podcastsData.length === 0) {
          this.activeTab = 'favorites';
        }
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
        this.favoritesData = [];
      }
    });
  }

  private loadUserPodcasts(userId: number): void {
    this.podcastService.getAllFiltered(undefined, userId, undefined, false, 0, 100).subscribe({
      next: (pageResponse) => {
        const items = pageResponse.content || [];

        // If items already include owner/user info, filter directly by userId
        const hasUserField = items.some((p: any) => p && p.user && (p.user.id !== undefined));

        if (hasUserField) {
          const filtered = items.filter((p: any) => p && p.user && p.user.id === userId);
          this.podcastsData = filtered.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            imageUrl: p.imageUrl,
            categories: p.categories || [],
            averageViews: p.averageViews || 0,
            averageRating: p.averageRating || 0
          }));
          if (this.podcastsData.length > 0) this.activeTab = 'podcasts';
          return;
        }

        // If server returned items without owner info, try fetching full podcast objects by id and filter
        const ids = items.map((p: any) => p.id).filter((id: any) => id != null);
        if (ids.length === 0) {
          this.podcastsData = [];
          return;
        }

        const requests = ids.map(id => this.podcastService.getPodcastById(id).pipe(
          catchError(() => of(null))
        ));

        forkJoin(requests).subscribe((fulls: any[]) => {
          const filtered = (fulls || []).filter(f => f && f.user && f.user.id === userId);
          this.podcastsData = filtered.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            imageUrl: p.imageUrl,
            categories: p.categories || [],
            averageViews: p.averageViews || 0,
            averageRating: p.averageRating || 0
          }));
          if (this.podcastsData.length > 0) this.activeTab = 'podcasts';
        }, (err) => {
          console.error('Error fetching full podcast objects for user filtering', err);
          // Fallback: map server response as-is
          this.podcastsData = items.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            imageUrl: p.imageUrl,
            categories: [],
            averageViews: p.averageViews || 0,
            averageRating: 0
          }));
          if (this.podcastsData.length > 0) this.activeTab = 'podcasts';
        });
      },
      error: (err) => {
        console.error('Error loading user podcasts:', err);
        this.podcastsData = [];
      }
    });
  }

  private handleLoadError(message: string, err: unknown): void {
    this.error = message;
    this.isLoading = false;
    console.error(err);
  }

  onProfileImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const wrapper = img.parentElement;
    if (wrapper) {
      img.remove();
      const placeholder = document.createElement('div');
      placeholder.className = 'user-image-placeholder profile-picture-placeholder';
      wrapper.appendChild(placeholder);
    }
  }
}