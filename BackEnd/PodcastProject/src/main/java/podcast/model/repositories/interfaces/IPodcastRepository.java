package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Podcast;
import podcast.model.entities.enums.Category;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface IPodcastRepository extends JpaRepository<Podcast, Long> {
    @Query("SELECT p FROM Podcast p WHERE p.isActive = true AND " +
           "(:userId IS NULL OR p.user.id = :userId) AND " +
           "(:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:category IS NULL OR :category MEMBER OF p.categories) " +
           "ORDER BY p.createdAt DESC, p.id DESC")
    Page<Podcast> findFilteredPodcasts(@Param("userId") Integer userId, 
                                       @Param("title") String title, 
                                       @Param("category") Category category, 
                                       Pageable pageable);

    @Query("SELECT p FROM Podcast p WHERE p.isActive = true AND " +
           "(:userId IS NULL OR p.user.id = :userId) AND " +
           "(:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:category IS NULL OR :category MEMBER OF p.categories) " +
           "ORDER BY p.createdAt DESC, p.id DESC")
    List<Podcast> findFilteredPodcastsList(@Param("userId") Integer userId, 
                                           @Param("title") String title, 
                                           @Param("category") Category category);

    Page<Podcast> findAllByIsActiveTrue(Pageable pageable);
    List<Podcast> findByUser_Credential_Username(String username);
    boolean existsByUserId(Long id);
}
