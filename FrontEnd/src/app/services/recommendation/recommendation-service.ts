import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';
import { RecommendationDTO } from '../../models/recommendation/recommendation-dto';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly API_URL = '/api/recommendations';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Retorna recomendaciones personalizadas para el usuario autenticado.
   * Requiere JWT — el interceptor lo inyecta automáticamente.
   * El backend selecciona la estrategia (TRENDING / CONTENT_BASED / COLLABORATIVE)
   * según la cantidad de favoritos del usuario.
   */
  getPersonalized(): Observable<RecommendationDTO[]> {
    return this.http.get<RecommendationDTO[]>(this.API_URL).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  /**
   * Retorna los podcasts más populares sin requerir autenticación.
   * Útil para usuarios no logueados o como fallback.
   */
  getTrending(): Observable<RecommendationDTO[]> {
    return this.http.get<RecommendationDTO[]>(`${this.API_URL}/trending`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }

  /**
   * Tira el dado random: retorna un único podcast aleatorio ponderado por relevanceScore.
   * Funciona con y sin JWT — si hay token, usa recomendaciones personalizadas;
   * si no, usa el pool de trending.
   */
  rollDice(): Observable<RecommendationDTO> {
    return this.http.get<RecommendationDTO>(`${this.API_URL}/dice`).pipe(
      catchError(this.errorHandler.handleError.bind(this.errorHandler))
    );
  }
}
