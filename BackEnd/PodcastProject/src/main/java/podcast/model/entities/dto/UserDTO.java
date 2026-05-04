package podcast.model.entities.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String nickname;
    private String profilePicture;
    private String bio;
}