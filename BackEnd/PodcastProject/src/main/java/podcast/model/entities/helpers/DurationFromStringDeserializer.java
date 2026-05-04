package podcast.model.entities.helpers;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalTime;

public class DurationFromStringDeserializer extends JsonDeserializer<Duration> {
    @Override
    public Duration deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        // Intenta parsear como HH:mm:ss
        try {
            LocalTime time = LocalTime.parse(value);
            return Duration.ofSeconds(time.toSecondOfDay());
        } catch (Exception e) {
            // Si falla, intenta parsear como ISO-8601
            return Duration.parse(value);
        }
    }
}