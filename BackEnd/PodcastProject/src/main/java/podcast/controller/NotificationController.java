package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import podcast.model.entities.User;
import podcast.model.entities.dto.NotificationDTO;
import podcast.model.services.NotificationService;
import podcast.model.services.UserService;

import java.util.List;

@RestController
@RequestMapping("podcastUTN/v1/notifications")
@Tag(name = "Notificaciones", description = "API para gestionar las notificaciones de los usuarios en tiempo real e historial")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @Autowired
    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener notificaciones del usuario",
        description = "Recupera todas las notificaciones del usuario actualmente autenticado (leídas y no leídas) ordenadas por fecha.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de notificaciones obtenida correctamente",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = NotificationDTO.class))
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getAuthenticatedUser(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.getNotifications(user.getId()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener cantidad de notificaciones no leídas",
        description = "Devuelve el contador de notificaciones pendientes de leer del usuario autenticado.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Contador devuelto correctamente",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "integer", example = "5"))
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getAuthenticatedUser(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.countUnread(user.getId()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Marcar notificación como leída",
        description = "Cambia el estado de una notificación específica a leída.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Notificación marcada como leída"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Notificación no encontrada")
    })
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

//* ===================================================================================================================

    @Operation(
        summary = "Marcar todas las notificaciones como leídas",
        description = "Marca todas las notificaciones del usuario actualmente autenticado como leídas.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Todas las notificaciones marcadas como leídas"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getAuthenticatedUser(userDetails.getUsername());
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
