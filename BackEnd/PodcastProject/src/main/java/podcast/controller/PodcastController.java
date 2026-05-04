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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import podcast.model.entities.Podcast;
import podcast.model.entities.dto.PodcastDTO;
import podcast.model.entities.dto.PodcastUpdateDTO;
import podcast.model.entities.enums.Category;
import podcast.model.exceptions.AlreadyCreatedException;
import podcast.model.exceptions.NullUserException;
import podcast.model.exceptions.PodcastNotFoundException;
import podcast.model.exceptions.UnauthorizedException;
import podcast.model.services.PodcastService;

import java.util.List;

@RestController
@RequestMapping(path = "podcastUTN/v1/podcasts")
@Tag(
    name = "Podcasts",
    description = "API para gestionar podcasts - Incluye operaciones CRUD, filtrado y gestión de contenido multimedia"
)
public class PodcastController {

    @Autowired
    private PodcastService podcastService;

//* ===================================================================================================================

    @ExceptionHandler(PodcastNotFoundException.class)
    public ResponseEntity<String> handlePodcastNotFound(PodcastNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(AlreadyCreatedException.class)
    public ResponseEntity<String> handleAlreadyCreated(AlreadyCreatedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((msg1, msg2) -> msg1 + ", " + msg2)
                .orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<String> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String errorMessage = "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }

    @ExceptionHandler(NullUserException.class)
    public ResponseEntity<String> handleNullUser(NullUserException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener todos los podcasts",
        description = "Recupera una lista de podcasts con opciones de filtrado por título, creador, categoría y ordenamiento por vistas"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de podcasts encontrada exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = PodcastDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Parámetros de filtro inválidos",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Invalid category value: INVALID_CATEGORY")
            )
        )
    })
    @GetMapping
    public ResponseEntity<List<PodcastDTO>> getAll(
            @Parameter(description = "Filtrar por título del podcast (búsqueda parcial)")
            @RequestParam(required = false) String title,
            
            @Parameter(description = "Filtrar por ID del usuario creador")
            @RequestParam(required = false) Integer userId,
            
            @Parameter(description = "Filtrar por categoría del podcast (ej: NOTICIAS, DEPORTES, TECNOLOGIA)")
            @RequestParam(required = false) String category,
            
            @Parameter(description = "Ordenar resultados por número de vistas (true = descendente)")
            @RequestParam(required = false) Boolean orderByViews
    ) {
        Category categoryEnum = (category != null) ? Category.valueOf(category) : null;
        List<PodcastDTO> podcasts = podcastService.getAllFiltered(title, userId, categoryEnum, orderByViews);
        return ResponseEntity.ok(podcasts);
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener podcast por ID",
        description = "Recupera un podcast específico utilizando su identificador único"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast encontrado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Podcast.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Podcast no encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast with id 123 not found")
            )
        )
    })
    @GetMapping("/{podcastId}")
    public ResponseEntity<Podcast> getById(
            @Parameter(description = "ID del podcast a recuperar", required = true, example = "1")
            @PathVariable("podcastId") Long podcastId) {
        return ResponseEntity.ok(podcastService.getPodcastById(podcastId));
    }

//* ===================================================================================================================


    @Operation(
        summary = "Obtener podcasts del usuario autenticado",
        description = "Recupera todos los podcasts creados por el usuario actualmente autenticado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de podcasts del usuario recuperada exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = PodcastDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "No autorizado - Token JWT faltante o inválido"
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Acceso denegado - El usuario no tiene el rol requerido"
        )
    })
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_CREATOR')")
    @GetMapping("/myPodcasts")
    public ResponseEntity<List<PodcastDTO>> getMyPodcasts(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        List<Podcast> podcasts = podcastService.getByUsername(userDetails.getUsername());
        return ResponseEntity.ok(podcasts.stream().map(Podcast::toDTO).toList());
    }

    @Operation(
        summary = "Crear nuevo podcast",
        description = "Crea un nuevo podcast en el sistema. Requiere autenticación y rol de creador"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast creado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast saved successfully")
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos del podcast inválidos",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "title: must not be blank")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(
            responseCode = "409",
            description = "Conflicto - El podcast ya existe",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast with title 'My Podcast' already exists")
            )
        )
    })
    @PreAuthorize("isAuthenticated")
    @PostMapping
    public ResponseEntity<String> save(
            @Parameter(
                description = "Datos del nuevo podcast",
                required = true,
                content = @Content(schema = @Schema(implementation = Podcast.class))
            )
            @RequestBody @Valid Podcast podcast) {
        podcastService.save(podcast);
        return ResponseEntity.ok("Podcast saved successfully");
    }

//* ===================================================================================================================

    @Operation(
            summary = "Actualizar un podcast existente",
            description = "Actualiza los datos de un podcast. Solo el creador o un administrador pueden realizar esta operación.",
            parameters = {
                    @Parameter(
                            name = "podcastId",
                            description = "ID del podcast a actualizar",
                            required = true,
                            example = "1"
                    )
            },
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Datos a actualizar del podcast",
                    required = true,
                    content = @Content(schema = @Schema(implementation = PodcastUpdateDTO.class))
            )
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Podcast actualizado exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = PodcastDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
            @ApiResponse(responseCode = "403", description = "Acceso denegado - No tiene permisos para actualizar este podcast"),
            @ApiResponse(responseCode = "404", description = "Podcast no encontrado")
    })
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_CREATOR')")
    @PatchMapping("/{podcastId}")
    public ResponseEntity<PodcastUpdateDTO> updatePodcast(
            @Parameter(hidden = true) @PathVariable Long podcastId,
            @RequestBody @Valid PodcastUpdateDTO updates,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PodcastUpdateDTO updatedPodcast = podcastService.updatePodcast(podcastId, updates, userDetails);
        return ResponseEntity.ok(updatedPodcast);
    }

//* ===================================================================================================================

    @Operation(
        summary = "Eliminar podcast",
        description = "Elimina un podcast existente. Solo el creador del podcast o un administrador pueden realizar esta operación"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast eliminado exitosamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "string", example = "Podcast deleted successfully")
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - No tiene permisos para eliminar este podcast"),
        @ApiResponse(responseCode = "404", description = "Podcast no encontrado")
    })
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_CREATOR')")
    @DeleteMapping("/{podcastId}")
    public ResponseEntity<String> deleteById(
            @Parameter(description = "ID del podcast a eliminar", required = true, example = "1")
            @PathVariable("podcastId") Long podcastId,
            @AuthenticationPrincipal UserDetails userDetails) {
        podcastService.deleteById(podcastId, userDetails.getUsername());
        return ResponseEntity.ok("Podcast deleted successfully");
    }
}