package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.EpisodeHistory;

import java.util.List;
import java.util.Optional;

@Repository
public interface IEpisodeHistoryRepository extends JpaRepository<EpisodeHistory, Long> {
    Optional<EpisodeHistory> findFirstByEpisode_IdAndUser_Id(Long episodeId, Long userId);

    @Query("SELECT eh FROM EpisodeHistory eh WHERE eh.user.id = :userId")
    List<EpisodeHistory> findEpisodesByUserId(@Param("userId") Long userId);

    void deleteByEpisodeId(Long episodeId);
}
