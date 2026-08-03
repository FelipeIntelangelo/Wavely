# 🎙️ PodcastFront - Wavely

Wavely es una plataforma web para descubrir, escuchar y gestionar podcasts. Desarrollada con Angular 20, permite a los usuarios explorar contenido, crear sus propios podcasts, gestionar episodios y disfrutar de una experiencia multimedia completa.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Rutas de la Aplicación](#-rutas-de-la-aplicación)
- [Servicios Principales](#-servicios-principales)
- [Componentes Compartidos](#-componentes-compartidos)
- [Estilos y Temas](#-estilos-y-temas)
- [Notas Adicionales](#-notas-adicionales)
- [Integrantes del proyecto](#-integrantes-del-proyecto)
- [Licencia](#-licencia)

## ✨ Características

### Para Usuarios
- 🔐 **Autenticación**: Sistema de login y registro con validación de formularios
- 🏠 **Home**: Carruseles dinámicos con podcasts destacados (Novedades, Más Escuchados, Mejores Valorados, Favoritos)
- 🔍 **Búsqueda**: Búsqueda avanzada de podcasts y episodios
- 📂 **Categorías**: Exploración por 20 categorías diferentes
- ⭐ **Favoritos**: Sistema de favoritos para guardar podcasts
- 📜 **Historial**: Seguimiento de episodios escuchados
- 👤 **Perfil**: Visualización y edición de perfil de usuario
- 🎵 **Reproductor**: Reproductor de audio flotante para episodios
- 💬 **Comentarios**: Sistema de comentarios en episodios
- ⭐ **Calificaciones**: Sistema de calificación de 1-10 para episodios
- 📋 **Playlists**: Creación y gestión de listas con podcasts y episodios
- 👥 **Seguimiento**: Seguimiento de creadores y consulta de seguidores
- 🔔 **Notificaciones**: Avisos en tiempo real mediante WebSocket
- 🎯 **Recomendaciones**: Contenido personalizado, tendencias y descubrimiento aleatorio

### Para Creadores
- 🎙️ **Crear Podcasts**: Creación de podcasts con imagen, descripción y categorías
- 📝 **Gestionar Episodios**: Agregar, editar y eliminar episodios
- 📊 **Estadísticas**: Visualización de vistas y calificaciones
- ✏️ **Edición**: Edición completa de podcasts y episodios

### Funcionalidades Adicionales
- 🖼️ **Cloudinary**: Integración con Cloudinary para gestión de imágenes, audios y videos
- 🔑 **Google Identity**: Inicio de sesión mediante una cuenta de Google
- 📱 **Responsive**: Diseño adaptable a diferentes tamaños de pantalla
- 🎨 **UI Moderna**: Interfaz con gradientes, efectos glassmorphism y animaciones

## 🛠️ Tecnologías

### Lenguajes de Programacion
- **HTML5** - Maquetado
- **CSS3** - Estilo

### Framework y Librerías Principales
- **Angular 20.3.0** - Framework principal
- **TypeScript 5.9.2** - Lenguaje de programación
- **Angular Router** - Sistema de rutas
- **Angular Forms (Reactive Forms)** - Manejo de formularios
- **RxJS 7.8.0** - Programación reactiva
- **Servicios HTTP** - Consumo de la API REST
- **STOMP.js y SockJS** - Notificaciones en tiempo real

### Servicios Externos
- **Cloudinary 2.8.0** - Almacenamiento y gestión de imágenes/videos/audios
- **Google Identity Services** - Autenticación con Google
- **SweetAlert2 11.26.3** - Alertas y notificaciones

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 20.19 o superior; el contenedor utiliza Node.js 22)
- **npm** (viene incluido con Node.js)

### Verificación

Verifica que las herramientas estén instaladas:

```bash
# Verificar versión de Node.js
node --version

# Verificar versión de npm
npm --version
```

## 🚀 Instalación

1. **Clona el repositorio** (si aplica):
   ```bash
   git clone <url-del-repositorio>
   cd Wavely/FrontEnd
   ```

2. **Instala las dependencias del proyecto**:
   ```bash
   npm install
   ```

3. **Instalación de Angular CLI (Opcional)**:
   
   Este proyecto funciona usando Angular CLI desde `node_modules` al ejecutar los scripts de npm, por lo que no es necesario instalarlo globalmente. Sin embargo, si prefieres tenerlo globalmente:

   ```bash
   # Instalación global
   npm install -g @angular/cli
   
   # Verificar instalación
   ng version
   ```
   
   **Nota**: Puedes usar `npx` para ejecutar comandos de Angular CLI sin instalación global (ej: `npx ng version`).

## ⚙️ Configuración

### Variables de Entorno

El proyecto utiliza los archivos `src/environments/environment.ts` y `src/environments/environment.prod.ts`. Podés tomar `environment.example.ts` como referencia:

```typescript
export const environment = {
  production: false,
  googleClientId: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  cloudinary: {
    cloudName: 'TU_CLOUD_NAME',
    uploadPreset: 'TU_UPLOAD_PRESET',
    apiKey: 'TU_API_KEY'
  },
  wsUrl: 'http://localhost:8080/ws'
};
```

El `uploadPreset` de Cloudinary debe permitir cargas sin firma. No incluyas secretos de Cloudinary en el frontend.

### Proxy Configuration

El proyecto incluye un archivo `proxy.conf.json` para redirigir las peticiones API al backend:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "pathRewrite": {
      "^/api": "/podcastUTN/v1"
    },
    "changeOrigin": true
  }
}
```

**Nota**: Asegúrate de que el backend esté corriendo en `http://localhost:8080` o ajusta la configuración según corresponda.

## 🎯 Uso

### Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm start
```

Esto iniciará la aplicación en `http://localhost:4200`

### Build y testing

```bash
# Generar el build de producción
npm run build

# Ejecutar los tests unitarios
npm test

# Generar builds de desarrollo ante cada cambio
npm run watch
```

### Docker

El frontend incluye un `Dockerfile` multi-stage. El build de Angular se publica mediante Nginx, que también redirige `/api` al backend y conserva el routing de la SPA.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/          # Componentes reutilizables
│   │   ├── footer/         # Pie de página
│   │   ├── header/         # Encabezado
│   │   └── shared/         # Componentes compartidos
│   │       ├── cloudinary-upload/      # Upload de imágenes
│   │       ├── floating-media-player/  # Reproductor de audio
│   │       ├── form-error/            # Mensajes de error
│   │       ├── media-image/           # Imágenes y fallbacks reutilizables
│   │       ├── add-to-playlist/       # Agregado de contenido a playlists
│   │       └── sidebar/               # Barra lateral
│   │
│   ├── models/              # Modelos y DTOs TypeScript
│   │   ├── commentary/     # Modelos de comentarios
│   │   ├── episode/        # Modelos de episodios
│   │   ├── podcast/        # Modelos de podcasts
│   │   ├── rating/         # Modelos de calificaciones
│   │   ├── user/           # Modelos de usuarios
│   │   └── enums/          # Enumeraciones (Category)
│   │
│   ├── pages/              # Páginas/Componentes de rutas
│   │   ├── auth/          # Autenticación (login, register)
│   │   ├── home/          # Página principal
│   │   ├── search/        # Búsqueda
│   │   ├── profile/       # Perfil de usuario
│   │   ├── podcast-detail/ # Detalle de podcast
│   │   ├── episode-detail/ # Detalle de episodio
│   │   ├── create-podcast/ # Crear podcast
│   │   ├── edit-podcast/   # Editar podcast
│   │   ├── add-episode/    # Agregar episodio
│   │   ├── edit-episode/   # Editar episodio
│   │   ├── favorites/      # Favoritos
│   │   ├── history/        # Historial
│   │   ├── playlists/      # Listas de reproducción
│   │   ├── following/      # Creadores seguidos
│   │   ├── followers/      # Seguidores de un perfil
│   │   └── ...            # Otras páginas
│   │
│   ├── services/          # Servicios Angular
│   │   ├── auth/          # Autenticación
│   │   ├── client/        # Servicio de usuarios
│   │   ├── cloudinary/    # Integración Cloudinary
│   │   ├── commentary/    # Servicio de comentarios
│   │   ├── episode/       # Servicio de episodios
│   │   ├── podcast/       # Servicio de podcasts
│   │   ├── media-player/  # Reproductor de audio
│   │   ├── playlist/      # Gestión de playlists
│   │   ├── recommendation/ # Recomendaciones y tendencias
│   │   ├── notification/  # Notificaciones HTTP y WebSocket
│   │   ├── follow/        # Seguimiento de usuarios
│   │   └── ui/            # Servicios de UI (alertas)
│   │
│   ├── app.config.ts      # Configuración de la app
│   ├── app.routes.ts      # Definición de rutas
│   └── app.ts             # Componente raíz
│
├── assets/                # Recursos estáticos (imágenes, etc.)
├── styles.css             # Estilos globales
├── main.ts                # Punto de entrada
└── index.html             # HTML principal
```

## 🗺️ Rutas de la Aplicación

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Home` | Página principal con carruseles |
| `/auth/login` | `Login` | Inicio de sesión |
| `/auth/register` | `Register` | Registro de usuario |
| `/search` | `Search` | Búsqueda de podcasts |
| `/search/:term` | `Search` | Búsqueda con término específico |
| `/profile` | `Profile` | Perfil del usuario actual |
| `/profile/:id` | `Profile` | Perfil de usuario específico |
| `/profile/edit` | `EditProfileComponent` | Editar perfil |
| `/podcast/:id` | `PodcastDetail` | Detalle de podcast |
| `/podcast/:id/edit` | `EditPodcastComponent` | Editar podcast |
| `/podcast/:id/add-episode` | `AddEpisodePage` | Agregar episodio |
| `/episode/:id` | `EpisodeDetail` | Detalle de episodio |
| `/episode/:id/edit` | `EditEpisodePage` | Editar episodio |
| `/create-podcast` | `CreatePodcastComponent` | Crear nuevo podcast |
| `/explore` | `ExploreCategories` | Explorar categorías |
| `/explore/:category` | `CategoryPodcasts` | Podcasts por categoría |
| `/myPodcasts` | `MyPodcasts` | Mis podcasts creados |
| `/favorites` | `FavoritesComponent` | Podcasts favoritos |
| `/history` | `HistoryComponent` | Historial de reproducción |
| `/playlists` | `PlaylistsComponent` | Listas de reproducción del usuario |
| `/following` | `FollowingComponent` | Creadores seguidos por el usuario |
| `/profile/:id/followers` | `FollowersComponent` | Seguidores de un perfil |

Las rutas de perfil propio, creación y edición, favoritos, historial, playlists, seguidos y podcasts propios están protegidas mediante `authGuard`.

## 🔧 Servicios Principales

### AuthService
Maneja la autenticación y el estado de sesión del usuario.

### UserService
Gestiona operaciones relacionadas con usuarios (perfil, favoritos, etc.).

### PodcastService
Operaciones CRUD para podcasts (crear, leer, actualizar, eliminar).

### EpisodeService
Gestión de episodios (crear, editar, eliminar, obtener).

### MediaPlayerService
Control del reproductor de audio flotante.

### AlertService
Muestra alertas y notificaciones usando SweetAlert2.

### CloudinaryService
Integración con Cloudinary para subida de imágenes y archivos multimedia.

### PlaylistService
Gestiona playlists y el contenido agregado a ellas.

### RecommendationService
Obtiene recomendaciones personalizadas, tendencias y contenido aleatorio.

### NotificationService
Consulta notificaciones y mantiene la conexión WebSocket autenticada.

### FollowService
Gestiona el seguimiento de usuarios y las preferencias de notificación.

## 🧩 Componentes Compartidos

### CloudinaryUploadComponent
Componente para subir imágenes a Cloudinary con validación y preview.

### FloatingMediaPlayerComponent
Reproductor de audio flotante que persiste entre páginas.

### FormErrorComponent
Muestra mensajes de error personalizados para formularios.

### SidebarComponent
Barra lateral de navegación.

### Header & Footer
Componentes de encabezado y pie de página.

## 🎨 Estilos y Temas

El proyecto utiliza variables CSS para mantener consistencia:

```css
--primary-color: #9D65D7
--secondary-color: #7c3aed
--background-dark: #050307
```

## 📝 Notas Adicionales

- El sistema de autenticación utiliza **JWT tokens** almacenados en localStorage
- Las imágenes y los archivos multimedia se suben directamente a Cloudinary desde el frontend
- El interceptor HTTP agrega el JWT a las solicitudes protegidas
- Las solicitudes `/api` se redirigen a `/podcastUTN/v1` mediante el proxy de desarrollo o Nginx

## 👥 Integrantes del proyecto

*Nahuel Di Costanzo*
*Felipe Intelangelo*
*Julian Barreiro*

## ⚖️ Licencia

Proyecto académico – Universidad Tecnologica Nacional de Mar del Plata(UTNMdP).
Trabajo práctico final academico para la materia Programacion IV

Este proyecto es parte de un trabajo práctico final academico para la materia Programacion IV de la Universidad Tecnologica Nacional de Mar del Plata(UTNMdP).

---

**Desarrollado con ❤️ usando Angular**

