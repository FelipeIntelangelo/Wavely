package podcast.model.entities.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserFollowDTO {
    private Long followedUserId;
    private String followedNickname;
    private String followedProfilePicture;
    private boolean bellEnabled;
    private LocalDateTime followedSince;
    private Long followersCount;
}
