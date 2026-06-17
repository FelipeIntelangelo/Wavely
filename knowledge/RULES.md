# Reglas y Pautas del Proyecto (Wavely) 📜

Este archivo contiene las reglas y pautas específicas del proyecto dictadas por el usuario. **Léelo al inicio de cada interacción** para alinear el comportamiento del asistente.

---

## 🚫 1. Comunicación y Respuestas del Asistente
* **No dar instrucciones redundantes de comandos de infraestructura:** No expliques cómo iniciar, detener, resetear, reconstruir o verificar el estado de los contenedores Docker o servidores (ej. `docker-compose up`, `docker-compose down`, `docker-compose logs`, etc.). El usuario ya conoce estos comandos y sus procesos a la perfección. Enfócate exclusivamente en el código y en el problema a resolver para optimizar el consumo de tokens.
* **Pruebas e Inspección de Base de Datos y Contenedores:** No intentes ejecutar comandos para inspeccionar directamente las tablas de la base de datos o el estado interno de los contenedores Docker. En su lugar, solicita al usuario que realice las consultas o pruebas necesarias y te proporcione los resultados.

---

## 🛠️ 2. Estándares Técnicos del Frontend (Angular)
* **Control de Flujo Moderno:** Está estrictamente prohibido usar la directiva estructural deprecada `*ngIf`. Se debe utilizar exclusivamente la sintaxis moderna de control de flujo de Angular (`@if`, `@else`, `@for`, `@switch`).
* **Paginación:** Todos los listados que consuman endpoints paginados del backend deben utilizar la interfaz `PageResponse<T>` (ubicada en `models/page-response.ts`) para tipar la respuesta. Los servicios deben exponer `hasMore$` e `isLoading$` como `Observable` para que los componentes puedan renderizar estados de carga y botones "Ver más" sin lógica duplicada.

---

## 🔐 3. Seguridad de Endpoints (Spring Boot)

### Modelo de seguridad en dos capas

Cada endpoint del backend debe ser evaluado en **ambas** capas de seguridad. Omitir cualquiera de las dos es un error:

| Capa | Dónde | Propósito |
|---|---|---|
| **Capa 1** | `SecurityConfig.java` → bloque `permitAll()` | Controla si Spring Security deja pasar la request sin JWT |
| **Capa 2** | Método del controlador → `@PreAuthorize(...)` | Controla el acceso a nivel de método una vez que hay un Principal |

### Reglas obligatorias

* **Endpoint público (sin JWT):** Debe agregarse al bloque `permitAll()` del `SecurityFilterChain` en `SecurityConfig`. No requiere `@PreAuthorize`.
* **Endpoint autenticado (con JWT obligatorio):** **NO** debe aparecer en el bloque `permitAll()`. **DEBE** tener `@PreAuthorize("isAuthenticated()")` (o un rol específico) en el método del controlador.
* **Nunca** agregar un endpoint al `permitAll()` si requiere identificar al usuario autenticado. Hacerlo deja la ruta abierta a nivel de filtro aunque el método lance una excepción.
* Al crear un nuevo controlador o endpoint, verificar explícitamente en qué categoría cae antes de escribir código.

### Referencia del estado actual de `permitAll()` (GET)

Ver sección correspondiente en `PROJECT_KNOWLEDGE.md` para la lista actualizada.

---

## ☕ 4. Estándares Técnicos del Backend (Spring Boot)
* **Inyección de Dependencias:** Preferir la inyección de dependencias basada en constructor (anotada con `@Autowired` en el constructor) para los controladores.
* **Líneas Separadoras en Controladores:** Utilizar la línea de comentarios `//* ===================================================================================================================` para separar cada método expuesto por el controlador.
* **Documentación con Swagger:** Añadir siempre anotaciones OpenAPI/Swagger (`@Tag` en la clase, `@Operation`, `@ApiResponses`, `@ApiResponse` y `@Parameter`) en todos los endpoints y clases controladoras.
* **Principal de Autenticación:** Utilizar siempre `@AuthenticationPrincipal UserDetails userDetails` en los parámetros de los controladores para recuperar el usuario logueado en lugar de inyectar la entidad `User` directamente, resolviendo el objeto JPA llamando a `userService.getAuthenticatedUser(userDetails.getUsername())`.
* **Manejo de Excepciones en Controladores:** Todo controlador **debe** incluir métodos `@ExceptionHandler` para las excepciones que sus servicios puedan lanzar. No delegar al `GlobalExceptionHandler` genérico excepciones que se conocen de antemano. El patrón estándar es:

```java
//* ===================================================================================================================

@ExceptionHandler(XyzNotFoundException.class)
public ResponseEntity<String> handleXyzNotFound(XyzNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
}

@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
}

@ExceptionHandler(MethodArgumentTypeMismatchException.class)
public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    String errorMessage = "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
}

@ExceptionHandler(Exception.class)
public ResponseEntity<String> handleGeneralException(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
}
```

  Los handlers deben ir **antes** del primer endpoint, separados por la línea divisoria estándar.

---

## 📁 5. Estructura de Paquetes — Backend (Spring Boot / MVC)

El proyecto sigue una arquitectura MVC con las siguientes convenciones fijas. **Respetar esta estructura en todo momento.**

```
src/main/java/podcast/
│
├── PodcastApplication.java           # Clase principal (@SpringBootApplication)
│
├── cfg/                              # Configuraciones de infraestructura y seguridad
│   ├── SecurityConfig.java           # Configuración de Spring Security
│   ├── OpenAPIConfig.java            # Configuración de Swagger / OpenAPI
│   ├── JwtUtil.java                  # Utilidades para generación/validación de JWT
│   ├── JwtAuthFilter.java            # Filtro de autenticación JWT
│   └── WebSocketConfig.java          # Configuración de WebSocket
│
├── controller/                       # Controladores REST (capa de presentación)
│   ├── AuthController.java
│   ├── UserController.java
│   ├── <Entidad>Controller.java      # Un controlador por recurso principal
│   └── GlobalExceptionHandler.java   # @RestControllerAdvice — manejo centralizado de errores
│
└── model/                            # Toda la lógica de dominio y datos
    │
    ├── entities/                     # Entidades JPA (@Entity)
    │   ├── <Entidad>.java
    │   │
    │   ├── dto/                      # DTOs usados en requests y responses
    │   │   ├── <Entidad>DTO.java           # DTO de respuesta/lectura
    │   │   ├── <Entidad>RequestDTO.java    # DTO de creación/entrada
    │   │   └── Update<Entidad>DTO.java     # DTO de actualización (si aplica)
    │   │
    │   ├── enums/                    # Enumeraciones del dominio
    │   │   └── <NombreEnum>.java
    │   │
    │   └── helpers/                  # Clases utilitarias o conversores JPA
    │       └── <NombreConverter>.java
    │
    ├── repositories/                 # Capa de acceso a datos
    │   └── interfaces/               # ⚠️ Los repos van EXCLUSIVAMENTE aquí
    │       └── I<Entidad>Repository.java   # Prefijo I obligatorio
    │
    ├── services/                     # Lógica de negocio (servicios @Service)
    │   └── <Entidad>Service.java
    │
    └── exceptions/                   # Excepciones personalizadas
        └── <Nombre>Exception.java
```

### Reglas de nomenclatura (Backend)

| Artefacto | Convención | Ejemplo |
|---|---|---|
| Controladores | `<Entidad>Controller` | `UserController` |
| Servicios | `<Entidad>Service` | `PodcastService` |
| Repositorios | `I<Entidad>Repository` | `IEpisodeRepository` |
| Entidades JPA | `<Entidad>` (PascalCase) | `EpisodeHistory` |
| DTOs de respuesta | `<Entidad>DTO` | `EpisodeDTO` |
| DTOs de entrada | `<Entidad>RequestDTO` | `CommentaryRequestDTO` |
| DTOs de update | `Update<Entidad>DTO` | `UpdateUserDTO` |
| Enums | `<Nombre>` (PascalCase) | `NotificationType` |
| Excepciones | `<Nombre>Exception` | `UserNotFoundException` |
| Configuraciones | `<Nombre>Config` o `<Nombre>Util` | `SecurityConfig`, `JwtUtil` |

---

## 🖥️ 6. Estructura de Carpetas — Frontend (Angular)

El proyecto Angular sigue una estructura basada en `pages` + `components` + `services` + `models`, sin NgModules. **Respetar esta organización en todo momento.**

```
src/
│
├── index.html                        # Entry point HTML
├── main.ts                           # Bootstrap de la aplicación
├── styles.css                        # Estilos globales
│
├── environments/                     # Variables de entorno por ambiente
│   ├── environment.ts                # Desarrollo
│   └── environment.prod.ts           # Producción
│
├── assets/                           # Recursos estáticos (imágenes, fuentes, íconos)
│
├── api/                              # Scripts de utilidad externos o integraciones
│   └── <nombre>.js
│
└── app/
    │
    ├── app.ts                        # Componente raíz
    ├── app.html                      # Template raíz
    ├── app.css                       # Estilos del componente raíz
    ├── app.routes.ts                 # Definición de rutas
    ├── app.config.ts                 # Configuración de la app (providers, etc.)
    │
    ├── pages/                        # Vistas/pantallas completas (enrutadas)
    │   └── <nombre-pagina>/          # Carpeta por página en kebab-case
    │       ├── <nombre-pagina>.ts
    │       ├── <nombre-pagina>.html
    │       ├── <nombre-pagina>.css
    │       └── <nombre-pagina>.spec.ts
    │
    ├── components/                   # Componentes reutilizables
    │   ├── <nombre-componente>/      # Componentes de feature (ej: header, footer)
    │   │   ├── <nombre>.ts
    │   │   ├── <nombre>.html
    │   │   └── <nombre>.css
    │   └── shared/                   # Componentes transversales (múltiples páginas)
    │       └── <nombre-shared>/
    │           ├── <nombre>.ts
    │           ├── <nombre>.html
    │           └── <nombre>.css
    │
    ├── services/                     # Servicios (lógica de negocio y llamadas HTTP)
    │   └── <dominio>/                # Carpeta por dominio en kebab-case
    │       ├── <dominio>-service.ts
    │       └── <dominio>-service.spec.ts
    │
    └── models/                       # Interfaces y tipos TypeScript
        ├── page-response.ts          # Interfaz genérica de paginación PageResponse<T>
        ├── enums/                    # Enums del frontend
        │   └── <nombre>.enum.ts
        └── <dominio>/                # Carpeta por dominio en kebab-case
            ├── <entidad>.ts              # Interfaz/tipo principal
            ├── <entidad>-dto.ts          # DTO de respuesta
            ├── <entidad>-create-dto.ts   # DTO de creación
            └── <entidad>-update-dto.ts   # DTO de actualización
```

### Reglas de nomenclatura (Frontend)

| Artefacto | Convención | Ejemplo |
|---|---|---|
| Páginas (carpeta) | `kebab-case` | `episode-detail/` |
| Componentes (carpeta) | `kebab-case` | `notification-bell/` |
| Servicios | `<dominio>-service.ts` | `podcast-service.ts` |
| Modelos / DTOs | `<entidad>-dto.ts` | `podcast-dto.ts`, `podcast-create-dto.ts` |
| Enums | `<nombre>.enum.ts` | `role.enum.ts` |
| Interfaces de modelo | `<entidad>.ts` | `podcast.ts`, `user.ts` |
| Archivos de tests | `<nombre>.spec.ts` | `home.spec.ts` |

### Convenciones adicionales (Frontend)

* **`pages/`** → solo componentes enrutados (ligados a una URL). Cada página tiene su propia carpeta.
* **`components/`** → componentes reutilizables entre páginas. Los de uso general van en `components/shared/`.
* **`services/`** → un servicio por dominio, en su propia subcarpeta. Nunca un único archivo de servicio global.
* **`models/`** → las interfaces del dominio se agrupan por carpeta de dominio. El archivo `page-response.ts` es global y se ubica directamente en `models/`.
* **Sin `index.ts` de barrel** por defecto; importar directamente desde el archivo fuente.
