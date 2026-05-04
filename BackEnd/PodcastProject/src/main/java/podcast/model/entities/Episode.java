package podcast.model.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import podcast.model.entities.dto.EpisodeDTO;
import podcast.model.entities.dto.UpdateEpisodeDTO;
import podcast.model.entities.helpers.DurationConverter;
import podcast.model.entities.helpers.DurationFromStringDeserializer;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@ToString
@Builder
@Table(name = "Episodes")

public class Episode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    @NotBlank
    @Size(min = 3, max = 50, message = "the title must have between 3 and 50 characters")
    private String title;

    @Column(nullable = false, length = 500)
    @NotBlank
    @Size(min = 5, max = 500, message = "the description must have between 5 and 500 characters")
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime publicationDate;

    @PositiveOrZero
    private Integer views = 0;

    @PrePersist
    protected void onCreate() {
        this.publicationDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.views = 0;
    }

    private String imageUrl;

    @NotNull
    @Min(value = 1, message = "the season must be at least 1")
    private Integer season;

    @NotNull
    @Min(value = 1, message = "the chapter must be at least 1")
    private Integer chapter;

    @Column(nullable = false)
    @NotBlank(message = "the path to the audio file cannot be blank")
    private String audioPath;

    @Column(nullable = false)
    @Convert(converter = DurationConverter.class)
    @JsonDeserialize(using = DurationFromStringDeserializer.class)
    private Duration duration;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "podcast_id", nullable = false)
    @JsonIgnoreProperties("episodes")
    private Podcast podcast;

    @OneToMany(mappedBy = "episode", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("episode")
    private List<Commentary> commentaries;

    @JsonProperty("commentaries")
    public Integer getCommentariesCount() {
        return commentaries != null ? commentaries.size() : 0;
    }

    @OneToMany(mappedBy = "episode", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Rating> ratings = new ArrayList<>();

    public EpisodeDTO toDTO() {
        return EpisodeDTO.builder()
                .id(this.id)
                .title(this.title)
                .description(this.description)
                .publicationDate(this.publicationDate)
                .views(this.views)
                .season(this.season)
                .chapter(this.chapter)
                .audioPath(this.audioPath)
                .duration(this.duration)
                .imageUrl(this.getImageUrl())
                .podcastTitle(this.podcast.getTitle())
                .build();
    }

}