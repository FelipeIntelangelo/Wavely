import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';
import { FollowStatusDTO } from '../../models/user/follow-status-dto';
import { UserFollowDTO } from '../../models/user/user-follow-dto';
import { FollowerDTO } from '../../models/user/follower-dto';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private readonly API_URL = '/api/follows';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  followUser(userId: number): Observable<string> {
    return this.http.post(`${this.API_URL}/${userId}`, {}, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  unfollowUser(userId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${userId}`, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  toggleBell(userId: number): Observable<{ bellEnabled: boolean }> {
    return this.http.patch<{ bellEnabled: boolean }>(`${this.API_URL}/${userId}/bell`, {}).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getFollowStatus(userId: number): Observable<FollowStatusDTO> {
    return this.http.get<FollowStatusDTO>(`${this.API_URL}/status/${userId}`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getMyFollowing(): Observable<UserFollowDTO[]> {
    return this.http.get<UserFollowDTO[]>(`${this.API_URL}/my-following`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  getFollowers(userId: number): Observable<FollowerDTO[]> {
    return this.http.get<FollowerDTO[]>(`${this.API_URL}/${userId}/followers`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
