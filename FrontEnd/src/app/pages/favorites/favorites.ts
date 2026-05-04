import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/client/user-service';
import { PodcastDTO } from '../../models/podcast/podcast-dto';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/ui/alert.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent implements OnInit {
  favorites: PodcastDTO[] = [];
  isLoading = true;

  constructor(
    private userService: UserService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.isLoading = true;
    this.userService.getMyFavorites().subscribe({
      next: (podcasts) => {
        this.favorites = podcasts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.isLoading = false;
      }
    });
  }

  formatViews(value: number): string {
    try {
      return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    } catch {
      const abs = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + 'B';
      if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + 'M';
      if (abs >= 1_000) return sign + (abs / 1_000).toFixed(1) + 'K';
      return String(value);
    }
  }

  viewPodcast(id: number): void {
    this.router.navigate(['/podcast', id]);
  }

  toggleFavorite(podcastId: number): void {
    this.userService.removePodcastFromFavorites(podcastId).subscribe({
      next: () => {
        this.alertService.success('¡Listo!', 'Podcast eliminado de favoritos');
        // Remover el podcast de la lista local
        this.favorites = this.favorites.filter(p => p.id !== podcastId);
      },
      error: (err) => {
        this.alertService.error('Error', err.message || 'No se pudo quitar de favoritos');
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
}
