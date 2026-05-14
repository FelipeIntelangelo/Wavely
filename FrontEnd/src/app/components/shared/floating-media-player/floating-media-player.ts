import { Component, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MediaPlayerService } from '../../../services/media-player/media-player.service';
import { EpisodeService } from '../../../services/episode/episode.service';
import { EpisodeDTO } from '../../../models/episode/episode-dto';
import { Episode } from '../../../models/episode/episode';

@Component({
  selector: 'app-floating-media-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-media-player.html',
  styleUrl: './floating-media-player.css'
})
export class FloatingMediaPlayerComponent implements AfterViewInit, OnDestroy {
  playerState;
  hasEpisode;
  cachedEmbedUrl: SafeResourceUrl | null = null;
  cachedEpisodeId: number | null = null;
  
  @ViewChild('mediaElement') mediaElement?: ElementRef<HTMLAudioElement | HTMLVideoElement | HTMLIFrameElement>;
  
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  isPlayingState = false;
  private updateInterval: any;
  
  episodes: EpisodeDTO[] = [];
  private episodesCache: Map<number, EpisodeDTO[]> = new Map(); // Cache por podcastId

  constructor(
    private mediaPlayerService: MediaPlayerService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private episodeService: EpisodeService
  ) {
    this.playerState = this.mediaPlayerService.playerState;
    this.hasEpisode = computed(() => this.playerState().episode !== null);
  }
  
  ngAfterViewInit() {
    this.startUpdateInterval();
    // Cargar episodios cuando se inicializa si hay un episodio
    if (this.playerState().episode) {
      this.loadEpisodesForPodcast();
    }
    
    // Observar cambios en el episodio
    const checkInterval = setInterval(() => {
      const currentEpisode = this.playerState().episode;
      if (currentEpisode) {
        const podcastId = currentEpisode.podcast?.id;
        if (podcastId) {
          // Si no tenemos episodios o el podcast cambió
          if (this.episodes.length === 0 || !this.episodesCache.has(podcastId)) {
            this.loadEpisodesForPodcast();
          }
        }
      }
    }, 500);
    
    // Limpiar intervalo en destroy
    if (this.updateInterval) {
      // Guardar referencia para limpiar en ngOnDestroy
      (this as any).checkInterval = checkInterval;
    }
  }
  
  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if ((this as any).checkInterval) {
      clearInterval((this as any).checkInterval);
    }
  }
  
  loadEpisodesForPodcast() {
    const episode = this.playerState().episode;
    if (!episode?.podcast?.id) return;
    
    const podcastId = episode.podcast.id;
    
    // Si ya tenemos los episodios en cache, usarlos
    if (this.episodesCache.has(podcastId)) {
      this.episodes = this.episodesCache.get(podcastId)!;
      return;
    }
    
    // Cargar episodios del podcast
    this.episodeService.getAll(undefined, podcastId).subscribe({
      next: (pageResponse) => {
        // Ordenar por temporada y capítulo
        this.episodes = pageResponse.content.sort((a, b) => {
          if (a.season !== b.season) {
            return a.season - b.season;
          }
          return a.chapter - b.chapter;
        });
        this.episodesCache.set(podcastId, this.episodes);
      },
      error: (error) => {
        console.error('Error loading episodes:', error);
      }
    });
  }
  
  getCurrentEpisodeIndex(): number {
    const currentEpisode = this.playerState().episode;
    if (!currentEpisode) return -1;
    
    return this.episodes.findIndex(ep => ep.id === currentEpisode.id);
  }
  
  hasPreviousEpisode(): boolean {
    return this.getCurrentEpisodeIndex() > 0;
  }
  
  hasNextEpisode(): boolean {
    const index = this.getCurrentEpisodeIndex();
    return index >= 0 && index < this.episodes.length - 1;
  }
  
  previousEpisode() {
    if (!this.hasPreviousEpisode()) return;
    
    // Si no tenemos los episodios cargados, cargarlos primero
    if (this.episodes.length === 0) {
      this.loadEpisodesForPodcast();
      // Esperar un momento para que se carguen
      setTimeout(() => this.previousEpisode(), 100);
      return;
    }
    
    const currentIndex = this.getCurrentEpisodeIndex();
    if (currentIndex <= 0) return;
    
    const previousEpisodeDTO = this.episodes[currentIndex - 1];
    
    // Convertir EpisodeDTO a Episode (necesitamos cargar el episodio completo)
    this.episodeService.getById(previousEpisodeDTO.id).subscribe({
      next: (episode: Episode) => {
        this.mediaPlayerService.openPlayer(episode, 0, true, false);
      },
      error: (error) => {
        console.error('Error loading previous episode:', error);
      }
    });
  }
  
  nextEpisode() {
    if (!this.hasNextEpisode()) return;
    
    // Si no tenemos los episodios cargados, cargarlos primero
    if (this.episodes.length === 0) {
      this.loadEpisodesForPodcast();
      // Esperar un momento para que se carguen
      setTimeout(() => this.nextEpisode(), 100);
      return;
    }
    
    const currentIndex = this.getCurrentEpisodeIndex();
    if (currentIndex < 0 || currentIndex >= this.episodes.length - 1) return;
    
    const nextEpisodeDTO = this.episodes[currentIndex + 1];
    
    // Convertir EpisodeDTO a Episode (necesitamos cargar el episodio completo)
    this.episodeService.getById(nextEpisodeDTO.id).subscribe({
      next: (episode: Episode) => {
        this.mediaPlayerService.openPlayer(episode, 0, true, false);
      },
      error: (error) => {
        console.error('Error loading next episode:', error);
      }
    });
  }
  
  // Método para detectar cambios en el episodio y cargar la lista
  getCurrentEpisode() {
    const episode = this.playerState().episode;
    if (episode && !this.episodes.length) {
      this.loadEpisodesForPodcast();
    } else if (episode && this.episodes.length > 0) {
      // Verificar si el episodio actual está en la lista cargada
      const isInList = this.episodes.some(ep => ep.id === episode.id);
      if (!isInList) {
        // Si no está en la lista, probablemente cambió de podcast
        this.loadEpisodesForPodcast();
      }
    }
    return episode;
  }
  
  
  
  startUpdateInterval() {
    this.updateInterval = setInterval(() => {
      this.updateTime();
    }, 100);
  }
  
  updateTime() {
    const element = this.mediaElement?.nativeElement;
    if (element && 'currentTime' in element && 'duration' in element) {
      this.currentTime = element.currentTime || 0;
      this.duration = element.duration || 0;
      if (this.duration > 0) {
        this.progressPercentage = (this.currentTime / this.duration) * 100;
      }
      const wasPlaying = this.isPlayingState;
      this.isPlayingState = !element.paused;
      // Actualizar el checkbox si el estado cambió
      if (wasPlaying !== this.isPlayingState) {
        const checkbox = document.getElementById('play-toggle') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = this.isPlayingState;
        }
        this.cdr.markForCheck();
      }
    }
  }
  
  isPlaying(): boolean {
    return this.isPlayingState;
  }

  closePlayer() {
    this.mediaPlayerService.closePlayer();
    this.cachedEmbedUrl = null;
    this.cachedEpisodeId = null;
  }

  toggleMinimize() {
    this.mediaPlayerService.toggleMinimize();
  }

  goToEpisode() {
    const episode = this.playerState().episode;
    if (episode) {
      this.router.navigate(['/episode', episode.id]);
    }
  }

  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  goToPodcast() {
    const ep = this.playerState().episode;
    const podcastId = ep?.podcast?.id;
    if (podcastId) {
      this.router.navigate(['/podcast', podcastId]);
    }
  }

  isCloudinaryVideo(url: string): boolean {
    return url.includes('cloudinary.com') && (url.includes('/video/') || url.includes('.mp4') || url.includes('.webm'));
  }

  isCloudinaryAudio(url: string): boolean {
    return url.includes('cloudinary.com') && (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a'));
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
    const episode = this.playerState().episode;
    const state = this.playerState();
    
    if (episode && this.cachedEpisodeId === episode.id && this.cachedEmbedUrl) {
      return this.cachedEmbedUrl;
    }

    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    // Agregar startTime y autoplay
    const startParam = state.startTime > 0 ? `&start=${Math.floor(state.startTime)}` : '';
    const autoplayParam = state.autoplay ? '&autoplay=1' : '';
    
    this.cachedEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}?enablejsapi=1${startParam}${autoplayParam}`
    );
    this.cachedEpisodeId = episode?.id || null;
    return this.cachedEmbedUrl;
  }
  
  togglePlayPause(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const element = this.mediaElement?.nativeElement;
    
    if (element && 'play' in element && 'pause' in element) {
      if (checkbox.checked) {
        // Checkbox checked = quiere reproducir
        element.play().then(() => {
          this.isPlayingState = true;
          // Iniciar el contador del historial cuando realmente se empieza a reproducir
          this.mediaPlayerService.startPlaybackCountdown();
          this.cdr.markForCheck();
        }).catch(() => {
          checkbox.checked = false;
          this.isPlayingState = false;
          this.cdr.markForCheck();
        });
      } else {
        // Checkbox unchecked = quiere pausar
        element.pause();
        this.isPlayingState = false;
        this.cdr.markForCheck();
      }
    }
  }
  
  onMetadataLoaded() {
    const element = this.mediaElement?.nativeElement;
    if (element && 'duration' in element) {
      this.duration = element.duration || 0;
    }
  }
  
  onTimeUpdate() {
    this.updateTime();
  }
  
  onPlay() {
    // Iniciar el contador del historial cuando se empieza a reproducir
    this.mediaPlayerService.startPlaybackCountdown();
  }
  
  onEnded() {
    this.isPlayingState = false;
    const checkbox = document.getElementById('play-toggle') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
    }
  }
  
  onIframeLoad() {
    // Para YouTube iframe, la duración se obtiene de otra forma
    // Por ahora, usamos un valor por defecto
    if (!this.duration) {
      this.duration = 300; // 5 minutos por defecto
    }
  }
  
  seek(event: MouseEvent) {
    const element = this.mediaElement?.nativeElement;
    if (element && 'currentTime' in element && 'duration' in element && element.duration) {
      const progressBar = event.currentTarget as HTMLElement;
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      element.currentTime = percentage * element.duration;
      this.currentTime = element.currentTime;
      this.progressPercentage = percentage * 100;
    }
  }
  
  
  formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
