package podcast.model.entities.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCommentaryDTO {

    @NotBlank(message = "El comentario no puede estar vacío")
    @Size(min = 1, max = 1000, message = "El contenido del comentario debe tener entre 1 y 1000 caracteres")
    private String content;

}
