package podcast.model.entities.dto;

import lombok.*;
import podcast.model.entities.enums.Category;
import podcast.model.entities.enums.PlaylistItemType;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlaylistItemDTO {
    private Long id;
    private PlaylistItemType type;
    private Long contentId;
    private String title;
    private String description;
    private String imageUrl;
    private List<Category> categories;
    private Long views;
    private Double rating;
    private String podcastTitle;
    private LocalDateTime addedAt;
}
