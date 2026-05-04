package podcast.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import podcast.cfg.JwtUtil;
import podcast.model.entities.dto.LoginRequest;
import podcast.model.entities.dto.LoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;

@RestController
@RequestMapping("podcastUTN/v1/auth")
@Tag(
    name = "Autenticación",
    description = "API para gestionar la autenticación de usuarios y generación de tokens JWT"
)
@SecurityRequirements  // Indica que estos endpoints no requieren autenticación
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

// ===================================================================================================================

    @Operation(
        summary = "Iniciar sesión",
        description = "Autentica al usuario utilizando sus credenciales (nombre de usuario y contraseña) " +
                     "y devuelve un token JWT que debe ser utilizado para autenticar las siguientes peticiones. " +
                     "El token debe ser incluido en el header 'Authorization' con el prefijo 'Bearer '"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Autenticación exitosa",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    implementation = LoginResponse.class,
                    example = """
                    {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    }
                    """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Credenciales inválidas",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    type = "string",
                    example = "Usuario o contraseña incorrectos"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos de solicitud inválidos",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    type = "string",
                    example = "El nombre de usuario y la contraseña son requeridos"
                )
            )
        )
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Parameter(
            description = "Credenciales del usuario",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    implementation = LoginRequest.class,
                    example = """
                    {
                        "username": "usuario123",
                        "password": "contraseña123"
                    }
                    """
                )
            )
        )
        @RequestBody LoginRequest request
    ) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails user = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(new LoginResponse(token));
    }
}