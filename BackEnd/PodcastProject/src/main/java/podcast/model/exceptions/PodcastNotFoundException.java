package podcast.model.exceptions;

public class PodcastNotFoundException extends RuntimeException {
    public PodcastNotFoundException(String message) {
        super(message);
    }
}
