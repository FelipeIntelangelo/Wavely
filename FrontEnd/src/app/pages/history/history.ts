import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/client/user-service';
import { EpisodeHistoryDTO } from '../../models/episode/episode-history-dto';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DurationPipe } from '../../pipes/duration.pipe';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, DurationPipe, MediaImageComponent, RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class HistoryComponent implements OnInit {
  history: EpisodeHistoryDTO[] = [];
  isLoading = true;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.userService.getMyHistory().subscribe({
      next: (history) => {
        // Ordenar por listenedAt descendente (más reciente primero)
        this.history = history.sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.isLoading = false;
      }
    });
  }

  viewEpisode(id: number): void {
    this.router.navigate(['/episode', id]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = Math.max(0, now.getTime() - date.getTime());
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  formatDuration(durationString: string): string {
    // Duration viene en formato ISO 8601 como "PT1H30M45S" o "PT5M30S"
    if (!durationString) return '0:00';
    
    const match = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
