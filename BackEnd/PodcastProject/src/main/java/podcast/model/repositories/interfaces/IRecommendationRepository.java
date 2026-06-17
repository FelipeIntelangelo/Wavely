package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Podcast;

import java.util.List;

/**
 * Repositorio dedicado a las consultas del motor de recomendaciones de Wavely.
 *
 * <p>Contiene tres grupos de queries nativas optimizadas, cada una correspondiente
 * a una de las capas del algoritmo híbrido:</p>
 * <ul>
 *   <li><b>Capa 1 – Trending:</b> Podcasts populares por views y rating.</li>
 *   <li><b>Capa 2 – Content-Based:</b> Podcasts de categorías afines al usuario.</li>
 *   <li><b>Capa 3 – Collaborative Filtering:</b> Podcasts favoritos de usuarios similares.</li>
 * </ul>
 */
@Repository
public interface IRecommendationRepository extends JpaRepository<Podcast, Long> {

    // ── Capa 1: Trending ─────────────────────────────────────────────────────────────

    /**
     * Retorna los podcasts más populares de la plataforma, ordenados por un score
     * compuesto de views promedio y rating promedio (pesos 60%/40%).
     *
     * <p>Excluye los podcasts ya marcados como favoritos por el usuario especificado
     * (si se proporciona userId) para no recomendar contenido ya conocido.</p>
     *
     * @param userId ID del usuario autenticado para excluir sus favoritos actuales.
     *               Puede ser {@code null} para usuarios anónimos.
     * @param limit  Cantidad máxima de resultados a retornar.
     * @return Lista de podcasts activos ordenados por popularidad decreciente.
     */
    @Query(value = """
            SELECT p.*
            FROM podcasts p
            LEFT JOIN episodes e ON e.podcast_id = p.id
            WHERE p.is_active = true
              AND (:userId IS NULL OR p.id NOT IN (
                    SELECT f.podcast_id FROM favorites f WHERE f.user_id = :userId
              ))
            GROUP BY p.id
            ORDER BY (COALESCE(AVG(e.views), 0) * 0.6 + COALESCE(p.average_rating, 0) * 0.4) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Podcast> findTrendingPodcasts(@Param("userId") Long userId, @Param("limit") int limit);

    // ── Capa 2: Content-Based ─────────────────────────────────────────────────────────

    /**
     * Retorna podcasts cuyas categorías coincidan con las categorías de los favoritos
     * del usuario, excluyendo los que éste ya tiene en su lista.
     *
     * <p>El orden se determina por popularidad (views promedio y rating), priorizando
     * el contenido de mayor calidad dentro de las categorías afines.</p>
     *
     * @param userId ID del usuario para el cual se generan recomendaciones.
     * @param limit  Cantidad máxima de resultados a retornar.
     * @return Lista de podcasts relevantes por categoría.
     */
    @Query(value = """
            SELECT DISTINCT p.*
            FROM podcasts p
            JOIN categoriasxpodcast cp ON cp.podcast_id = p.id
            LEFT JOIN episodes e ON e.podcast_id = p.id
            WHERE p.is_active = true
              AND cp.category IN (
                    SELECT cp2.category
                    FROM favorites f
                    JOIN categoriasxpodcast cp2 ON cp2.podcast_id = f.podcast_id
                    WHERE f.user_id = :userId
              )
              AND p.id NOT IN (
                    SELECT f2.podcast_id FROM favorites f2 WHERE f2.user_id = :userId
              )
            GROUP BY p.id
            ORDER BY (COALESCE(AVG(e.views), 0) * 0.6 + COALESCE(p.average_rating, 0) * 0.4) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Podcast> findContentBasedRecommendations(@Param("userId") Long userId, @Param("limit") int limit);

    // ── Capa 3: Collaborative Filtering ──────────────────────────────────────────────

    /**
     * Implementa un algoritmo de Collaborative Filtering basado en usuarios similares
     * (User-Based CF).
     *
     * <p>El proceso es el siguiente:
     * <ol>
     *   <li>Identifica a los usuarios que comparten al menos {@code minSharedFavorites}
     *       favoritos con el usuario objetivo.</li>
     *   <li>Recopila todos los podcasts que esos usuarios tienen en favoritos.</li>
     *   <li>Excluye los podcasts que el usuario objetivo ya conoce.</li>
     *   <li>Ordena por frecuencia de aparición (score colaborativo): los podcasts
     *       favoriteados por más usuarios similares tienen mayor prioridad.</li>
     * </ol>
     * </p>
     *
     * @param userId             ID del usuario para el cual se generan recomendaciones.
     * @param minSharedFavorites Umbral mínimo de favoritos compartidos para considerar
     *                           a un usuario como "similar". Valor recomendado: 2.
     * @param limit              Cantidad máxima de resultados a retornar.
     * @return Lista de podcasts ordenados por score colaborativo decreciente.
     */
    @Query(value = """
            SELECT p.*, COUNT(*) AS collab_score
            FROM podcasts p
            JOIN favorites uf ON p.id = uf.podcast_id
            WHERE uf.user_id IN (
                    SELECT uf2.user_id
                    FROM favorites uf2
                    WHERE uf2.podcast_id IN (
                          SELECT f.podcast_id FROM favorites f WHERE f.user_id = :userId
                    )
                      AND uf2.user_id != :userId
                    GROUP BY uf2.user_id
                    HAVING COUNT(*) >= :minSharedFavorites
            )
              AND p.is_active = true
              AND p.id NOT IN (
                    SELECT f3.podcast_id FROM favorites f3 WHERE f3.user_id = :userId
              )
            GROUP BY p.id
            ORDER BY collab_score DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Podcast> findCollaborativeRecommendations(
            @Param("userId") Long userId,
            @Param("minSharedFavorites") int minSharedFavorites,
            @Param("limit") int limit
    );

    // ── Utilidades ────────────────────────────────────────────────────────────────────

    /**
     * Cuenta la cantidad de podcasts en favoritos de un usuario.
     * Utilizado por el servicio para determinar qué estrategia del algoritmo aplicar.
     *
     * @param userId ID del usuario a consultar.
     * @return Cantidad de podcasts en la lista de favoritos del usuario.
     */
    @Query(value = "SELECT COUNT(*) FROM favorites WHERE user_id = :userId", nativeQuery = true)
    int countUserFavorites(@Param("userId") Long userId);
}
