package podcast.model.entities.enums;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ROLE_ADMIN,
    ROLE_CREATOR,
    ROLE_USER;

    @Override
    public String getAuthority() {
        return name();
    }
}
