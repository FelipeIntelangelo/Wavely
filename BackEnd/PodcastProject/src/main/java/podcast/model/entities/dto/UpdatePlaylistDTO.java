package podcast.model.entities.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdatePlaylistDTO {

    @Size(max = 30, message = "El nombre de la playlist no puede superar los 30 caracteres")
    private String name;

    @Size(max = 300, message = "La descripción no puede superar los 300 caracteres")
    private String description;
}
