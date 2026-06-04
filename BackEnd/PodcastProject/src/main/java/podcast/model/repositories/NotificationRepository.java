package podcast.model.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Notification;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    Long countByReceiverIdAndIsReadFalse(Long receiverId);
    List<Notification> findByReceiverIdAndIsReadFalse(Long receiverId);
}
