package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import podcast.model.entities.Podcast;
import podcast.model.entities.dto.RecommendationDTO;
import podcast.model.entities.enums.RecommendationStrategy;
import podcast.model.repositories.interfaces.IRecommendationRepository;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Servicio del motor de recomendaciones de Wavely.
 *
 * <p>Implementa un <b>algoritmo híbrido de tres capas</b> que selecciona dinámicamente
 * la estrategia más adecuada según el perfil de interacción del usuario autenticado:</p>
 *
 * <ul>
 *   <li><b>Capa 1 – Trending (popularidad global):</b> Se aplica cuando el usuario no
 *       tiene favoritos registrados. Recomienda los podcasts más vistos y mejor valorados
 *       de la plataforma.</li>
 *
 *   <li><b>Capa 2 – Content-Based Filtering:</b> Se aplica cuando el usuario tiene entre
 *       1 y {@value #COLLABORATIVE_THRESHOLD} favoritos. Identifica las categorías
 *       de sus favoritos y busca otros podcasts dentro de esas mismas categorías.</li>
 *
 *   <li><b>Capa 3 – Collaborative Filtering (User-Based CF):</b> Se aplica cuando el
 *       usuario tiene más de {@value #COLLABORATIVE_THRESHOLD} favoritos. Detecta usuarios
 *       con gustos similares y recomienda lo que ellos escuchan pero el usuario aún no
 *       ha explorado. Si los resultados colaborativos son insuficientes, los complementa
 *       con recomendaciones de content-based.</li>
 * </ul>
 *
 * <p>Todos los resultados son mapeados a {@link RecommendationDTO}, que incluye el campo
 * {@code strategy} indicando cuál capa generó cada recomendación.</p>
 */
@Service
public class RecommendationService {

    // ── Constantes de configuración del algoritmo ────────────────────────────────────

    /**
     * Cantidad de resultados máximos a retornar por defecto.
     */
    private static final int DEFAULT_LIMIT = 10;

    /**
     * Tamaño del pool de candidatos para el Dado Random.
     * Se usa un pool más amplio que el default para maximizar la variedad en el sorteo.
     */
    private static final int DICE_POOL_SIZE = 20;

    /**
     * Umbral mínimo de favoritos para activar el Collaborative Filtering.
     * Con menos favoritos que este valor, se usa Content-Based Filtering.
     */
    private static final int COLLABORATIVE_THRESHOLD = 5;

    /**
     * Umbral mínimo de favoritos compartidos para considerar a dos usuarios como
     * "similares" en el algoritmo de Collaborative Filtering.
     */
    private static final int MIN_SHARED_FAVORITES = 2;

    // ── Inyección de dependencias ─────────────────────────────────────────────────────

    private final IRecommendationRepository recommendationRepository;

    /**
     * Cache en memoria para evitar repetir el mismo podcast en tiradas consecutivas
     * del dado para un mismo usuario. Mapea userId → último podcastId sorteado.
     */
    private final Map<Long, Long> lastDiceResultByUser = new ConcurrentHashMap<>();

    @Autowired
    public RecommendationService(IRecommendationRepository recommendationRepository) {
        this.recommendationRepository = recommendationRepository;
    }

    // ── Lógica principal del algoritmo ───────────────────────────────────────────────

    /**
     * Punto de entrada principal del motor de recomendaciones.
     *
     * <p>Evalúa el perfil del usuario (cantidad de favoritos) y delega a la estrategia
     * correspondiente. La decisión sigue este árbol:</p>
     * <pre>
     *   userId == null          →  Trending (llamado desde /trending, sin autenticación)
     *   favoritos == 0          →  Trending
     *   1 ≤ favoritos ≤ COLLABORATIVE_THRESHOLD  →  Content-Based
     *   favoritos > COLLABORATIVE_THRESHOLD       →  Collaborative (+ Content-Based como fallback)
     * </pre>
     *
     * @param userId ID del usuario autenticado. {@code null} solo cuando la llamada
     *               proviene del endpoint público {@code /trending}.
     * @return Lista de hasta {@value #DEFAULT_LIMIT} podcasts recomendados con su
     *         puntaje de relevancia y estrategia de origen.
     */
    public List<RecommendationDTO> getRecommendations(Long userId) {
        if (userId == null) {
            return getTrendingRecommendations(null);
        }

        int favoriteCount = recommendationRepository.countUserFavorites(userId);

        if (favoriteCount == 0) {
            return getTrendingRecommendations(userId);
        } else if (favoriteCount <= COLLABORATIVE_THRESHOLD) {
            return getContentBasedRecommendations(userId);
        } else {
            return getCollaborativeRecommendations(userId);
        }
    }

    // ── Capa 1: Trending ─────────────────────────────────────────────────────────────

    /**
     * Genera recomendaciones basadas en popularidad global (Capa 1 – Trending).
     *
     * <p>Consulta los podcasts activos ordenados por un score compuesto:
     * {@code score = views_promedio × 0.6 + average_rating × 0.4}.
     * Se excluyen automáticamente los favoritos actuales del usuario si se proporciona
     * un {@code userId}.</p>
     *
     * @param userId ID del usuario para exclusión de favoritos. Puede ser {@code null}.
     * @return Lista de podcasts populares mapeados a {@link RecommendationDTO}.
     */
    private List<RecommendationDTO> getTrendingRecommendations(Long userId) {
        List<Podcast> trending = recommendationRepository.findTrendingPodcasts(userId, DEFAULT_LIMIT);
        return trending.stream()
                .map(p -> toDTO(p, RecommendationStrategy.TRENDING, computeTrendingScore(p)))
                .toList();
    }

    // ── Capa 2: Content-Based ─────────────────────────────────────────────────────────

    /**
     * Genera recomendaciones basadas en las categorías de los favoritos del usuario
     * (Capa 2 – Content-Based Filtering).
     *
     * <p>Identifica las categorías presentes en los podcasts favoriteados y busca otros
     * podcasts activos que compartan esas categorías. Si no hay resultados (usuario con
     * favoritos de categorías muy nicho), hace fallback a Trending.</p>
     *
     * @param userId ID del usuario autenticado.
     * @return Lista de podcasts relevantes por afinidad de categoría.
     */
    private List<RecommendationDTO> getContentBasedRecommendations(Long userId) {
        List<Podcast> contentBased = recommendationRepository.findContentBasedRecommendations(userId, DEFAULT_LIMIT);

        if (contentBased.isEmpty()) {
            return getTrendingRecommendations(userId);
        }

        return contentBased.stream()
                .map(p -> toDTO(p, RecommendationStrategy.CONTENT_BASED, computeTrendingScore(p)))
                .toList();
    }

    // ── Capa 3: Collaborative Filtering ──────────────────────────────────────────────

    /**
     * Genera recomendaciones mediante Collaborative Filtering basado en usuarios
     * similares (Capa 3 – User-Based CF).
     *
     * <p>Encuentra usuarios que comparten al menos {@value #MIN_SHARED_FAVORITES} favoritos
     * con el usuario objetivo, luego recomienda los podcasts que esos usuarios tienen
     * en sus listas pero el usuario objetivo aún no ha explorado. El orden está dado
     * por la frecuencia de aparición entre los usuarios similares (score colaborativo).</p>
     *
     * <p>Si los resultados colaborativos son insuficientes (menos de 3 resultados),
     * se complementa con hasta {@value #DEFAULT_LIMIT} items de Content-Based para
     * garantizar una lista completa.</p>
     *
     * @param userId ID del usuario autenticado.
     * @return Lista de podcasts con score colaborativo, posiblemente combinada con
     *         resultados de Content-Based como complemento.
     */
    private List<RecommendationDTO> getCollaborativeRecommendations(Long userId) {
        List<Podcast> collaborative = recommendationRepository.findCollaborativeRecommendations(
                userId, MIN_SHARED_FAVORITES, DEFAULT_LIMIT
        );

        List<RecommendationDTO> result = collaborative.stream()
                .map(p -> toDTO(p, RecommendationStrategy.COLLABORATIVE, computeTrendingScore(p)))
                .toList();

        // Fallback: si hay menos de 3 resultados colaborativos, completar con content-based
        if (result.size() < 3) {
            List<RecommendationDTO> contentBased = getContentBasedRecommendations(userId);
            // Unir listas evitando duplicados por id
            List<Long> existingIds = result.stream().map(RecommendationDTO::getId).toList();
            List<RecommendationDTO> combined = new java.util.ArrayList<>(result);
            contentBased.stream()
                    .filter(dto -> !existingIds.contains(dto.getId()))
                    .limit(DEFAULT_LIMIT - result.size())
                    .forEach(combined::add);
            return combined;
        }

        return result;
    }

    // ── Dado Random (Weighted Random Selection) ──────────────────────────────────────

    /**
     * Genera una recomendación aleatoria ponderada para el Dado Random.
     *
     * <p>El algoritmo funciona de la siguiente manera:</p>
     * <ol>
     *   <li>Selecciona la estrategia del motor de recomendaciones según el perfil del usuario
     *       (Trending / Content-Based / Collaborative), exactamente igual que {@link #getRecommendations}.</li>
     *   <li>Amplía el pool de candidatos a {@value #DICE_POOL_SIZE} para maximizar la variedad.</li>
     *   <li>Aplica un sorteo ponderado (weighted random) donde cada candidato tiene una probabilidad
     *       proporcional a su {@code relevanceScore}. Un podcast con score 900 tiene ~3× más
     *       posibilidades de ser seleccionado que uno con score 300.</li>
     *   <li>Si el podcast sorteado coincide con el último resultado del mismo usuario,
     *       se excluye y se repite el sorteo para evitar repeticiones consecutivas.</li>
     * </ol>
     *
     * @param userId ID del usuario autenticado. {@code null} para usuarios anónimos
     *               (se usa Trending como pool).
     * @return Un único {@link RecommendationDTO} con {@code strategy = RANDOM_DICE}.
     * @throws IllegalStateException si no hay podcasts disponibles en el pool.
     */
    public RecommendationDTO getRandomDice(Long userId) {
        List<RecommendationDTO> pool = buildDicePool(userId);

        if (pool.isEmpty()) {
            throw new IllegalStateException("No hay podcasts disponibles para el dado.");
        }

        // Excluir el último resultado del usuario para evitar repeticiones consecutivas
        Long lastResult = userId != null ? lastDiceResultByUser.get(userId) : null;
        List<RecommendationDTO> candidates = pool;
        if (lastResult != null && pool.size() > 1) {
            candidates = pool.stream()
                    .filter(dto -> !dto.getId().equals(lastResult))
                    .toList();
            // Si se filtraron todos (caso extremo), usar pool completo
            if (candidates.isEmpty()) {
                candidates = pool;
            }
        }

        // Sorteo ponderado por relevanceScore
        RecommendationDTO selected = weightedRandomSelect(candidates);

        // Registrar resultado para anti-repetición
        if (userId != null) {
            lastDiceResultByUser.put(userId, selected.getId());
        }

        // Retornar con estrategia RANDOM_DICE
        return RecommendationDTO.builder()
                .id(selected.getId())
                .title(selected.getTitle())
                .description(selected.getDescription())
                .imageUrl(selected.getImageUrl())
                .categories(selected.getCategories())
                .averageViews(selected.getAverageViews())
                .averageRating(selected.getAverageRating())
                .createdAt(selected.getCreatedAt())
                .relevanceScore(selected.getRelevanceScore())
                .strategy(RecommendationStrategy.RANDOM_DICE)
                .build();
    }

    /**
     * Construye el pool de candidatos para el dado, usando la misma lógica de selección
     * de estrategia del motor principal pero con un límite ampliado.
     */
    private List<RecommendationDTO> buildDicePool(Long userId) {
        if (userId == null) {
            return getDicePoolTrending(null);
        }

        int favoriteCount = recommendationRepository.countUserFavorites(userId);

        if (favoriteCount == 0) {
            return getDicePoolTrending(userId);
        } else if (favoriteCount <= COLLABORATIVE_THRESHOLD) {
            return getDicePoolContentBased(userId);
        } else {
            return getDicePoolCollaborative(userId);
        }
    }

    private List<RecommendationDTO> getDicePoolTrending(Long userId) {
        return recommendationRepository.findTrendingPodcasts(userId, DICE_POOL_SIZE).stream()
                .map(p -> toDTO(p, RecommendationStrategy.TRENDING, computeTrendingScore(p)))
                .toList();
    }

    private List<RecommendationDTO> getDicePoolContentBased(Long userId) {
        List<Podcast> contentBased = recommendationRepository.findContentBasedRecommendations(userId, DICE_POOL_SIZE);
        if (contentBased.isEmpty()) {
            return getDicePoolTrending(userId);
        }
        return contentBased.stream()
                .map(p -> toDTO(p, RecommendationStrategy.CONTENT_BASED, computeTrendingScore(p)))
                .toList();
    }

    private List<RecommendationDTO> getDicePoolCollaborative(Long userId) {
        List<Podcast> collaborative = recommendationRepository.findCollaborativeRecommendations(
                userId, MIN_SHARED_FAVORITES, DICE_POOL_SIZE
        );
        List<RecommendationDTO> result = collaborative.stream()
                .map(p -> toDTO(p, RecommendationStrategy.COLLABORATIVE, computeTrendingScore(p)))
                .toList();

        if (result.size() < 3) {
            List<RecommendationDTO> contentBased = getDicePoolContentBased(userId);
            List<Long> existingIds = result.stream().map(RecommendationDTO::getId).toList();
            List<RecommendationDTO> combined = new java.util.ArrayList<>(result);
            contentBased.stream()
                    .filter(dto -> !existingIds.contains(dto.getId()))
                    .limit(DICE_POOL_SIZE - result.size())
                    .forEach(combined::add);
            return combined;
        }
        return result;
    }

    /**
     * Selecciona un elemento aleatorio del pool con probabilidad proporcional a su
     * {@code relevanceScore}.
     *
     * <p>Algoritmo: acumula los pesos y genera un número aleatorio en el rango [0, totalWeight).
     * Recorre la lista sumando pesos hasta superar el valor aleatorio.
     * Complejidad: O(n) en una sola pasada.</p>
     */
    private RecommendationDTO weightedRandomSelect(List<RecommendationDTO> candidates) {
        double totalWeight = candidates.stream()
                .mapToDouble(dto -> Math.max(dto.getRelevanceScore(), 0.1))
                .sum();

        double random = ThreadLocalRandom.current().nextDouble() * totalWeight;
        double cumulative = 0;

        for (RecommendationDTO candidate : candidates) {
            cumulative += Math.max(candidate.getRelevanceScore(), 0.1);
            if (random <= cumulative) {
                return candidate;
            }
        }

        // Fallback: último elemento (no debería llegar aquí por floating-point)
        return candidates.get(candidates.size() - 1);
    }

    // ── Conversión y utilidades ───────────────────────────────────────────────────────

    /**
     * Calcula el score de relevancia para la Capa 1 (Trending) y Capa 2 (Content-Based).
     *
     * <p>Fórmula: {@code score = averageViews × 0.6 + averageRating × 0.4}
     * Los valores son normalizados internamente por la query SQL.</p>
     *
     * @param podcast Entidad Podcast a evaluar.
     * @return Score de relevancia como valor Double.
     */
    private Double computeTrendingScore(Podcast podcast) {
        double views = podcast.calcularViewsPromedio() != null ? podcast.calcularViewsPromedio() : 0.0;
        double rating = podcast.getAverageRating() != null ? podcast.getAverageRating() : 0.0;
        return views * 0.6 + rating * 0.4;
    }

    /**
     * Convierte una entidad {@link Podcast} a un {@link RecommendationDTO}.
     *
     * @param podcast       Entidad a convertir.
     * @param strategy      Estrategia que originó la recomendación.
     * @param relevanceScore Puntaje de relevancia calculado.
     * @return DTO de recomendación listo para ser serializado como respuesta HTTP.
     */
    private RecommendationDTO toDTO(Podcast podcast, RecommendationStrategy strategy, Double relevanceScore) {
        return RecommendationDTO.builder()
                .id(podcast.getId())
                .title(podcast.getTitle())
                .description(podcast.getDescription())
                .imageUrl(podcast.getImageUrl())
                .categories(podcast.getCategories())
                .averageViews(podcast.calcularViewsPromedio())
                .averageRating(podcast.getAverageRating())
                .createdAt(podcast.getCreatedAt())
                .relevanceScore(relevanceScore)
                .strategy(strategy)
                .build();
    }
}
