package podcast.model.exceptions;

public class CommentaryNotFoundException extends RuntimeException {
    public CommentaryNotFoundException(String message) {
        super(message);
    }
}
