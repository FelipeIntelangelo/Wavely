package podcast.model.entities.enums;

/**
 * Estrategias del motor de recomendaciones híbrido de Wavely.
 *
 * <ul>
 *   <li>{@link #TRENDING} — Popularidad global: se aplica cuando el usuario no tiene favoritos.</li>
 *   <li>{@link #CONTENT_BASED} — Filtrado por contenido: basado en las categorías de los favoritos del usuario.</li>
 *   <li>{@link #COLLABORATIVE} — Filtrado colaborativo: basado en usuarios con gustos similares.</li>
 * </ul>
 */
public enum RecommendationStrategy {
    TRENDING,
    CONTENT_BASED,
    COLLABORATIVE,
    RANDOM_DICE
}
