import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { CommentaryDTO } from '../../models/commentary/commentary-dto';
import { CommentaryCreateDTO } from '../../models/commentary/commentary-create-dto';
import { UpdateCommentaryDTO } from '../../models/commentary/update-commentary-dto';
import { ErrorHandlerService } from '../error/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class CommentaryService {
  private readonly API_URL = '/api/episodes';

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  getByEpisode(episodeId: number): Observable<CommentaryDTO[]> {
    return this.http.get<CommentaryDTO[]>(`${this.API_URL}/${episodeId}/commentaries`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  createCommentary(episodeId: number, commentary: CommentaryCreateDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/${episodeId}/comment`, commentary, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  updateCommentary(episodeId: number, commentaryId: number, updates: UpdateCommentaryDTO): Observable<string> {
    return this.http.patch(`${this.API_URL}/${episodeId}/commentaries/${commentaryId}`, updates, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  deleteCommentary(episodeId: number, commentaryId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${episodeId}/commentaries/${commentaryId}`, { responseType: 'text' }).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
