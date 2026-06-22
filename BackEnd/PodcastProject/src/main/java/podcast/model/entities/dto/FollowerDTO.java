package podcast.model.entities.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FollowerDTO {
    private Long followerUserId;
    private String followerNickname;
    private String followerProfilePicture;
    private LocalDateTime followedSince;
    private Long followersCount;
}
