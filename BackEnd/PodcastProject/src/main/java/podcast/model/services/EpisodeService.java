package podcast.model.services;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import podcast.model.entities.Commentary;
import podcast.model.entities.Episode;
import podcast.model.entities.Podcast;
import podcast.model.entities.User;
import podcast.model.entities.dto.EpisodeDTO;
import podcast.model.entities.dto.UpdateEpisodeDTO;
import podcast.model.entities.enums.Role;
import podcast.model.exceptions.*;
import podcast.model.repositories.interfaces.*;

import java.util.List;

@Service
public class EpisodeService {

private final IEpisodeRepository episodeRepository;
private final IPodcastRepository podcastRepository;
private final IEpisodeHistoryRepository episodeHistoryRepository;
private final IUserRepository userRepository;
private final ICommentaryRepository commentaryRepository;
private final CloudinaryService cloudinaryService;

    @Autowired
    public EpisodeService(IEpisodeRepository episodeRepository,
                          IPodcastRepository podcastRepository,
                          IEpisodeHistoryRepository episodeHistoryRepository,
                          IUserRepository userRepository,
                          ICommentaryRepository commentaryRepository,
                          CloudinaryService cloudinaryService) {
        this.episodeRepository = episodeRepository;
        this.podcastRepository = podcastRepository;
        this.episodeHistoryRepository = episodeHistoryRepository;
        this.userRepository = userRepository;
        this.commentaryRepository = commentaryRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // SAVE
    @Transactional
    public void save(Episode episode) {
        if (episode.getPodcast() == null || episode.getPodcast().getId() == null) {
            throw new PodcastNotFoundException("El episodio debe tener un podcast con id válido");
        }
        Long podcastId = episode.getPodcast().getId();
        Podcast existingPodcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new PodcastNotFoundException("Podcast con id " + podcastId + " no encontrado"));
        // Asigna el podcast completo al episodio
        if(existingPodcast.getEpisodes().stream()
                .anyMatch(e -> e.getTitle().equalsIgnoreCase(episode.getTitle())))
        {
            throw new AlreadyCreatedException("An episode with the title '" + episode.getTitle() + "' already exists in this podcast");
        }
        episode.setPodcast(existingPodcast);

        // Validaciones de season y chapter
        existingPodcast.getEpisodes().stream()
                .max((e1, e2) -> e1.getPublicationDate().compareTo(e2.getPublicationDate()))
                .ifPresent(ultimo -> {
                    if  (episode.getSeason() < ultimo.getSeason() ||
                            (episode.getSeason().equals(ultimo.getSeason()) && !episode.getChapter().equals(ultimo.getChapter()+1))
                            ) {
                        throw new ChapterOrSeasonInvalidException("The episode must have a season and/or chapter greater than the last one (" +
                                "Season: " + ultimo.getSeason() + ", Chapter: " + ultimo.getChapter() + ")");
                    }
                    if (episode.getSeason() > ultimo.getSeason() && episode.getChapter() != 1) {
                        throw new ChapterOrSeasonInvalidException("If the season is greater, the chapter must be 1");
                    }
                });

        episodeRepository.save(episode);
        existingPodcast.getEpisodes().add(episode);
        podcastRepository.save(existingPodcast);
    }

    // UPDATE
    public EpisodeDTO updateEpisode(Long episodeId, @Valid UpdateEpisodeDTO updates, UserDetails userDetails) {
        // Buscar el episodio por ID
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episodio con ID " + episodeId + " no encontrado"));

        // Verificar que el usuario sea el creador o tenga rol de administrador
        if (!episode.getPodcast().getUser().getCredential().getUsername().equals(userDetails.getUsername()) &&
                !userDetails.getAuthorities().contains(Role.ROLE_ADMIN)) {
            throw new UnauthorizedException("No tienes permisos para actualizar este episodio");
        }

        boolean flag = false;
        // Actualizar los campos del episodio si están presentes en el DTO
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            if(updates.getTitle().equals(episode.getTitle())){
                throw new AlreadyCreatedException("An episode with the title '" + updates.getTitle() + "' already exists in this podcast");
            }
            episode.setTitle(updates.getTitle());
            flag = true;
        }
        if (updates.getDescription() != null && !updates.getDescription().isBlank()) {
            episode.setDescription(updates.getDescription());
            flag = true;
        }
        if (updates.getImageUrl() != null && !updates.getImageUrl().isBlank()) {
            episode.setImageUrl(updates.getImageUrl());
            flag = true;
        }
        if (!flag) {
            throw new IllegalArgumentException("At least one field must be provided for update");
        }

        // Guardar los cambios en el repositorio
        episodeRepository.save(episode);

        EpisodeDTO episodeDTO = episode.toDTO();

        // Retornar el DTO actualizado
        return episodeDTO;
    }

    @Transactional
    public void deleteById(Long episodeId, String username) {
        Episode episode = episodeRepository.findById(episodeId).orElseThrow(() ->
                new EpisodeNotFoundException("Episode with ID " + episodeId + " not found"));
        Podcast podcast = episode.getPodcast();

        // Validaciones...

        // Cloudinary
        System.out.println("Episode imageUrl: " + episode.getImageUrl());
        System.out.println("Episode audioPath: " + episode.getAudioPath());
        cloudinaryService.deleteFile(episode.getImageUrl());
        cloudinaryService.deleteFile(episode.getAudioPath());

        episodeHistoryRepository.deleteByEpisodeId(episodeId);

        // DELETE de BD
        System.out.println("⚠️ DELETING EPISODE FROM DATABASE...");
        podcast.getEpisodes().remove(episode);
        podcastRepository.save(podcast);
        episodeRepository.delete(episode);
        System.out.println("✓ EPISODE DELETED FROM DATABASE");
    }
    // MOSTRAR - GETS

    public Episode getEpisodeById(Long episodeId) {
        return episodeRepository.findById(episodeId).orElseThrow(() ->
                new EpisodeNotFoundException("Episode with ID " + episodeId + " not found"));
    }

    public String getAudioUrl(Long episodeId) {
        Episode episode = episodeRepository.findById(episodeId).orElseThrow(() ->
                new EpisodeNotFoundException("Episode with ID " + episodeId + " not found"));
        return episode.getAudioPath();
    }

    public List<Episode> getAllFiltered(String title, Long podcastId) {
        List<Episode> filtered;

        if (title == null && podcastId == null) {
            filtered = episodeRepository.findAll();
        } else if (podcastId != null) {
            filtered = episodeRepository.findByPodcast_Id(podcastId);
            if (filtered.isEmpty()) {
                throw new PodcastNotFoundException("No episodes found for podcast ID " + podcastId);
            }
        } else {
            filtered = episodeRepository.findByTitleIgnoreCase(title);
            if (filtered.isEmpty()) {
                throw new PodcastNotFoundException("No episodes found with title " + title);
            }
        }
        return filtered;
    }
    public void commentEpisode(Long episodeId, String comment, String username) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException("Comment cannot be null or blank");
        }

        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));

        episodeHistoryRepository.findFirstByEpisode_IdAndUser_Id(episodeId, (user.getId()))
                .orElseThrow(() -> new EpisodeNotFoundException("Episode not viewed for: " + episodeId + " and user ID: " + username));

        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episode not found for ID: " + episodeId));

        Commentary commentary = Commentary.builder()
                .content(comment)
                .user(user)
                .episode(episode)
                .build();

        commentaryRepository.save(commentary);
    }


    public List<Episode> getEpisodesByMostViews() {
        if (episodeRepository.findAll().isEmpty()) {
            throw new IllegalArgumentException("No episodes found");
        }
        return episodeRepository.findAllByOrderByViewsDesc();
    }

    public List<Commentary> getComments(Long episodeId) {
    Episode episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new EpisodeNotFoundException("Episode not found for ID: " + episodeId));
        if (episode.getCommentaries().isEmpty()) {
            throw new CommentaryNotFoundException("No comments found for episode ID: " + episodeId);
        }
        return episode.getCommentaries();
    }
}
