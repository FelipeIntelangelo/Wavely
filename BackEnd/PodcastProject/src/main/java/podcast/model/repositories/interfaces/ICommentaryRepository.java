package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Commentary;
import java.util.List;

@Repository
public interface ICommentaryRepository extends JpaRepository<Commentary, Long> {
    List<Commentary> findByEpisodeIdOrderByCreatedAtDesc(Long episodeId);
    void deleteByUserId(Long userId);
}
