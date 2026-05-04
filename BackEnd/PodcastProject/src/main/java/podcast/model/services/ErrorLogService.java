package podcast.model.services;

import podcast.model.entities.ErrorLog;
import org.springframework.stereotype.Service;
import podcast.model.repositories.interfaces.IErrorLogRepository;

import java.time.LocalDateTime;

@Service
public class ErrorLogService {
    private final IErrorLogRepository repository;

    public ErrorLogService(IErrorLogRepository repository) {
        this.repository = repository;
    }

    public void audit(String endpoint, String errorMessage, String stackTrace) {
        ErrorLog Log = new ErrorLog();
        Log.setEndpoint(endpoint);
        Log.setErrorMessage(errorMessage);
        Log.setStackTrace(stackTrace);
        Log.setTimestamp(LocalDateTime.now());
        repository.save(Log);
    }
}
