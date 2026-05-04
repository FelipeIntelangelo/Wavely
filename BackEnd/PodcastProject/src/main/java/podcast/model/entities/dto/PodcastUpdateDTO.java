package podcast.model.entities.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import podcast.model.entities.enums.Category;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PodcastUpdateDTO {

    @Size(min = 1, max = 100, message = "Title must be less than 100 characters, and not blank")
    private String title;

    @Size(min = 1, max = 500, message = "Description must be less than 500 characters, and not blank")
    private String description;

    @Pattern(regexp = "^(http|https)://.*$", message = "La URL de la imagen del Podcast debe ser válida")
    private String imageUrl;

    private List<Category> categories;
}