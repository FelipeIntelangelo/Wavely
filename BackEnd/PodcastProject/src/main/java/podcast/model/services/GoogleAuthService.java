package podcast.model.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import podcast.cfg.JwtUtil;
import podcast.model.entities.Credential;
import podcast.model.entities.User;
import podcast.model.entities.enums.AuthProvider;
import podcast.model.entities.enums.Role;
import podcast.model.repositories.interfaces.IUserRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;

@Service
public class GoogleAuthService {

    private final GoogleIdTokenVerifier verifier;
    private final IUserRepository userRepository;
    private final JwtUtil jwtUtil;

    public GoogleAuthService(@Value("${google.client-id}") String googleClientId,
                             IUserRepository userRepository,
                             JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * Verifica el ID Token de Google, busca o crea el usuario en la BD,
     * y devuelve un JWT propio de la aplicación.
     */
    public String authenticateWithGoogle(String idTokenString) {
        GoogleIdToken idToken = verifyToken(idTokenString);
        GoogleIdToken.Payload payload = idToken.getPayload();

        String email = payload.getEmail();
        String name = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");
        String pictureUrl = (String) payload.get("picture");

        // Buscar si ya existe un usuario con ese email
        User user = userRepository.findByCredentialEmail(email)
                .orElseGet(() -> createGoogleUser(email, name, lastName, pictureUrl));

        // Generar y devolver nuestro JWT
        return jwtUtil.generateToken(user);
    }

    /**
     * Verifica el token con la API de Google.
     * Lanza RuntimeException si el token es inválido.
     */
    private GoogleIdToken verifyToken(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Token de Google inválido");
            }
            return idToken;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al verificar el token de Google", e);
        }
    }

    /**
     * Crea un nuevo usuario a partir de los datos de Google.
     * El usuario no tendrá password (authProvider = GOOGLE).
     */
    private User createGoogleUser(String email, String name, String lastName, String pictureUrl) {
        // Generar un username único basado en el email (parte antes del @)
        String baseUsername = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9_]", "_");

        // Asegurar que sea de al menos 3 caracteres
        if (baseUsername.length() < 3) {
            baseUsername = baseUsername + "_user";
        }
        // Truncar a 20 caracteres máximo
        if (baseUsername.length() > 20) {
            baseUsername = baseUsername.substring(0, 20);
        }

        // Si ya existe, agregar un sufijo numérico
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByCredentialUsername(username)) {
            String suffixStr = String.valueOf(suffix);
            int maxBase = 20 - suffixStr.length();
            username = baseUsername.substring(0, Math.min(baseUsername.length(), maxBase)) + suffixStr;
            suffix++;
        }

        // Limitar nombre y apellido a 20 caracteres
        if (name == null || name.isBlank()) name = "Usuario";
        if (lastName == null || lastName.isBlank()) lastName = "Google";
        if (name.length() > 20) name = name.substring(0, 20);
        if (lastName.length() > 20) lastName = lastName.substring(0, 20);

        HashSet<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER);

        Credential credential = Credential.builder()
                .email(email)
                .username(username)
                .password(null)  // No tiene password, se autentica con Google
                .roles(roles)
                .authProvider(AuthProvider.GOOGLE)
                .createdAt(LocalDateTime.now())
                .build();

        User user = User.builder()
                .name(name)
                .lastName(lastName)
                .nickname(username)
                .credential(credential)
                .profilePicture(pictureUrl)
                .build();

        return userRepository.save(user);
    }
}
