package podcast.model.repositories.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import podcast.model.entities.Commentary;
import podcast.model.entities.Notification;

import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);
    Long countByReceiverIdAndIsReadFalse(Long receiverId);
    List<Notification> findByReceiverIdAndIsReadFalse(Long receiverId);
    void deleteByEpisodeId(Long episodeId);
    void deleteByCommentary(Commentary commentary);
    void deleteByCommentaryId(Integer commentaryId);
    void deleteByCommentaryId(Long commentaryId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.commentary.id IN (SELECT c.id FROM Commentary c WHERE c.user.id = :userId)")
    void deleteByCommentaryUserId(@Param("userId") Long userId);
}

