package podcast.model.entities.dto;

import lombok.Builder;
import lombok.Data;
import podcast.model.entities.Rating;

import java.time.LocalDateTime;

@Data
@Builder
public class EpisodeHistoryDTO {
    private LocalDateTime listenedAt;
    private EpisodeDTO episode;
}