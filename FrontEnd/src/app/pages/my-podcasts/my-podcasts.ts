import { Component, OnInit } from '@angular/core';
import { PodcastService } from '../../services/podcast/podcast-service';
import { PodcastTotalDTO } from '../../models/podcast/podcast-total-dto';
import { AlertService } from '../../services/ui/alert.service';
import { Router } from '@angular/router';
import { EpisodeService } from '../../services/episode/episode.service';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-podcasts',
  imports: [MediaImageComponent, CommonModule],
  templateUrl: './my-podcasts.html',
  styleUrl: './my-podcasts.css'
})
export class MyPodcasts implements OnInit {
  myPodcasts: PodcastTotalDTO[] = [];
  isLoading = true;
  episodesCount: Map<number, number> = new Map(); // Mapa para almacenar cantidad de episodios por podcast

  constructor(
    private podcastService: PodcastService,
    private alertService: AlertService,
    private router: Router,
    private episodeService: EpisodeService
  ) {}

  ngOnInit(): void {
    this.loadMyPodcasts();
  }

  loadMyPodcasts(): void {
    this.isLoading = true;
    this.podcastService.getMyPodcasts().subscribe({
      next: (podcasts) => {
        this.myPodcasts = podcasts;
        this.loadEpisodesForAllPodcasts();
        this.isLoading = false;
        console.log(podcasts)
      },
      error: (error) => {
        console.error('Error loading my podcasts:', error);
        this.isLoading = false;
      }
    });
  }

  loadEpisodesForAllPodcasts(): void {
    // Cargar episodios para cada podcast
    this.myPodcasts.forEach(podcast => {
      this.episodeService.getAll(undefined, podcast.id).subscribe({
        next: (pageResponse) => {
          this.episodesCount.set(podcast.id, pageResponse.totalElements);
        },
        error: (error) => {
          console.error(`Error loading episodes for podcast ${podcast.id}:`, error);
          this.episodesCount.set(podcast.id, 0);
        }
      });
    });
  }

  hasEpisodes(podcastId: number): boolean {
    const count = this.episodesCount.get(podcastId) || 0;
    return count > 0;
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

  editPodcast(id: number): void {
    this.router.navigate(['/podcast', id, 'edit']);
  }

  async deletePodcast(id: number): Promise<void> {
    const confirmed = await this.alertService.confirmDeletePodcast();
    if (confirmed) {
      this.podcastService.deletePodcast(id).subscribe({
        next: () => {
          this.alertService.deletePodcastSuccess();
          this.loadMyPodcasts();
        },
        error: (err) => {
          console.error('Error deleting podcast:', err);
          
          // Extraer mensaje de error personalizado del backend
          let errorMessage = 'No podés eliminar un podcast con episodios. Eliminá los episodios primero.';
          
          if (err?.error?.error) {
            errorMessage = err.error.error;
          } else if (typeof err?.error === 'string') {
            try {
              const parsed = JSON.parse(err.error);
              errorMessage = parsed.error || errorMessage;
            } catch {
              errorMessage = err.error;
            }
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          // Detectar si es error de constraint o validación de negocio
          const isConstraintOrValidation = 
            err?.status === 409 || 
            err?.status === 400 || 
            errorMessage.toLowerCase().includes('episodio') ||
            errorMessage.toLowerCase().includes('constraint');
          
          if (isConstraintOrValidation) {
            this.alertService.error('Acción no permitida', errorMessage);
          } else {
            this.alertService.deletePodcastError();
          }
        }
      });
    }
  }
}
