# Soft Delete e Integridad Referencial (Usuarios)

## Problema de Diseño Original
Inicialmente se había planificado realizar un "Hard Delete" (borrado físico mediante `userRepository.delete(user)`) con cascada de tipo `CascadeType.REMOVE` hacia todas las entidades dependientes del usuario (playlists, likes, historial, followers). 

Sin embargo, surgió un **cuello de botella de integridad referencial**: si un usuario tenía un Podcast inactivo (Soft Deleted) e intentaba eliminar su cuenta, el motor de la base de datos abortaría la operación debido a que el podcast inactivo mantenía una `foreign key` hacia el `user_id`. Eliminar el podcast inactivo tampoco era factible, ya que requeriría eliminar físicamente sus episodios, lo cual a su vez rompería las `foreign keys` en los historiales de reproducción (`EpisodeHistory`) y `Playlists` de **otros** usuarios de la plataforma.

## Solución Implementada: Modelo Híbrido (Soft Delete + Hard Delete Selectivo)
Se optó por un modelo híbrido basado en las mejores prácticas de la industria (GDPR compliant) para evitar mutaciones destructivas en las bases de datos de otros usuarios:

1. **Hard Delete Selectivo (Basura y Asociaciones menores)**
   En lugar de depender de Hibernate (`CascadeType.REMOVE`), el servicio `UserService.java` ahora inyecta los repositorios individuales (`IPlaylistRepository`, `ICommentaryRepository`, `IRatingRepository`, `IEpisodeHistoryRepository`, `IUserFollowRepository`) y realiza un borrado físico de la data dependiente del usuario. Esto limpia la base de datos de "likes fantasmas", listas de reproducción sin dueño o historiales huérfanos.

2. **Soft Delete y Anonimización (Entidad Principal)**
   En lugar de eliminar la fila de `User`, la cuenta se transforma en un **Usuario Fantasma**:
   - `name` y `lastName` pasan a ser "Usuario Eliminado".
   - `bio` y `profilePicture` se vacían.
   - `email` y `username` se sobreescriben a un identificador único (ej: `deleted_12345@wavely.com` y `deleted_12345`), liberando el correo electrónico y nombre de usuario reales para permitir que la persona se vuelva a registrar desde cero si así lo desea.
   - `password` se sobreescribe con un UUID aleatorio encriptado, imposibilitando un futuro login.

3. **Restricción de Borrado Activo**
   El borrado (anonimización) se bloquea explícitamente mediante la excepción `CannotDeleteOwnerException` solo si el usuario es dueño de **al menos un Podcast Activo**. Si sus podcasts se encuentran inactivos (`isActive = false`), se le permite continuar, y su cuenta anonimizada servirá como "nodo contenedor" para sostener dichos podcasts inactivos sin violar constraints de SQL.

## Archivos Clave Modificados
- `User.java`: Se removieron los `CascadeType.REMOVE` introducidos temporalmente.
- `UserService.java`: Se rediseñaron los métodos `deleteAuthenticatedUser` y `deleteUserById` extrayendo la lógica a `performSoftDeleteAndCleanup`.
- Interfaces `I...Repository`: Se añadieron métodos para soportar el borrado directo a partir de llaves foráneas (`deleteByUserId`, `deleteByFollowerId`, etc.).
- `IPodcastRepository`: Se añadió el método `existsByUserIdAndIsActiveTrue`.
