package podcast.cfg;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import podcast.model.entities.Credential;
import podcast.model.entities.User;
import podcast.model.entities.enums.AuthProvider;
import podcast.model.entities.enums.Role;
import podcast.model.repositories.interfaces.IUserRepository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        String adminUsername = "admin";
        String adminEmail = "admin@podcastutn.com";
        String adminPassword = "AdminPassword123!";

        if (!userRepository.existsByCredentialUsername(adminUsername) && !userRepository.existsByCredentialEmail(adminEmail)) {
            log.info("Inicializando usuario Administrador por defecto...");

            Set<Role> roles = new HashSet<>();
            roles.add(Role.ROLE_ADMIN);
            roles.add(Role.ROLE_CREATOR);
            roles.add(Role.ROLE_USER);

            Credential credential = Credential.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles(roles)
                    .authProvider(AuthProvider.LOCAL)
                    .createdAt(LocalDateTime.now())
                    .build();

            User admin = User.builder()
                    .name("Admin")
                    .lastName("System")
                    .nickname("admin")
                    .bio("Administrador general de la plataforma")
                    .credential(credential)
                    .build();

            userRepository.save(admin);
            log.info("Usuario Administrador creado exitosamente: username='{}', email='{}'", adminUsername, adminEmail);
        } else {
            log.info("El usuario Administrador ya existe en la base de datos.");
        }
    }
}
