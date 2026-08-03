 package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import podcast.model.entities.Podcast;
import podcast.model.entities.User;
import podcast.model.entities.dto.PodcastDTO;
import podcast.model.entities.dto.UpdateUserDTO;
import podcast.model.entities.dto.UserDTO;
import podcast.model.entities.enums.AuthProvider;
import podcast.model.entities.enums.Role;
import podcast.model.exceptions.AlreadyCreatedException;
import podcast.model.exceptions.PodcastNotFoundException;
import podcast.model.exceptions.UserNotFoundException;
import podcast.model.repositories.interfaces.IPodcastRepository;
import podcast.model.repositories.interfaces.IUserRepository;
import podcast.model.repositories.interfaces.IPlaylistRepository;
import podcast.model.repositories.interfaces.ICommentaryRepository;
import podcast.model.repositories.interfaces.IRatingRepository;
import podcast.model.repositories.interfaces.IUserFollowRepository;
import podcast.model.repositories.interfaces.IEpisodeHistoryRepository;
import podcast.model.entities.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    // ── Inyeccion De Dependencias Necesarias ─────────────────────────────────────────

    private final IUserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final IPodcastRepository podcastRepository;
    private final NotificationService notificationService;
    private final IPlaylistRepository playlistRepository;
    private final ICommentaryRepository commentaryRepository;
    private final IRatingRepository ratingRepository;
    private final IUserFollowRepository userFollowRepository;
    private final IEpisodeHistoryRepository episodeHistoryRepository;

    // ── Constructor ──────────────────────────────────────────────────────────────────

    @Autowired
    public UserService(IUserRepository userRepository, PasswordEncoder passwordEncoder, 
                       IPodcastRepository podcastRepository, NotificationService notificationService,
                       IPlaylistRepository playlistRepository, ICommentaryRepository commentaryRepository,
                       IRatingRepository ratingRepository, IUserFollowRepository userFollowRepository,
                       IEpisodeHistoryRepository episodeHistoryRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.podcastRepository = podcastRepository;
        this.notificationService = notificationService;
        this.playlistRepository = playlistRepository;
        this.commentaryRepository = commentaryRepository;
        this.ratingRepository = ratingRepository;
        this.userFollowRepository = userFollowRepository;
        this.episodeHistoryRepository = episodeHistoryRepository;
    }

    // ── Logica De Negocio ────────────────────────────────────────────────────────────


    // ── Get ──────────────────────────────────────────────────────────────────────────

    public User getAuthenticatedUser(String username) {
        return userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
    }

    public Page<UserDTO> getAllUsersAsDTO(String nickname, Boolean orderByFollowers, Pageable pageable) {
        if (Boolean.TRUE.equals(orderByFollowers)) {
            org.springframework.data.domain.Pageable unpagedSort = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
            return userRepository.findUsersOrderByFollowersDesc(nickname, unpagedSort).map(User::toDTO);
        }
        
        if (nickname != null && !nickname.isBlank()) {
            return userRepository.findByNicknameContainingIgnoreCase(nickname, pageable).map(User::toDTO);
        }
        return userRepository.findAll(pageable).map(User::toDTO);
    }

    public List<UserDTO> getFeaturedCreators(int limit) {
        List<User> allUsers = userRepository.findAll();
        
        return allUsers.stream()
                .filter(u -> u.getPodcasts() != null && !u.getPodcasts().isEmpty())
                .sorted((u1, u2) -> Long.compare(calculateScore(u2), calculateScore(u1)))
                .limit(limit)
                .map(User::toDTO)
                .toList();
    }
    
    private long calculateScore(User user) {
        long followersScore = (user.getFollowers() != null ? user.getFollowers().size() : 0) * 5L;
        long viewsScore = user.getPodcasts().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .flatMap(p -> p.getEpisodes() != null ? p.getEpisodes().stream() : java.util.stream.Stream.<podcast.model.entities.Episode>empty())
                .mapToLong(e -> e.getViews() != null ? e.getViews() : 0)
                .sum();
        return followersScore + viewsScore;
    }

    public UserDTO getUserByIdAsDTO(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + id));
        return user.toDTO();
    }

    public User getUserWithCredentialsById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + id));
    }

    public List<PodcastDTO> getFavoritesByUsername(String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
        return user.getFavorites().stream().map(Podcast::toDTO).toList();
    }

    // ── Post ─────────────────────────────────────────────────────────────────────────

    public void save(User user) {
        // Verifica que el id sea nulo pq es autoincremental en la bdd
        if (user.getId() != null) {
            throw new AlreadyCreatedException("ERR_INVALID_USER_ID", "No se debe enviar un ID al registrar un usuario nuevo");
        }

        // Validar que los usuarios locales tengan contraseña
        String rawPassword = user.getCredential().getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }
        if (rawPassword.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }

        // Asigna rol por defecto si no tiene
        user.getCredential().getRoles().clear();
        user.getCredential().getRoles().add(Role.ROLE_USER);
        // Encripta la contraseña
        user.getCredential().setPassword(passwordEncoder.encode(rawPassword));

        // Asigna proveedor LOCAL por defecto
        user.getCredential().setAuthProvider(AuthProvider.LOCAL);

        // Asigna fecha de creación si es nuevo
        if (user.getCredential().getCreatedAt() == null) {
            user.getCredential().setCreatedAt(LocalDateTime.now());
        }

        userRepository.save(user);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByCredentialUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByCredentialEmail(email);
    }

    public void addPodcastToFavorites(String username, Long podcastId) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new PodcastNotFoundException("Podcast no encontrado con id: " + podcastId));

        if (user.getFavorites().contains(podcast)) {
            throw new IllegalArgumentException("El podcast ya está en la lista de favoritos");
        }

        user.getFavorites().add(podcast);
        userRepository.save(user);

        String subscriptionMessage = user.getNickname() + " marcó tu podcast '" + podcast.getTitle() + "' como favorito";
        notificationService.notify(NotificationType.NEW_SUBSCRIPTION, user, podcast.getUser(), podcast, null, null, subscriptionMessage);
    }

    // ── Patch ────────────────────────────────────────────────────────────────────────

    public User updateAuthenticatedUser(String username, UpdateUserDTO updates) {
        User existingUser = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));

        // Actualiza solo los campos proporcionados y no vacíos
        if (updates.getNickname() != null && !updates.getNickname().isBlank()) {
            existingUser.setNickname(updates.getNickname());
        }
        if (updates.getProfilePicture() != null && !updates.getProfilePicture().isBlank()) {
            existingUser.setProfilePicture(updates.getProfilePicture());
        }
        if (updates.getBio() != null && !updates.getBio().isBlank()) {
            existingUser.setBio(updates.getBio());
        }
        if (updates.getEmail() != null && !updates.getEmail().isBlank()) {
            existingUser.getCredential().setEmail(updates.getEmail());
        }
        if (updates.getPassword() != null && !updates.getPassword().isBlank()) {
            existingUser.getCredential().setPassword(passwordEncoder.encode(updates.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    // ── Delete ───────────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteAuthenticatedUser(String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));

        boolean hasActivePodcasts = podcastRepository.existsByUserIdAndIsActiveTrue(user.getId());
        if (hasActivePodcasts) {
            throw new podcast.model.exceptions.CannotDeleteOwnerException("ERR_CANNOT_DELETE_OWNER", "No se puede eliminar el usuario porque es dueño de uno o más podcasts activos.");
        }

        performSoftDeleteAndCleanup(user);
    }

    public void removePodcastFromFavorites(String username, Long podcastId) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new PodcastNotFoundException("Podcast no encontrado con id: " + podcastId));

        if (!user.getFavorites().contains(podcast)) {
            throw new IllegalArgumentException("El podcast no está en la lista de favoritos");
        }

        user.getFavorites().remove(podcast);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con id: " + userId));

        boolean hasActivePodcasts = podcastRepository.existsByUserIdAndIsActiveTrue(user.getId());
        if (hasActivePodcasts) {
            throw new IllegalArgumentException("No se puede eliminar el usuario porque es dueño de uno o más podcasts activos.");
        }

        performSoftDeleteAndCleanup(user);
    }

    private void performSoftDeleteAndCleanup(User user) {
        Long userId = user.getId();

        // Limpiar basura física para no dejar base de datos sucia
        playlistRepository.deleteByUserId(userId);
        commentaryRepository.deleteByUserId(userId);
        ratingRepository.deleteByUserId(userId);
        episodeHistoryRepository.deleteByUserId(userId);
        userFollowRepository.deleteByFollowerId(userId);
        userFollowRepository.deleteByFollowedId(userId);
        user.getFavorites().clear();

        // Anonimizar el usuario
        user.setName("Usuario");
        user.setLastName("Eliminado");
        user.setNickname("deleted_" + userId);
        user.setBio(null);
        user.setProfilePicture(null);
        
        user.getCredential().setUsername("deleted_" + userId);
        user.getCredential().setEmail("deleted_" + userId + "@wavely.com");
        user.getCredential().setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

        userRepository.save(user);
    }
}