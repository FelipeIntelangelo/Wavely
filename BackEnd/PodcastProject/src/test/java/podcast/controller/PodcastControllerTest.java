package podcast.controller;

    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.Test;
    import org.junit.jupiter.api.extension.ExtendWith;
    import org.mockito.InjectMocks;
    import org.mockito.Mock;
    import org.mockito.junit.jupiter.MockitoExtension;
    import org.springframework.http.MediaType;
    import org.springframework.test.web.servlet.MockMvc;
    import org.springframework.test.web.servlet.setup.MockMvcBuilders;
    import podcast.model.entities.Podcast;
    import podcast.model.entities.User;
    import podcast.model.entities.dto.PodcastDTO;
    import podcast.model.entities.enums.Category;
    import podcast.model.services.PodcastService;
    import podcast.model.services.UserService;

    import java.time.LocalDateTime;
    import java.util.Arrays;

    import static org.mockito.Mockito.when;
    import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
    import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

    @ExtendWith(MockitoExtension.class)
    class PodcastControllerTest {

        private MockMvc mockMvc;

        @Mock
        private PodcastService podcastService;

        @Mock
        private UserService userService;

        @InjectMocks
        private PodcastController podcastController;

        private Podcast testPodcast;

        @BeforeEach
        void setUp() {
            mockMvc = MockMvcBuilders.standaloneSetup(podcastController).build();

            User testUser = User.builder()
                    .id(1L)
                    .nickname("testUser")
                    .build();

            testPodcast = Podcast.builder()
                    .id(1L)
                    .title("Test Podcast")
                    .description("Test Description")
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .categories(Arrays.asList(Category.TECNOLOGIA))
                    .user(testUser)
                    .build();
        }

        @Test
        void getPodcastByIdDeberiaRetornarPodcast() throws Exception {
            when(podcastService.getPodcastById(1L)).thenReturn(testPodcast);

            mockMvc.perform(get("/podcastUTN/v1/podcasts/1"))
                    .andExpect(status().isOk())
                    .andDo(print())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.title").value("Test Podcast"));
        }
    }