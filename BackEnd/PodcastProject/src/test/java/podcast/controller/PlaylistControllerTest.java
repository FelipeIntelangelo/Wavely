package podcast.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import podcast.model.exceptions.PlaylistLimitExceededException;
import podcast.model.services.PlaylistService;
import podcast.model.services.UserService;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class PlaylistControllerTest {

    @Mock private PlaylistService playlistService;
    @Mock private UserService userService;

    private PlaylistController controller;

    @BeforeEach
    void setUp() {
        controller = new PlaylistController(playlistService, userService);
    }

    @Test
    void dataIntegrityConflictShouldReturn409() {
        var response = controller.handleDataIntegrityViolation(
                new DataIntegrityViolationException("duplicate key")
        );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("La operación entra en conflicto con una playlist existente", response.getBody());
    }

    @Test
    void playlistLimitShouldReturn409() {
        var response = controller.handleConflict(
                new PlaylistLimitExceededException("Alcanzaste el límite de 20 playlists")
        );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Alcanzaste el límite de 20 playlists", response.getBody());
    }
}
