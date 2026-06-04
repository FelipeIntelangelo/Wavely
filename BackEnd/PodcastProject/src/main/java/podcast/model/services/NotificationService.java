package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import podcast.model.entities.*;
import podcast.model.entities.dto.NotificationDTO;
import podcast.model.entities.enums.NotificationType;
import podcast.model.repositories.NotificationRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notify(NotificationType type, User sender, User receiver, Podcast podcast, Episode episode, Commentary commentary, String message) {
        if (sender.getId().equals(receiver.getId())) {
            return; // Don't notify yourself
        }

        Notification notification = Notification.builder()
                .type(type)
                .sender(sender)
                .receiver(receiver)
                .podcast(podcast)
                .episode(episode)
                .commentary(commentary)
                .message(message)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        
        NotificationDTO dto = toDTO(notification);
        
        // Send over WebSocket
        messagingTemplate.convertAndSendToUser(
                receiver.getNickname(), 
                "/queue/notifications", 
                dto
        );
    }

    public void notifyNewEpisode(Episode episode) {
        Podcast podcast = episode.getPodcast();
        User creator = podcast.getUser();
        List<User> subscribers = podcast.getFavoritedBy();

        if (subscribers != null) {
            for (User subscriber : subscribers) {
                String message = "🎙️ " + creator.getNickname() + " publicó un nuevo episodio en " + podcast.getTitle() + ": '" + episode.getTitle() + "'";
                notify(NotificationType.NEW_EPISODE, creator, subscriber, podcast, episode, null, message);
            }
        }
    }

    public List<NotificationDTO> getNotifications(Long userId) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Long countUnread(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByReceiverIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .senderId(notification.getSender().getId())
                .senderName(notification.getSender().getNickname())
                .senderProfilePicture(notification.getSender().getProfilePicture())
                .podcastId(notification.getPodcast() != null ? notification.getPodcast().getId() : null)
                .episodeId(notification.getEpisode() != null ? Long.valueOf(notification.getEpisode().getId()) : null)
                .commentaryId(notification.getCommentary() != null ? Long.valueOf(notification.getCommentary().getId()) : null)
                .build();
    }
}
