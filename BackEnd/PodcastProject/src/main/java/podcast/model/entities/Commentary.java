package podcast.model.entities;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import podcast.model.entities.dto.CommentaryDTO;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "Commentaries")

public class Commentary {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Integer id;

@Column(nullable = false, length = 1000)
@NotBlank
@Size(min = 1, max = 1000, message = "El contenido del comentario debe tener entre 1 y 1000 caracteres")
private String content;

@Column(nullable = false)
private LocalDateTime createdAt = LocalDateTime.now();

@PrePersist
protected void onCreate() {
    this.createdAt = LocalDateTime.now();
}

@ManyToOne
@JoinColumn(name = "user_id", nullable = false)
private User user;

@ManyToOne
@JoinColumn(name = "episode_id", nullable = false)
@JsonIgnoreProperties("commentaries")
private Episode episode;

public CommentaryDTO toDTO() {
    return CommentaryDTO.builder()
            .id(id)
            .content(content)
            .createdAt(createdAt)
            .userName(user.getNickname())
            .userProfilePicture(user.getProfilePicture())
            .build();
}

@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Commentary that = (Commentary) o;
    return id != null && id.equals(that.id);
}

@Override
public int hashCode() {
    return id != null ? id.hashCode() : 0;
}
}