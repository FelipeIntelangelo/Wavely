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

## ☕ 3. Estándares Técnicos del Backend (Spring Boot)
* **Inyección de Dependencias:** Preferir la inyección de dependencias basada en constructor (anotada con `@Autowired` en el constructor) para los controladores.
* **Líneas Separadoras en Controladores:** Utilizar la línea de comentarios `//* ===================================================================================================================` para separar cada método expuesto por el controlador.
* **Documentación con Swagger:** Añadir siempre anotaciones OpenAPI/Swagger (`@Tag` en la clase, `@Operation`, `@ApiResponses`, `@ApiResponse` y `@Parameter`) en todos los endpoints y clases controladoras.
* **Principal de Autenticación:** Utilizar siempre `@AuthenticationPrincipal UserDetails userDetails` en los parámetros de los controladores para recuperar el usuario logueado en lugar de inyectar la entidad `User` directamente, resolviendo el objeto JPA llamando a `userService.getAuthenticatedUser(userDetails.getUsername())`.

---

## 📁 4. Estándares de Estructura y Nomenclatura del Backend
* **Ubicación de Repositorios:** Todos los repositorios JPA deben ubicarse **exclusivamente** dentro del paquete `model.repositories.interfaces`. Nunca crear archivos de repositorio directamente en `model.repositories` (el paquete raíz).
* **Nomenclatura de Repositorios:** Todos los repositorios deben seguir la convención `I` + `NombreEntidad` + `Repository` (ej: `INotificationRepository`, `IEpisodeRepository`). El prefijo `I` indica que es una interfaz y es **obligatorio**.
* **Paginación en Repositorios:** Los métodos de consulta que devuelvan listas de entidades deben exponer una sobrecarga con `Pageable` que retorne `Page<T>` para soportar paginación. Los controladores deben aceptar los parámetros `@RequestParam(defaultValue = "0") int page` y `@RequestParam(defaultValue = "20") int size`, y devolver `Page<DTO>`.
