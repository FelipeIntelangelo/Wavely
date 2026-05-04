package podcast.model.entities.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateEpisodeDTO {

    @Size(min = 3, max = 50, message = "El título debe tener entre 3 y 100 caracteres")
    private String title;

    @Size(min = 5, max = 500, message = "La descripción debe tener entre 5 y 500 caracteres")
    private String description;

    @Pattern(
        regexp = "^(http|https)://.*$",
        message = "La URL de la imagen del episodio debe ser válida"
    )
    private String imageUrl;
}
