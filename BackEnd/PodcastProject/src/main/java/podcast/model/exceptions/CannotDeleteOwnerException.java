package podcast.model.exceptions;

public class CannotDeleteOwnerException extends RuntimeException {
    private final String errorCode;

    public CannotDeleteOwnerException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
