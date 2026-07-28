package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import podcast.model.entities.dto.FollowStatusDTO;
import podcast.model.entities.dto.UserFollowDTO;
import podcast.model.services.UserFollowService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/podcastUTN/v1/follows")
@Tag(
    name = "Seguimiento de Creadores",
    description = "API para seguir/dejar de seguir creadores y gestionar la campanita de notificaciones push"
)
public class UserFollowController {

    private final UserFollowService userFollowService;

    @Autowired
    public UserFollowController(UserFollowService userFollowService) {
        this.userFollowService = userFollowService;
    }

//* ===================================================================================================================

    @Operation(
        summary = "Seguir a un creador",
        description = "Crea una relación de seguimiento con un creador. La campanita empieza desactivada por defecto.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Ahora seguís a este creador",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "string"))),
        @ApiResponse(responseCode = "400", description = "Ya seguís a este usuario o intentaste seguirte a vos mismo"),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{userId}")
    public ResponseEntity<String> followUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID del creador a seguir", required = true, example = "1")
            @PathVariable Long userId) {
        userFollowService.followUser(userDetails.getUsername(), userId);
        return ResponseEntity.ok("Ahora seguís a este creador");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Dejar de seguir a un creador",
        description = "Elimina la relación de seguimiento con un creador. Se elimina también el estado de la campanita.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Dejaste de seguir a este creador",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "string"))),
        @ApiResponse(responseCode = "400", description = "No seguís a este usuario"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> unfollowUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID del creador a dejar de seguir", required = true, example = "1")
            @PathVariable Long userId) {
        userFollowService.unfollowUser(userDetails.getUsername(), userId);
        return ResponseEntity.ok("Dejaste de seguir a este creador");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Toggle campanita de notificaciones",
        description = "Activa o desactiva la campanita para recibir notificaciones push cuando el creador sube un nuevo episodio.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estado de la campanita actualizado",
            content = @Content(mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"bellEnabled\": true}"))),
        @ApiResponse(responseCode = "400", description = "Primero debés seguir al usuario para activar la campanita"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{userId}/bell")
    public ResponseEntity<Map<String, Boolean>> toggleBell(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID del creador", required = true, example = "1")
            @PathVariable Long userId) {
        boolean newState = userFollowService.toggleBell(userDetails.getUsername(), userId);
        return ResponseEntity.ok(Map.of("bellEnabled", newState));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener estado de seguimiento",
        description = "Retorna si el usuario autenticado sigue al creador, si tiene la campanita activa, y el total de seguidores del creador.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estado de seguimiento recuperado",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = FollowStatusDTO.class))),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/status/{userId}")
    public ResponseEntity<FollowStatusDTO> getFollowStatus(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID del creador", required = true, example = "1")
            @PathVariable Long userId) {
        return ResponseEntity.ok(userFollowService.getFollowStatus(userDetails.getUsername(), userId));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener mis seguidos",
        description = "Retorna la lista completa de creadores que el usuario autenticado sigue, con el estado de campanita de cada uno.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de seguidos recuperada exitosamente",
            content = @Content(mediaType = "application/json",
                schema = @Schema(type = "array", implementation = UserFollowDTO.class))),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my-following")
    public ResponseEntity<List<UserFollowDTO>> getMyFollowing(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userFollowService.getMyFollowing(userDetails.getUsername()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener los seguidores de un usuario",
        description = "Retorna la lista de usuarios que siguen a un creador específico."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de seguidores recuperada exitosamente",
            content = @Content(mediaType = "application/json",
                schema = @Schema(type = "array", implementation = podcast.model.entities.dto.FollowerDTO.class))),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<podcast.model.entities.dto.FollowerDTO>> getFollowers(
            @Parameter(description = "ID del usuario", required = true, example = "1")
            @PathVariable Long userId) {
        return ResponseEntity.ok(userFollowService.getFollowers(userId));
    }
}
