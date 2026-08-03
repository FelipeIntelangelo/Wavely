import { Injectable, signal } from '@angular/core';
import { Episode } from '../../models/episode/episode';
import { EpisodeService } from '../episode/episode.service';

import { UserService } from '../client/user-service';
import { forkJoin, map, switchMap, catchError, of, firstValueFrom } from 'rxjs';
import { AlertService } from '../ui/alert.service';

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

  constructor(
    private episodeService: EpisodeService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  playPodcast(podcastId: number) {
    // 1. Fetch all episodes for the podcast (first 100 should be enough for now)
    // 2. Fetch user's history
    // 3. Find the next episode to play
    forkJoin({
      episodes: this.episodeService.getAll(undefined, podcastId, 0, 100).pipe(catchError(() => of(null))),
      history: this.userService.getMyHistory().pipe(catchError(() => of([])))
    }).subscribe(({ episodes, history }) => {
      if (!episodes || !episodes.content || episodes.content.length === 0) {
        this.alertService.error('Error', 'No hay episodios disponibles para este podcast.');
        return;
      }
      
      const allEpisodes = episodes.content.sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.chapter - b.chapter;
      });

      let episodeToPlay = allEpisodes[0];

      if (history && history.length > 0) {
        // Find episodes from history that belong to this podcast
        const podcastHistory = history.filter(h => h.episode.podcastId === podcastId);
        
        if (podcastHistory.length > 0) {
          // Sort history to find the most recently listened
          podcastHistory.sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
          const lastListened = podcastHistory[0];
          
          // Find the last listened episode in the sorted episodes list
          const lastIndex = allEpisodes.findIndex(e => e.id === lastListened.episode.id);
          if (lastIndex !== -1 && lastIndex < allEpisodes.length - 1) {
            // Play the next one!
            episodeToPlay = allEpisodes[lastIndex + 1];
          } else if (lastIndex !== -1) {
            // Reached the end, maybe play the last one again or the first? 
            // We'll just play the last one if there is no next.
            episodeToPlay = allEpisodes[lastIndex];
          }
        }
      }

      // Fetch the full episode to open it in player
      this.episodeService.getById(episodeToPlay.id).subscribe({
        next: (fullEpisode) => {
          this.openPlayer(fullEpisode);
        },
        error: () => {
          this.alertService.error('Error', 'Error al cargar el episodio.');
        }
      });
    });
  }

  playEpisode(episodeId: number) {
    this.episodeService.getById(episodeId).subscribe({
      next: (fullEpisode) => {
        this.openPlayer(fullEpisode);
      },
      error: () => {
        this.alertService.error('Error', 'Error al cargar el episodio.');
      }
    });
  }

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
