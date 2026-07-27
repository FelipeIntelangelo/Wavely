# Dado Random - Wavely

## Alcance

El Dado Random es una funcionalidad de descubrimiento de contenido que permite a los usuarios (tanto anónimos como autenticados) explorar podcasts de forma lúdica. Introduce un componente de azar ponderado que rompe con la "burbuja de filtro" del motor de recomendaciones clásico, sin sacrificar por completo la relevancia.

- **Usuarios Anónimos:** Se selecciona un podcast de forma aleatoria a partir de un pool basado en las tendencias globales (Trending).
- **Usuarios Autenticados:** Se utiliza la estrategia de recomendación personalizada correspondiente al perfil (Trending, Content-Based o Collaborative) para armar los candidatos.

## Modelo y Algoritmo

- **Pool Extendido:** El motor amplía la búsqueda para obtener hasta **20 candidatos** (mediante `DICE_POOL_SIZE = 20`), brindando mayor variedad para el sorteo.
- **Sorteo Ponderado (Weighted Random Selection):** Cada candidato tiene una probabilidad de salir sorteado que es proporcional a su `relevanceScore`. Por ejemplo, un podcast con un score elevado tiene estadísticamente mayores posibilidades de salir que uno con bajo score, pero todos mantienen una chance.
- **Anti-repetición en memoria:** El backend mantiene un registro temporal (`ConcurrentHashMap`) del último podcast sorteado por cada usuario. Antes de cada tirada, se excluye ese último resultado del pool, evitando así repeticiones consecutivas. Al no requerir un estado persistente largo, se evita cargar la base de datos.
- **DTO:** Se retorna un objeto `RecommendationDTO` único, cuya propiedad `strategy` viene seteada como `RANDOM_DICE`.

## API

El endpoint es de acceso público (configurado en el `permitAll()` de `SecurityConfig`), pero detecta proactivamente al usuario si este incluye un JWT válido (mejora autenticada).

```text
GET /podcastUTN/v1/recommendations/dice
```

Retorna una respuesta `200 OK` con el objeto `RecommendationDTO`. El backend resuelve el `userId` interceptando el token (si existe) vía `@AuthenticationPrincipal`.

## Frontend

La integración del Dado Random reside principalmente en la página principal (`Home`).

- Se expone mediante un componente Angular compartido y encapsulado (`DiceRollerComponent`).
- La interfaz de usuario es un dado 3D de 44x44px implementado con puro CSS (preserve-3d). 
- Al hacer clic directamente sobre el cubo, se activa una animación de rotación al mismo tiempo que se dispara el llamado al endpoint.
- Una vez finalizada la animación y recibida la respuesta, se renderiza un overlay modal con efecto glassmorphism que muestra la carátula, título y descripción del podcast sorteado.
- El modal provee opciones para ir directamente al detalle del podcast o "volver a tirar" el dado.
