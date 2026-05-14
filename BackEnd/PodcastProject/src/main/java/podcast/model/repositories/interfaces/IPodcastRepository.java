package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Podcast;
import podcast.model.entities.enums.Category;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface IPodcastRepository extends JpaRepository<Podcast, Long> {
    List<Podcast> findByUser_IdOrTitleIgnoreCaseOrCategories(Integer userId, String title, Category category);
    Page<Podcast> findByUser_IdOrTitleIgnoreCaseOrCategoriesAndIsActiveTrue(Integer userId, String title, Category category, Pageable pageable);
    Page<Podcast> findAllByIsActiveTrue(Pageable pageable);
    List<Podcast> findByUser_Credential_Username(String username);
    boolean existsByUserId(Long id);
}
