package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Episode;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface IEpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByPodcast_Id(Long podcastId);
    Page<Episode> findByPodcast_Id(Long podcastId, Pageable pageable);
    List<Episode> findByTitleIgnoreCase(String title);
    Page<Episode> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    List<Episode> findByPodcast_IdAndTitleIgnoreCase(Long podcastId, String title);
    void deleteByTitleIgnoreCase(String title);
    List<Episode> findAllByOrderByViewsDesc();        //LISTA UNA CANTIDAD DETERMINADA List<Episode> findTop15ByOrderByViewsDesc();

    @Query(
            value = "SELECT AVG(rating) FROM episode_history WHERE episode_id = :episodeId",
            nativeQuery = true
    )
    Double findAverageRatingByEpisodeId(@Param("episodeId") Long episodeId);
}
