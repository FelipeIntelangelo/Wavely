package podcast.model.exceptions;

public class PlaylistItemNotFoundException extends RuntimeException {
    public PlaylistItemNotFoundException(String message) {
        super(message);
    }
}
