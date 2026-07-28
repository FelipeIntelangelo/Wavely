package podcast.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import podcast.model.exceptions.AlreadyCreatedException;
import podcast.model.exceptions.PlaylistLimitExceededException;
import podcast.model.services.ErrorLogService;
import podcast.model.services.PlaylistService;
import podcast.model.services.UserService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests del PlaylistController usando el GlobalExceptionHandler.
 * Los tests anteriores (que llamaban a handleConflict() directamente) fueron migrados
 * a este estilo MockMvc para validar que el handler global funciona end-to-end.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlaylistController — Error Codes via GlobalExceptionHandler")
class PlaylistControllerTest {

    private MockMvc mockMvc;

    @Mock private PlaylistService playlistService;
    @Mock private UserService userService;
    @Mock private ErrorLogService errorLogService;

    @InjectMocks
    private PlaylistController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(errorLogService))
                .build();
    }

    @Test
    @DisplayName("409 — Límite de playlists devuelve ERR_PLAYLIST_LIMIT")
    void cuandoLimitePlaylists_deberiaResponder400ConErrorCode() throws Exception {
        when(playlistService.getPlaylists(any()))
                .thenThrow(new PlaylistLimitExceededException("Alcanzaste el límite de 20 playlists"));

        mockMvc.perform(get("/podcastUTN/v1/playlists")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ERR_PLAYLIST_LIMIT"));
    }

    @Test
    @DisplayName("409 — Playlist duplicada devuelve ERR_DUPLICATE_PLAYLIST")
    void cuandoPlaylistDuplicada_deberiaResponder409ConErrorCode() throws Exception {
        when(playlistService.getPlaylists(any()))
                .thenThrow(new AlreadyCreatedException("ERR_DUPLICATE_PLAYLIST", "Ya existe una playlist con ese nombre"));

        mockMvc.perform(get("/podcastUTN/v1/playlists")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ERR_DUPLICATE_PLAYLIST"));
    }
}
