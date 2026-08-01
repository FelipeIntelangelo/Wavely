package podcast.model.entities.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import podcast.model.entities.enums.PlaylistItemType;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreatePlaylistDTO {

    @NotBlank(message = "El nombre de la playlist es obligatorio")
    @Size(max = 30, message = "El nombre de la playlist no puede superar los 30 caracteres")
    private String name;

    @Size(max = 300, message = "La descripción no puede superar los 300 caracteres")
    private String description;

    private PlaylistItemType itemType;
    private Long itemId;
}
