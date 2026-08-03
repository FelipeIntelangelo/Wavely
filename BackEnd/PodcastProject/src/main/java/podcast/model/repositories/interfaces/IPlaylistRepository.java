package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.Playlist;

import java.util.List;
import java.util.Optional;

@Repository
public interface IPlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<Playlist> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long id);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
