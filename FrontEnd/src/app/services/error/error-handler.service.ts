import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';

/**
 * Mapa de errorCode → mensaje amigable en español.
 * El backend envía un JSON { errorCode, message } desde GlobalExceptionHandler.
 * Cada código aquí corresponde exactamente a los definidos en el backend.
 */
const ERROR_CODE_DICTIONARY: Record<string, string> = {
  // Conflictos (409)
  ERR_DUPLICATE_PODCAST:       'Ya existe un podcast con este título.',
  ERR_DUPLICATE_EPISODE:       'Ya existe un episodio con ese título en este podcast.',
  ERR_DUPLICATE_PLAYLIST:      'Ya existe una playlist con ese nombre.',
  ERR_ITEM_ALREADY_IN_PLAYLIST:'Este contenido ya está en la playlist.',
  ERR_DUPLICATE_USERNAME:      'El nombre de usuario ya se encuentra en uso.',
  ERR_DUPLICATE_EMAIL:         'El correo electrónico ya está registrado. Si usaste Google, iniciá sesión directamente.',
  ERR_CONFLICT:                'Hubo un conflicto con los datos ingresados.',
  ERR_CANNOT_DELETE_OWNER:     'No se puede eliminar la cuenta porque eres dueño de uno o más podcasts. Elimínalos primero.',

  // No encontrado (404)
  ERR_PODCAST_NOT_FOUND:       'El podcast solicitado no existe.',
  ERR_EPISODE_NOT_FOUND:       'El episodio solicitado no existe.',
  ERR_USER_NOT_FOUND:          'El usuario solicitado no existe.',
  ERR_PLAYLIST_NOT_FOUND:      'La playlist solicitada no existe.',
  ERR_COMMENT_NOT_FOUND:       'El comentario solicitado no existe.',
  ERR_PLAYLIST_ITEM_NOT_FOUND: 'El elemento de la playlist no existe.',

  // Permisos (403)
  ERR_FORBIDDEN:               'No tenés permisos para realizar esta acción.',

  // Datos inválidos (400)
  ERR_NULL_USER:               'El usuario asociado no es válido.',
  ERR_INVALID_CHAPTER:         'El número de capítulo o temporada no es válido.',
  ERR_PLAYLIST_LIMIT:          'Alcanzaste el límite máximo de playlists.',
  ERR_INVALID_ARGUMENT:        'Los datos enviados contienen un valor no válido.',
  ERR_VALIDATION_FAILED:       'Verificá que todos los campos estén completos y sean correctos.',
  ERR_TYPE_MISMATCH:           'Uno de los valores enviados tiene un formato incorrecto.',
  ERR_INVALID_USER_ID:         'No se debe enviar un ID al registrar un usuario nuevo.',

  // Servidor (500)
  ERR_INTERNAL:                'Ocurrió un error en el servidor. El equipo fue notificado.',

  // Infraestructura y Archivos (400, 413, 405)
  ERR_FILE_TOO_LARGE:          'El archivo seleccionado es demasiado grande.',
  ERR_MISSING_FILE:            'Falta adjuntar un archivo requerido (imagen o audio).',
  ERR_METHOD_NOT_ALLOWED:      'Acción HTTP no permitida en esta ruta.',

  // Autenticación (401)
  ERR_UNAUTHORIZED:            'Credenciales incorrectas o tu sesión ha expirado.',
};

/** Mensajes de fallback por código HTTP cuando no viene errorCode del backend. */
const HTTP_STATUS_FALLBACK: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Revisá tu conexión a internet o intentá más tarde.',
  400: 'Los datos enviados son inválidos. Por favor, verificá la información ingresada.',
  401: 'Credenciales incorrectas o tu sesión ha expirado.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Hubo un conflicto con los datos ingresados.',
  500: 'Ocurrió un error inesperado en el servidor. Intentá de nuevo más tarde.',
  502: 'Ocurrió un error inesperado en el servidor. Intentá de nuevo más tarde.',
  503: 'Ocurrió un error inesperado en el servidor. Intentá de nuevo más tarde.',
  504: 'Ocurrió un error inesperado en el servidor. Intentá de nuevo más tarde.',
};

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Mapea un HttpErrorResponse a un mensaje amigable en español.
   * Prioridad:
   *  1. errorCode del body JSON (nuevo estándar del backend)
   *  2. Fallback por HTTP status
   *  3. Mensaje genérico
   */
  private getFriendlyMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Ocurrió un error en el navegador: ${error.error.message}`;
    }

    // 1. Intentar leer errorCode del body estructurado { errorCode, message }
    let errorObj = error.error;
    
    // Si Angular no lo parseó automáticamente como JSON y lo dejó como string
    if (typeof errorObj === 'string') {
      try {
        errorObj = JSON.parse(errorObj);
      } catch (e) {
        // No es un JSON válido, seguimos con lo que hay
      }
    }

    const errorCode: string | undefined = errorObj?.errorCode;
    if (errorCode && ERROR_CODE_DICTIONARY[errorCode]) {
      return ERROR_CODE_DICTIONARY[errorCode];
    }

    // 2. Fallback por HTTP status
    const statusFallback = HTTP_STATUS_FALLBACK[error.status];
    if (statusFallback) {
      return statusFallback;
    }

    // 3. Último recurso
    return 'Ocurrió un error inesperado. Por favor, intentá nuevamente.';
  }

  /**
   * Maneja errores HTTP de manera genérica.
   * @param error - El error HTTP recibido
   * @returns Observable que emite un error formateado
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    console.log('Handling error:', error);

    if (!(error.error instanceof ErrorEvent) && error.status === 200 && (error.error === null || (typeof error.error === 'string' && error.error.length === 0))) {
      console.log('Successful response with empty body, not treating as error.');
      return EMPTY;
    }

    const friendlyMessage = this.getFriendlyMessage(error);
    console.error(`Error procesado: ${friendlyMessage}`, error);

    return throwError(() => new Error(friendlyMessage));
  }

  /**
   * Maneja errores específicos con contexto adicional.
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

    return throwError(() => new Error(friendlyMessage));
  }
}