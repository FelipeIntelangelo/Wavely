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
import podcast.model.exceptions.*;
import podcast.model.services.ErrorLogService;
import podcast.model.services.PodcastService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests para GlobalExceptionHandler.
 *
 * Verifica que cuando el backend lanza una excepción, el GlobalExceptionHandler
 * la intercepta y devuelve un JSON con la estructura { errorCode, message }
 * con el HTTP status correcto.
 *
 * Se usa standaloneSetup para aislar el controlador de cualquier configuración
 * de seguridad o contexto de Spring completo, registrando el GlobalExceptionHandler
 * manualmente para que MockMvc lo use.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalExceptionHandler — Error Codes")
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @Mock
    private PodcastService podcastService;

    @Mock
    private ErrorLogService errorLogService;

    @InjectMocks
    private PodcastController podcastController;

    @BeforeEach
    void setUp() {
        // Registramos el GlobalExceptionHandler en el standaloneSetup para que
        // MockMvc lo intercepte cuando el controller lance una excepción.
        mockMvc = MockMvcBuilders
                .standaloneSetup(podcastController)
                .setControllerAdvice(new GlobalExceptionHandler(errorLogService))
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // 409 CONFLICT — AlreadyCreatedException con errorCode específico
    // ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("409 — Podcast duplicado devuelve ERR_DUPLICATE_PODCAST")
    void cuandoPodcastDuplicado_deberiaResponder409ConErrorCode() throws Exception {
        when(podcastService.getPodcastById(1L))
                .thenThrow(new AlreadyCreatedException("ERR_DUPLICATE_PODCAST", "Podcast with name 'X' already exists"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.errorCode").value("ERR_DUPLICATE_PODCAST"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("409 — Episodio duplicado devuelve ERR_DUPLICATE_EPISODE")
    void cuandoEpisodioYaExiste_deberiaResponder409ConErrorCode() throws Exception {
        when(podcastService.getPodcastById(any(Long.class)))
                .thenThrow(new AlreadyCreatedException("ERR_DUPLICATE_EPISODE", "An episode with the title 'X' already exists"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ERR_DUPLICATE_EPISODE"));
    }

    // ─────────────────────────────────────────────────────────────
    // 404 NOT FOUND
    // ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("404 — Podcast no encontrado devuelve ERR_PODCAST_NOT_FOUND")
    void cuandoPodcastNoExiste_deberiaResponder404ConErrorCode() throws Exception {
        when(podcastService.getPodcastById(99L))
                .thenThrow(new PodcastNotFoundException("Podcast with ID 99 not found"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/99")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("ERR_PODCAST_NOT_FOUND"))
                .andExpect(jsonPath("$.message").exists());
    }

    // ─────────────────────────────────────────────────────────────
    // 403 FORBIDDEN
    // ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("403 — Acceso no autorizado devuelve ERR_FORBIDDEN")
    void cuandoUsuarioNoTienePermisos_deberiaResponder403ConErrorCode() throws Exception {
        when(podcastService.getPodcastById(1L))
                .thenThrow(new UnauthorizedException("No tienes permisos"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ERR_FORBIDDEN"));
    }

    // ─────────────────────────────────────────────────────────────
    // 400 BAD REQUEST — IllegalArgumentException
    // ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("400 — Argumento inválido devuelve ERR_INVALID_ARGUMENT")
    void cuandoArgumentoInvalido_deberiaResponder400ConErrorCode() throws Exception {
        when(podcastService.getPodcastById(any(Long.class)))
                .thenThrow(new IllegalArgumentException("Valor no permitido"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ERR_INVALID_ARGUMENT"));
    }

    // ─────────────────────────────────────────────────────────────
    // Estructura del JSON de error
    // ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("La respuesta de error siempre tiene los campos errorCode y message")
    void laRespuestaDeErrorSiempreTieneEstructuraCorrecta() throws Exception {
        when(podcastService.getPodcastById(any(Long.class)))
                .thenThrow(new PodcastNotFoundException("not found"));

        mockMvc.perform(get("/podcastUTN/v1/podcasts/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.errorCode").isString())
                .andExpect(jsonPath("$.message").isString());
    }
}
