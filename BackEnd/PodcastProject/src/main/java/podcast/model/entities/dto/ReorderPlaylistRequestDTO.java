package podcast.model.entities.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReorderPlaylistRequestDTO {
    @NotNull(message = "La lista de IDs no puede ser nula")
    private List<Long> itemIds;
}
