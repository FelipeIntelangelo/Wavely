package podcast.model.entities.dto;

import lombok.*;
import podcast.model.entities.enums.NotificationType;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private NotificationType type;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;

    // Sender Info
    private Long senderId;
    private String senderName;
    private String senderProfilePicture;

    // Context IDs
    private Long podcastId;
    private Long episodeId;
    private Long commentaryId;
}
