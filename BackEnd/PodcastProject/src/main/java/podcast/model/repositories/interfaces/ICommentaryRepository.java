package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Commentary;

@Repository
public interface ICommentaryRepository extends JpaRepository<Commentary, Long> {
}
