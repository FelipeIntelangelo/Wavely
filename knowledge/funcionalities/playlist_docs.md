# Playlists mixtas - Wavely

## Alcance

Las playlists son privadas y pertenecen al usuario autenticado. Pueden contener podcasts completos y episodios individuales en una misma lista. Agregar un podcast no agrega automáticamente sus episodios.

Cada usuario puede tener como máximo **20 playlists**. La validación se realiza en backend dentro de una transacción y bloquea la fila del usuario durante la creación para impedir que solicitudes simultáneas superen el límite.

Los elementos se muestran por fecha de agregado descendente. No existe todavía orden manual ni atributo `position`; esto no impide aplicar en el futuro filtros por categoría o tipo y ordenamientos automáticos por título, vistas o valoración.

## Modelo

- `Playlist`: nombre único por usuario, descripción opcional, propietario y fechas de creación/actualización.
- `PlaylistItem`: referencia a la playlist, fecha de agregado y exactamente una referencia de contenido: `podcast` o `episode`.
- Se impiden podcasts o episodios repetidos dentro de una misma playlist.
- El esquema SQL necesario está en `BackEnd/PodcastProject/src/main/resources/playlist-schema.sql` porque Hibernate utiliza `ddl-auto=none`.

## API

Todos los endpoints requieren JWT y `@PreAuthorize("isAuthenticated()")`.

```text
GET    /podcastUTN/v1/playlists
GET    /podcastUTN/v1/playlists/{playlistId}?page=0&size=20
POST   /podcastUTN/v1/playlists
PATCH  /podcastUTN/v1/playlists/{playlistId}
DELETE /podcastUTN/v1/playlists/{playlistId}

POST   /podcastUTN/v1/playlists/{playlistId}/podcasts/{podcastId}
DELETE /podcastUTN/v1/playlists/{playlistId}/podcasts/{podcastId}
POST   /podcastUTN/v1/playlists/{playlistId}/episodes/{episodeId}
DELETE /podcastUTN/v1/playlists/{playlistId}/episodes/{episodeId}
```

`POST /playlists` admite opcionalmente `itemType` (`PODCAST` o `EPISODE`) e `itemId`. Si se envían, la creación de la playlist y el agregado inicial ocurren en la misma transacción.

El detalle retorna los elementos como `Page<PlaylistItemDTO>`. El tamaño de página predeterminado es 20 y el máximo permitido por solicitud es 100. Los conflictos por límite, nombres duplicados o restricciones de integridad retornan `409 Conflict`.

## Frontend

- `AddToPlaylistComponent` es el selector compartido usado desde podcasts y episodios.
- Permite elegir una playlist existente o crear una nueva y agregar el contenido en el momento.
- `/playlists` permite crear, listar y eliminar playlists, abrir sus contenidos, quitar elementos y cargar páginas adicionales mediante "Ver más".
- El acceso a `/playlists` aparece en el sidebar solo para usuarios autenticados.
