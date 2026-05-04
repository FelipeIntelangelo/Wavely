package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Podcast;
import podcast.model.entities.enums.Category;

import java.util.List;

@Repository
public interface IPodcastRepository extends JpaRepository<Podcast, Long> {
    List<Podcast> findByUser_IdOrTitleIgnoreCaseOrCategories(Integer userId, String title, Category category);
    List<Podcast> findByUser_Credential_Username(String username);
    boolean existsByUserId(Long id);
}
