package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import podcast.model.entities.*;
import podcast.model.entities.dto.NotificationDTO;
import podcast.model.entities.enums.NotificationType;
import podcast.model.repositories.interfaces.INotificationRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    @Autowired
    private INotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Lazy
    @Autowired
    private UserFollowService userFollowService;

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
        
        // Send over WebSocket — uses credential username to match the authenticated STOMP Principal
        messagingTemplate.convertAndSendToUser(
                receiver.getCredential().getUsername(),
                "/queue/notifications",
                dto
        );
    }

    public void notifyNewEpisode(Episode episode) {
        Podcast podcast = episode.getPodcast();
        User creator = podcast.getUser();

        Set<Long> notifiedUserIds = new HashSet<>();

        // 1. Notificar a los que tienen el podcast en favoritos (comportamiento existente)
        List<User> subscribers = podcast.getFavoritedBy();
        if (subscribers != null) {
            for (User subscriber : subscribers) {
                String message = creator.getNickname() + " publicó un nuevo episodio en " + podcast.getTitle() + ": '" + episode.getTitle() + "'";
                notify(NotificationType.NEW_EPISODE, creator, subscriber, podcast, episode, null, message);
                notifiedUserIds.add(subscriber.getId());
            }
        }

        // 2. Notificar a los seguidores con campanita activa del creador (sin duplicar)
        List<User> bellFollowers = userFollowService.getFollowersWithBell(creator.getId());
        for (User follower : bellFollowers) {
            if (!notifiedUserIds.contains(follower.getId())) {
                String message = creator.getNickname() + " publicó un nuevo episodio: '" + episode.getTitle() + "'";
                notify(NotificationType.NEW_EPISODE, creator, follower, podcast, episode, null, message);
            }
        }
    }

    public Page<NotificationDTO> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDTO);
    }

    public Long countUnread(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId, Long requestingUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getReceiver().getId().equals(requestingUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tienes permiso para modificar esta notificación"
            );
        }
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
