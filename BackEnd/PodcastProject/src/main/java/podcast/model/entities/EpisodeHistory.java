package podcast.model.entities;

import jakarta.persistence.*;
import lombok.*;
import podcast.model.entities.dto.EpisodeHistoryDTO;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "EpisodeHistory")
public class EpisodeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listened_at", nullable = false, updatable = false)
    private LocalDateTime listenedAt;

    @PrePersist
    protected void onCreate() {
        this.listenedAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "episode_id", nullable = false)
    private Episode episode;

    public EpisodeHistoryDTO toDTO() {
        return EpisodeHistoryDTO.builder()
                .listenedAt(this.listenedAt)
                .episode(this.episode.toDTO())
                .build();
    }
}
