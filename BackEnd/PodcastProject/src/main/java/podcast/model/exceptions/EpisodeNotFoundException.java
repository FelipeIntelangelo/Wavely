package podcast.model.exceptions;

public class EpisodeNotFoundException extends RuntimeException {
    public EpisodeNotFoundException(String message) {
        super(message);
    }
}
