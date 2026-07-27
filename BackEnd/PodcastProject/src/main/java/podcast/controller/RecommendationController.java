package podcast.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import podcast.model.entities.User;
import podcast.model.entities.dto.RecommendationDTO;
import podcast.model.exceptions.UserNotFoundException;
import podcast.model.services.RecommendationService;
import podcast.model.services.UserService;

import java.util.List;

/**
 * Controlador REST que expone el motor de recomendaciones de Wavely.
 *
 * <p>Provee un endpoint autenticado para recomendaciones personalizadas y uno público
 * de tendencias globales. Toda la lógica de selección de estrategia es delegada
 * internamente al {@link RecommendationService}.</p>
 */
@RestController
@RequestMapping("podcastUTN/v1/recommendations")
@Tag(
    name = "Recomendaciones",
    description = "Motor de recomendaciones híbrido de Wavely. Retorna podcasts personalizados " +
                  "mediante tres estrategias: Trending, Content-Based Filtering y Collaborative Filtering."
)
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    @Autowired
    public RecommendationController(RecommendationService recommendationService, UserService userService) {
        this.recommendationService = recommendationService;
        this.userService = userService;
    }

//* ===================================================================================================================

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String errorMessage = "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error interno al generar recomendaciones: " + ex.getMessage());
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener recomendaciones personalizadas",
        description = """
                Retorna hasta 10 podcasts recomendados para el usuario autenticado.
                
                El algoritmo selecciona dinámicamente la estrategia óptima según el historial del usuario:
                
                - **TRENDING**: Sin favoritos → podcasts más populares (views × 0.6 + rating × 0.4).
                - **CONTENT_BASED**: 1 a 5 favoritos → podcasts de las mismas categorías.
                - **COLLABORATIVE**: Más de 5 favoritos → podcasts favoritos de usuarios similares.
                
                Cada resultado incluye el campo `strategy` indicando cuál algoritmo lo generó.
                """,
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de recomendaciones generada correctamente",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = RecommendationDTO.class))
            )
        ),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
        @ApiResponse(responseCode = "500", description = "Error interno al procesar las recomendaciones")
    })
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<RecommendationDTO>> getRecommendations(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getAuthenticatedUser(userDetails.getUsername());
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getId()));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Obtener podcasts en tendencia (público)",
        description = """
                Retorna los 10 podcasts más populares de la plataforma sin requerir autenticación.
                
                Útil para la pantalla de inicio de usuarios no registrados o como vista pública de tendencias.
                El score se calcula como: `views_promedio × 0.6 + average_rating × 0.4`.
                La estrategia retornada siempre es `TRENDING`.
                """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Lista de podcasts trending obtenida correctamente",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = RecommendationDTO.class))
            )
        ),
        @ApiResponse(responseCode = "500", description = "Error interno al procesar el trending")
    })
    @GetMapping("/trending")
    public ResponseEntity<List<RecommendationDTO>> getTrending() {
        return ResponseEntity.ok(recommendationService.getRecommendations(null));
    }

//* ===================================================================================================================

    @Operation(
        summary = "Tirar el dado random (público con mejora autenticada)",
        description = """
                Retorna un único podcast aleatorio seleccionado mediante sorteo ponderado.
                
                El algoritmo arma un pool de 20 candidatos usando la misma lógica de tres capas
                del motor de recomendaciones, pero en vez de devolver el top 10 ordenado,
                **sortea uno al azar con probabilidad proporcional a su relevanceScore**.
                
                - **Sin JWT**: Usa el pool de Trending (descubrimiento para visitantes).
                - **Con JWT**: Usa la estrategia personalizada según los favoritos del usuario
                  (Trending / Content-Based / Collaborative).
                
                Evita repetir el mismo podcast en tiradas consecutivas para un mismo usuario.
                La estrategia retornada siempre es `RANDOM_DICE`.
                """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Podcast aleatorio obtenido correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = RecommendationDTO.class)
            )
        ),
        @ApiResponse(responseCode = "500", description = "Error interno al procesar el dado")
    })
    @GetMapping("/dice")
    public ResponseEntity<RecommendationDTO> rollDice(
            @Parameter(hidden = true) @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = null;
        if (userDetails != null) {
            User user = userService.getAuthenticatedUser(userDetails.getUsername());
            userId = user.getId();
        }
        return ResponseEntity.ok(recommendationService.getRandomDice(userId));
    }
}
