package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import podcast.model.entities.User;
import podcast.model.entities.dto.CreatePlaylistDTO;
import podcast.model.entities.dto.PlaylistDTO;
import podcast.model.entities.dto.PlaylistDetailDTO;
import podcast.model.entities.dto.UpdatePlaylistDTO;
import podcast.model.exceptions.*;
import podcast.model.services.PlaylistService;
import podcast.model.services.UserService;

import java.util.List;

@RestController
@RequestMapping("podcastUTN/v1/playlists")
@Tag(name = "Playlists", description = "API para gestionar playlists privadas con podcasts y episodios")
@SecurityRequirement(name = "JWT")
public class PlaylistController {

    private final PlaylistService playlistService;
    private final UserService userService;

    @Autowired
    public PlaylistController(PlaylistService playlistService, UserService userService) {
        this.playlistService = playlistService;
        this.userService = userService;
    }

//* ===================================================================================================================

    @ExceptionHandler(PlaylistNotFoundException.class)
    public ResponseEntity<String> handlePlaylistNotFound(PlaylistNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler({PodcastNotFoundException.class, EpisodeNotFoundException.class, PlaylistItemNotFoundException.class})
    public ResponseEntity<String> handleContentNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler({AlreadyCreatedException.class, PlaylistLimitExceededException.class})
    public ResponseEntity<String> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("La operación entra en conflicto con una playlist existente");
    }

    @ExceptionHandler({IllegalArgumentException.class, ArithmeticException.class})
    public ResponseEntity<String> handleIllegalArgument(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Datos inválidos");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
    }

//* ===================================================================================================================

    @Operation(summary = "Listar mis playlists", description = "Obtiene las playlists del usuario autenticado")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Playlists obtenidas"), @ApiResponse(responseCode = "401", description = "No autorizado")})
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<PlaylistDTO>> getMyPlaylists(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(playlistService.getPlaylists(getUser(userDetails)));
    }

//* ===================================================================================================================

    @Operation(summary = "Obtener playlist", description = "Obtiene una página de elementos de una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Playlist obtenida"), @ApiResponse(responseCode = "404", description = "Playlist no encontrada")})
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{playlistId}")
    public ResponseEntity<PlaylistDetailDTO> getPlaylist(
            @Parameter(description = "ID de la playlist") @PathVariable Long playlistId,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Elementos por página (máximo 100)") @RequestParam(defaultValue = "20") int size,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(playlistService.getPlaylist(playlistId, getUser(userDetails), page, size));
    }

//* ===================================================================================================================

    @Operation(summary = "Crear playlist", description = "Crea una playlist y opcionalmente agrega el contenido que originó la acción")
    @ApiResponses({@ApiResponse(responseCode = "201", description = "Playlist creada"), @ApiResponse(responseCode = "409", description = "Nombre duplicado")})
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<PlaylistDTO> createPlaylist(
            @Valid @RequestBody CreatePlaylistDTO request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playlistService.createPlaylist(request, getUser(userDetails)));
    }

//* ===================================================================================================================

    @Operation(summary = "Editar playlist", description = "Actualiza el nombre o la descripción de una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Playlist actualizada"), @ApiResponse(responseCode = "404", description = "Playlist no encontrada")})
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{playlistId}")
    public ResponseEntity<PlaylistDTO> updatePlaylist(
            @PathVariable Long playlistId,
            @Valid @RequestBody UpdatePlaylistDTO request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(playlistService.updatePlaylist(playlistId, request, getUser(userDetails)));
    }

//* ===================================================================================================================

    @Operation(summary = "Eliminar playlist", description = "Elimina una playlist propia y sus elementos")
    @ApiResponses({@ApiResponse(responseCode = "204", description = "Playlist eliminada"), @ApiResponse(responseCode = "404", description = "Playlist no encontrada")})
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<Void> deletePlaylist(
            @PathVariable Long playlistId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        playlistService.deletePlaylist(playlistId, getUser(userDetails));
        return ResponseEntity.noContent().build();
    }

//* ===================================================================================================================

    @Operation(summary = "Agregar podcast", description = "Agrega un podcast a una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Podcast agregado"), @ApiResponse(responseCode = "409", description = "Podcast duplicado")})
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{playlistId}/podcasts/{podcastId}")
    public ResponseEntity<PlaylistDTO> addPodcast(
            @PathVariable Long playlistId,
            @PathVariable Long podcastId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(playlistService.addPodcast(playlistId, podcastId, getUser(userDetails)));
    }

//* ===================================================================================================================

    @Operation(summary = "Quitar podcast", description = "Quita un podcast de una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "204", description = "Podcast quitado"), @ApiResponse(responseCode = "404", description = "Elemento no encontrado")})
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{playlistId}/podcasts/{podcastId}")
    public ResponseEntity<Void> removePodcast(
            @PathVariable Long playlistId,
            @PathVariable Long podcastId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        playlistService.removePodcast(playlistId, podcastId, getUser(userDetails));
        return ResponseEntity.noContent().build();
    }

//* ===================================================================================================================

    @Operation(summary = "Agregar episodio", description = "Agrega un episodio a una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Episodio agregado"), @ApiResponse(responseCode = "409", description = "Episodio duplicado")})
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{playlistId}/episodes/{episodeId}")
    public ResponseEntity<PlaylistDTO> addEpisode(
            @PathVariable Long playlistId,
            @PathVariable Long episodeId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(playlistService.addEpisode(playlistId, episodeId, getUser(userDetails)));
    }

//* ===================================================================================================================

    @Operation(summary = "Quitar episodio", description = "Quita un episodio de una playlist propia")
    @ApiResponses({@ApiResponse(responseCode = "204", description = "Episodio quitado"), @ApiResponse(responseCode = "404", description = "Elemento no encontrado")})
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{playlistId}/episodes/{episodeId}")
    public ResponseEntity<Void> removeEpisode(
            @PathVariable Long playlistId,
            @PathVariable Long episodeId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        playlistService.removeEpisode(playlistId, episodeId, getUser(userDetails));
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails userDetails) {
        return userService.getAuthenticatedUser(userDetails.getUsername());
    }
}
