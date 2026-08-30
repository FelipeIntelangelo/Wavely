# 🎙️ Guía de Presentación - Rol: Creador de Contenido (Podcaster)

> **Contexto:** Defensa de Tesis Universitaria (UTN) - Plataforma **Wavely**.  
> **Formato:** Walkthrough 100% interactivo en la aplicación web en tiempo real (sin slides ni código).  
> **Duración estimada para este rol:** 3 a 4 minutos.

---

## 🎯 Objetivo de la Demostración
Demostrar el ciclo de vida completo de autoría y publicación multimedia: alta de un nuevo canal de podcast con categorización temática, auto-promoción dinámica de rol en el sistema de seguridad, panel centralizado de gestión (*Mis Podcasts*), carga de episodios con extracción de metadatos de audio y disparo automático de notificaciones a la comunidad de seguidores.

---

## 📋 Pre-condiciones antes de comenzar
* Aplicación abierta en el navegador: `http://localhost:4200`
* **Sesión iniciada** con un usuario que creará contenido (o una cuenta con rol creador).
* Tener a mano un archivo de audio ligero (`.mp3`) y una imagen (`.jpg`/`.png`) para la demostración en vivo.
* Backend y base de datos corriendo con el servicio de Cloudinary activo.

---

## 🚀 Paso a Paso de la Exposición

### 📍 Paso 1: Acceso a la Creación de Podcast
* **Qué hacés en pantalla:**
  1. Con la sesión iniciada, señalás el botón **"Crear"** con ícono `+` en la cabecera (o el botón flotante / enlace del Sidebar).
  2. Hacés clic para navegar a la ruta `/create-podcast`.
* **Qué se observa:**
  * Se despliega la pantalla de alta con el formulario reactivo ([PodcastFormComponent](file:///c:/Users/Felipe/Desktop/Projects/podcastUtn/FrontEnd/src/app/pages/podcast-form/podcast-form.ts)): campos de título, descripción, selector de categorías temáticas y área de subida de portada.
* **🗣️ Guión verbal (Qué decir):**
  > *"Cualquier usuario registrado en Wavely tiene la posibilidad de convertirse en creador. Al presionar el botón 'Crear', la plataforma nos traslada al módulo de publicación donde iniciaremos el alta de un nuevo canal de podcast."*

---

### 📍 Paso 2: Creación del Canal y Categorización Temática
* **Qué hacés en pantalla:**
  1. Ingresás un título atractivo (ej. *"Innovación y Futuro Tech"*) y una descripción detallada.
  2. Abrís el **dropdown interactivo de Categorías** y seleccionás múltiples temáticas (ej. *Tecnología* y *Educación*). Mostrás cómo se marcan visualmente con checkboxes y chips.
  3. Hacés clic en la zona de subida de imagen para cargar la portada del podcast.
  4. Probás el **modal de recorte interactivo (`ImageCropperModal`)** ajustando el encuadre 1:1 y confirmás.
  5. Hacés clic en **"Crear Podcast"**.
* **Qué se observa:**
  * La imagen se procesa y se sube asíncronamente a la nube (Cloudinary).
  * El sistema muestra un mensaje de éxito, redirige al Home y, en el backend, el usuario es automáticamente promovido a `ROLE_CREATOR`.
* **🗣️ Guión verbal (Qué decir):**
  > *"El formulario incluye validaciones reactivas en tiempo real, un sistema de categorización temática múltiple para alimentar el motor de recomendaciones, y un cropper integrado en el frontend que garantiza portadas estandarizadas antes de enviarlas al almacenamiento en la nube. Al publicar su primer canal, el backend le otorga dinámicamente al usuario los privilegios de Creador de Contenido."*

---

### 📍 Paso 3: Panel de Gestión "Mis Podcasts" (`/myPodcasts`)
* **Qué hacés en pantalla:**
  1. Abrís el Sidebar y hacés clic en **"Mis Podcasts"** (`/myPodcasts`).
  2. Mostrás la tarjeta del podcast recién creado junto a sus métricas de canal.
* **Qué se observa:**
  * Grilla exclusiva con todos los podcasts de autoría propia.
  * Cada tarjeta exhibe la carátula, título, categorías asociadas, contador de visualizaciones acumuladas y cantidad total de episodios cargados.
  * Acceso directo a los botones de administración: **"Ver"**, **"Editar"** y **"Eliminar"**.
* **🗣️ Guión verbal (Qué decir):**
  > *"El panel 'Mis Podcasts' centraliza el catálogo de autoría del usuario. Desde aquí el podcaster supervisa la tracción de sus programas, accede a métricas de visualizaciones acumuladas y controla el estado de cada uno de sus canales."*

---

### 📍 Paso 4: Ficha de Autor y Permisos Exclusivos (`/podcast/:id`)
* **Qué hacés en pantalla:**
  1. Hacés clic en la tarjeta de tu podcast para abrir su ficha de detalle (`/podcast/:id`).
* **Qué se observa:**
  * Al detectar que el usuario autenticado es el propietario del recurso (`isOwner === true`), la interfaz habilita controles protegidos que un visitante u oyente no ven:
    * Botón **"Editar Podcast"** en la cabecera.
    * Botón **"Agregar Episodio"** destacado sobre la lista de episodios.
    * Botón **"Eliminar Podcast"**.
* **🗣️ Guión verbal (Qué decir):**
  > *"Al ingresar a la ficha del podcast, la interfaz evalúa las políticas de autorización sobre el recurso. Al comprobar que somos los autores, se desbloquean las herramientas de gestión del canal y la posibilidad de incorporar nuevos episodios."*

---

### 📍 Paso 5: Publicación de Episodio y Extracción Multimedia (`/podcast/:id/add-episode`)
* **Qué hacés en pantalla:**
  1. Hacés clic en **"Agregar Episodio"** (`/podcast/:id/add-episode`).
  2. Seleccionás la **Temporada** (ej. *Temporada 1*). Señalás cómo el sistema autocompleta el número de capítulo de forma correlativa.
  3. Ingresás título y descripción del episodio.
  4. En la sección multimedia, arrastrás o seleccionás un archivo de audio `.mp3`.
  5. Mostrás cómo el sistema extrae automáticamente la **duración exacta del audio** en segundos y habilita un **reproductor local de previsualización** para escuchar el archivo antes de subirlo.
  6. Opcionalmente seleccionás una carátula personalizada para el episodio con el cropper.
  7. Hacés clic en **"Publicar Episodio"**.
* **Qué se observa:**
  * Barra de progreso y estado de subida a Cloudinary.
  * Al confirmarse, alerta de éxito y redirección inmediata a la ficha del podcast con el nuevo episodio ya listado en su temporada correspondiente.
* **🗣️ Guión verbal (Qué decir):**
  > *"El módulo de alta de episodios automatiza la experiencia del podcaster: calcula la correlatividad de capítulos por temporada, extrae la duración exacta del audio en el cliente para estructurar la metadata ISO 8601, y ofrece un reproductor de preescucha antes de la confirmación final."*

---

### 📍 Paso 6: Disparo de Notificaciones y Distribución a la Audiencia
* **Qué hacés en pantalla:**
  1. Mencionás (o mostrás con una segunda cuenta/pestaña si aplica) la campanita de notificaciones.
* **Qué se observa:**
  * En el backend, la creación del episodio invocó el `NotificationService`, despachando notificaciones automáticas de tipo `NEW_EPISODE` a todos los usuarios que siguen al creador con la campanita activa.
  * El nuevo contenido impacta de inmediato en el carrusel de **Novedades**, en el **Feed de Seguidos** (`/following`) de los oyentes y en el motor de búsqueda.
* **🗣️ Guión verbal (Qué decir):**
  > *"En el instante en que el episodio se publica, el sistema ejecuta un mecanismo de distribución en cascada: notifica en tiempo real a todos los seguidores que activaron la campana de alertas y disponibiliza el contenido en el feed global y en el catálogo público."*

---

### 📍 Paso 7: Edición de Contenido y Ciclo de Vida (`/podcast/:id/edit` y `/episode/:id/edit`)
* **Qué hacés en pantalla:**
  1. En la ficha del podcast o del episodio, hacés clic en **"Editar"**.
  2. Modificás un campo menor (ej. agregás un tag a la descripción o cambiás el título).
  3. Guardás los cambios.
* **Qué se observa:**
  * Actualización atómica de los datos mediante peticiones `PATCH` / `PUT` al backend.
  * La interfaz refresca la información de inmediato sin pérdida de consistencia en estadísticas ni ratings previos.
* **🗣️ Guión verbal (Qué decir):**
  > *"Tanto los canales como los episodios admiten modificaciones en su ciclo de vida. Los endpoints de actualización permiten ajustar la metadata o el arte de tapa preservando el historial de reproducciones y las calificaciones otorgadas por la comunidad."*

---

### 📍 Paso 8: Integridad Referencial y Reglas de Negocio en Eliminación
* **Qué hacés en pantalla:**
  1. Mostrás los botones de **"Eliminar"** tanto a nivel de episodio individual como a nivel de canal.
  2. Explicás la política de integridad del sistema.
* **Qué se observa:**
  * Para eliminar un episodio: Alerta modal de confirmación irreversible con `AlertService`.
  * Para eliminar un podcast: Regla de negocio que previene el borrado accidental si el podcast aún contiene episodios asociados, garantizando la integridad de datos relacionales en la base de datos.
* **🗣️ Guión verbal (Qué decir):**
  > *"Finalmente, los mecanismos de baja incorporan confirmaciones seguras y reglas de integridad referencial para evitar inconsistencias en la base de datos o eliminaciones no deseadas."*

---

## 🏆 Conceptos Técnicos para Defender ante Preguntas del Tribunal
* **Seguridad y Autorización RBAC:** Rutas de API protegidas mediante `@PreAuthorize("hasRole('ROLE_CREATOR') or hasRole('ROLE_ADMIN')")` combinadas con validación a nivel de servicio para verificar que el `principal` autenticado sea el dueño real de la entidad (`isOwner`).
* **Auto-promoción de Roles:** Lógica transaccional en `PodcastService` que inspecciona los roles de la credencial del usuario y añade `Role.ROLE_CREATOR` al dar de alta su primer canal.
* **Almacenamiento Multimedia Cloud:** Integración desacoplada con Cloudinary para audio e imágenes, almacenando en MySQL únicamente las URLs públicas seguras (`audioPath`, `imageUrl`) y la duración normalizada en formato ISO 8601 (`PT...S`).
* **Arquitectura de Notificaciones:** Desacoplamiento entre la creación del episodio y la generación de alertas para seguidores mediante `NotificationService` y repositorios optimizados para consultas batch de suscriptores.
* **Validación y DTOs:** Uso de `Bean Validation` (`@Valid`, `@NotBlank`, `@Size`) en backend y `FormGroup` con validadores sincrónicos/asincrónicos en Angular.
