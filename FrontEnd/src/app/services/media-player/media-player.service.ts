import { Injectable, signal } from '@angular/core';
import { Episode } from '../../models/episode/episode';
import { EpisodeService } from '../episode/episode.service';

export interface MediaPlayerState {
  episode: Episode | null;
  isOpen: boolean;
  isMinimized: boolean;
  viewCounted: boolean;
  startTime: number;
  autoplay: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MediaPlayerService {
  private playbackTimer: any = null;

  playerState = signal<MediaPlayerState>({
    episode: null,
    isOpen: false,
    isMinimized: false,
    viewCounted: false,
    startTime: 0,
    autoplay: false
  });

  constructor(private episodeService: EpisodeService) {}

  openPlayer(episode: Episode, startTime: number = 0, autoplay: boolean = true, viewAlreadyCounted: boolean = false) {
    const currentState = this.playerState();
    
    // Si ya está abierto el mismo episodio, solo expandir si estaba minimizado
    if (currentState.isOpen && currentState.episode?.id === episode.id) {
      if (currentState.isMinimized) {
        this.playerState.update(state => ({
          ...state,
          isMinimized: false
        }));
      }
      return; // No reiniciar el reproductor
    }
    
    // Nuevo episodio o player cerrado - cargar desde cero
    this.cancelViewCountdown();
    this.playerState.update(state => ({
      ...state,
      episode,
      isOpen: true,
      isMinimized: false,
      viewCounted: viewAlreadyCounted,
      startTime,
      autoplay
    }));
    
    // No iniciar el countdown automáticamente - se iniciará cuando se dé play
  }
  
  startPlaybackCountdown() {
    const currentState = this.playerState();
    // Solo iniciar countdown si no se ha contado ya y hay un episodio
    if (!currentState.viewCounted && currentState.episode) {
      this.startViewCountdown();
    }
  }

  closePlayer() {
    this.cancelViewCountdown();
    this.playerState.set({
      episode: null,
      isOpen: false,
      isMinimized: false,
      viewCounted: false,
      startTime: 0,
      autoplay: false
    });
  }

  toggleMinimize() {
    this.playerState.update(state => ({
      ...state,
      isMinimized: !state.isMinimized
    }));
  }

  private startViewCountdown() {
    const currentState = this.playerState();
    if (currentState.viewCounted || !currentState.episode) return;

    this.cancelViewCountdown();

    this.playbackTimer = setTimeout(() => {
      const episode = this.playerState().episode;
      if (episode) {
        this.episodeService.incrementView(episode.id).subscribe({
          next: () => {
            console.log('View contabilizada para episodio:', episode.id);
            this.playerState.update(state => ({ ...state, viewCounted: true }));
          },
          error: (err: any) => console.error('Error al contabilizar view:', err)
        });
      }
    }, 30000); // 30 segundos
  }

  private cancelViewCountdown() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }
}
