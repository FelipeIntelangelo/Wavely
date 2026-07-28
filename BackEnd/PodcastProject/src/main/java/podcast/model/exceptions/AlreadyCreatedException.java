package podcast.model.exceptions;

public class AlreadyCreatedException extends RuntimeException {

    private final String errorCode;

    public AlreadyCreatedException(String message) {
        super(message);
        this.errorCode = "ERR_CONFLICT";
    }

    public AlreadyCreatedException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
