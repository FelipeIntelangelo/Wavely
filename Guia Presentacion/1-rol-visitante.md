# 🎙️ Guía de Presentación - Rol 1: Visitante / No Autenticado (Invitado)

> **Contexto:** Defensa de Tesis Universitaria (UTN) - Plataforma **Wavely**.  
> **Formato:** Walkthrough 100% interactivo en la aplicación web en tiempo real (sin slides ni código).  
> **Duración estimada para este rol:** 2 a 3 minutos.

---

## 🎯 Objetivo de la Demostración
Demostrar la primera impresión de la plataforma: accesibilidad total al catálogo público, diseño responsivo, navegación SPA reactiva y persistencia del streaming de audio en segundo plano sin requerir autenticación previa.

---

## 📋 Pre-condiciones antes de comenzar
* Aplicación abierta en el navegador: `http://localhost:4200`
* **Sesión cerrada** (no haber iniciado sesión con ninguna cuenta).
* Base de datos levantada con podcasts y episodios cargados.

---

## 🚀 Paso a Paso de la Exposición

### 📍 Paso 1: Entrada a la plataforma y Navegación Adaptativa
* **Qué hacés en pantalla:**
  1. Abrís la aplicación en la ruta raíz (`/` o `/home`).
  2. Abrís/cerrás la barra lateral (**Sidebar**) mediante el botón de menú hamburguesa.
* **Qué se observa:**
  * En la cabecera: isotipo de Wavely, buscador integrado y el botón animado **"Iniciar Sesión"**.
  * En el Sidebar: la interfaz es reactiva y **oculta las secciones privadas**, mostrando únicamente accesos a **"Inicio"** y **"Explorar"**.
* **🗣️ Guión verbal (Qué decir):**
  > *"Comenzamos la presentación como un visitante anónimo que ingresa por primera vez a Wavely. La interfaz es completamente reactiva y adapta su menú de navegación según el estado de autenticación, ofreciendo una experiencia limpia y sin fricciones de entrada."*

---

### 📍 Paso 2: El Home y los 5 Carruseles Públicos
* **Qué hacés en pantalla:**
  1. Hacés scroll suave por la pantalla principal.
  2. Señalás brevemente los diferentes bloques.
* **Qué se observa:**
  1. **Tendencias globales:** Recomendaciones públicas basadas en score ponderado (60% vistas + 40% calificación promedio).
  2. **Novedades:** Últimos podcasts dados de alta en el sistema.
  3. **Creadores Destacados:** Cards con foto, nickname y biografía de los podcasters con mayor audiencia.
  4. **Más Escuchados:** Ordenados por volumen de reproducciones.
  5. **Mejores Valorados:** Ordenados por promedio de estrellas comunitarias.
  *(El carrusel de Favoritos permanece oculto al no haber sesión activa).*
* **🗣️ Guión verbal (Qué decir):**
  > *"El Home ofrece múltiples estrategias de descubrimiento para los oyentes: algoritmos de tendencias globales, novedades recientes, creadores destacados y rankings por popularidad y valoración comunitaria."*

---

### 📍 Paso 3: Función "Sorpréndeme" (`dice-roller`)
* **Qué hacés en pantalla:**
  1. En el primer carrusel, hacés clic sobre el **dado 3D** de la primera tarjeta (*"Sorpréndeme"*).
* **Qué se observa:**
  * El dado gira interactivamente y el sistema redirige de inmediato a la ficha de un podcast aleatorio obtenido mediante sorteo ponderado.
* **🗣️ Guión verbal (Qué decir):**
  > *"Incorporamos la función 'Sorpréndeme', un componente lúdico que selecciona un podcast al azar mediante un sorteo ponderado basado en relevancia para quienes buscan contenido nuevo de forma inmediata."*

---

### 📍 Paso 4: Reproductor Flotante Persistente (`FloatingMediaPlayer`)
* **Qué hacés en pantalla:**
  1. Volvés al Home y pasás el cursor sobre la portada de cualquier podcast.
  2. Hacés clic en el botón flotante de **Play** sobre la imagen.
* **Qué se observa:**
  * En la parte inferior de la pantalla se despliega el **Reproductor Flotante**.
  * Se observa la carátula, título del episodio, canal, barra de progreso interactiva (seek bar) y control de volumen.
* **🗣️ Guión verbal (Qué decir):**
  > *"Cualquier visitante puede comenzar a escuchar un podcast con un solo clic. El reproductor multimedia flotante funciona como un servicio global desacoplado de la vista actual."*

---

### 📍 Paso 5: Persistencia del Streaming en Navegación SPA
* **Qué hacés en pantalla:**
  1. **Con la música sonando de fondo**, hacés clic en el Sidebar en **"Explorar"** (`/explore`).
* **Qué se observa:**
  * La vista cambia instantáneamente a las Categorías, pero **el audio continúa reproduciéndose sin cortes, reinicios ni saltos**.
* **🗣️ Guión verbal (Qué decir):**
  > *"Al tratarse de una Single Page Application, la navegación entre rutas no destruye el estado del reproductor, permitiendo al usuario seguir explorando la plataforma mientras disfruta de su episodio."*

---

### 📍 Paso 6: Exploración por Categorías Temáticas (`/explore`)
* **Qué hacés en pantalla:**
  1. Mostrás la grilla visual de categorías con sus colores temáticos.
  2. Hacés clic en una categoría (ej. *Tecnología* o *Educación*).
* **Qué se observa:**
  * Se abre `/explore/:category` mostrando la grilla de todos los podcasts pertenecientes a esa temática.
* **🗣️ Guión verbal (Qué decir):**
  > *"El módulo de exploración organiza el catálogo mediante una taxonomía temática visual que facilita el filtrado y segmentación del contenido."*

---

### 📍 Paso 7: Motor de Búsqueda Global en Tiempo Real
* **Qué hacés en pantalla:**
  1. Escribís un término en el buscador de la cabecera (ej. *"tech"* o el nombre de un creador).
  2. Mostrás el **dropdown instantáneo** con resultados en vivo.
  3. Presionás **Enter** para ir a la página completa de búsqueda (`/search`).
  4. Alternás entre las pestañas de **Podcasts**, **Episodios** y **Usuarios**, y mostrás el botón para ordenar por popularidad.
* **Qué se observa:**
  * Resultados clasificados en tres dimensiones con soporte de paginación e infinite scroll.
* **🗣️ Guión verbal (Qué decir):**
  > *"El motor de búsqueda soporta consultas en tiempo real y categoriza los resultados en tres ejes fundamentales: canales completos, episodios individuales y perfiles de creadores."*

---

### 📍 Paso 8: Ficha de Detalle de Podcast (`/podcast/:id`)
* **Qué hacés en pantalla:**
  1. Hacés clic en un podcast para entrar a su ficha de detalle.
* **Qué se observa:**
  * Portada en alta definición y chips de categorías temáticas.
  * Promedio de estrellas (★) y contador de vistas.
  * Selector de temporadas (*Todos*, *Temporada 1*, *Temporada 2*).
  * Lista cronológica de episodios con metadata.
* **🗣️ Guión verbal (Qué decir):**
  > *"La ficha del podcast centraliza la información del canal: estructuración por temporadas, métricas públicas de audiencia y el catálogo completo de episodios listos para reproducir."*

---

### 📍 Paso 9: Ficha de Episodio y Descripción (`/episode/:id`)
* **Qué hacés en pantalla:**
  1. Hacés clic en un episodio para ver su detalle.
  2. Probás el botón **"Ver más" / "Ver menos"** en la descripción.
  3. Hacés scroll hasta la sección de comentarios de la comunidad.
* **Qué se observa:**
  * La descripción se trunca y expande fluidamente.
  * La caja de comentarios muestra las opiniones públicas de los usuarios.
* **🗣️ Guión verbal (Qué decir):**
  > *"En la vista del episodio, el visitante puede leer las notas del programa y consultar la retroalimentación de la comunidad."*

---

### 📍 Paso 10: Perfil Público del Creador (`/profile/:id`)
* **Qué hacés en pantalla:**
  1. Hacés clic en el nombre o avatar del creador del podcast.
* **Qué se observa:**
  * Foto de perfil, nickname, biografía y grilla de todos los podcasts publicados por dicho autor.
* **🗣️ Guión verbal (Qué decir):**
  > *"Los perfiles de los creadores son abiertos y accesibles, permitiendo conocer su trayectoria, biografía y catálogo completo."*

---

### 📍 Paso 11: La Barrera de Autenticación y Transición a Rol 2
* **Qué hacés en pantalla:**
  1. Intentás presionar un botón protegido: **"Seguir"**, **"Favorito" (corazón)** o intentás escribir un comentario.
  2. Hacés clic en **"Iniciar Sesión"** en la cabecera.
* **Qué se observa:**
  * Se abre el **Modal de Autenticación** sobre la misma pantalla.
  * Muestra el formulario de Login local, alternancia a Registro y el botón de **Google Sign-In (OAuth 2.0)**.
* **🗣️ Guión verbal (Qué decir):**
  > *"El visitante tiene total libertad para descubrir y consumir audio. Sin embargo, al momento de interactuar, valorar o guardar contenido, el sistema activa sus políticas de seguridad invitándolo a autenticarse mediante credenciales locales o Google OAuth. A continuación, iniciaremos sesión para ver la experiencia como Usuario Registrado."*

---

## 🏆 Conceptos Técnicos para Defender ante Preguntas del Tribunal
* **Arquitectura SPA:** Angular Router desacoplado con estado compartido vía servicios Singleton.
* **Streaming Multimedia:** El elemento de audio vive en el servicio `MediaPlayerService`, permitiendo que la navegación por componentes nunca destruya la reproducción.
* **Algoritmo de Recomendación:** Estrategia *Trending* calculada en el backend combinando reproducciones y calificaciones (`0.6 * views + 0.4 * rating`).
* **Seguridad:** Rutas públicas protegidas por `SecurityConfig` en Spring Boot mediante `.permitAll()` en endpoints GET específicos y rechazo 401/403 en acciones transaccionales.
