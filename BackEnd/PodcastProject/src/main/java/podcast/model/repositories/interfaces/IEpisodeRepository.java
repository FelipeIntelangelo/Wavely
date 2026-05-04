package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Episode;

import java.util.List;

@Repository
public interface IEpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByPodcast_Id(Long podcastId);
    List<Episode> findByTitleIgnoreCase(String title);
    List<Episode> findByPodcast_IdAndTitleIgnoreCase(Long podcastId, String title);
    void deleteByTitleIgnoreCase(String title);
    List<Episode> findAllByOrderByViewsDesc();        //LISTA UNA CANTIDAD DETERMINADA List<Episode> findTop15ByOrderByViewsDesc();

    @Query(
            value = "SELECT AVG(rating) FROM episode_history WHERE episode_id = :episodeId",
            nativeQuery = true
    )
    Double findAverageRatingByEpisodeId(@Param("episodeId") Long episodeId);
}
