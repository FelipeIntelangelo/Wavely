# Guía de Testing Exhaustivo: Sistema de Errores de Wavely

Este documento detalla el plan de pruebas para asegurar que **ningún error crudo (raw error)** llegue al usuario final. Se analizan todas las capas de la aplicación, identificando qué deberías probar y qué posibles "agujeros" (edge cases) podrían quedar.

## 1. Casos de Negocio (Conflictos - 409)
El objetivo de estas pruebas es validar que las restricciones de negocio devuelven los mensajes amigables definidos en nuestro diccionario frontend.

- [ ] **Podcast Duplicado:** Creá un podcast, copiá su título exacto, e intentá crear otro igual.
  *Resultado esperado:* "Ya existe un podcast con este título."
- [ ] **Episodio Duplicado:** En un podcast, intentá crear un episodio con un número o título que ya existe en esa misma temporada.
  *Resultado esperado:* "Ya existe un episodio con ese título en este podcast."
- [ ] **Playlist Duplicada:** Creá una playlist, copiá el nombre e intentá crear otra igual.
  *Resultado esperado:* "Ya existe una playlist con ese nombre."
- [ ] **Registro Usuario Existente (Username):** Registrá una cuenta con un username que ya sepas que existe.
  *Resultado esperado:* "El nombre de usuario ya se encuentra en uso."
- [ ] **Registro Usuario Existente (Email):** Registrá una cuenta con un email existente (podés probar intentar crear con clave un email que ya entró por Google).
  *Resultado esperado:* "El correo electrónico ya está registrado. Si usaste Google, iniciá sesión directamente."

---

## 2. Casos de Recursos Inexistentes (Not Found - 404)
El objetivo es forzar búsquedas de recursos borrados o IDs manipulados.

- [ ] **Podcast Borrado:** Entrá al detalle de un podcast que acabás de borrar o cambiá el ID en la URL a `99999`.
  *Resultado esperado:* Redirección visual o cartel "El podcast solicitado no existe."
- [ ] **Episodio Borrado:** Hacé lo mismo con un episodio.
  *Resultado esperado:* "El episodio solicitado no existe."
- [ ] **Endpoint Inexistente:** Intentá acceder a una URL de la API que no existe (ej. `/podcastUTN/v1/dsfsdfsdf`).
  *Resultado esperado:* Fallback `404` genérico: "El recurso solicitado no fue encontrado."

---

## 3. Seguridad y Permisos (401 y 403)
Acá probamos cómo actúa Spring Security frente a manipulaciones de tokens y permisos.

- [ ] **Token Expirado/Manipulado:** Inciá sesión, abrí el DevTools -> Application -> LocalStorage, y borrá algunas letras del token JWT. Refrescá la página e intentá hacer una acción.
  *Resultado esperado:* "Credenciales incorrectas o tu sesión ha expirado" y deberías ser deslogueado.
- [ ] **Falta de Permisos:** Usando una cuenta normal (no Admin, si la jerarquía existe), intentá hacer una petición HTTP directa con Postman a un endpoint de borrado de un podcast ajeno.
  *Resultado esperado:* JSON con `ERR_FORBIDDEN` y el frontend (si llega a llamarlo por error) mostrará "No tenés permisos para realizar esta acción."

---

## 4. Validaciones de Datos (Bad Request - 400)
Forzamos a que el sistema rechace entradas por problemas de formato o validación pura.

- [ ] **Campos Vacíos:** Con Postman (porque el frontend probablemente bloquea el botón "Guardar"), intentá mandar un payload para crear un podcast sin el campo `title`.
  *Resultado esperado:* El backend lanza `MethodArgumentNotValidException`, el GlobalExceptionHandler escupe `ERR_VALIDATION_FAILED`, el frontend dice: "Verificá que todos los campos estén completos y sean correctos."
- [ ] **Límite de Playlists:** Creá 20 playlists (el máximo) con un script o a mano, e intentá crear la número 21.
  *Resultado esperado:* "Alcanzaste el límite máximo de playlists."
- [ ] **Tipos de Datos (Type Mismatch):** En una URL que espera un número (ej. `/podcasts/1`), pasale texto (`/podcasts/TEXTO`).
  *Resultado esperado:* `ERR_TYPE_MISMATCH` -> "Uno de los valores enviados tiene un formato incorrecto."

---

## 5. Posibles "Agujeros" a vigilar (Edge Cases de Infraestructura)

Acá están los casos donde Spring Boot/Nginx pueden llegar a esquivar nuestro `GlobalExceptionHandler` si no somos cuidadosos.

> [!WARNING]
> **Archivos muy pesados (Payload Too Large):** Si intentás subir un audio de 500MB y el servidor de Spring Boot (Tomcat) tiene configurado un máximo de, digamos, 50MB, Tomcat tirará una `MaxUploadSizeExceededException` **antes** de llegar al controlador.
> - **Riesgo:** Si esa excepción no está en el `GlobalExceptionHandler`, caerá en el error 500 (`ERR_INTERNAL`). Si te pasa y querés ser más preciso, deberías agregar explícitamente `MaxUploadSizeExceededException` al GlobalExceptionHandler devolviendo un `ERR_FILE_TOO_LARGE`.

> [!NOTE]
> **Falta el archivo (MissingServletRequestPartException):** Si un endpoint de formulario `multipart/form-data` requiere obligatoriamente una foto o audio, y el request se envía vacío.
> - **Situación actual:** Caen en el genérico de Fallback o 500 `ERR_INTERNAL`. No exponen código fuente, pero el mensaje para el usuario es muy genérico ("Ocurrió un error en el servidor"). Si notas esto seguido, podés sumarlo al Handler para devolver un `400 BAD REQUEST` con un `ERR_MISSING_FILE`.

> [!IMPORTANT]
> **Servidor Abajo (Status 0):** Probá apagar tu backend (el de Java) desde la terminal de comandos y, con el frontend levantado, hacé click en un botón para cargar data.
> - **Resultado esperado:** Ahora deberías ver el mensaje que agregamos recientemente: *"No se pudo conectar con el servidor. Revisá tu conexión a internet o intentá más tarde."*

---

## Recomendación de recorrido (Flujo de vida del usuario):
Para testearlo eficientemente hoy, seguí este "Happy Path Inverso" (rompiendo cosas a propósito):
1. Abrí la web, poné mal el pass 3 veces (Test 401).
2. Logueate con éxito. Registrá otra cuenta con la misma info (Test 409).
3. Entrá a tu perfil. Creá un podcast. Creá otro igual (Test 409).
4. Borrá ese podcast. Apretá el botón "atrás" en el navegador para volver a su detalle y comentá (Test 404).
5. Desconectá el backend o apagá tu WiFi y refrescá la página o apretá un botón (Test Status 0).
