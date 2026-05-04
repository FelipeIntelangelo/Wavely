// ErrorAudit.java
package podcast.model.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "error_logs")

public class ErrorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String endpoint;
    private String errorMessage;
    private String stackTrace;
    private LocalDateTime timestamp;

}
