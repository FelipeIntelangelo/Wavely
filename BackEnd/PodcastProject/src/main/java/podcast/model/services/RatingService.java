package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import podcast.model.entities.Episode;
import podcast.model.entities.Podcast;
import podcast.model.entities.Rating;
import podcast.model.entities.User;
import podcast.model.exceptions.EpisodeNotFoundException;
import podcast.model.exceptions.UserNotFoundException;
import podcast.model.repositories.interfaces.IEpisodeRepository;
import podcast.model.repositories.interfaces.IPodcastRepository;
import podcast.model.repositories.interfaces.IRatingRepository;
import podcast.model.repositories.interfaces.IUserRepository;
import podcast.model.entities.enums.NotificationType;

import java.util.Optional;

@Service
public class RatingService {

    private final IRatingRepository ratingRepository;
    private final IEpisodeRepository episodeRepository;
    private final IUserRepository userRepository;
    private final IPodcastRepository podcastRepository;
    private final NotificationService notificationService;

    @Autowired
    public RatingService(IRatingRepository ratingRepository,
                         IEpisodeRepository episodeRepository,
                         IUserRepository userRepository,
                         IPodcastRepository podcastRepository,
                         NotificationService notificationService) {
        this.ratingRepository = ratingRepository;
        this.episodeRepository = episodeRepository;
        this.userRepository = userRepository;
        this.podcastRepository = podcastRepository;
        this.notificationService = notificationService;
    }

    public void rateEpisode(Long episodeId, String username, Long score) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episodio no encontrado con id: " + episodeId));

        Optional<Rating> existing = ratingRepository.findByUserAndEpisode(user, episode);
        Rating rating;
        if (existing.isPresent()) {
            rating = existing.get();
            rating.setScore(score);
        } else {
            rating = Rating.builder()
                    .user(user)
                    .episode(episode)
                    .score(score)
                    .build();
        }
        ratingRepository.save(rating);

        // Actualiza el promedio del podcast
        Podcast podcast = episode.getPodcast();
        podcast.updateAverageRating();
        podcastRepository.save(podcast);

        if (!existing.isPresent()) {
            String message = "⭐ " + user.getNickname() + " calificó tu episodio '" + episode.getTitle() + "' con " + score + " estrellas";
            notificationService.notify(NotificationType.NEW_RATING, user, podcast.getUser(), podcast, episode, null, message);
        }
    }

    public Double getAverageRating(Long episodeId) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episodio no encontrado con id: " + episodeId));
        Double ratingFounded = ratingRepository.findAverageScoreByEpisode(episode);
        if ( ratingFounded == null || ratingFounded.isNaN() || ratingFounded == 0) {
            throw new EpisodeNotFoundException("No ratings found for episode with id: " + episodeId);
        }
        return ratingRepository.findAverageScoreByEpisode(episode);
    }

    public Long getUserRating(Long episodeId, String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Usuario no encontrado con username: " + username));
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episodio no encontrado con id: " + episodeId));

        return ratingRepository.findByUserAndEpisode(user, episode)
                .map(Rating::getScore)
                .orElse(0L);
    }
}
