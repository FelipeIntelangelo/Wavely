# Diagrama UML del Proyecto PodcastFront

Este directorio contiene el diagrama de clases UML del proyecto de podcasts.

## 📁 Archivos

- `class-diagram.puml` - Diagrama de clases en formato PlantUML

## 🔍 Descripción del Diagrama

El diagrama UML representa la estructura del modelo de dominio del frontend de la aplicación de podcasts, mostrando:

### Clases Principales

1. **User** (Usuario)
   - Representa a los usuarios de la plataforma
   - Tiene credenciales de acceso
   - Puede crear podcasts, marcar favoritos, comentar y calificar

2. **Podcast**
   - Contenedor principal de episodios
   - Pertenece a un usuario creador
   - Puede tener múltiples categorías
   - Calcula calificación promedio

3. **Episode** (Episodio)
   - Contenido individual dentro de un podcast
   - Tiene audio, descripción y metadata
   - Puede recibir comentarios y calificaciones
   - Rastrea vistas

4. **Commentary** (Comentario)
   - Comentarios de usuarios en episodios
   - Asociado a un usuario y un episodio

5. **Rating** (Calificación)
   - Calificaciones de 1-10 en episodios
   - Asociado a un usuario y un episodio

6. **Credential** (Credencial)
   - Información de autenticación del usuario
   - Email, username, roles

7. **Category** (Categoría - Enum)
   - 20 categorías predefinidas para clasificar podcasts

### Relaciones Clave

- **User ↔ Podcast**: Un usuario crea múltiples podcasts (1:N)
- **User ↔ Podcast**: Relación de favoritos (M:N)
- **Podcast ↔ Episode**: Un podcast contiene múltiples episodios (1:N)
- **Podcast ↔ Category**: Un podcast tiene múltiples categorías (M:N)
- **Episode ↔ Commentary**: Un episodio tiene múltiples comentarios (1:N)
- **Episode ↔ Rating**: Un episodio tiene múltiples calificaciones (1:N)
- **User ↔ Credential**: Un usuario tiene una credencial (1:1)

## 🖼️ Cómo Visualizar el Diagrama

### Opción 1: Extensión de VS Code (Recomendado)

1. Instala la extensión **PlantUML** en VS Code:
   - Abre VS Code
   - Ve a Extensions (Ctrl+Shift+X)
   - Busca "PlantUML"
   - Instala "PlantUML" de jebbs

2. Abre el archivo `class-diagram.puml`

3. Presiona `Alt+D` para ver el preview del diagrama

### Opción 2: Online

1. Visita [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copia el contenido de `class-diagram.puml`
3. Pégalo en el editor online
4. El diagrama se generará automáticamente

### Opción 3: Exportar a Imagen

Con la extensión de PlantUML instalada:

1. Abre `class-diagram.puml`
2. Presiona `Ctrl+Shift+P`
3. Escribe "PlantUML: Export Current Diagram"
4. Selecciona el formato (PNG, SVG, PDF, etc.)

## 📊 Correspondencia con el DER

Este diagrama UML del frontend corresponde al DER (Diagrama Entidad-Relación) de la base de datos:

| DER (Base de Datos) | UML (Frontend) |
|---------------------|----------------|
| users | User + Credential |
| podcasts | Podcast |
| episodes | Episode |
| commentaries | Commentary |
| ratings | Rating |
| categories_x_podcasts | Podcast ↔ Category |
| favorites | User ↔ Podcast (favoritos) |
| user_roles | Credential.roles[] |
| episode_history | Episode.views |

## 🛠️ Tecnologías

- **PlantUML**: Lenguaje de modelado UML basado en texto
- **TypeScript Interfaces**: Los modelos del proyecto están definidos como interfaces TypeScript en `src/app/models/`

## 📝 Notas

- Los atributos privados están marcados con `-`
- Los métodos públicos están marcados con `+`
- Las multiplicidades se indican en las relaciones (1, 0..*, etc.)
- El diagrama refleja la estructura actual del código en `src/app/models/`
