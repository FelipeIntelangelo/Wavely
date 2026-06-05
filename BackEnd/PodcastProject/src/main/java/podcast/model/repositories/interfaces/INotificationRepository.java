package podcast.model.repositories.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Notification;

import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);
    Long countByReceiverIdAndIsReadFalse(Long receiverId);
    List<Notification> findByReceiverIdAndIsReadFalse(Long receiverId);
}
