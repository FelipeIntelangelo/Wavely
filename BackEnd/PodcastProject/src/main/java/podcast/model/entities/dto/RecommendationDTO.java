package podcast.model.entities.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import podcast.model.entities.enums.Category;
import podcast.model.entities.enums.RecommendationStrategy;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta para el motor de recomendaciones de Wavely.
 *
 * <p>Encapsula los datos de un podcast recomendado, incluyendo un puntaje de relevancia
 * calculado internamente por el algoritmo y la estrategia que originó la recomendación.</p>
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationDTO {

    /** Identificador único del podcast recomendado. */
    private Long id;

    /** Título del podcast. */
    private String title;

    /** Descripción del podcast. */
    private String description;

    /** URL de la imagen de portada alojada en Cloudinary. */
    private String imageUrl;

    /** Categorías asociadas al podcast. */
    private List<Category> categories;

    /** Promedio de visualizaciones por episodio. */
    private Long averageViews;

    /** Calificación promedio del podcast (rango 0.0 – 5.0). */
    private Double averageRating;

    /** Fecha de creación del podcast en la plataforma. */
    private LocalDateTime createdAt;

    /**
     * Puntaje de relevancia calculado por el algoritmo de recomendación.
     * Valor interno usado para ordenar los resultados; no representa una calificación del usuario.
     */
    private Double relevanceScore;

    /**
     * Estrategia del algoritmo que originó esta recomendación.
     * @see RecommendationStrategy
     */
    private RecommendationStrategy strategy;
}
