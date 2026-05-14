import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';
import { PodcastSearchDTO } from '../../models/podcast/podcast-search-dto';
import { Podcast } from '../../models/podcast/podcast';
import { PodcastTotalDTO } from '../../models/podcast/podcast-total-dto';
import { PodcastCreateDTO } from '../../models/podcast/podcast-create-dto';
import { PodcastUpdateDTO } from '../../models/podcast/podcast-update-dto';
import { PageResponse } from '../../models/page-response';

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

  getAll(page: number = 0, size: number = 10, orderByViews: boolean = false): Observable<PageResponse<PodcastSearchDTO>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (orderByViews) params.append('orderByViews', 'true');
    
    return this.http.get<PageResponse<PodcastSearchDTO>>(`${this.API_URL}?${params.toString()}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getAllFiltered(title?: string, userId?: number, category?: string, orderByViews: boolean = false, page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    const params = new URLSearchParams();
    
    if (title) params.append('title', title);
    if (userId) params.append('userId', userId.toString());
    if (category) params.append('category', category);
    if (orderByViews) params.append('orderByViews', 'true');
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const queryString = params.toString();
    const url = `${this.API_URL}?${queryString}`;
    
    return this.http.get<PageResponse<any>>(url).pipe(
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
