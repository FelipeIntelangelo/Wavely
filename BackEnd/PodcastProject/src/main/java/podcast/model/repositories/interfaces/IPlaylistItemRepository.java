package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import podcast.model.entities.PlaylistItem;

import java.util.Optional;

@Repository
public interface IPlaylistItemRepository extends JpaRepository<PlaylistItem, Long> {
    boolean existsByPlaylistIdAndPodcastId(Long playlistId, Long podcastId);
    boolean existsByPlaylistIdAndEpisodeId(Long playlistId, Integer episodeId);
    Optional<PlaylistItem> findByPlaylistIdAndPodcastId(Long playlistId, Long podcastId);
    Optional<PlaylistItem> findByPlaylistIdAndEpisodeId(Long playlistId, Integer episodeId);
    @org.springframework.data.jpa.repository.Query("SELECT i FROM PlaylistItem i WHERE i.playlist.id = :playlistId ORDER BY CASE WHEN i.orderIndex IS NULL THEN 1 ELSE 0 END ASC, i.orderIndex ASC, i.addedAt DESC")
    Page<PlaylistItem> findByPlaylistIdCustomOrder(@org.springframework.data.repository.query.Param("playlistId") Long playlistId, Pageable pageable);

    long countByPlaylistId(Long playlistId);
    void deleteByEpisodeId(Integer episodeId);
    
    java.util.List<PlaylistItem> findByPlaylistIdAndIdIn(Long playlistId, java.util.List<Long> ids);
}
