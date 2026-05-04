package podcast.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.server.ResponseStatusException;
import podcast.PodcastApplication;
import podcast.cfg.JwtUtil;
import podcast.model.entities.dto.LoginRequest;
import podcast.model.entities.dto.LoginResponse;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(classes = PodcastApplication.class)
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthController authController;

    private LoginRequest loginRequest;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("testpass");

        userDetails = User.builder()
                .username("testuser")
                .password("testpass")
                .authorities(new ArrayList<>())
                .build();
    }

    @Test
    void loginDeberiaRetornarToken() {
        // Arrange
        String expectedToken = "test-jwt-token";
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(userDetails, null));
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn(expectedToken);

        // Act
        ResponseEntity<LoginResponse> response = authController.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(expectedToken, response.getBody().getToken());
    }

    @Test
    void loginDeberiaFallarConCredencialesInvalidas() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Credenciales inválidas"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> {
            authController.login(loginRequest);
        });
    }

    @Test
    void loginDeberiaFallarConUsernameVacio() {
        // Arrange
        loginRequest.setUsername("");

        // Act & Assert
        Exception exception = assertThrows(ResponseStatusException.class, () -> {
            authController.login(loginRequest);
        });

        assertTrue(exception.getMessage().contains("Username no puede estar vacío"));
    }

    @Test
    void loginDeberiaFallarConPasswordVacio() {
        // Arrange
        loginRequest.setPassword("");

        // Act & Assert
        Exception exception = assertThrows(ResponseStatusException.class, () -> {
            authController.login(loginRequest);
        });

        assertTrue(exception.getMessage().contains("Password no puede estar vacío"));
    }

    @Test
    void loginDeberiaFallarConTokenExpirado() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(userDetails, null));
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.generateToken(any(UserDetails.class)))
                .thenThrow(new RuntimeException("Token generation failed - expired"));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authController.login(loginRequest);
        });

        assertTrue(exception.getMessage().contains("Token generation failed"));
    }

    @Test
    void tokenDeberiaContenerFormatoCorrecto() {
        // Arrange
        String expectedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciJ9.123456789";
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(userDetails, null));
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn(expectedToken);

        // Act
        ResponseEntity<LoginResponse> response = authController.login(loginRequest);

        // Assert
        assertNotNull(response.getBody());
        String token = response.getBody().getToken();
        assertTrue(token.contains("."));
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length); // Header.Payload.Signature
    }
}