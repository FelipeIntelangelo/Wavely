package podcast.model.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.*;
import jakarta.validation.constraints.Pattern;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import podcast.model.entities.dto.UserDTO;
import java.util.Collection;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@ToString
@Table(name = "Users")
public class User implements UserDetails {

    // ── Atributos Obligatorios ───────────────────────────────────────────────────────

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 20, message = "El nombre no puede tener más de 20 caracteres")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 20, message = "El apellido no puede tener más de 20 caracteres")
    @Column(nullable = false)
    private String lastName;

    @NotBlank(message = "El nickname es obligatorio")
    @Size(min = 3, max = 20, message = "El nickname debe tener entre 3 y 20 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "El nickname solo puede contener letras, números y guiones bajos")
    @Column(nullable = false, unique = true)
    private String nickname;

    @NotNull(message = "Las credenciales son obligatorias")
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "email", column = @Column(unique = true)),
            @AttributeOverride(name = "username", column = @Column(unique = true))
    })
    private Credential credential;

    // ── Atributos Opcionales ─────────────────────────────────────────────────────────

    @Pattern(regexp = "^(http|https)://.*$", message = "La URL de la imagen de perfil debe ser válida")
    private String profilePicture;

    @Size(max = 500, message = "La biografía no puede tener más de 500 caracteres")
    private String bio;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Podcast> podcasts;

    @JsonProperty("podcasts")
    public List<String> getPodcasts() {
        return podcasts != null ? podcasts.stream().map(x -> x.getTitle()).toList() : List.of();
    }

    @ManyToMany
    @JsonIgnore // <- Cambia esto
    @JoinTable(
            name = "Favorites",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "podcast_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "podcast_id"})
    )
    private List<Podcast> favorites;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Rating> ratings;

    // ── Equals Y Hashcode ────────────────────────────────────────────────────────────


    public User(String name, String lastName, String nickname, Credential credential) {
        this.name = name;
        this.lastName = lastName;
        this.nickname = nickname;
        this.credential = credential;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id != null && id.equals(user.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    // ── Metodos De Userdetails ───────────────────────────────────────────────────────

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return credential.getRoles();
    }

    @Override
    @JsonIgnore
    public String getPassword() {
        return credential.getPassword();
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        return credential.getUsername();
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }


    // ── Metodo Para Convertir User A Userdto ─────────────────────────────────────────
    public UserDTO toDTO() {
        return UserDTO.builder()
                .id(this.id)
                .nickname(this.nickname)
                .profilePicture(this.profilePicture)
                .bio(this.bio)
                .build();
    }
}