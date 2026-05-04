package podcast.model.entities.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserDTO {

    @Size(min = 3, max = 20, message = "El nickname debe tener entre 3 y 20 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "El nickname solo puede contener letras, números y guiones bajos")
    private String nickname;

    @Pattern(regexp = "^(http|https)://.*$", message = "La URL de la imagen de perfil debe ser válida")
    private String profilePicture;

    @Size(max = 500, message = "La biografía no puede tener más de 500 caracteres")
    private String bio;

    @Email(message = "El email debe ser válido")
    private String email;

    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
}