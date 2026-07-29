package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import podcast.model.entities.Commentary;
import podcast.model.entities.Episode;
import podcast.model.entities.dto.CommentaryDTO;
import podcast.model.entities.dto.CommentaryRequestDTO;
import podcast.model.entities.dto.EpisodeDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import podcast.model.entities.dto.UpdateEpisodeDTO;
import podcast.model.services.EpisodeHistoryService;
import podcast.model.services.EpisodeService;
import podcast.model.services.RatingService;

import java.util.List;

@RestController
@RequestMapping(path = "podcastUTN/v1/episodes")
@Tag(name = "Episodios", description = "API para gestionar episodios de podcasts")
public class EpisodeController {

    private final EpisodeService episodeService;
    private final EpisodeHistoryService episodeHistoryService;
    private final RatingService ratingService;

    @Autowired
    public EpisodeController(EpisodeService episodeService, EpisodeHistoryService episodeHistoryService, RatingService ratingService) {
        this.episodeService = episodeService;
        this.episodeHistoryService = episodeHistoryService;
        this.ratingService = ratingService;
    }

//* ===================================================================================================================

    @Operation(
            summary = "Obtener todos los episodios",
            description = "Obtiene una lista de episodios en formato DTO con filtros opcionales. Los resultados se devuelven como EpisodeDTO para proteger datos sensibles y optimizar la respuesta."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de episodios encontrada",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = EpisodeDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Parámetros de filtro inválidos")
    })
    @GetMapping
    public ResponseEntity<Page<EpisodeDTO>> getAll(
            @Parameter(description = "Título del episodio para filtrar") @RequestParam(required = false) String title,
            @Parameter(description = "ID del podcast") @RequestParam(required = false) Long podcastId,
            @ParameterObject Pageable pageable
    ) {
        Page<Episode> episodes = episodeService.getAllFiltered(title, podcastId, pageable);
        return ResponseEntity.ok(episodes.map(Episode::toDTO));
    }

//* ===================================================================================================================

    @Operation(
            summary = "Obtener feed de episodios",
            description = "Obtiene los episodios más recientes de los creadores que el usuario sigue, paginados.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Feed de episodios recuperado exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = EpisodeDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/feed")
    public ResponseEntity<Page<EpisodeDTO>> getFeed(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails,
            @ParameterObject Pageable pageable) {
        Page<Episode> feed = episodeService.getFeedForUser(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(feed.map(Episode::toDTO));
    }

//* ===================================================================================================================

    @Operation(
            summary = "Obtener episodio por ID",
            description = "Recupera un episodio específico por su identificador único"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Episodio encontrado",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = Episode.class)
                    )
            ),
            @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @GetMapping("/{episodeId}")
    public ResponseEntity<Episode> getById(
            @Parameter(description = "ID del episodio") @PathVariable("episodeId") Long episodeId) {
        Episode episodePivot = episodeService.getEpisodeById(episodeId);
        return ResponseEntity.ok(episodePivot);
    }

//* ===================================================================================================================

    @Operation(
            summary = "Reproducir episodio",
            description = "Reproduce un episodio y registra la reproducción en el historial del usuario"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "URL del audio del episodio",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(type = "string", example = "https://storage.com/audio/episode123.mp3")
                    )
            ),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @PreAuthorize("isAuthenticated")
    @GetMapping("/{episodeId}/play")
    public ResponseEntity<String> playEpisode(
            @Parameter(description = "ID del episodio") @PathVariable("episodeId") Long episodeId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        episodeHistoryService.registerPlay(episodeId, userDetails.getUsername());
        String audioUrl = episodeService.getAudioUrl(episodeId);
        return ResponseEntity.ok(audioUrl);
    }

//* ===================================================================================================================

    @Operation(
            summary = "Obtener comentarios de un episodio",
            description = "Recupera todos los comentarios asociados a un episodio específico"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de comentarios encontrada",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CommentaryDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @PreAuthorize("isAuthenticated")
    @GetMapping("/{episodeId}/commentaries")
    public ResponseEntity<List<CommentaryDTO>> getComments(
            @Parameter(description = "ID del episodio") @PathVariable("episodeId") Long episodeId) {
        List<Commentary> comments = episodeService.getComments(episodeId);
        return ResponseEntity.ok(comments.stream().map(Commentary::toDTO).toList());
    }

//* ===================================================================================================================

    @Operation(
        summary = "Get average rating of an episode",
        description = "Returns the average rating (as a decimal number) for the specified episode.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Average rating retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "number", format = "double", example = "4.5")
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
            description = "Episode not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"error\": \"Episode not found\"}")
            )
        )
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{episodeId}/average")
    public ResponseEntity<Double> getAverageRating(
            @Parameter(description = "ID of the episode", required = true, example = "1")
            @PathVariable Long episodeId) {
        Double avg = ratingService.getAverageRating(episodeId);
        return ResponseEntity.ok(avg);
    }

//* ===================================================================================================================

    @Operation(
            summary = "Obtener calificación del usuario para un episodio",
            description = "Devuelve el puntaje de calificación otorgado por el usuario autenticado para el episodio (0 si no calificó).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calificación recuperada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
            @ApiResponse(responseCode = "404", description = "Episodio o usuario no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{episodeId}/rating")
    public ResponseEntity<Long> getUserRating(
            @Parameter(description = "ID del episodio", required = true, example = "1")
            @PathVariable Long episodeId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        Long rating = ratingService.getUserRating(episodeId, userDetails.getUsername());
        return ResponseEntity.ok(rating);
    }

//* ===================================================================================================================

    @Operation(
            summary = "Guardar nuevo episodio",
            description = "Crea un nuevo episodio en el sistema"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Episodio guardado correctamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(type = "string", example = "Episode saved successfully")
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Datos del episodio inválidos"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "409", description = "Episodio ya existe")
    })
    @PreAuthorize("isAuthenticated")
    @PostMapping
    public ResponseEntity<String> save(
            @Parameter(
                    description = "Datos del episodio a crear",
                    required = true,
                    content = @Content(schema = @Schema(implementation = Episode.class))
            )
            @RequestBody @Valid Episode episode) {
        episodeService.save(episode);
        return ResponseEntity.ok("Episode saved successfully");
    }

//* ===================================================================================================================

    @Operation(
            summary = "Comentar episodio",
            description = "Permite a un usuario autenticado agregar un comentario a un episodio"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Comentario agregado correctamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(type = "string", example = "Comment added successfully")
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Comentario inválido"),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{episodeId}/comment")
    public ResponseEntity<String> commentEpisode(
            @Parameter(description = "ID del episodio") @PathVariable("episodeId") Long episodeId,
            @Parameter(description = "Texto del comentario") @RequestBody @Valid CommentaryRequestDTO comment,
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        episodeService.commentEpisode(episodeId, comment.getCommentary(), userDetails.getUsername());
        return ResponseEntity.ok("Comment added successfully");
    }

//* ===================================================================================================================

    @Operation(
        summary = "Actualizar un episodio existente",
        description = "Actualiza los datos de un episodio. Solo el creador o un administrador pueden realizar esta operación.",
        parameters = {
            @Parameter(
                name = "episodeId",
                description = "ID del episodio a actualizar",
                required = true,
                example = "1"
            )
        },
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Datos a actualizar del episodio",
            required = true,
            content = @Content(schema = @Schema(implementation = UpdateEpisodeDTO.class))
        )
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Episodio actualizado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = EpisodeDTO.class)
            )
        ),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - No tiene permisos para actualizar este episodio"),
        @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_CREATOR')")
    @PatchMapping("/{episodeId}")
    public ResponseEntity<EpisodeDTO> updateEpisode(
            @Parameter(hidden = true) @PathVariable Long episodeId,
            @RequestBody @Valid UpdateEpisodeDTO updates,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        EpisodeDTO updatedEpisode = episodeService.updateEpisode(episodeId, updates, userDetails);
        return ResponseEntity.ok(updatedEpisode);
    }

//* ===================================================================================================================

    @Operation(
            summary = "Eliminar episodio",
            description = "Elimina un episodio existente. Solo disponible para creadores y administradores"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Episodio eliminado correctamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(type = "string", example = "Episode deleted successfully")
                    )
            ),
            @ApiResponse(responseCode = "401", description = "No autorizado"),
            @ApiResponse(responseCode = "403", description = "Acceso denegado"),
            @ApiResponse(responseCode = "404", description = "Episodio no encontrado")
    })
    @PreAuthorize("hasRole('ROLE_CREATOR') or hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{episodeId}")
    public ResponseEntity<String> deleteById(
            @Parameter(description = "ID del episodio") @PathVariable("episodeId") Long episodeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        episodeService.deleteById(episodeId, userDetails.getUsername());
        return ResponseEntity.ok("Episode deleted successfully");
    }
}