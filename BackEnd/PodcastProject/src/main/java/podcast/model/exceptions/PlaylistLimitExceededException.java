package podcast.model.exceptions;

public class PlaylistLimitExceededException extends RuntimeException {
    public PlaylistLimitExceededException(String message) {
        super(message);
    }
}
