package podcast.model.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import podcast.model.entities.Playlist;
import podcast.model.entities.PlaylistItem;
import podcast.model.entities.Podcast;
import podcast.model.entities.User;
import podcast.model.entities.dto.CreatePlaylistDTO;
import podcast.model.entities.dto.PlaylistDTO;
import podcast.model.entities.enums.PlaylistItemType;
import podcast.model.exceptions.AlreadyCreatedException;
import podcast.model.exceptions.PlaylistNotFoundException;
import podcast.model.exceptions.PlaylistLimitExceededException;
import podcast.model.repositories.interfaces.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock private IPlaylistRepository playlistRepository;
    @Mock private IPlaylistItemRepository playlistItemRepository;
    @Mock private IPodcastRepository podcastRepository;
    @Mock private IEpisodeRepository episodeRepository;
    @Mock private IUserRepository userRepository;

    private PlaylistService playlistService;
    private User user;

    @BeforeEach
    void setUp() {
        playlistService = new PlaylistService(
                playlistRepository,
                playlistItemRepository,
                podcastRepository,
                episodeRepository,
                userRepository
        );
        user = User.builder().id(7L).nickname("usuario").build();
    }

    @Test
    void createPlaylistShouldCreateAndAddInitialPodcast() {
        Podcast podcast = Podcast.builder().id(12L).title("Podcast").description("Descripción").build();
        CreatePlaylistDTO request = CreatePlaylistDTO.builder()
                .name(" Viajes ")
                .itemType(PlaylistItemType.PODCAST)
                .itemId(12L)
                .build();

        when(playlistRepository.existsByUserIdAndNameIgnoreCase(7L, "Viajes")).thenReturn(false);
        allowPlaylistCreation();
        when(playlistRepository.save(any(Playlist.class))).thenAnswer(invocation -> {
            Playlist playlist = invocation.getArgument(0);
            if (playlist.getId() == null) playlist.setId(3L);
            if (playlist.getCreatedAt() == null) playlist.setCreatedAt(LocalDateTime.now());
            if (playlist.getUpdatedAt() == null) playlist.setUpdatedAt(LocalDateTime.now());
            return playlist;
        });
        when(podcastRepository.findById(12L)).thenReturn(Optional.of(podcast));
        when(playlistItemRepository.existsByPlaylistIdAndPodcastId(3L, 12L)).thenReturn(false);
        when(playlistItemRepository.countByPlaylistId(3L)).thenReturn(1L);
        when(playlistItemRepository.save(any(PlaylistItem.class))).thenAnswer(invocation -> {
            PlaylistItem item = invocation.getArgument(0);
            item.setId(20L);
            item.setAddedAt(LocalDateTime.now());
            return item;
        });

        PlaylistDTO result = playlistService.createPlaylist(request, user);

        assertEquals("Viajes", result.getName());
        assertEquals(1, result.getItemCount());
        verify(playlistItemRepository).save(any(PlaylistItem.class));
    }

    @Test
    void createPlaylistShouldRejectDuplicatedNameIgnoringCase() {
        CreatePlaylistDTO request = CreatePlaylistDTO.builder().name("viajes").build();
        allowPlaylistCreation();
        when(playlistRepository.existsByUserIdAndNameIgnoreCase(7L, "viajes")).thenReturn(true);

        AlreadyCreatedException exception = assertThrows(
                AlreadyCreatedException.class,
                () -> playlistService.createPlaylist(request, user)
        );

        assertEquals("Ya existe una playlist con ese nombre", exception.getMessage());
        verify(playlistRepository, never()).save(any());
    }

    @Test
    void deletePlaylistShouldDeleteOnlyPlaylistAndItsLinks() {
        Playlist playlist = Playlist.builder().id(3L).name("Viajes").user(user).build();
        when(playlistRepository.findByIdAndUserId(3L, 7L)).thenReturn(Optional.of(playlist));

        playlistService.deletePlaylist(3L, user);

        verify(playlistRepository).delete(playlist);
        verifyNoInteractions(podcastRepository, episodeRepository, playlistItemRepository);
    }

    @Test
    void getPlaylistShouldRejectPlaylistOwnedByAnotherUser() {
        when(playlistRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());

        PlaylistNotFoundException exception = assertThrows(
                PlaylistNotFoundException.class,
                () -> playlistService.getPlaylist(99L, user, 0, 20)
        );

        assertEquals("Playlist no encontrada", exception.getMessage());
    }

    @Test
    void addPodcastShouldRejectDuplicatedItem() {
        Playlist playlist = Playlist.builder().id(3L).name("Viajes").user(user).build();
        when(playlistRepository.findByIdAndUserId(3L, 7L)).thenReturn(Optional.of(playlist));
        when(playlistItemRepository.existsByPlaylistIdAndPodcastId(3L, 12L)).thenReturn(true);

        AlreadyCreatedException exception = assertThrows(
                AlreadyCreatedException.class,
                () -> playlistService.addPodcast(3L, 12L, user)
        );

        assertEquals("El podcast ya está en esta playlist", exception.getMessage());
        verify(podcastRepository, never()).findById(anyLong());
        verify(playlistItemRepository, never()).save(any());
    }

    @Test
    void createPlaylistShouldRejectIncompleteInitialItem() {
        CreatePlaylistDTO request = CreatePlaylistDTO.builder()
                .name("Viajes")
                .itemType(PlaylistItemType.EPISODE)
                .build();
        when(playlistRepository.existsByUserIdAndNameIgnoreCase(7L, "Viajes")).thenReturn(false);
        allowPlaylistCreation();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> playlistService.createPlaylist(request, user)
        );

        assertEquals("itemType e itemId deben enviarse juntos", exception.getMessage());
        verify(playlistRepository, never()).save(any());
    }

    @Test
    void createPlaylistShouldRejectPlaylistTwentyOne() {
        CreatePlaylistDTO request = CreatePlaylistDTO.builder().name("Playlist 21").build();
        when(userRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(user));
        when(playlistRepository.countByUserId(7L)).thenReturn(20L);

        PlaylistLimitExceededException exception = assertThrows(
                PlaylistLimitExceededException.class,
                () -> playlistService.createPlaylist(request, user)
        );

        assertEquals("Alcanzaste el límite de 20 playlists", exception.getMessage());
        verify(playlistRepository, never()).save(any());
    }

    @Test
    void getPlaylistShouldReturnRequestedPageOfItems() {
        Playlist playlist = Playlist.builder().id(3L).name("Viajes").user(user).build();
        Podcast podcast = Podcast.builder().id(12L).title("Podcast").description("Descripción").build();
        PlaylistItem item = PlaylistItem.builder().id(20L).playlist(playlist).podcast(podcast).build();
        PageRequest pageRequest = PageRequest.of(1, 20);

        when(playlistRepository.findByIdAndUserId(3L, 7L)).thenReturn(Optional.of(playlist));
        when(playlistItemRepository.findByPlaylistIdOrderByAddedAtDesc(3L, pageRequest))
                .thenReturn(new PageImpl<>(List.of(item), pageRequest, 21));

        var result = playlistService.getPlaylist(3L, user, 1, 20);

        assertEquals(1, result.getItems().getNumber());
        assertEquals(2, result.getItems().getTotalPages());
        assertEquals(21, result.getItemCount());
        assertEquals(12L, result.getItems().getContent().getFirst().getContentId());
    }

    private void allowPlaylistCreation() {
        when(userRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(user));
        when(playlistRepository.countByUserId(7L)).thenReturn(19L);
    }
}
