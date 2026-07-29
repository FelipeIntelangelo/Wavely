import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EpisodeService } from '../../services/episode/episode.service';
import { CommentaryService } from '../../services/commentary/commentary.service';
import { Episode } from '../../models/episode/episode';
import { CommentaryDTO } from '../../models/commentary/commentary-dto';
import { CommentaryCreateDTO } from '../../models/commentary/commentary-create-dto';
import { EpisodeHistoryDTO } from '../../models/episode/episode-history-dto';
import { DatePipe, CommonModule } from '@angular/common';
import { MediaPlayerService } from '../../services/media-player/media-player.service';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/client/user-service';
import { AlertService } from '../../services/ui/alert.service';
import { User } from '../../models/user/user';
import { FormsModule } from '@angular/forms';
import { AddToPlaylistComponent } from '../../components/shared/add-to-playlist/add-to-playlist';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

@Component({
  selector: 'app-episode-detail',
  imports: [DatePipe, RouterLink, CommonModule, FormsModule, AddToPlaylistComponent, MediaImageComponent],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.css'
})
export class EpisodeDetail implements OnInit, OnDestroy {
  episode?: Episode;
  isLoading = true;
  episodeId?: number;
  hideInlinePlayer = false;
  videoCurrentTime = 0;
  isVideoPlaying = false;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
  
  // Contador de tiempo manual
  playbackStartTime: number | null = null;
  timerInterval: any = null;
  estimatedPlaybackTime = 0;
  
  // Contador de views
  viewTimerInterval: any = null;
  viewCounted = false;
  isUserLoggedIn = false;
  currentUser?: User;
  isAdmin = false;
  // Descripción expandida
  isDescriptionExpanded = false;
  // Comentarios
  commentaries: CommentaryDTO[] = [];
  isLoadingCommentaries = false;
  commentariesError: string | null = null;
  pageSize = 10;
  currentPage = 1;
  // Nuevo comentario
  newCommentContent = '';
  isSubmittingComment = false;
  // Historial del usuario
  isInHistory = false;
  isLoadingHistory = false;
  // Rating
  userRating: number = 0;
  isSubmittingRating = false;

  // Límite de caracteres para comentarios (estilo Twitter)
  readonly MAX_COMMENT_LENGTH = 1000;

  get commentCharCount(): number {
    return this.newCommentContent ? this.newCommentContent.length : 0;
  }

  get remainingChars(): number {
    return this.MAX_COMMENT_LENGTH - this.commentCharCount;
  }

  get strokeDashoffset(): number {
    const circumference = 62.83;
    const progress = Math.min(1, this.commentCharCount / this.MAX_COMMENT_LENGTH);
    return circumference * (1 - progress);
  }

  
  constructor(
    private route: ActivatedRoute,
    private episodeService: EpisodeService,
    private commentaryService: CommentaryService,
    private mediaPlayerService: MediaPlayerService,
    private authService: AuthService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router
  ) {
    // Reaccionar en tiempo real cuando el reproductor flotante contabilice los 30 segundos
    effect(() => {
      const state = this.mediaPlayerService.playerState();
      if (this.episodeId && state.episode?.id === this.episodeId && state.viewCounted) {
        this.viewCounted = true;
        this.isInHistory = true;
      }
    });
  }
  
  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe(loggedIn => {
      this.isUserLoggedIn = loggedIn;
      if (loggedIn) {
        this.loadUserHistory();
        if (this.episodeId) {
          this.loadUserRating(this.episodeId);
        }
      }
    });
    
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isAdmin = user.credential.roles.includes('ADMIN');
      },
      error: () => {
        this.currentUser = undefined;
        this.isAdmin = false;
      }
    });
    
    this.route.params.subscribe(params => {
      this.episodeId = +params['id'];
      if (this.episodeId) {
        this.loadEpisode(this.episodeId);
      }
    });
  }
  
  get totalPages(): number {
    return Math.ceil(this.commentaries.length / this.pageSize) || 1;
  }

  get paginatedCommentaries(): CommentaryDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.commentaries.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  
  loadEpisode(id: number): void {
    this.isLoading = true;
    // Limpiar timer anterior
    this.stopTimer();
    this.stopViewTimer();
    this.episodeService.getById(id).subscribe({
      next: (episode) => {
        this.episode = episode;
        this.isLoading = false;
        this.loadCommentaries(episode.id);
        if (this.isUserLoggedIn) {
          this.loadUserRating(episode.id);
        }
        
        // Verificar si este episodio está reproduciéndose en el flotante
        const playerState = this.mediaPlayerService.playerState();
        if (playerState.isOpen && playerState.episode?.id === episode.id) {
          // El episodio está en el flotante
          this.hideInlinePlayer = true;
          this.viewCounted = playerState.viewCounted;
          if (playerState.viewCounted) {
            this.isInHistory = true;
          }
        } else {
          // Episodio no está en el flotante, resetear estado
          this.hideInlinePlayer = false;
          this.viewCounted = false;
        }
        
        this.estimatedPlaybackTime = 0;
      },
      error: (error) => {
        console.error('Error loading episode:', error);
        this.isLoading = false;
      }
    });
  }

  loadCommentaries(episodeId: number): void {
    this.isLoadingCommentaries = true;
    this.commentariesError = null;
    this.commentaryService.getByEpisode(episodeId).subscribe({
      next: (data) => {
        this.commentaries = data;
        this.isLoadingCommentaries = false;
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Error loading commentaries:', err);
        this.commentariesError = err.message || 'No se pudieron cargar los comentarios';
        this.isLoadingCommentaries = false;
      }
    });
  }

  loadUserHistory(): void {
    this.isLoadingHistory = true;
    this.userService.getMyHistory().subscribe({
      next: (history: EpisodeHistoryDTO[]) => {
        this.isLoadingHistory = false;
        // Verificar si el episodio actual está en el historial
        if (this.episodeId) {
          const found = history.some(h => h.episode.id === this.episodeId);
          if (found) {
            this.isInHistory = true;
          }
        }
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.isLoadingHistory = false;
      }
    });
  }

  loadUserRating(episodeId: number): void {
    this.episodeService.getUserRating(episodeId).subscribe({
      next: (score: number) => {
        this.userRating = score || 0;
      },
      error: (err) => {
        console.error('Error loading user rating:', err);
        this.userRating = 0;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
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

  isVideo(): boolean {
    if (!this.episode?.audioPath) return false;
    const url = this.episode.audioPath.toLowerCase();
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('.ogg') || url.includes('.flac')) {
      return false;
    }
    return url.includes('.mp4') || url.includes('.webm') || url.includes('/video/');
  }

  onVideoPlayerPlay(): void {
    this.isVideoPlaying = true;
    if (!this.timerInterval) {
      this.startTimer();
    }
    if (this.isUserLoggedIn && !this.viewCounted) {
      this.startViewTimer();
    }
  }

  onVideoPlayerPause(): void {
    this.isVideoPlaying = false;
  }

  onVideoTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video) {
      this.videoCurrentTime = video.currentTime;
    }
  }

  startTimer(): void {
    if (this.timerInterval) return; // Ya está corriendo
    
    this.playbackStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (this.playbackStartTime) {
        this.estimatedPlaybackTime = Math.floor((Date.now() - this.playbackStartTime) / 1000);
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startViewTimer(): void {
    if (this.viewCounted || this.viewTimerInterval) return;
    
    this.viewTimerInterval = setTimeout(() => {
      if (this.episode && !this.viewCounted) {
        this.episodeService.incrementView(this.episode.id).subscribe({
          next: () => {
            this.viewCounted = true;
            this.isInHistory = true;
            console.log('View contabilizada para episodio:', this.episode?.id);
            if (this.isUserLoggedIn) {
              this.loadUserHistory();
            }
          },
          error: (error) => console.error('Error al contabilizar view:', error)
        });
      }
    }, 30000); // 30 segundos
  }

  stopViewTimer(): void {
    if (this.viewTimerInterval) {
      clearTimeout(this.viewTimerInterval);
      this.viewTimerInterval = null;
    }
  }

  playInFloatingPlayer(): void {
    if (this.episode) {
      let playbackTime = this.estimatedPlaybackTime;
      
      if (this.isVideo()) {
        playbackTime = this.videoCurrentTime;
        this.isVideoPlaying = false; // Prevent auto-floating on destroy
      } else {
        const el = this.videoPlayer?.nativeElement;
        if (el) {
          playbackTime = el.currentTime;
          try {
            el.pause();
          } catch {}
        }
      }
      
      // Detener el timer de tiempo
      this.stopTimer();
      this.hideInlinePlayer = true;
      
      // Abrir el reproductor flotante
      this.mediaPlayerService.openPlayer(this.episode, playbackTime, true, this.viewCounted);
    }
  }

  showInlinePlayer(): void {
    this.hideInlinePlayer = false;
    this.mediaPlayerService.closePlayer();
    this.estimatedPlaybackTime = 0;
    this.stopTimer();
  }

  ngOnDestroy(): void {
    // If the video player was playing, transition to floating player on page navigation
    if (this.episode && this.isVideo() && this.isVideoPlaying) {
      this.mediaPlayerService.openPlayer(this.episode, this.videoCurrentTime, true, this.viewCounted);
    }
    this.stopTimer();
    this.stopViewTimer();
  }

  canDeleteEpisode(): boolean {
    if (!this.currentUser || !this.episode) return false;
    const isOwner = this.episode.podcast?.user?.id === this.currentUser.id;
    return isOwner || this.isAdmin;
  }

  deleteEpisode(): void {
    if (!this.episode || !this.canDeleteEpisode()) return;

    this.alertService.confirm(
      '¿Eliminar episodio?',
      `¿Estás seguro de eliminar "${this.episode.title}"? Esta acción no se puede deshacer.`
    ).then((confirmed) => {
      if (confirmed && this.episode) {
        const podcastId = this.episode.podcast.id;
        this.episodeService.deleteEpisode(this.episode.id).subscribe({
          next: () => {
            this.alertService.success('Episodio eliminado', 'El episodio fue eliminado correctamente.');
            this.router.navigate(['/podcast', podcastId]);
          },
          error: (err) => {
            this.alertService.error('Error', err.message || 'No se pudo eliminar el episodio.');
          }
        });
      }
    });
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  rateEpisode(score: number): void {
    if (!this.episode || !this.isUserLoggedIn) {
      this.alertService.error('Error', 'Debes iniciar sesión para valorar episodios');
      return;
    }

    this.isSubmittingRating = true;
    this.episodeService.rateEpisode(this.episode.id, score).subscribe({
      next: () => {
        this.userRating = score;
        this.isSubmittingRating = false;
        this.alertService.success('¡Gracias!', `Valoraste este episodio con ${score} estrella${score > 1 ? 's' : ''}`);
      },
      error: (err) => {
        this.isSubmittingRating = false;
        let errorMessage = 'No se pudo guardar tu valoración';
        if (err?.error) {
          errorMessage = typeof err.error === 'string' ? err.error : errorMessage;
        }
        this.alertService.error('Error', errorMessage);
      }
    });
  }

  canComment(): boolean {
    return this.isUserLoggedIn && this.isInHistory;
  }

  submitComment(): void {
    if (!this.episode || !this.canComment() || !this.newCommentContent.trim() || this.remainingChars < 0) {
      return;
    }

    if (this.commentCharCount > this.MAX_COMMENT_LENGTH) {
      this.alertService.error('Comentario muy largo', `El comentario no puede exceder los ${this.MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    this.isSubmittingComment = true;
    const commentDto: CommentaryCreateDTO = {
      commentary: this.newCommentContent.trim()
    };

    this.commentaryService.createCommentary(this.episode.id, commentDto).subscribe({
      next: () => {
        // Recargar los comentarios desde el servidor
        this.loadCommentaries(this.episode!.id);
        this.newCommentContent = '';
        this.isSubmittingComment = false;
        this.alertService.success('¡Comentario publicado!', 'Tu comentario se ha agregado correctamente.');
      },
      error: (err) => {
        this.isSubmittingComment = false;
        this.alertService.error('Error', err.message || 'No se pudo publicar el comentario.');
      }
    });
  }

  isPlayingInFloatingPlayer(): boolean {
    if (!this.episode) return false;
    const playerState = this.mediaPlayerService.playerState();
    return playerState.isOpen && playerState.episode?.id === this.episode.id;
  }

  togglePlayFromImage(event: Event): void {
    event.stopPropagation();
    // Siempre reproducir cuando se hace clic en el botón
    this.playInFloatingPlayer();
  }
}
