package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import podcast.model.entities.*;
import podcast.model.entities.dto.*;
import podcast.model.entities.enums.PlaylistItemType;
import podcast.model.exceptions.*;
import podcast.model.repositories.interfaces.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PlaylistService {

    public static final int MAX_PLAYLISTS_PER_USER = 20;
    public static final int MAX_PAGE_SIZE = 100;

    private final IPlaylistRepository playlistRepository;
    private final IPlaylistItemRepository playlistItemRepository;
    private final IPodcastRepository podcastRepository;
    private final IEpisodeRepository episodeRepository;
    private final IUserRepository userRepository;

    @Autowired
    public PlaylistService(IPlaylistRepository playlistRepository,
                           IPlaylistItemRepository playlistItemRepository,
                           IPodcastRepository podcastRepository,
                           IEpisodeRepository episodeRepository,
                           IUserRepository userRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistItemRepository = playlistItemRepository;
        this.podcastRepository = podcastRepository;
        this.episodeRepository = episodeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaylistDTO> getPlaylists(User user) {
        return playlistRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlaylistDetailDTO getPlaylist(Long playlistId, User user, int page, int size) {
        validatePage(page, size);
        Playlist playlist = getOwnedPlaylist(playlistId, user);
        Pageable pageable = PageRequest.of(page, size);
        Page<PlaylistItemDTO> items = playlistItemRepository
                .findByPlaylistIdOrderByAddedAtDesc(playlistId, pageable)
                .map(this::toItemDTO);
        return toDetailDTO(playlist, items);
    }

    @Transactional
    public PlaylistDTO createPlaylist(CreatePlaylistDTO request, User user) {
        String name = normalizeName(request.getName());
        lockUserAndValidateLimit(user.getId());
        validateUniqueName(user.getId(), name, null);
        validateInitialItem(request);

        Playlist playlist = Playlist.builder()
                .name(name)
                .description(normalizeDescription(request.getDescription()))
                .user(user)
                .build();
        playlist = playlistRepository.save(playlist);

        if (request.getItemType() != null) {
            addItem(playlist, request.getItemType(), request.getItemId());
        }

        return toDTO(playlist);
    }

    @Transactional
    public PlaylistDTO updatePlaylist(Long playlistId, UpdatePlaylistDTO request, User user) {
        Playlist playlist = getOwnedPlaylist(playlistId, user);

        if (request.getName() != null) {
            String name = normalizeName(request.getName());
            validateUniqueName(user.getId(), name, playlistId);
            playlist.setName(name);
        }
        if (request.getDescription() != null) {
            playlist.setDescription(normalizeDescription(request.getDescription()));
        }

        return toDTO(playlistRepository.save(playlist));
    }

    @Transactional
    public void deletePlaylist(Long playlistId, User user) {
        playlistRepository.delete(getOwnedPlaylist(playlistId, user));
    }

    @Transactional
    public PlaylistDTO addPodcast(Long playlistId, Long podcastId, User user) {
        Playlist playlist = getOwnedPlaylist(playlistId, user);
        addItem(playlist, PlaylistItemType.PODCAST, podcastId);
        return toDTO(playlist);
    }

    @Transactional
    public PlaylistDTO addEpisode(Long playlistId, Long episodeId, User user) {
        Playlist playlist = getOwnedPlaylist(playlistId, user);
        addItem(playlist, PlaylistItemType.EPISODE, episodeId);
        return toDTO(playlist);
    }

    @Transactional
    public void removePodcast(Long playlistId, Long podcastId, User user) {
        Playlist playlist = getOwnedPlaylist(playlistId, user);
        PlaylistItem item = playlistItemRepository.findByPlaylistIdAndPodcastId(playlistId, podcastId)
                .orElseThrow(() -> new PlaylistItemNotFoundException("El podcast no está en esta playlist"));
        playlist.getItems().remove(item);
        playlistItemRepository.delete(item);
        touch(playlist);
    }

    @Transactional
    public void removeEpisode(Long playlistId, Long episodeId, User user) {
        Playlist playlist = getOwnedPlaylist(playlistId, user);
        int normalizedEpisodeId = Math.toIntExact(episodeId);
        PlaylistItem item = playlistItemRepository.findByPlaylistIdAndEpisodeId(playlistId, normalizedEpisodeId)
                .orElseThrow(() -> new PlaylistItemNotFoundException("El episodio no está en esta playlist"));
        playlist.getItems().remove(item);
        playlistItemRepository.delete(item);
        touch(playlist);
    }

    private void addItem(Playlist playlist, PlaylistItemType type, Long itemId) {
        if (type == PlaylistItemType.PODCAST) {
            if (playlistItemRepository.existsByPlaylistIdAndPodcastId(playlist.getId(), itemId)) {
                throw new AlreadyCreatedException("El podcast ya está en esta playlist");
            }
            Podcast podcast = podcastRepository.findById(itemId)
                    .orElseThrow(() -> new PodcastNotFoundException("Podcast no encontrado"));
            PlaylistItem item = PlaylistItem.builder().playlist(playlist).podcast(podcast).build();
            playlistItemRepository.save(item);
            playlist.getItems().add(0, item);
        } else {
            int episodeId = Math.toIntExact(itemId);
            if (playlistItemRepository.existsByPlaylistIdAndEpisodeId(playlist.getId(), episodeId)) {
                throw new AlreadyCreatedException("El episodio ya está en esta playlist");
            }
            Episode episode = episodeRepository.findById(itemId)
                    .orElseThrow(() -> new EpisodeNotFoundException("Episodio no encontrado"));
            PlaylistItem item = PlaylistItem.builder().playlist(playlist).episode(episode).build();
            playlistItemRepository.save(item);
            playlist.getItems().add(0, item);
        }
        touch(playlist);
    }

    private Playlist getOwnedPlaylist(Long playlistId, User user) {
        return playlistRepository.findByIdAndUserId(playlistId, user.getId())
                .orElseThrow(() -> new PlaylistNotFoundException("Playlist no encontrada"));
    }

    private void validateInitialItem(CreatePlaylistDTO request) {
        if ((request.getItemType() == null) != (request.getItemId() == null)) {
            throw new IllegalArgumentException("itemType e itemId deben enviarse juntos");
        }
    }

    private void validateUniqueName(Long userId, String name, Long playlistId) {
        boolean exists = playlistId == null
                ? playlistRepository.existsByUserIdAndNameIgnoreCase(userId, name)
                : playlistRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, name, playlistId);
        if (exists) {
            throw new AlreadyCreatedException("Ya existe una playlist con ese nombre");
        }
    }

    private void lockUserAndValidateLimit(Long userId) {
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado"));
        if (playlistRepository.countByUserId(userId) >= MAX_PLAYLISTS_PER_USER) {
            throw new PlaylistLimitExceededException(
                    "Alcanzaste el límite de " + MAX_PLAYLISTS_PER_USER + " playlists"
            );
        }
    }

    private void validatePage(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("El número de página no puede ser negativo");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamaño de página debe estar entre 1 y " + MAX_PAGE_SIZE);
        }
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la playlist es obligatorio");
        }
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null) return null;
        String normalized = description.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void touch(Playlist playlist) {
        playlist.setUpdatedAt(LocalDateTime.now());
        playlistRepository.save(playlist);
    }

    private PlaylistDTO toDTO(Playlist playlist) {
        return PlaylistDTO.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .createdAt(playlist.getCreatedAt())
                .updatedAt(playlist.getUpdatedAt())
                .itemCount(playlistItemRepository.countByPlaylistId(playlist.getId()))
                .build();
    }

    private PlaylistDetailDTO toDetailDTO(Playlist playlist, Page<PlaylistItemDTO> items) {
        return PlaylistDetailDTO.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .createdAt(playlist.getCreatedAt())
                .updatedAt(playlist.getUpdatedAt())
                .itemCount(items.getTotalElements())
                .items(items)
                .build();
    }

    private PlaylistItemDTO toItemDTO(PlaylistItem item) {
        if (item.getPodcast() != null) {
            Podcast podcast = item.getPodcast();
            return PlaylistItemDTO.builder()
                    .id(item.getId())
                    .type(PlaylistItemType.PODCAST)
                    .contentId(podcast.getId())
                    .title(podcast.getTitle())
                    .description(podcast.getDescription())
                    .imageUrl(podcast.getImageUrl())
                    .categories(podcast.getCategories())
                    .views(podcast.calcularViewsPromedio())
                    .rating(podcast.getAverageRating())
                    .addedAt(item.getAddedAt())
                    .build();
        }

        Episode episode = item.getEpisode();
        Double rating = episode.getRatings() == null ? 0.0 : episode.getRatings().stream()
                .mapToLong(Rating::getScore)
                .average()
                .orElse(0.0);
        return PlaylistItemDTO.builder()
                .id(item.getId())
                .type(PlaylistItemType.EPISODE)
                .contentId(Long.valueOf(episode.getId()))
                .title(episode.getTitle())
                .description(episode.getDescription())
                .imageUrl(episode.getImageUrl())
                .categories(episode.getPodcast().getCategories())
                .views(Long.valueOf(episode.getViews()))
                .rating(rating)
                .podcastTitle(episode.getPodcast().getTitle())
                .addedAt(item.getAddedAt())
                .build();
    }
}
