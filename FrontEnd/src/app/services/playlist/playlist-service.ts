import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, tap } from 'rxjs';
import {
  CreatePlaylistRequest,
  Playlist,
  PlaylistDetail,
  PlaylistItemType,
  UpdatePlaylistRequest
} from '../../models/playlist/playlist';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private readonly API_URL = '/api/playlists';
  private readonly hasMoreSubject = new BehaviorSubject<boolean>(false);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  readonly hasMore$ = this.hasMoreSubject.asObservable();
  readonly isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMyPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(this.API_URL);
  }

  getById(playlistId: number, page = 0, size = 20): Observable<PlaylistDetail> {
    this.isLoadingSubject.next(true);
    return this.http.get<PlaylistDetail>(`${this.API_URL}/${playlistId}`, {
      params: { page, size }
    }).pipe(
      tap(playlist => this.hasMoreSubject.next(!playlist.items.last)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  create(request: CreatePlaylistRequest): Observable<Playlist> {
    return this.http.post<Playlist>(this.API_URL, request);
  }

  update(playlistId: number, request: UpdatePlaylistRequest): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.API_URL}/${playlistId}`, request);
  }

  delete(playlistId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${playlistId}`);
  }

  addItem(playlistId: number, type: PlaylistItemType, contentId: number): Observable<Playlist> {
    const segment = type === 'PODCAST' ? 'podcasts' : 'episodes';
    return this.http.post<Playlist>(`${this.API_URL}/${playlistId}/${segment}/${contentId}`, {});
  }

  removeItem(playlistId: number, type: PlaylistItemType, contentId: number): Observable<void> {
    const segment = type === 'PODCAST' ? 'podcasts' : 'episodes';
    return this.http.delete<void>(`${this.API_URL}/${playlistId}/${segment}/${contentId}`);
  }
}
