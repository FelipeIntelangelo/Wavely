package podcast.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import podcast.model.services.ErrorLogService;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ErrorLogService errorLogService;

    public GlobalExceptionHandler(ErrorLogService errorLogService) {
        this.errorLogService = errorLogService;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handleAllExceptions(Exception ex, WebRequest request) {
        logger.error("Error en endpoint {}: {}", request.getDescription(false), ex.getMessage(), ex);
        errorLogService.audit(
                request.getDescription(false),
                ex.getMessage(),
                ex.toString()
        );
        return "Ocurrió un error interno. El equipo ha sido notificado." +
                " De igual manera fue controlado y no afecta el funcionamiento de la aplicación.";
    }
}