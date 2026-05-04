package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Episode;
import podcast.model.entities.Rating;
import podcast.model.entities.User;

import java.util.Optional;

@Repository
public interface IRatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByUserAndEpisode(User user, Episode episode);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.episode = :episode")
    Double findAverageScoreByEpisode(@Param("episode") Episode episode);
}

