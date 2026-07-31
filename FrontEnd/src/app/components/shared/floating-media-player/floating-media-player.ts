import { Component, computed, effect, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MediaPlayerService } from '../../../services/media-player/media-player.service';
import { EpisodeService } from '../../../services/episode/episode.service';
import { EpisodeDTO } from '../../../models/episode/episode-dto';
import { Episode } from '../../../models/episode/episode';
import { MediaImageComponent } from '../media-image/media-image';

@Component({
  selector: 'app-floating-media-player',
  standalone: true,
  imports: [CommonModule, MediaImageComponent],
  templateUrl: './floating-media-player.html',
  styleUrl: './floating-media-player.css'
})
export class FloatingMediaPlayerComponent {
  playerState;
  hasEpisode;
  
  @ViewChild('mediaElement') mediaElement?: ElementRef<HTMLAudioElement | HTMLVideoElement>;
  
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  isPlayingState = false;
  
  episodes: EpisodeDTO[] = [];
  private episodesCache: Map<number, EpisodeDTO[]> = new Map(); // Cache por podcastId

  constructor(
    private mediaPlayerService: MediaPlayerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private episodeService: EpisodeService
  ) {
    this.playerState = this.mediaPlayerService.playerState;
    this.hasEpisode = computed(() => this.playerState().episode !== null);

    // Reactively watch for episode changes to load podcast episodes
    effect(() => {
      const currentEpisode = this.playerState().episode;
      if (currentEpisode) {
        const podcastId = currentEpisode.podcast?.id;
        if (podcastId) {
          this.loadEpisodesForPodcast();
        }
      } else {
        this.episodes = [];
      }
    });
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
    this.episodeService.getAllByPodcast(podcastId).subscribe({
      next: (episodes) => {
        // Ordenar por temporada y capítulo
        this.episodes = episodes.sort((a, b) => {
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
  
  
  
  updateTime() {
    const element = this.mediaElement?.nativeElement;
    if (element && 'currentTime' in element && 'duration' in element) {
      this.currentTime = element.currentTime || 0;
      this.duration = element.duration || 0;
      
      // Registrar vista si pasa de 20 segundos o completa el 80% del audio
      if (this.currentTime >= 20 || (this.duration > 0 && this.currentTime >= this.duration * 0.8)) {
        this.mediaPlayerService.registerView();
      }

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
      }
      this.cdr.markForCheck();
    }
  }
  
  isPlaying(): boolean {
    return this.isPlayingState;
  }

  closePlayer() {
    this.mediaPlayerService.closePlayer();
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

  goToPodcast() {
    const ep = this.playerState().episode;
    const podcastId = ep?.podcast?.id;
    if (podcastId) {
      this.router.navigate(['/podcast', podcastId]);
    }
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('.mp3') || lower.includes('.wav') || lower.includes('.m4a') || lower.includes('.ogg') || lower.includes('.flac')) {
      return false;
    }
    return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('/video/');
  }
  
  togglePlayPause(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const element = this.mediaElement?.nativeElement;
    
    if (element && 'play' in element && 'pause' in element) {
      if (checkbox.checked) {
        // Checkbox checked = quiere reproducir
        element.play().then(() => {
          this.isPlayingState = true;
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
  
  // Control de Volumen
  volume = 1;
  isMuted = false;
  previousVolume = 1;

  get volumePercentage(): number {
    return this.isMuted ? 0 : Math.round(this.volume * 100);
  }

  setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    this.isMuted = this.volume === 0;
    const element = this.mediaElement?.nativeElement;
    if (element) {
      element.volume = this.volume;
      element.muted = this.isMuted;
    }
  }

  toggleMute() {
    if (this.isMuted || this.volume === 0) {
      this.setVolume(this.previousVolume > 0 ? this.previousVolume : 1);
    } else {
      this.previousVolume = this.volume;
      this.setVolume(0);
    }
  }

  onVolumeInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.setVolume(parseFloat(input.value));
  }

  onMetadataLoaded() {
    const element = this.mediaElement?.nativeElement;
    if (element) {
      if ('duration' in element) {
        this.duration = element.duration || 0;
      }
      element.volume = this.volume;
      element.muted = this.isMuted;
    }
  }
  
  onTimeUpdate() {
    this.updateTime();
  }
  
  onPlay() {
    // Ya no usamos el contador en onPlay, se maneja por currentTime en updateTime
  }
  
  onEnded() {
    this.isPlayingState = false;
    const checkbox = document.getElementById('play-toggle') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
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
