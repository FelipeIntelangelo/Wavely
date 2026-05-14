import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';
import { EpisodeDTO } from '../../models/episode/episode-dto';
import { Episode } from '../../models/episode/episode';
import { EpisodeCreatePayload } from '../../models/episode/episode-create-dto';
import { PageResponse } from '../../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class EpisodeService {
  private readonly API_URL = "/api/episodes";

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getAll(title?: string, podcastId?: number, page: number = 0, size: number = 10): Observable<PageResponse<EpisodeDTO>> {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (podcastId) params.append('podcastId', podcastId.toString());
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const queryString = params.toString();
    const url = `${this.API_URL}?${queryString}`;
    
    return this.http.get<PageResponse<EpisodeDTO>>(url).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getById(episodeId: number): Observable<Episode> {
    return this.http.get<Episode>(`${this.API_URL}/${episodeId}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  incrementView(episodeId: number): Observable<string> {
    return this.http.get(`${this.API_URL}/${episodeId}/play`, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  createEpisode(payload: EpisodeCreatePayload): Observable<string> {
    return this.http.post(`${this.API_URL}`,
      payload,
      { responseType: 'text' }
    ).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  deleteEpisode(episodeId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${episodeId}`, { responseType: 'text' as 'json' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  updateEpisode(episodeId: number, payload: { title?: string; description?: string; imageUrl?: string }): Observable<Episode> {
    return this.http.patch<Episode>(`${this.API_URL}/${episodeId}`, payload).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  rateEpisode(episodeId: number, score: number): Observable<string> {
    return this.http.post(`/api/users/${episodeId}/rate`, { score }, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

}
