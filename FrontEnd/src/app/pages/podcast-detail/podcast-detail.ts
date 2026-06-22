import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PodcastService } from '../../services/podcast/podcast-service';
import { Podcast as PodcastModel } from '../../models/podcast/podcast';
import { UserService } from '../../services/client/user-service';
import { AlertService } from '../../services/ui/alert.service';
import { User } from '../../models/user/user';
import { EpisodeService } from '../../services/episode/episode.service';
import { EpisodeDTO } from '../../models/episode/episode-dto';
import { DatePipe } from '@angular/common';
import { AddToPlaylistComponent } from '../../components/shared/add-to-playlist/add-to-playlist';

@Component({
  selector: 'app-podcast-detail',
  imports: [DatePipe, RouterLink, AddToPlaylistComponent],
  templateUrl: './podcast-detail.html',
  styleUrl: './podcast-detail.css'
})
export class PodcastDetail implements OnInit{
  podcast?: PodcastModel;
  isLoading = true;
  podcastId?: number;
  isFavorited = false; // estado local temporal hasta integrar backend
  currentUser?: User;
  isAdmin = false;
  episodes: EpisodeDTO[] = [];
  isLoadingEpisodes = false;
  showCategoriesPopup = false;
  selectedSeason: number = 0; // 0 = todas las temporadas
  availableSeasons: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private podcastService: PodcastService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router,
    private episodeService: EpisodeService
  ){}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.route.params.subscribe(params => {
      this.podcastId = +params['id']; // El + convierte string a number
      if (this.podcastId) {
        this.loadPodcast(this.podcastId);
      }
    });
  }

  editPodcast(): void {
    if (this.podcastId) {
      this.router.navigate(['/podcast', this.podcastId, 'edit']);
    }
  }

  loadCurrentUser(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isAdmin = user.credential.roles.includes('ADMIN');
        this.loadFavoriteStatus();
      },
      error: () => {
        this.currentUser = undefined;
        this.isAdmin = false;
      }
    });
  }

  loadFavoriteStatus(): void {
    if (!this.currentUser || !this.podcastId) return;
    
    this.userService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.isFavorited = favorites.some(fav => fav.id === this.podcastId);
      },
      error: () => {
        this.isFavorited = false;
      }
    });
  }

  loadPodcast(id: number): void {
    this.isLoading = true;
    this.podcastService.getPodcastById(id).subscribe({
      next: (podcast) => {
        this.podcast = podcast;
        this.isLoading = false;
        this.loadEpisodes(id);
      },
      error: (error) => {
        console.error('Error loading podcast:', error);
        this.isLoading = false;
      }
    });
  }

  loadEpisodes(podcastId: number): void {
    this.isLoadingEpisodes = true;
    this.episodeService.getAll(undefined, podcastId).subscribe({
      next: (pageResponse) => {
        this.episodes = pageResponse.content;
        this.updateAvailableSeasons();
        this.isLoadingEpisodes = false;
      },
      error: (error) => {
        console.error('Error loading episodes:', error);
        this.episodes = []; // Limpiamos la lista si el backend devuelve un error (como el 404)
        this.updateAvailableSeasons();
        this.isLoadingEpisodes = false;
      }
    });
  }

  updateAvailableSeasons(): void {
    const seasons = new Set(this.episodes.map(ep => ep.season));
    this.availableSeasons = Array.from(seasons).sort((a, b) => a - b);
  }

  setSelectedSeason(season: number): void {
    this.selectedSeason = season;
  }

  get filteredEpisodes(): EpisodeDTO[] {
    if (this.selectedSeason === 0) {
      return this.episodes;
    }
    return this.episodes.filter(ep => ep.season === this.selectedSeason);
  }

  getTotalViews(): number {
    if (!this.podcast?.episodes) return 0;
    return this.podcast.episodes.reduce((total, episode) => total + (episode.views || 0), 0);
  }

  getTotalEpisodes(): number {
    return this.episodes.length;
  }

  getTotalSeasons(): number {
    if (this.episodes.length === 0) return 0;
    const seasons = this.episodes.map(ep => ep.season).filter(s => s !== null && s !== undefined);
    return seasons.length > 0 ? Math.max(...seasons) : 0;
  }

  formatViews(value: number): string {
    try {
      // Compact notation like 1.2K, 3.4M
      return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    } catch {
      // Fallback simple formatter
      const abs = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + 'B';
      if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + 'M';
      if (abs >= 1_000) return sign + (abs / 1_000).toFixed(1) + 'K';
      return String(value);
    }
  }

  getUserInitial(): string {
    const name = this.podcast?.user?.nickname || this.podcast?.user?.name || '';
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  toggleFavorite(): void {
    if (!this.podcastId || !this.currentUser) {
      this.alertService.error('Error', 'Debes iniciar sesión para agregar favoritos');
      return;
    }

    const action = this.isFavorited 
      ? this.userService.removePodcastFromFavorites(this.podcastId)
      : this.userService.addPodcastToFavorites(this.podcastId);

    action.subscribe({
      next: () => {
        this.isFavorited = !this.isFavorited;
      },
      error: (err) => {
        this.alertService.error('Error', err.message || 'No se pudo actualizar favoritos');
      }
    });
  }

  canDeletePodcast(): boolean {
    if (!this.podcast || !this.currentUser) return false;
    return this.isAdmin || this.podcast.user.id === this.currentUser.id;
  }

  canAddEpisode(): boolean {
    if (!this.podcast || !this.currentUser) return false;
    return this.isAdmin || this.podcast.user.id === this.currentUser.id;
  }

  goToAddEpisode(): void {
    if (!this.podcast) return;
    this.router.navigate(['/podcast', this.podcast.id, 'add-episode']);
  }

  viewEpisode(episodeId: number): void {
    this.router.navigate(['/episode', episodeId]);
  }

  async deletePodcast(): Promise<void> {
    if (!this.podcastId) return;
    
    const confirmed = await this.alertService.confirmDeletePodcast();
    if (confirmed) {
      this.podcastService.deletePodcast(this.podcastId).subscribe({
        next: () => {
          this.alertService.deletePodcastSuccess();
          this.router.navigate(['/']);
        },
        error: (err) => {
          const msg = 'No podés eliminar un podcast con episodios. Eliminá los episodios primero.';
          const isConstraint = err?.status === 409 || err?.status === 400 || (err?.status === 500 && (err?.error?.message?.includes('constraint') || err?.message?.includes('constraint') || err?.error?.toString?.().includes('constraint')));
          if (isConstraint) {
            this.alertService.error('Acción no permitida', msg);
          } else {
            this.alertService.deletePodcastError();
          }
        }
      });
    }
  }

  canDeleteEpisode(episode: EpisodeDTO): boolean {
    if (!this.currentUser || !this.podcast) return false;
    const isOwner = this.podcast.user?.id === this.currentUser.id;
    return isOwner || this.isAdmin;
  }

  deleteEpisode(episode: EpisodeDTO, event: Event): void {
    event.stopPropagation();
    if (!this.canDeleteEpisode(episode)) return;

    this.alertService.confirm(
      '¿Eliminar episodio?',
      `¿Estás seguro de eliminar "${episode.title}"? Esta acción no se puede deshacer.`
    ).then((confirmed) => {
      if (confirmed && this.podcast) {
        this.episodeService.deleteEpisode(episode.id).subscribe({
          next: () => {
            this.alertService.success('Episodio eliminado', 'El episodio fue eliminado correctamente.');
            // Actualización local (Optimistic Update)
            this.episodes = this.episodes.filter(e => e.id !== episode.id);
            if (this.podcast?.episodes) {
              this.podcast.episodes = this.podcast.episodes.filter(e => e.id !== episode.id);
            }
            this.updateAvailableSeasons();
          },
          error: (err) => {
            this.alertService.error('Error', err.message || 'No se pudo eliminar el episodio.');
          }
        });
      }
    });
  }

  editEpisode(episode: EpisodeDTO, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/episode', episode.id, 'edit']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  goToCategory(category: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/explore', category]);
  }

  toggleCategoriesPopup(event: Event): void {
    event.stopPropagation();
    this.showCategoriesPopup = !this.showCategoriesPopup;
  }

  closeCategoriesPopup(): void {
    this.showCategoriesPopup = false;
  }
}
