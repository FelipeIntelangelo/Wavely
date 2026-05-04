package podcast.model.entities.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommentaryDTO {
    private Integer id;
    private String content;
    private String userName;
    private String userProfilePicture;
    private LocalDateTime createdAt;
}
