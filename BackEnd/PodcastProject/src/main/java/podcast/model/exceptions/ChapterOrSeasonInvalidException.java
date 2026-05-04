package podcast.model.exceptions;

public class ChapterOrSeasonInvalidException extends RuntimeException {
    public ChapterOrSeasonInvalidException(String message) {
        super(message);
    }
}
