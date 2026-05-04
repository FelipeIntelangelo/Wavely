package podcast.model.services;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    public void deleteFile(String url) {
        if (url == null || url.isBlank()) {
            return;
        }

        try {
            String resourceType = extractResourceType(url);
            String publicId = extractPublicId(url);

            System.out.println("Cloudinary delete → type=" + resourceType + " id=" + publicId);

            if (!publicId.isBlank()) {
                Map options = ObjectUtils.asMap("resource_type", resourceType, "invalidate", true);
                Map result = cloudinary.uploader().destroy(publicId, options);
                System.out.println("Cloudinary delete result: " + result);
            }
        } catch (Exception e) {
            System.err.println("Error deleting file from Cloudinary: " + e.getMessage());
        }
    }

    private String extractResourceType(String url) {
        // https://res.cloudinary.com/.../image/upload/... → image
        // https://res.cloudinary.com/.../video/upload/... → video
        if (url.contains("/video/")) return "video";
        if (url.contains("/raw/")) return "raw";
        return "image";
    }

    private String extractPublicId(String url) {
        // URL ejemplo: https://res.cloudinary.com/dusesgecs/image/upload/v1763509415/gri4pygdvpfnu8mfvwuc.png
        // Public ID: gri4pygdvpfnu8mfvwuc

        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return "";

        String afterUpload = url.substring(uploadIdx + "/upload/".length());

        // Quitar versión vNNN/
        if (afterUpload.startsWith("v")) {
            int slash = afterUpload.indexOf('/');
            if (slash != -1) afterUpload = afterUpload.substring(slash + 1);
        }

        // Quitar extensión
        int lastDot = afterUpload.lastIndexOf('.');
        if (lastDot != -1) afterUpload = afterUpload.substring(0, lastDot);

        return afterUpload;
    }
}