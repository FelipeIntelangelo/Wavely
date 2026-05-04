package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import podcast.cfg.JwtUtil;
import podcast.model.entities.User;
import podcast.model.entities.dto.*;
import podcast.model.exceptions.*;
import podcast.model.services.EpisodeHistoryService;
import podcast.model.services.RatingService;
import podcast.model.services.UserDetailsServiceImpl;
import podcast.model.services.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/podcastUTN/v1/users")
@Tag(
    name = "Usuarios",
    description = "API para gestión de usuarios y perfiles - Incluye operaciones de autenticación, gestión de perfil, y preferencias de usuario"
)
public class UserController {

    private final EpisodeHistoryService episodeHistoryService;
    private final UserService userService;
    private final UserDetailsServiceImpl userDetailsService;
    private final RatingService ratingService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserController(
            EpisodeHistoryService episodeHistoryService,
            UserService userService,
            UserDetailsServiceImpl userDetailsService,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RatingService ratingService
    ) {
        this.episodeHistoryService = episodeHistoryService;
        this.userService = userService;
        this.userDetailsService = userDetailsService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.ratingService = ratingService;
    }

//* ===================================================================================================================

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFoundException(UserNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(AlreadyCreatedException.class)
    public ResponseEntity<String> handleAlreadyCreated(AlreadyCreatedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(PodcastNotFoundException.class)
    public ResponseEntity<String> handlePodcastNotFound(PodcastNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((msg1, msg2) -> msg1 + ", " + msg2)
                .orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String errorMessage = "Tipo de dato incorrecto para el parámetro '" + ex.getName() + "': " + ex.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }

    @ExceptionHandler(CommentaryNotFoundException.class)
    public ResponseEntity<String> handleCommentaryNotFound(CommentaryNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<String> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        return ResponseEntity.status(500).body(Map.of("error", "Ocurrió un error inesperado: " + ex.getMessage()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener mi perfil",
        description = "Retrieves the full profile of the currently authenticated user.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Profile retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = User.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Missing or invalid JWT token",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"error\": \"Unauthorized\"}")
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"error\": \"User not found\"}")
            )
        )
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/myProfile")
    public ResponseEntity<User> getAuthenticatedUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getAuthenticatedUser(userDetails.getUsername()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener todos los usuarios",
        description = "Recupera una lista de todos los usuarios registrados en el sistema"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de usuarios encontrada exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = UserDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Acceso denegado - No tiene permisos para ver todos los usuarios"
        )
    })
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsersAsDTO());
    }

    @Operation(
        summary = "Obtener usuario por ID",
        description = "Recupera la información de un usuario específico utilizando su ID"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Usuario encontrado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Usuario no encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"error\": \"Usuario con id 123 no encontrado\"}")
            )
        )
    })
    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(
            @Parameter(description = "ID del usuario a recuperar", required = true, example = "1")
            @PathVariable("userId") Long userId) {
        return ResponseEntity.ok(userService.getUserByIdAsDTO(userId));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener usuario con credenciales por ID",
        description = "Recupera la información completa de un usuario, incluyendo sus credenciales. Solo accesible para administradores"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Usuario encontrado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = User.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - No tiene rol de administrador"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping("/credential/{userId}")
    public ResponseEntity<User> getUserWithCredentialsById(
            @Parameter(description = "ID del usuario", required = true, example = "1")
            @PathVariable("userId") Long userId) {
        return ResponseEntity.ok(userService.getUserWithCredentialsById(userId));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener historial de reproducción",
        description = "Recupera el historial de episodios reproducidos por el usuario autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Historial recuperado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = EpisodeHistoryDTO.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/myHistory")
    public ResponseEntity<List<EpisodeHistoryDTO>> getMyHistory(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        List<EpisodeHistoryDTO> history = episodeHistoryService.getHistoryByUsername(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener podcasts favoritos",
        description = "Recupera la lista de podcasts marcados como favoritos por el usuario autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de favoritos recuperada exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = PodcastDTO.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/myFavorites")
    public ResponseEntity<List<PodcastDTO>> getMyFavorites(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        List<PodcastDTO> favorites = userService.getFavoritesByUsername(userDetails.getUsername());
        return ResponseEntity.ok(favorites);
    }

//* ===================================================================================================================

    @Operation(
        summary = "Registrar nuevo usuario",
        description = "Crea una nueva cuenta de usuario en el sistema"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Usuario registrado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Usuario registrado correctamente")
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos de usuario inválidos",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "username: debe tener al menos 3 caracteres")
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Usuario ya existe",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "El usuario con el nombre de usuario ya existe")
            )
        )
    })
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(
            @Parameter(
                description = "Datos del nuevo usuario",
                required = true,
                content = @Content(schema = @Schema(implementation = User.class))
            )
            @RequestBody @Valid User user) {
        if (userService.existsByUsername(user.getUsername())) {
            throw new AlreadyCreatedException("El usuario con el nombre de usuario ya existe.");
        }
        userService.save(user);
        return ResponseEntity.ok("Usuario registrado correctamente");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Agregar podcast a favoritos",
        description = "Añade un podcast a la lista de favoritos del usuario autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast agregado a favoritos exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast agregado a favoritos correctamente")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Podcast no encontrado")
    })
    @PreAuthorize("isAuthenticated")
    @PostMapping("/favorites/{podcastId}")
    public ResponseEntity<String> addPodcastToFavorites(
        @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
        @Parameter(description = "ID del podcast a agregar a favoritos", required = true, example = "1")
        @PathVariable Long podcastId
    ) {
        userService.addPodcastToFavorites(userDetails.getUsername(), podcastId);
        return ResponseEntity.ok("Podcast agregado a favoritos correctamente");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Calificar un episodio",
        description = "Permite al usuario autenticado calificar un episodio con un puntaje.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Episodio calificado correctamente",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "string", example = "Episodio calificado correctamente"))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Solicitud inválida o datos incorrectos",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "string", example = "Puntaje fuera de rango"))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "No autorizado - Token JWT faltante o inválido"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Episodio no encontrado",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "string", example = "Episodio no encontrado"))
        )
    })
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{episodeId}/rate")
    public ResponseEntity<String> rateEpisode(
        @Parameter(description = "ID del episodio a calificar", required = true, example = "1")
        @PathVariable Long episodeId,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Datos de la calificación",
            required = true,
            content = @Content(schema = @Schema(implementation = RatingRequestDTO.class))
        )
        @RequestBody RatingRequestDTO ratingRequest,
        @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        ratingService.rateEpisode(episodeId, userDetails.getUsername(), ratingRequest.getScore());
        return ResponseEntity.ok("Episodio calificado correctamente");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Actualizar perfil de usuario",
        description = "Actualiza la información del perfil del usuario autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Perfil actualizado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos de actualización inválidos",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "email: debe ser una dirección de correo válida")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/myProfile")
    public ResponseEntity<UserDTO> updateProfile(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(
                description = "Datos a actualizar del perfil",
                required = true,
                content = @Content(schema = @Schema(implementation = UpdateUserDTO.class))
            )
            @RequestBody @Valid UpdateUserDTO updates) {
        User updatedUser = userService.updateAuthenticatedUser(userDetails.getUsername(), updates);
        return ResponseEntity.ok(updatedUser.toDTO());
    }

//* ===================================================================================================================

    @Operation(
        summary = "Delete a user by ID",
        description = "Deletes a user from the system by their ID. Only accessible to administrators.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "User deleted successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Usuario eliminado correctamente")
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Missing or invalid JWT token"
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - User does not have admin role"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Usuario con id 123 no encontrado")
            )
        )
    })
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> deleteUserById(
            @Parameter(description = "ID of the user to delete", required = true, example = "1")
            @PathVariable Long userId) {
        userService.deleteUserById(userId);
        return ResponseEntity.ok("Usuario eliminado correctamente");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Eliminar perfil de usuario",
        description = "Elimina la cuenta del usuario autenticado y todos sus datos asociados"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Usuario eliminado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Usuario eliminado correctamente")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @DeleteMapping("/myProfile")
    public ResponseEntity<String> deleteAuthenticatedUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteAuthenticatedUser(userDetails.getUsername());
        return ResponseEntity.ok("Usuario eliminado correctamente");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Eliminar podcast de favoritos",
        description = "Elimina un podcast de la lista de favoritos del usuario autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast eliminado de favoritos exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast eliminado de favoritos correctamente")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Podcast no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/favorites/{podcastId}")
    public ResponseEntity<String> removePodcastFromFavorites(
        @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
        @Parameter(description = "ID del podcast a eliminar de favoritos", required = true, example = "1")
        @PathVariable Long podcastId
    ) {
        userService.removePodcastFromFavorites(userDetails.getUsername(), podcastId);
        return ResponseEntity.ok("Podcast eliminado de favoritos correctamente");
    }
}