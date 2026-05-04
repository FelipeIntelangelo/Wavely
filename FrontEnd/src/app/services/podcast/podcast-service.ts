import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { Podcast } from '../../models/podcast/podcast';
import { PodcastTotalDTO } from '../../models/podcast/podcast-total-dto';
import { PodcastCreateDTO } from '../../models/podcast/podcast-create-dto';
import { PodcastUpdateDTO } from '../../models/podcast/podcast-update-dto';

@Injectable({
  providedIn: 'root'
})
export class PodcastService {
  private readonly API_URL = "/api/podcasts";
  private readonly AUTH_API_URL = "/api/auth";

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getAll(orderByViews: boolean = false): Observable<PodcastSearchDTO[]> {
    const params = orderByViews ? '?orderByViews=true' : '';
    return this.http.get<PodcastSearchDTO[]>(`${this.API_URL}${params}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getAllFiltered(title?: string, userId?: number, category?: string, orderByViews: boolean = false): Observable<any[]> {
    const params = new URLSearchParams();
    
    if (title) params.append('title', title);
    if (userId) params.append('userId', userId.toString());
    if (category) params.append('category', category);
    if (orderByViews) params.append('orderByViews', 'true');
    
    const queryString = params.toString();
    const url = queryString ? `${this.API_URL}?${queryString}` : this.API_URL;
    
    return this.http.get<any[]>(url).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getPodcastById(podcastId: number): Observable<Podcast> {
    return this.http.get<Podcast>(`${this.API_URL}/${podcastId}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  createPodcast(podcast: PodcastCreateDTO): Observable<string> {
    return this.http.post(`${this.API_URL}`, podcast, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getMyPodcasts(): Observable<PodcastTotalDTO[]> {
    return this.http.get<PodcastTotalDTO[]>(`${this.API_URL}/myPodcasts`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  deletePodcast(podcastId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${podcastId}`, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  updatePodcast(podcastId: number, updates: PodcastUpdateDTO): Observable<PodcastUpdateDTO> {
    return this.http.patch<PodcastUpdateDTO>(`${this.API_URL}/${podcastId}`, updates).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
