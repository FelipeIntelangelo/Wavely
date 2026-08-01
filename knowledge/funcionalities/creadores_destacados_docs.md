# Creadores Destacados - Documentación de Funcionalidad

## Descripción General
La sección "Creadores Destacados" es un carrusel interactivo ubicado en la vista principal (`Home`) que muestra a los creadores de contenido (usuarios) más populares de la plataforma. Esta funcionalidad tiene como fin dar visibilidad a los creadores que traccionan mayor audiencia.

## Algoritmo de Popularidad
Para determinar y ordenar a los creadores destacados se utiliza un algoritmo basado en un sistema de puntaje (score) que toma en cuenta los siguientes factores:

1. **Cantidad de Seguidores:** Se multiplica por un factor de 5 (cada seguidor suma 5 puntos).
2. **Vistas Totales (Reproducciones):** Se suman todas las vistas (`views`) de todos los episodios (`Episode`) pertenecientes a los podcasts (`Podcast`) que el usuario mantiene activos.

**Fórmula:**
`Score = (Seguidores * 5) + Vistas Totales`

Solo se contemplan aquellos usuarios que posean al menos un podcast activo en el sistema, y la API devuelve un límite predeterminado de los **Top 10** creadores.

## Arquitectura e Implementación

### Backend (Capa de Datos y Servicios)
- **Endpoint:** `GET /podcastUTN/v1/users/featured?limit=10` (`UserController.java`).
- **Servicio (`UserService.java`):** Calcula el puntaje de todos los usuarios en memoria iterando sobre sus seguidores y las reproducciones de sus episodios, los ordena de manera descendente y devuelve los primeros `limit` elementos.
- **Tipado y Lombok:** 
  - Para evitar conflictos de compilación y sombreado de getters (donde Lombok no sobreescribía los métodos manuales), el método original en `User.java` que devolvía los títulos de los podcasts fue renombrado a `getPodcastTitles()`, manteniendo su etiqueta de Jackson `@JsonProperty("podcasts")` intacta.

### Frontend (Capa de Presentación y Servicios)
- **Consumo (`user-service.ts`):** Cuenta con la función `getFeaturedCreators(limit)` que devuelve un arreglo de `UserSearchDTO[]`.
- **Integración Visual (`home.ts` & `home.html`):** 
  - Se incorporó la gestión del estado para este nuevo carrusel (estado de carga, referencias al DOM, y botones de navegación izquierda/derecha).
  - La UI recicla la clase CSS `.cardHome` de los podcasts, pero renderiza los perfiles empleando el componente `<app-media-image type="user">` que da forma redondeada a los avatares.
  - La biografía (bio) de los creadores se trunca automáticamente a 50 caracteres para preservar la armonía visual de las tarjetas.
