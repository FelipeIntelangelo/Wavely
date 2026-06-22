package podcast.model.entities.dto;

import lombok.*;

import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FollowStatusDTO {
    @JsonProperty("isFollowing")
    private boolean isFollowing;
    
    @JsonProperty("bellEnabled")
    private boolean bellEnabled;
    
    private Long followersCount;
}
