# 🎙️ Guía de Presentación - Apertura: Landing Page & Introducción Técnica

> **Contexto:** Defensa de Trabajo Final Integrador — **Wavely** (UTN FRMDP).  
> **Carrera:** Tecnicatura Universitaria en Programación (TUP) · 2026.  
> **Ubicación:** `http://localhost:4200/landing`  
> **Duración estimada:** 2 a 3 minutos.  
> **Formato:** Exposición ágil y visual guiada por la landing page antes de pasar a la demo interactiva.

---

## 🎯 Objetivo de esta Sección
Introducir el proyecto ante el tribunal evaluador, presentar al equipo, justificar la elección de la temática (salir de la zona de confort del CRUD básico) y repasar la arquitectura técnica, el motor de recomendación y el modelo de roles de forma conceptual.

---

## 🚀 Paso a Paso de la Exposición

### 📍 Paso 1: Apertura y Motivación *(Sección Hero)*
* **Qué se ve en pantalla:**
  * Título: *"Todo lo que Querés Escuchar, en un Solo Lugar"*.
  * Insignia institucional de la **UTN FRMDP · TUP**.
  * Carrusel interactivo automático con las fotos del equipo (**Felipe**, **Julián**, **Nahuel**).
* **💡 Puntos clave para hablar (con tus palabras):**
  * **Presentación personal y del equipo:** Nombre de los tres integrantes y mención del Trabajo Final de TUP.
  * **La motivación central:** 
    * No queríamos presentar el típico proyecto universitario de 3 formularios CRUD de base de datos.
    * Buscamos salir de la zona de confort y plantearnos desafíos de software más complejos: **streaming de audio continuo**, **procesamiento multimedia en la nube**, **notificaciones en tiempo real** y **recomendación algorítmica**.
* **Acción:** Clic en la flecha inferior $\downarrow$ para deslizar a la siguiente sección.

---

### 📍 Paso 2: Arquitectura y Stack Tecnológico *(Sección Arquitectura)*
* **Qué se ve en pantalla:**
  * Grid de 6 tecnologías estructuradas en 2 capas (Backend / Frontend).
* **💡 Puntos clave para hablar:**
  * **Fila 1 — Backend, Datos y Seguridad:**
    * **Spring Boot 3.5 (Java 21):** API RESTful modular, controlador global de excepciones con `ErrorCode` tipados.
    * **MySQL & Docker (Hibernate / JPA):** Base relacional normalizada con *soft-delete* híbrido y anonimización de datos sensibles para no romper integridad referencial.
    * **Seguridad Dual (Spring Security):** Autenticación stateless con JWT local + Google OAuth 2.0 y control de acceso por roles (RBAC).
  * **Fila 2 — Frontend, Tiempo Real y Cloud:**
    * **Angular 20:** Single Page Application basada en componentes Standalone con **reproductor multimedia desacoplado** (el audio no se corta al navegar).
    * **WebSockets / STOMP:** Notificaciones instantáneas push a usuarios sin recurrir a peticiones periódicas (polling).
    * **Cloudinary CDN:** Almacenamiento desacoplado en la nube para audios MP3 y portadas de alta resolución.
* **Acción:** Clic en la flecha inferior $\downarrow$.

---

### 📍 Paso 3: Motor de Recomendación Híbrido *(Sección Recomendación)*
* **Qué se ve en pantalla:**
  * Diagrama del pipeline de 3 capas con la fórmula de scoring.
* **💡 Puntos clave para hablar:**
  * **El desafío técnico:** Resolver el problema del *Cold Start* (qué recomendarle a un usuario nuevo sin historial) y personalizar progresivamente.
  * **Las 3 Capas:**
    1. **Capa 1 — Trending (0 Favoritos):** Para visitantes y cuentas nuevas. Se calcula directamente en base de datos:
       $$\text{Score} = (0.60 \times \text{Reproducciones}) + (0.40 \times \text{Calificación})$$
    2. **Capa 2 — Content-Based (1 a 5 Favoritos):** Cruza la taxonomía de categorías de los canales guardados para sugerir contenido temáticamente afín.
    3. **Capa 3 — Filtrado Colaborativo (> 5 Favoritos):** Minería de afinidad comunitaria (recomienda podcasts que escuchan otros usuarios con gustos similares).
* **Acción:** Clic en la flecha inferior $\downarrow$.

---

### 📍 Paso 4: Jerarquía de Roles *(Sección Roles)*
* **Qué se ve en pantalla:**
  * Cadena horizontal conectada: $\text{Visitante} \rightarrow \text{Usuario} \rightarrow \text{Creador} \rightarrow \text{Administrador}$.
* **💡 Puntos clave para hablar:**
  * **Modelo Progresivo / Acumulativo:** Cada rol hereda el 100% de las funciones del anterior y desbloquea módulos diferenciales.
    * **Visitante:** Catálogo público, buscador global y streaming libre.
    * **Usuario:** Favoritos, playlists mixtas (podcasts + episodios), historial con reanudación y valoraciones.
    * **Creador:** Panel de autoría "Mis Podcasts", subida y recorte de portadas, publicación de episodios y emisión de notificaciones.
    * **Administrador:** **Moderación in-situ** (puede editar o dar de baja contenido directamente sobre las vistas estándar gracias al override global de permisos, sin necesidad de un panel aislado).
* **Acción:** Clic en la flecha inferior $\downarrow$.

---

### 📍 Paso 5: Cierre y Pase a la Demo Práctica *(Sección Launch)*
* **Qué se ve en pantalla:**
  * Encabezado *"Demostración Práctica"*.
  * Botón principal **"Iniciar Recorrido"**.
  * Créditos: *UTN FRMDP · Tecnicatura Universitaria en Programación (TUP) · 2026*.
* **💡 Frase de pase a la acción:**
  > *"Habiendo repasado los fundamentos técnicos y la arquitectura de la plataforma, pasamos ahora a la demostración práctica en vivo comenzando por el Rol 1 (Visitante)."*
* **Acción:** Clic en **"Iniciar Recorrido"** para entrar a `http://localhost:4200/home` y continuar con la guía [1-rol-visitante.md](file:///c:/Users/Felipe/Desktop/Projects/podcastUtn/Guia%20Presentacion/1-rol-visitante.md).
