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
    Page<PlaylistItem> findByPlaylistIdOrderByAddedAtDesc(Long playlistId, Pageable pageable);
    long countByPlaylistId(Long playlistId);
}
