package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.UserFollow;

import java.util.List;
import java.util.Optional;

@Repository
public interface IUserFollowRepository extends JpaRepository<UserFollow, Long> {

    Optional<UserFollow> findByFollowerIdAndFollowedId(Long followerId, Long followedId);

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    List<UserFollow> findByFollowerId(Long followerId);

    List<UserFollow> findByFollowedId(Long followedId);

    List<UserFollow> findByFollowedIdAndBellEnabledTrue(Long followedId);

    Long countByFollowedId(Long followedId);

    Long countByFollowerId(Long followerId);

    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);
}
