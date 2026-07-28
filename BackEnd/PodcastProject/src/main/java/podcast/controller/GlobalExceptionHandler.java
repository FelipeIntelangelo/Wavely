package podcast.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import podcast.model.entities.dto.ErrorResponseDTO;
import podcast.model.exceptions.*;
import podcast.model.services.ErrorLogService;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ErrorLogService errorLogService;

    public GlobalExceptionHandler(ErrorLogService errorLogService) {
        this.errorLogService = errorLogService;
    }

//* ===================================================================================================================
//* EXCEPCIONES DE CONFLICTO (409) - Usado por todos los servicios (Podcast, Episode, Playlist, User)
//* ===================================================================================================================

    @ExceptionHandler(AlreadyCreatedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAlreadyCreated(AlreadyCreatedException ex) {
        logger.warn("Conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        logger.warn("Data Integrity Violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO("ERR_CONFLICT", "Conflicto de integridad en base de datos"));
    }

//* ===================================================================================================================
//* EXCEPCIONES DE RECURSO NO ENCONTRADO (404) - Mapeo 1:1 con las entidades principales
//* ===================================================================================================================

    @ExceptionHandler(PodcastNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handlePodcastNotFound(PodcastNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_PODCAST_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(EpisodeNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleEpisodeNotFound(EpisodeNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_EPISODE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_USER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(PlaylistNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handlePlaylistNotFound(PlaylistNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_PLAYLIST_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(CommentaryNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleCommentaryNotFound(CommentaryNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_COMMENT_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(PlaylistItemNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handlePlaylistItemNotFound(PlaylistItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO("ERR_PLAYLIST_ITEM_NOT_FOUND", ex.getMessage()));
    }

//* ===================================================================================================================
//* EXCEPCIONES DE SEGURIDAD Y AUTENTICACIÓN (401 / 403) - AuthController, Servicios y Filtros
//* ===================================================================================================================

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponseDTO("ERR_FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAuthentication(org.springframework.security.core.AuthenticationException ex) {
        // Devuelve 401 en lugar de 500 cuando hay error de login (credenciales inválidas)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponseDTO("ERR_UNAUTHORIZED", "Credenciales incorrectas"));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponseDTO("ERR_FORBIDDEN", "No tienes los permisos necesarios."));
    }

//* ===================================================================================================================
//* EXCEPCIONES DE VALIDACIÓN Y BAD REQUEST (400) - Reglas de Negocio y Formato
//* ===================================================================================================================

    @ExceptionHandler(NullUserException.class)
    public ResponseEntity<ErrorResponseDTO> handleNullUser(NullUserException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_NULL_USER", ex.getMessage()));
    }

    @ExceptionHandler(ChapterOrSeasonInvalidException.class)
    public ResponseEntity<ErrorResponseDTO> handleChapterOrSeasonInvalid(ChapterOrSeasonInvalidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_INVALID_CHAPTER", ex.getMessage()));
    }

    @ExceptionHandler(PlaylistLimitExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handlePlaylistLimitExceeded(PlaylistLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_PLAYLIST_LIMIT", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDTO> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_INVALID_ARGUMENT", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce((a, b) -> a + ", " + b)
                .orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_VALIDATION_FAILED", detail));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String detail = "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_TYPE_MISMATCH", detail));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleMaxSize(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponseDTO("ERR_FILE_TOO_LARGE", "El archivo excede el tamaño máximo permitido"));
    }

    @ExceptionHandler(org.springframework.web.multipart.support.MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponseDTO> handleMissingPart(org.springframework.web.multipart.support.MissingServletRequestPartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("ERR_MISSING_FILE", "Falta parte de la solicitud (archivo)"));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDTO> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponseDTO("ERR_METHOD_NOT_ALLOWED", "Método HTTP no soportado"));
    }

//* ===================================================================================================================
//* FALLBACK GENÉRICO (500) - Captura todo error no controlado y lo audita en base de datos
//* ===================================================================================================================

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponseDTO> handleAllExceptions(Exception ex, WebRequest request) {
        logger.error("Error en endpoint {}: {}", request.getDescription(false), ex.getMessage(), ex);
        errorLogService.audit(
                request.getDescription(false),
                ex.getMessage(),
                ex.toString()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDTO("ERR_INTERNAL", "Ocurrió un error interno. El equipo ha sido notificado."));
    }
}