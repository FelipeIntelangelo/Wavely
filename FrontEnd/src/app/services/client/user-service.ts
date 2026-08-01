import { Injectable } from '@angular/core';
import { UserRegisterDTO } from '../../models/user/userRegister/user-register-dto';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { User } from '../../models/user/user';
import { UserLoginDTO } from '../../models/user/userLogin/user-login-dto';
import { UserSearchDTO } from '../../models/user/userSearchDTO';
import { EpisodeHistoryDTO } from '../../models/episode/episode-history-dto';
import { ErrorHandlerService } from '../error/error-handler.service';
import { PodcastDTO } from '../../models/podcast/podcast-dto';
import { UserUpdateDTO } from '../../models/user/user-update-dto';
import { PageResponse } from '../../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = "/api/users";
  private readonly AUTH_API_URL = "/api/auth";

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /* -------------------- Login, Register & Profile LOGIC -------------------- */
  getUsersDTO(nickname?: string, sortByFollowers: boolean = false, page: number = 0, size: number = 10): Observable<PageResponse<UserSearchDTO>> {
    const params = new URLSearchParams();
    if (nickname) params.append('nickname', nickname);
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sortByFollowers) {
      params.append('orderByFollowers', 'true');
    }
    
    return this.http.get<PageResponse<UserSearchDTO>>(`${this.API_URL}?${params.toString()}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getFeaturedCreators(limit: number = 10): Observable<UserSearchDTO[]> {
    return this.http.get<UserSearchDTO[]>(`${this.API_URL}/featured?limit=${limit}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getUserById(id: number): Observable<User | UserSearchDTO> {
    return this.http.get<User | UserSearchDTO>(`${this.API_URL}/${id}`).pipe(
    catchError(this.errorHandler.handleError.bind(this.errorHandler))
  );
}
  
  login(credentials: UserLoginDTO): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.AUTH_API_URL}/login`, credentials).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  loginWithGoogle(idToken: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.AUTH_API_URL}/google`, { idToken }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
  
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/myProfile`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  updateCurrentUserProfile(updates: UserUpdateDTO): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/myProfile`, updates).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  deleteCurrentUser(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/myProfile`, { responseType: 'text' as 'json' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  // If your backend returns plain text (e.g. "Usuario registrado correctamente")
  // use responseType: 'text' so HttpClient doesn't try to parse JSON.
  // Preferably the backend should return JSON with Content-Type: application/json.
  registerUser(user: UserRegisterDTO): Observable<string> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(`${this.API_URL}/register`, user, { headers, responseType: 'text' })
      .pipe(
        catchError((error) => {
          // Log detallado del error
          console.error('Error detallado:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            url: error.url
          });
          return this.errorHandler.handleErrorWithContext(error, 'al registrar usuario');
        })
      );
  }
  /* -------------------- END OF LOGIN AND REGISTER LOGIC -------------------- */

  getMyHistory(): Observable<EpisodeHistoryDTO[]> {
    return this.http.get<EpisodeHistoryDTO[]>(`${this.API_URL}/myHistory`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  addPodcastToFavorites(podcastId: number): Observable<string> {
    return this.http.post(`${this.API_URL}/favorites/${podcastId}`, {}, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  removePodcastFromFavorites(podcastId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/favorites/${podcastId}`, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getMyFavorites(): Observable<PodcastDTO[]> {
    return this.http.get<PodcastDTO[]>(`${this.API_URL}/myFavorites`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
