# Manejo Centralizado de Errores (Error Codes) - Wavely

## Alcance

Este documento describe la arquitectura de manejo de errores implementada en el backend (Spring Boot) y el frontend (Angular) de Wavely. El objetivo fue eliminar el código duplicado de `@ExceptionHandler` disperso en todos los controladores, y establecer un contrato estandarizado entre backend y frontend mediante **códigos de error semánticos** (`errorCode`).

---

## Problema previo

Antes de este refactor:
- Cada controlador (`PodcastController`, `EpisodeController`, etc.) tenía su propio bloque de `@ExceptionHandler` local.
- El backend devolvía strings planos como body de error (ej: `"Podcast with name X already exists"`).
- El frontend usaba `includes()` sobre esos strings en inglés para intentar deducir el tipo de error y mostrar un mensaje en español. Esto era frágil y dependiente del texto exacto del mensaje.

---

## Solución: Error Codes

### Backend

#### `ErrorResponseDTO` — `podcast/model/entities/dto/`

Nuevo record que define el contrato de respuesta de error:

```java
public record ErrorResponseDTO(String errorCode, String message) {}
```

Todos los errores del backend devuelven **exclusivamente** este JSON:
```json
{ "errorCode": "ERR_DUPLICATE_PODCAST", "message": "Podcast with name 'X' already exists" }
```

---

#### `AlreadyCreatedException` — `podcast/model/exceptions/`

Se le agregó un campo `errorCode` y un constructor sobrecargado. El constructor original sin `errorCode` sigue funcionando y asigna el código genérico `ERR_CONFLICT` para no romper compatibilidad.

```java
// Uso nuevo (específico)
throw new AlreadyCreatedException("ERR_DUPLICATE_PODCAST", "Podcast with name X already exists");

// Uso heredado (sin modificar)
throw new AlreadyCreatedException("Mensaje genérico"); // → errorCode = ERR_CONFLICT
```

---

#### `GlobalExceptionHandler` — `podcast/controller/`

Reescrito completamente con `@RestControllerAdvice`. Centraliza **todos** los handlers. Los controladores ya no tienen `@ExceptionHandler` locales.

##### Tabla de Error Codes

| Excepción Java | HTTP Status | `errorCode` |
|---|---|---|
| `AlreadyCreatedException` | `409 CONFLICT` | Usa el campo de la excepción (`ex.getErrorCode()`) |
| `DataIntegrityViolationException` | `409 CONFLICT` | `ERR_CONFLICT` (Evita errores 500 por uniques de DB) |
| `PodcastNotFoundException` | `404 NOT_FOUND` | `ERR_PODCAST_NOT_FOUND` |
| `EpisodeNotFoundException` | `404 NOT_FOUND` | `ERR_EPISODE_NOT_FOUND` |
| `UserNotFoundException` | `404 NOT_FOUND` | `ERR_USER_NOT_FOUND` |
| `PlaylistNotFoundException` | `404 NOT_FOUND` | `ERR_PLAYLIST_NOT_FOUND` |
| `CommentaryNotFoundException` | `404 NOT_FOUND` | `ERR_COMMENT_NOT_FOUND` |
| `PlaylistItemNotFoundException` | `404 NOT_FOUND` | `ERR_PLAYLIST_ITEM_NOT_FOUND` |
| `UnauthorizedException` | `403 FORBIDDEN` | `ERR_FORBIDDEN` |
| `AccessDeniedException` | `403 FORBIDDEN` | `ERR_FORBIDDEN` (Filtros de roles de Spring Security) |
| `AuthenticationException` | `401 UNAUTHORIZED` | `ERR_UNAUTHORIZED` (Error en login/credenciales) |
| `NullUserException` | `400 BAD_REQUEST` | `ERR_NULL_USER` |
| `ChapterOrSeasonInvalidException` | `400 BAD_REQUEST` | `ERR_INVALID_CHAPTER` |
| `PlaylistLimitExceededException` | `400 BAD_REQUEST` | `ERR_PLAYLIST_LIMIT` |
| `IllegalArgumentException` | `400 BAD_REQUEST` | `ERR_INVALID_ARGUMENT` |
| `MethodArgumentNotValidException` | `400 BAD_REQUEST` | `ERR_VALIDATION_FAILED` |
| `MethodArgumentTypeMismatchException` | `400 BAD_REQUEST` | `ERR_TYPE_MISMATCH` |
| `MissingServletRequestPartException`| `400 BAD_REQUEST` | `ERR_MISSING_FILE` (Falta archivo en form) |
| `HttpRequestMethodNotSupportedEx...`| `405 METHOD_NOT_ALLOWED` | `ERR_METHOD_NOT_ALLOWED` (Método HTTP incorrecto) |
| `MaxUploadSizeExceededException` | `413 PAYLOAD_TOO_LARGE` | `ERR_FILE_TOO_LARGE` (Tomcat frena subida pesada) |
| `Exception` (fallback) | `500 INTERNAL_SERVER_ERROR` | `ERR_INTERNAL` |

> **Auditoría:** Solo el handler fallback de `Exception` (500) llama a `errorLogService.audit()` y persiste en la base de datos. Los errores 4xx son errores esperados del negocio y no se auditan.

---

#### Servicios modificados (tabla de `throw`)

| Archivo | `errorCode` asignado |
|---|---|
| `PodcastService.java:42` | `ERR_DUPLICATE_PODCAST` |
| `EpisodeService.java:67` | `ERR_DUPLICATE_EPISODE` |
| `EpisodeService.java:109` | `ERR_DUPLICATE_EPISODE` |
| `PlaylistService.java:141` | `ERR_ITEM_ALREADY_IN_PLAYLIST` |
| `PlaylistService.java:151` | `ERR_ITEM_ALREADY_IN_PLAYLIST` |
| `PlaylistService.java:178` | `ERR_DUPLICATE_PLAYLIST` |
| `UserService.java:84` | `ERR_INVALID_USER_ID` |
| `UserController.java:340` | `ERR_DUPLICATE_USERNAME` |
| `UserController.java:345` | `ERR_DUPLICATE_EMAIL` |

---

### Frontend

#### `ErrorHandlerService` — `services/error/error-handler.service.ts`

Reescrito para eliminar el string matching con `includes()`. Ahora usa un **diccionario declarativo** (`ERROR_CODE_DICTIONARY`) que mapea cada `errorCode` del backend a un mensaje amigable en español.

Prioridad de resolución:
1. `error.error?.errorCode` → busca en el diccionario → mensaje específico.
2. Fallback por HTTP status (`HTTP_STATUS_FALLBACK`) → mensaje genérico por tipo de error.
3. Mensaje genérico absoluto como último recurso.

Para agregar un nuevo mensaje de error en el futuro, solo hay que agregar una línea al diccionario:
```typescript
ERR_NUEVO_CODIGO: 'Mensaje en español para el usuario.',
```

---

## Tests

Se creó `GlobalExceptionHandlerTest.java` en `src/test/java/podcast/controller/` con 6 tests usando **JUnit + MockMvc**.

Técnica usada: `MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler(...))`.

Esto permite simular peticiones HTTP completas sin levantar el contexto de Spring, verificando que el JSON de respuesta tenga la estructura `{ errorCode, message }` correcta y el HTTP status esperado.

Se migró también `PlaylistControllerTest.java` al mismo patrón (los tests anteriores llamaban directamente a métodos locales del controlador que ya no existen).

---

## Extensibilidad futura

- **Multilenguaje (i18n):** El backend solo emite `errorCode`s inmutables. Si en el futuro se agrega soporte para múltiples idiomas, solo hay que reemplazar el diccionario del frontend.
- **Nuevos errores:** Agregar una nueva excepción requiere: (1) un handler en `GlobalExceptionHandler`, (2) una línea en el diccionario del frontend. Nada más.
- **Auditoría de seguridad:** Si se quiere detectar patrones maliciosos (ej. muchos 403 del mismo usuario), eso se implementaría como un sistema de *security auditing* separado, independiente del `ErrorLogService` actual.
