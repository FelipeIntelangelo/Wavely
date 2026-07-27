# Motor de Recomendaciones de Podcasts — Wavely
### Documentación Técnica del Sistema

---

## 1. Introducción

El presente documento describe el diseño, la arquitectura y la implementación del **Motor de Recomendaciones** integrado en la plataforma Wavely. El objetivo de este módulo es maximizar la relevancia del contenido presentado a cada usuario, aumentando el tiempo de sesión y la tasa de descubrimiento de nuevos podcasts.

El motor fue diseñado bajo el principio de **pragmatismo escalable**: se prioriza una solución funcional y de bajo costo computacional que opere íntegramente sobre la base de datos relacional existente (PostgreSQL), sin requerir infraestructura de Machine Learning externa. Esta decisión permite una incorporación inmediata al sistema y facilita una futura migración hacia modelos más sofisticados (e.g., Matrix Factorization, redes neuronales) una vez que la plataforma alcance la escala necesaria.

---

## 2. Contexto y Justificación

Las plataformas de streaming de referencia —como **Spotify**, **YouTube Music** y **Apple Podcasts**— emplean arquitecturas de recomendación basadas en **Deep Neural Networks** y **Two-Tower Models**, entrenados con cientos de millones de interacciones de usuarios. Sin embargo, estos sistemas presentan barreras de entrada significativas:

- Requieren grandes volúmenes de datos históricos (millones de interacciones).
- Demandan infraestructura de cómputo especializada (GPUs, pipelines de ML).
- Implican ciclos de desarrollo y ajuste extensos.

Para una plataforma en etapa temprana como Wavely, la solución adecuada es un **sistema híbrido basado en heurísticas y SQL nativo**, que aprovecha los datos ya disponibles —favoritos, ratings, historial de reproducción y categorías— para generar recomendaciones de calidad sin dependencias externas.

---

## 3. Arquitectura del Módulo

El módulo de recomendaciones sigue la misma arquitectura en capas MVC del resto de la aplicación:

```
RecommendationController  (capa de presentación)
        │
        ▼
RecommendationService     (capa de lógica de negocio)
        │
        ▼
IRecommendationRepository (capa de acceso a datos)
        │
        ▼
    PostgreSQL            (base de datos)
```

### Archivos creados

| Artefacto | Ubicación | Responsabilidad |
|---|---|---|
| `RecommendationDTO` | `model/entities/dto/` | Contrato de respuesta del endpoint |
| `IRecommendationRepository` | `model/repositories/interfaces/` | Queries SQL nativas de cada estrategia |
| `RecommendationService` | `model/services/` | Orquestación del algoritmo híbrido |
| `RecommendationController` | `controller/` | Exposición REST + documentación Swagger |

---

## 4. El Algoritmo Híbrido de Tres Capas

El núcleo del motor es un **algoritmo de selección de estrategia dinámica**. En lugar de aplicar un único método de recomendación a todos los usuarios, el sistema evalúa el perfil de cada usuario en tiempo de ejecución y activa la estrategia más apropiada.

### Árbol de decisión

```
¿El usuario tiene favoritos?
│
├─ NO  → Estrategia 1: TRENDING (popularidad global)
│
└─ SÍ
    │
    ├─ 1 a 5 favoritos  → Estrategia 2: CONTENT_BASED (filtrado por categorías)
    │
    └─ > 5 favoritos    → Estrategia 3: COLLABORATIVE (filtrado colaborativo)
                              │
                              └─ Si resultados < 3  → Fallback a CONTENT_BASED
```

Este enfoque resuelve el **problema del "cold start"** (arranque en frío): un usuario recién registrado —que aún no tiene historial— recibe igualmente recomendaciones de calidad a través del módulo de popularidad global.

---

### 4.1 Capa 1 — Trending (Popularidad Global)

**Condición de activación:** El usuario no tiene podcasts en su lista de favoritos, o se accede sin autenticación.

**Descripción:** Se seleccionan los podcasts activos con mayor popularidad, calculada mediante un **score compuesto ponderado**:

$$\text{score} = \overline{\text{views}} \times 0{,}6 + \overline{\text{rating}} \times 0{,}4$$

Donde:
- $\overline{\text{views}}$: promedio de reproducciones por episodio del podcast.
- $\overline{\text{rating}}$: calificación promedio del podcast (escala 0–5).

Los pesos reflejan que el volumen de consumo es un indicador más fiable de relevancia que la calificación subjetiva, ya que los ratings pueden estar sesgados por pocos votos.

**Query SQL (nativa):**
```sql
SELECT p.*
FROM podcasts p
LEFT JOIN episodes e ON e.podcast_id = p.id
WHERE p.is_active = true
  AND (:userId IS NULL OR p.id NOT IN (
        SELECT f.podcast_id FROM favorites f WHERE f.user_id = :userId
  ))
GROUP BY p.id
ORDER BY (COALESCE(AVG(e.views), 0) * 0.6 + COALESCE(p.average_rating, 0) * 0.4) DESC
LIMIT 10
```

**Caso de uso:** Página de inicio para usuarios anónimos o usuarios nuevos. También es el endpoint `/recommendations/trending` (público, sin autenticación).

---

### 4.2 Capa 2 — Content-Based Filtering (Filtrado por Contenido)

**Condición de activación:** El usuario tiene entre 1 y 5 podcasts en favoritos.

**Descripción:** Se analizan las **categorías** de los podcasts que el usuario ya tiene en su lista de favoritos y se recuperan otros podcasts activos que pertenezcan a esas mismas categorías, excluyendo los que el usuario ya conoce.

Este enfoque se denomina **Content-Based Filtering** porque el sistema compara atributos del contenido (categorías) en lugar de comportamiento de otros usuarios.

**Ejemplo:** Si el usuario tiene como favoritos podcasts de `TECNOLOGIA` y `CIENCIA`, se le recomendarán otros podcasts etiquetados con esas categorías, ordenados por el mismo score de popularidad de la Capa 1.

**Query SQL (nativa):**
```sql
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
LIMIT 10
```

**Ventajas:**
- No requiere otros usuarios como referencia.
- Funciona bien con pocos datos.

**Limitación conocida:** Puede generar un efecto de "burbuja de filtro" (*filter bubble*), donde el usuario siempre recibe contenido similar a lo que ya escucha. Esto se mitiga en la Capa 3.

---

### 4.3 Capa 3 — Collaborative Filtering (Filtrado Colaborativo)

**Condición de activación:** El usuario tiene más de 5 podcasts en favoritos.

**Descripción:** Implementa el algoritmo clásico de **User-Based Collaborative Filtering**. La premisa es que usuarios con gustos similares tenderán a disfrutar el mismo contenido.

El proceso se divide en dos subpasos:

**Subpaso 1 — Identificación de usuarios similares:**
Se buscan todos los usuarios de la plataforma que comparten **al menos 2 podcasts en común** con el usuario objetivo en sus listas de favoritos. Este umbral (configurable mediante la constante `MIN_SHARED_FAVORITES`) evita falsos positivos por coincidencias aleatorias.

**Subpaso 2 — Extracción de recomendaciones:**
Se recopilan los podcasts en favoritos de esos usuarios similares que el usuario objetivo **aún no tiene en su lista**. Los resultados se ordenan por su **score colaborativo**: la cantidad de usuarios similares que tienen ese podcast en favoritos. Un podcast más popular entre el grupo similar tiene mayor prioridad.

**Query SQL (nativa):**
```sql
SELECT p.*, COUNT(*) AS collab_score
FROM podcasts p
JOIN favorites uf ON p.id = uf.podcast_id
WHERE uf.user_id IN (
        -- Usuarios similares: comparten >= 2 favoritos con el usuario objetivo
        SELECT uf2.user_id
        FROM favorites uf2
        WHERE uf2.podcast_id IN (
              SELECT f.podcast_id FROM favorites f WHERE f.user_id = :userId
        )
          AND uf2.user_id != :userId
        GROUP BY uf2.user_id
        HAVING COUNT(*) >= 2
)
  AND p.is_active = true
  AND p.id NOT IN (
        SELECT f3.podcast_id FROM favorites f3 WHERE f3.user_id = :userId
  )
GROUP BY p.id
ORDER BY collab_score DESC
LIMIT 10
```

**Mecanismo de fallback:** Si el algoritmo colaborativo retorna menos de 3 resultados (situación que ocurre cuando hay pocos usuarios similares en la plataforma), el sistema automáticamente complementa la lista con resultados de la Capa 2 (Content-Based), garantizando siempre una respuesta útil.

**Ventajas:**
- Descubre contenido fuera de las categorías habituales del usuario (*serendipity*).
- Mejora naturalmente a medida que crece la base de usuarios.

---

## 5. Seguridad y Manejo de Errores

### 5.1 Modelo de seguridad en dos capas

La protección del motor de recomendaciones se implementa mediante un **modelo de seguridad en dos capas** que es estándar en toda la arquitectura de Wavely:

| Capa | Mecanismo | Ubicación | Propósito |
|---|---|---|---|
| **Capa 1 — Filtro de red** | `SecurityFilterChain` | `SecurityConfig.java` | Controla si Spring Security permite que la request llegue al controller sin validar JWT |
| **Capa 2 — Autorización de método** | `@PreAuthorize("isAuthenticated()")` | `RecommendationController.java` | Garantiza que exista un `Principal` autenticado antes de ejecutar el método |

Ambas capas deben estar presentes para un endpoint protegido. Agregar un endpoint al bloque `permitAll()` del `SecurityFilterChain` sin revisar si requiere autenticación es un error de diseño: Spring Security dejaría pasar la request antes de que el filtro JWT pueda rechazarla.

### 5.2 Clasificación de acceso por endpoint

| Endpoint | Capa 1 (`permitAll`) | Capa 2 (`@PreAuthorize`) | Acceso |
|---|---|---|---|
| `GET /recommendations` | ❌ No aparece | ✅ `isAuthenticated()` | 🔒 JWT obligatorio |
| `GET /recommendations/trending` | ✅ Público | ❌ No requerido | 🌐 Sin autenticación |

### 5.3 Manejo de excepciones en el controlador

El `RecommendationController` implementa métodos `@ExceptionHandler` para capturar y traducir las excepciones conocidas a respuestas HTTP semánticamente correctas, sin delegar al manejador global genérico:

| Excepción | Código HTTP | Situación |
|---|---|---|
| `UserNotFoundException` | `404 Not Found` | El username del JWT no corresponde a un usuario existente en la base de datos |
| `IllegalArgumentException` | `400 Bad Request` | Argumento inválido en la lógica del servicio |
| `MethodArgumentTypeMismatchException` | `400 Bad Request` | Parámetro de ruta o query string con tipo incorrecto |
| `Exception` (genérico) | `500 Internal Server Error` | Error inesperado no contemplado por los handlers anteriores |

---

## 6. Contrato de la API REST

### Endpoints expuestos

#### `GET /podcastUTN/v1/recommendations`
Retorna recomendaciones personalizadas para el usuario autenticado.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `Authorization` | Header | **Sí** | Token JWT en formato `Bearer <token>`. Sin él, Spring Security retorna `401 Unauthorized` antes de llegar al controller. |

> Este endpoint requiere JWT obligatoriamente. Está protegido por `@PreAuthorize("isAuthenticated()")` en el controller y **no** forma parte del bloque `permitAll()` en `SecurityConfig`.

#### `GET /podcastUTN/v1/recommendations/trending`
Retorna los 10 podcasts más populares. **Público, sin autenticación requerida.** Figura en el bloque `permitAll()` del `SecurityFilterChain`.

---

### Respuesta — `RecommendationDTO`

```json
[
  {
    "id": 42,
    "title": "Tecnología Sin Filtro",
    "description": "Análisis profundo del ecosistema tech argentino.",
    "imageUrl": "https://res.cloudinary.com/.../podcast_cover.jpg",
    "categories": ["TECNOLOGIA", "CIENCIA"],
    "averageViews": 1540,
    "averageRating": 4.7,
    "createdAt": "2025-03-15T10:30:00",
    "relevanceScore": 924.88,
    "strategy": "COLLABORATIVE"
  }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `Long` | Identificador único del podcast |
| `title` | `String` | Título del podcast |
| `description` | `String` | Descripción breve |
| `imageUrl` | `String` | URL de portada en Cloudinary |
| `categories` | `List<Category>` | Categorías asignadas |
| `averageViews` | `Long` | Promedio de vistas por episodio |
| `averageRating` | `Double` | Calificación promedio (0.0 – 5.0) |
| `createdAt` | `LocalDateTime` | Fecha de creación del podcast |
| `relevanceScore` | `Double` | Puntaje interno de relevancia calculado por el algoritmo |
| `strategy` | `String` | Estrategia que originó esta recomendación: `TRENDING`, `CONTENT_BASED` o `COLLABORATIVE` |

---

## 7. Constantes de Configuración del Algoritmo

Las siguientes constantes se encuentran en `RecommendationService` y controlan el comportamiento del algoritmo. Pueden ajustarse sin modificar la lógica central:

| Constante | Valor por defecto | Descripción |
|---|---|---|
| `DEFAULT_LIMIT` | `10` | Cantidad máxima de recomendaciones retornadas |
| `DICE_POOL_SIZE` | `20` | Tamaño del pool de candidatos para el Dado Random |
| `COLLABORATIVE_THRESHOLD` | `5` | Cantidad de favoritos a partir de la cual se activa la Capa 3 |
| `MIN_SHARED_FAVORITES` | `2` | Mínimo de favoritos en común para considerar usuarios "similares" |

---

## 8. Dado Random (Weighted Random Selection)

### Concepto

El **Dado Random** es una extensión del motor de recomendaciones que introduce **azar ponderado** en la selección de podcasts. En lugar de presentar siempre los resultados ordenados por relevancia (lo que crea predictibilidad), el dado construye un pool amplio de candidatos y sortea uno con probabilidad proporcional a su `relevanceScore`.

Esto rompe la **burbuja de filtro** sin sacrificar la relevancia: un podcast con score 900 tiene ~3× más chances de salir que uno con score 300, pero ambos tienen posibilidad.

### Algoritmo

```
1. Obtener los favoritos del usuario (o null si anónimo)
2. Seleccionar estrategia según el árbol de decisión existente:
   - 0 favoritos → pool = Trending (top 20)
   - 1-5 favoritos → pool = Content-Based (top 20)
   - >5 favoritos → pool = Collaborative (top 20, con fallback a Content-Based)
3. Pool ampliado a DICE_POOL_SIZE (20) resultados
4. Anti-repetición: si el usuario tiene un resultado previo, se excluye del pool
5. Sorteo ponderado: probabilidad ∝ relevanceScore (mínimo 0.1 para evitar división por cero)
6. Retorna UN único RecommendationDTO con strategy = RANDOM_DICE
```

### Sorteo ponderado (implementación)

```java
double totalWeight = candidates.stream()
        .mapToDouble(dto -> Math.max(dto.getRelevanceScore(), 0.1))
        .sum();

double random = ThreadLocalRandom.current().nextDouble() * totalWeight;
double cumulative = 0;

for (RecommendationDTO candidate : candidates) {
    cumulative += Math.max(candidate.getRelevanceScore(), 0.1);
    if (random <= cumulative) return candidate;
}
```

### Anti-repetición

Se mantiene un `ConcurrentHashMap<Long, Long>` en memoria (`lastDiceResultByUser`) que mapea `userId → último podcastId sorteado`. Si el pool tiene más de un candidato, se filtra el último resultado antes del sorteo.

### Endpoint

#### `GET /podcastUTN/v1/recommendations/dice`

**Público con mejora autenticada.** Figura en el bloque `permitAll()` del `SecurityFilterChain`.

- **Sin JWT:** Usa el pool de Trending (descubrimiento para visitantes).
- **Con JWT:** Usa la estrategia personalizada según los favoritos del usuario.

Retorna un único `RecommendationDTO` (no una lista).

### Frontend

El dado se implementa como un componente Angular compartido (`DiceRollerComponent`) ubicado en `components/shared/dice-roller/`. Consiste en un cubo 3D CSS de 44×44px con los colores de Wavely que gira al hacer click directamente sobre él (sin botón separado). Al completar la animación, se muestra un modal con la card del podcast sorteado y opciones para navegar al podcast o tirar de nuevo.

---

## 9. Tecnologías Utilizadas

| Componente | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.5.0 |
| Acceso a datos | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL |
| Queries de recomendación | SQL nativo (`@Query nativeQuery = true`) |
| Documentación API | OpenAPI 3 / Swagger UI |
| Seguridad | Spring Security + JWT |

---

## 10. Escalabilidad y Evolución Futura

El diseño actual sienta las bases para futuras mejoras sin necesidad de reescribir la arquitectura:

| Escenario | Mejora propuesta |
|---|---|
| Base de usuarios > 10.000 | Reemplazar Capa 3 por **Matrix Factorization (ALS/SVD)** |
| Datos de reproducción detallados | Incorporar duración escuchada como señal de engagement |
| Análisis de contenido | Aplicar **NLP** (TF-IDF o embeddings) sobre títulos y descripciones |
| Escala masiva | Migrar a arquitecturas **Two-Tower** con TensorFlow o PyTorch |

---

## 11. Resumen

El motor de recomendaciones de Wavely implementa un **algoritmo híbrido de tres capas** que opera íntegramente sobre PostgreSQL mediante queries SQL nativas. Su diseño resuelve el problema del cold start, evita la burbuja de filtro mediante el componente colaborativo y garantiza respuestas de calidad en todos los estados del ciclo de vida del usuario — desde el registro hasta el uso avanzado de la plataforma.
