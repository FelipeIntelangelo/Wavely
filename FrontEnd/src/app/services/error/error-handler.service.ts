import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Mapea un HttpErrorResponse a un mensaje amigable en español.
   */
  private getFriendlyMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Ocurrió un error en el navegador: ${error.error.message}`;
    }

    const status = error.status;
    const rawMessage = error.error?.message || error.error || '';

    // Manejo específico basado en el código de estado HTTP
    switch (status) {
      case 400: {
        const msg400 = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : JSON.stringify(rawMessage).toLowerCase();
        
        const badRequestRules = [
          { keywords: ['file', 'archivo', 'image', 'audio'], message: 'Hubo un problema con el archivo multimedia. Verificá que el formato sea válido.' }
        ];

        const match400 = badRequestRules.find(rule => rule.keywords.some(kw => msg400.includes(kw)));
        return match400 ? match400.message : 'Los datos enviados son inválidos. Por favor, verificá la información ingresada.';
      }
      case 401:
        return 'Credenciales incorrectas o tu sesión ha expirado.';
      case 403:
        return 'No tenés permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 409: {
        const msgLower = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : JSON.stringify(rawMessage).toLowerCase();
        
        const conflictRules = [
          { keywords: ['username', 'usuario'], message: 'El nombre de usuario ya se encuentra en uso.' },
          { keywords: ['email', 'correo'], message: 'El correo electrónico ya está registrado.' },
          { keywords: ['podcast', 'title', 'título'], message: 'Ya existe un podcast con este título.' },
          { keywords: ['episode', 'episodio', 'chapter'], message: 'Ya existe un episodio con ese número o título para esta temporada.' }
        ];

        const match409 = conflictRules.find(rule => rule.keywords.some(kw => msgLower.includes(kw)));
        return match409 ? match409.message : 'Hubo un conflicto con los datos ingresados.';
      }
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Ocurrió un error inesperado en el servidor. Intentá de nuevo más tarde.';
      default:
        // Si el backend envía un mensaje explícito como string que no es código html, y no es un json grande, 
        // podríamos mostrarlo, pero como queremos estandarizar:
        if (typeof rawMessage === 'string' && rawMessage.length < 100 && !rawMessage.includes('<html')) {
          return rawMessage; // A veces el backend tira un string limpio
        }
        return 'Ocurrió un error inesperado. Por favor, intentá nuevamente.';
    }
  }

  /**
   * Maneja errores HTTP de manera genérica
   * @param error - El error HTTP recibido
   * @returns Observable que emite un error formateado
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    console.log('Handling error:', error);

    if (!(error.error instanceof ErrorEvent) && error.status === 200 && (error.error === null || (typeof error.error === 'string' && error.error.length === 0))) {
      console.log('Successful response with empty body, not treating as error.');
      return EMPTY; // Complete the stream so subscribers finish normally
    }

    const friendlyMessage = this.getFriendlyMessage(error);
    console.error(`Error procesado: ${friendlyMessage}`, error);
    
    return throwError(() => new Error(friendlyMessage));
  }

  /**
   * Maneja errores específicos con contexto adicional
   * @param error - El error HTTP recibido
   * @param context - Contexto adicional del error (ej: "al obtener usuarios")
   * @returns Observable que emite un error formateado
   */
  handleErrorWithContext(error: HttpErrorResponse, context: string): Observable<never> {
    console.log(`Handling error ${context}:`, error);

    if (!(error.error instanceof ErrorEvent) && error.status === 200 && (error.error === null || (typeof error.error === 'string' && error.error.length === 0))) {
      console.log('Successful response with empty body, not treating as error.');
      return EMPTY;
    }

    const friendlyMessage = this.getFriendlyMessage(error);
    console.error(`Error ${context}: ${friendlyMessage}`, error);

    // Adjuntamos el mensaje amigable. El componente no necesita saber el contexto técnico en la UI.
    return throwError(() => new Error(friendlyMessage));
  }
}