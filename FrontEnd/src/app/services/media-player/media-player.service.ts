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
  currentTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MediaPlayerService {
  playerState = signal<MediaPlayerState>({
    episode: null,
    isOpen: false,
    isMinimized: false,
    viewCounted: false,
    startTime: 0,
    autoplay: false,
    currentTime: 0
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
    this.playerState.update(state => ({
      ...state,
      episode,
      isOpen: true,
      isMinimized: false,
      viewCounted: viewAlreadyCounted,
      startTime,
      currentTime: startTime,
      autoplay
    }));
    
    // El viewCounted se manejará desde el componente del reproductor
  }

  updateCurrentTime(time: number) {
    this.playerState.update(state => ({
      ...state,
      currentTime: time
    }));
  }

  getCurrentTime(): number {
    const state = this.playerState();
    return state.currentTime ?? state.startTime ?? 0;
  }
  
  closePlayer() {
    this.playerState.set({
      episode: null,
      isOpen: false,
      isMinimized: false,
      viewCounted: false,
      startTime: 0,
      currentTime: 0,
      autoplay: false
    });
  }

  toggleMinimize() {
    this.playerState.update(state => ({
      ...state,
      isMinimized: !state.isMinimized
    }));
  }

  registerView() {
    const currentState = this.playerState();
    if (currentState.viewCounted || !currentState.episode) return;

    // Marcamos inmediatamente para evitar múltiples llamadas concurrentes
    this.playerState.update(state => ({ ...state, viewCounted: true }));

    this.episodeService.incrementView(currentState.episode.id).subscribe({
      next: () => {
        console.log('View contabilizada para episodio:', currentState.episode!.id);
      },
      error: (err: any) => {
        console.error('Error al contabilizar view:', err);
        // Si falla, revertimos para permitir un reintento
        this.playerState.update(state => ({ ...state, viewCounted: false }));
      }
    });
  }
}
