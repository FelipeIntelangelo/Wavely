# Conocimiento Integral del Proyecto: Wavely (Podcast UTN) 🚀

Este archivo contiene el mapeo exhaustivo de la arquitectura, entidades, controladores, componentes y configuraciones de la plataforma Wavely. Actúa como el cerebro/memoria del proyecto para futuras interacciones.

---

## 🛠 1. Stack Tecnológico General
* **Backend:** Java 21, Spring Boot 3.5.0
* **Frontend:** Angular 20 (TypeScript, RxJS)
* **Base de Datos:** PostgreSQL (Docker-compose) / H2 (Testing)
* **Autenticación:** JWT (JSON Web Tokens) vía `Authorization: Bearer <token>`, Spring Security.
* **Archivos Multimedia:** Cloudinary (imágenes de portada y audios MP3).
* **Tiempo Real:** STOMP sobre WebSockets (Backend: `spring-boot-starter-websocket`, Frontend: `@stomp/stompjs` + `sockjs-client`).

---

## ⚙️ 2. Arquitectura del Backend (`BackEnd/PodcastProject`)
**Paquete base:** `podcast` (`src/main/java/podcast`)

### 2.1 Entidades del Dominio (`model.entities`) y Relaciones Claves
Cada entidad está mapeada a PostgreSQL mediante JPA (`@Entity`).

*   **`User` (Usuarios)**
    *   **Campos:** `id`, `name`, `lastName`, `nickname` (único), `credential` (embebido), `profilePicture`, `bio`.
    *   **Credential (Embebido):** `email`, `username`, `password`, `roles` (`ROLE_ADMIN`, `ROLE_CREATOR`, `ROLE_USER`), `authProvider` (`LOCAL`, `GOOGLE`), `createdAt`.
    *   **Relaciones:**
        *   `podcasts`: `OneToMany` (Podcasts que creó).
        *   `favorites`: `ManyToMany` con Podcast (Suscripciones/Favoritos).
        *   `ratings`: `OneToMany` con Rating.
*   **`Podcast`**
    *   **Campos:** `id`, `title`, `description`, `imageUrl` (Cloudinary), `isActive`, `createdAt`, `updatedAt`, `averageRating`.
    *   **Relaciones:**
        *   `user`: `ManyToOne` (Creador).
        *   `episodes`: `OneToMany`.
        *   `categories`: `ElementCollection` de Enum `Category` (`TECHNOLOGY`, `COMEDY`, `EDUCATION`, etc.).
        *   `favoritedBy`: `ManyToMany` (Usuarios suscritos).
*   **`Episode`**
    *   **Campos:** `id`, `title`, `description`, `audioPath` (Cloudinary), `imageUrl`, `duration`, `season`, `chapter`, `views`, `publicationDate`.
    *   **Relaciones:**
        *   `podcast`: `ManyToOne`.
        *   `commentaries`: `OneToMany`.
        *   `ratings`: `OneToMany`.
*   **`Commentary`**
    *   **Campos:** `id`, `content`, `createdAt`.
    *   **Relaciones:** `user` (ManyToOne), `episode` (ManyToOne).
*   **`Rating`**
    *   **Campos:** `id`, `score` (Long).
    *   **Relaciones:** `user` (ManyToOne), `episode` (ManyToOne).
*   **`Notification`**
    *   **Campos:** `id`, `type` (Enum: `NEW_EPISODE`, `NEW_SUBSCRIPTION`, `NEW_COMMENTARY`, `NEW_RATING`, `NEW_FOLLOWER`), `message`, `isRead`, `createdAt`.
    *   **Relaciones:** `sender` (User), `receiver` (User), opcionales a `Podcast`, `Episode`, `Commentary`.
*   **`EpisodeHistory`**
    *   **Campos:** `id`, `viewedAt`.
    *   **Relaciones:** `user` (ManyToOne), `episode` (ManyToOne).

### 2.2 Servicios (`model.services`)
*   **`UserService`:** CRUD usuarios, gestión de favoritos (`addPodcastToFavorites`), `getCurrentUserProfile`.
*   **`PodcastService`:** CRUD podcasts, cálculo de ratings/views. Integración con `CloudinaryService` para carátulas.
*   **`EpisodeService`:** CRUD episodios, validación de temporada/capítulo (`season`, `chapter`), manejo de comentarios. Dispara `NUEVO_EPISODIO` y `NUEVO_COMENTARIO`.
*   **`RatingService`:** Asigna puntaje (`rateEpisode`) y dispara `NUEVO_RATING`.
*   **`NotificationService`:** Persiste notificaciones y envía por WebSocket a `/queue/notifications` vía `SimpMessagingTemplate`.
*   **`AuthService` / `GoogleAuthService`:** Registro y login (Local y Google). Generación de JWT mediante `JwtUtil`.
*   **`CloudinaryService`:** Sube (`uploadFile`) y elimina (`deleteFile`) archivos multimedia en la nube.

### 2.3 Endpoints / Controladores REST (`controller`)
*   `/api/auth/**`: `POST /register`, `POST /login`, `POST /google`.
*   `/api/users/**`: `GET /myProfile`, `PATCH /myProfile`, `DELETE /myProfile`, `GET /myFavorites`, `POST /favorites/{id}`. Búsqueda con `?nickname=X`.
*   `/api/podcasts/**`: `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`.
*   `/api/episodes/**`: `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`, `POST /{id}/comments`.
*   `/api/notifications/**`: `GET /` (lista), `GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all`.
*   `/ws/**`: Endpoint WebSocket para STOMP.

### 2.4 Configuración (`cfg`)
*   **`SecurityConfig`:** Deshabilita CSRF, habilita CORS, estado `STATELESS`. Rutas GET públicas (podcasts, episodios, usuarios) y WebSocket (`/ws/**`). Filtro JWT (`JwtAuthFilter`).
*   **`WebSocketConfig`:** Habilita el broker `/topic` y `/queue`. Prefijo de destino `/app` y destino de usuario `/user`. Endpoint SockJS en `/ws`.

---

## 🎨 3. Arquitectura del Frontend (`FrontEnd/src/app`)
Aplicación SPA en **Angular 20**.

### 3.1 Modelos e Interfaces (`models/`)
*   `user/`: `User`, `UserLoginDTO`, `UserRegisterDTO`, `UserUpdateDTO`, `UserSearchDTO`.
*   `podcast/`: `PodcastDTO`, `PodcastSearchDTO`, `PodcastUpdateDTO`.
*   `episode/`: `EpisodeDTO`, `EpisodeHistoryDTO`, `UpdateEpisodeDTO`.
*   `notification/`: `Notification`, Enum `NotificationType`.
*   `page-response.ts`: Interface estándar de paginación de Spring Boot (`content`, `totalPages`, `totalElements`).

### 3.2 Servicios (`services/`)
Toda la lógica de red utiliza `HttpClient`.
*   **`auth/auth.service.ts`:** Maneja estado local (`isLoggedIn$`). Almacena el `jwt_token` en `localStorage`.
*   **`auth/auth.interceptor.ts`:** Inyecta automáticamente `Authorization: Bearer <token>` en todas las peticiones a la API.
*   **`client/user-service.ts`:** Llama a `/api/users/`. Tiene la lógica de `getCurrentUserProfile`, `getUsersDTO`, historial, y login/registro.
*   **`podcast/podcast-service.ts`:** Llama a `/api/podcasts/`. Maneja subida con `FormData`.
*   **`episode/episode.service.ts`:** Llama a `/api/episodes/`.
*   **`notification/notification.service.ts`:**
    *   Usa `HttpClient` para traer notificaciones iniciales.
    *   Usa `@stomp/stompjs` y `sockjs-client` para conectar al WebSocket en `http://localhost:8080/ws` con el JWT en el header.
    *   Mantiene estado global reactivo mediante `notifications$` y `unreadCount$` (RxJS `BehaviorSubject`).
*   **`media-player/`:** Servicio que controla la persistencia del audio en la app (reproductor global).

### 3.3 Componentes de Interfaz (`components/`)
*   **`header/`:** Barra superior. Contiene el buscador global dinámico (podcasts y usuarios), menú de perfil de usuario y la campanita de notificaciones.
*   **`notification-bell/`:** Ícono de campana interactivo con menú desplegable, conectado al `NotificationService`.
*   **`notification-item/`:** Renderiza la notificación individual con iconos específicos (`🎙️`, `📢`, `💬`, `⭐`).
*   **`sidebar/`:** Navegación principal de la plataforma.
*   **`audio-player/`:** Reproductor multimedia fijado en la parte inferior de la pantalla.

### 3.4 Vistas / Páginas (`pages/`)
Rutas principales configuradas en `app.routes.ts`:
*   `/` -> **`home`**: Página principal con recomendaciones.
*   `/auth/login`, `/auth/register` -> **`auth`**: Inicio de sesión y registro.
*   `/profile`, `/profile/:id` -> **`profile`**: Perfil de usuario público y privado.
*   `/edit-profile` -> **`edit-profile`**.
*   `/podcast/:id` -> **`podcast-detail`**: Lista de episodios, info del creador, botón de suscribir (favoritos).
*   `/episode/:id` -> **`episode-detail`**: Reproductor, panel de comentarios, rating.
*   `/create-podcast`, `/edit-podcast/:id` -> **`create-podcast`** / **`edit-podcast`**.
*   `/create-episode/:podcastId` -> **`create-episode`**.
*   `/search/:query` -> **`search`**: Resultados globales completos.
*   `/history` -> **`history`**: Episodios escuchados.

---

## 🔄 4. Detalles Cruciales de Integración
1.  **Imágenes y Audios:** El frontend utiliza `FormData` para enviar objetos `File` al backend (`PodcastController` / `EpisodeController`), que a su vez se encarga de subir el archivo binario a Cloudinary y guarda en la base de datos la URL segura (`https://res.cloudinary.com/...`).
2.  **Seguridad CORS:** El backend en `SecurityConfig` (o `WebConfig`) permite orígenes que coincidan con `http://localhost:4200` o la IP de Angular, además de exponer endpoints `GET` críticos como públicos, asegurando `POST/PATCH/DELETE` solo a usuarios autenticados con su token Bearer extraído por el filtro de seguridad de Spring.
3.  **Roles de Sistema:** Por defecto, cualquier usuario es `ROLE_USER`. Para crear podcasts o episodios, es altamente probable que el frontend o el backend restrinja el acceso con `ROLE_CREATOR` o `ROLE_ADMIN`, basado en la autoridad extraída del JWT.
