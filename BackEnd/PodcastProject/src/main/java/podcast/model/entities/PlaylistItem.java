package podcast.model.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
        name = "PlaylistItems",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"playlist_id", "podcast_id"}),
                @UniqueConstraint(columnNames = {"playlist_id", "episode_id"})
        }
)
public class PlaylistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "podcast_id")
    private Podcast podcast;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id")
    private Episode episode;

    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        boolean hasPodcast = podcast != null;
        boolean hasEpisode = episode != null;
        if (hasPodcast == hasEpisode) {
            throw new IllegalStateException("Un elemento debe referenciar un podcast o un episodio, pero no ambos");
        }
        addedAt = LocalDateTime.now();
    }
}
