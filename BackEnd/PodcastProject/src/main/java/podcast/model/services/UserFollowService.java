package podcast.model.services;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import podcast.model.entities.User;
import podcast.model.entities.UserFollow;
import podcast.model.entities.dto.FollowStatusDTO;
import podcast.model.entities.dto.UserFollowDTO;
import podcast.model.entities.dto.FollowerDTO;
import podcast.model.entities.enums.NotificationType;
import podcast.model.exceptions.UserNotFoundException;
import podcast.model.repositories.interfaces.IUserFollowRepository;
import podcast.model.repositories.interfaces.IUserRepository;

import java.util.List;

@Service
public class UserFollowService {

    private final IUserFollowRepository userFollowRepository;
    private final IUserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public UserFollowService(IUserFollowRepository userFollowRepository,
                             IUserRepository userRepository,
                             @Lazy NotificationService notificationService) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ── Follow ──────────────────────────────────────────────────────────────────────

    public void followUser(String followerUsername, Long followedUserId) {
        User follower = userRepository.findByCredentialUsername(followerUsername)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado: " + followerUsername));
        User followed = userRepository.findById(followedUserId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + followedUserId));

        if (follower.getId().equals(followed.getId())) {
            throw new IllegalArgumentException("No podés seguirte a vos mismo");
        }

        if (userFollowRepository.existsByFollowerIdAndFollowedId(follower.getId(), followed.getId())) {
            throw new IllegalArgumentException("Ya seguís a este usuario");
        }

        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .followed(followed)
                .bellEnabled(false)
                .build();

        userFollowRepository.save(userFollow);

        String message = follower.getNickname() + " comenzó a seguirte";
        notificationService.notify(NotificationType.NEW_FOLLOWER, follower, followed, null, null, null, message);
    }

    // ── Unfollow ────────────────────────────────────────────────────────────────────

    @Transactional
    public void unfollowUser(String followerUsername, Long followedUserId) {
        User follower = userRepository.findByCredentialUsername(followerUsername)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado: " + followerUsername));

        if (!userFollowRepository.existsByFollowerIdAndFollowedId(follower.getId(), followedUserId)) {
            throw new IllegalArgumentException("No seguís a este usuario");
        }

        userFollowRepository.deleteByFollowerIdAndFollowedId(follower.getId(), followedUserId);
    }

    // ── Toggle Bell ─────────────────────────────────────────────────────────────────

    public boolean toggleBell(String followerUsername, Long followedUserId) {
        User follower = userRepository.findByCredentialUsername(followerUsername)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado: " + followerUsername));

        UserFollow userFollow = userFollowRepository.findByFollowerIdAndFollowedId(follower.getId(), followedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Primero debés seguir al usuario para activar la campanita"));

        userFollow.setBellEnabled(!userFollow.isBellEnabled());
        userFollowRepository.save(userFollow);
        return userFollow.isBellEnabled();
    }

    // ── Get Follow Status ───────────────────────────────────────────────────────────

    public FollowStatusDTO getFollowStatus(String followerUsername, Long followedUserId) {
        User follower = userRepository.findByCredentialUsername(followerUsername)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado: " + followerUsername));

        boolean isFollowing = userFollowRepository.existsByFollowerIdAndFollowedId(follower.getId(), followedUserId);
        boolean bellEnabled = false;

        if (isFollowing) {
            UserFollow follow = userFollowRepository
                    .findByFollowerIdAndFollowedId(follower.getId(), followedUserId)
                    .orElse(null);
            if (follow != null) {
                bellEnabled = follow.isBellEnabled();
            }
        }

        Long followersCount = userFollowRepository.countByFollowedId(followedUserId);

        return FollowStatusDTO.builder()
                .isFollowing(isFollowing)
                .bellEnabled(bellEnabled)
                .followersCount(followersCount)
                .build();
    }

    // ── Get My Following ────────────────────────────────────────────────────────────

    public List<UserFollowDTO> getMyFollowing(String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado: " + username));

        return userFollowRepository.findByFollowerId(user.getId()).stream()
                .map(this::toDTO)
                .toList();
    }

    // ── Get Followers ───────────────────────────────────────────────────────────────

    public List<FollowerDTO> getFollowers(Long followedUserId) {
        if (!userRepository.existsById(followedUserId)) {
            throw new UserNotFoundException("Usuario no encontrado con id: " + followedUserId);
        }

        return userFollowRepository.findByFollowedId(followedUserId).stream()
                .map(this::toFollowerDTO)
                .toList();
    }

    // ── Get Followers With Bell (usado por NotificationService) ─────────────────────

    public List<User> getFollowersWithBell(Long followedUserId) {
        return userFollowRepository.findByFollowedIdAndBellEnabledTrue(followedUserId).stream()
                .map(UserFollow::getFollower)
                .toList();
    }

    // ── Mapper ──────────────────────────────────────────────────────────────────────

    private UserFollowDTO toDTO(UserFollow follow) {
        return UserFollowDTO.builder()
                .followedUserId(follow.getFollowed().getId())
                .followedNickname(follow.getFollowed().getNickname())
                .followedProfilePicture(follow.getFollowed().getProfilePicture())
                .bellEnabled(follow.isBellEnabled())
                .followedSince(follow.getCreatedAt())
                .followersCount(userFollowRepository.countByFollowedId(follow.getFollowed().getId()))
                .build();
    }

    private FollowerDTO toFollowerDTO(UserFollow follow) {
        return FollowerDTO.builder()
                .followerUserId(follow.getFollower().getId())
                .followerNickname(follow.getFollower().getNickname())
                .followerProfilePicture(follow.getFollower().getProfilePicture())
                .followedSince(follow.getCreatedAt())
                .followersCount(userFollowRepository.countByFollowedId(follow.getFollower().getId()))
                .build();
    }
}
