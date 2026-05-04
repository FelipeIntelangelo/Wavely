import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Maneja errores HTTP de manera genérica
   * @param error - El error HTTP recibido
   * @returns Observable que emite un error formateado
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    console.log('Handling error:', error);
    console.log('Error status:', error.status);
    console.log('Error error:', error.error);

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Check if it's a successful response with an empty body (common for DELETE)
      if (error.status === 200 && (error.error === null || (typeof error.error === 'string' && error.error.length === 0))) {
        console.log('Successful response with empty body, not treating as error.');
        return new Observable<never>(); // Return an empty observable to complete the stream
      }
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.error?.message || error.error || 'Error del servidor'}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Maneja errores específicos con contexto adicional
   * @param error - El error HTTP recibido
   * @param context - Contexto adicional del error (ej: "al obtener usuarios")
   * @returns Observable que emite un error formateado
   */
  handleErrorWithContext(error: HttpErrorResponse, context: string): Observable<never> {
    let errorMessage = '';
    console.log(`Handling error ${context}:`, error);

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error ${context}: ${error.error.message}`;
    } else {
      if (error.status === 200 && (error.error === null || (typeof error.error === 'string' && error.error.length === 0))) {
        console.log('Successful response with empty body, not treating as error.');
        return new Observable<never>();
      }
      errorMessage = `Error ${context} - Código: ${error.status}, Mensaje: ${error.error?.message || error.error || 'Error del servidor'}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}