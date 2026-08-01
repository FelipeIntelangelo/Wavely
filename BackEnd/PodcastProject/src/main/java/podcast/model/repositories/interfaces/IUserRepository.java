package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import podcast.model.entities.User;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;

@Repository
public interface IUserRepository extends JpaRepository <User, Long> {

    Optional<User> findByCredentialUsername(String username);

    Optional<User> findByNickname(String nickname);

    Optional<User> findByCredentialEmail(String email);

    boolean existsByCredentialEmail(String email);

    boolean existsByCredentialUsername(String username);

    boolean existsByCredentialResetToken(String resetToken);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.credential.roles WHERE u.id = :id")
    Optional<User> findByIdWithCredentialAndRoles(@Param("id") Long id);

    Page<User> findByNicknameContainingIgnoreCase(String nickname, Pageable pageable);

    @Query(value = "SELECT u FROM User u LEFT JOIN u.followers f WHERE (:nickname IS NULL OR :nickname = '' OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :nickname, '%'))) GROUP BY u.id ORDER BY COUNT(f.id) DESC",
           countQuery = "SELECT COUNT(u) FROM User u WHERE (:nickname IS NULL OR :nickname = '' OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :nickname, '%')))")
    Page<User> findUsersOrderByFollowersDesc(@Param("nickname") String nickname, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

}
