package podcast.model.services;

import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.UserDetails;
import podcast.model.entities.dto.PodcastUpdateDTO;
import podcast.model.entities.enums.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import podcast.model.entities.Podcast;
import podcast.model.entities.User;
import podcast.model.entities.dto.PodcastDTO;
import podcast.model.entities.enums.Category;
import podcast.model.exceptions.*;
import podcast.model.repositories.interfaces.IPodcastRepository;
import podcast.model.repositories.interfaces.IUserRepository;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@Service
public class PodcastService {

    private final IPodcastRepository podcastRepository;
    private final IUserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @Autowired
    public PodcastService(IPodcastRepository podcastRepository, IUserRepository userRepository, CloudinaryService cloudinaryService) {
        this.podcastRepository = podcastRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public void save(Podcast podcast) {
        podcastRepository.findAll().stream()
                .filter(podcastpvt -> podcastpvt.getTitle().equals(podcast.getTitle()))
                .findFirst()
                .ifPresent(podcastpvt -> {
                    throw new AlreadyCreatedException("ERR_DUPLICATE_PODCAST", "Podcast with name " + podcast.getTitle() + " already exists");
                });
        if (podcast.getUser() == null || podcast.getUser().getId() == null) {
            throw new NullUserException("Podcast must have a valid user");
        }
        User user = userRepository.findByIdWithCredentialAndRoles(podcast.getUser().getId())
                .orElseThrow(() -> new PodcastNotFoundException("User with ID " + podcast.getUser().getId() + " not found"));

        if (user.getCredential().getRoles() == null) {
            user.getCredential().setRoles(new java.util.HashSet<>());
        }
        user.getCredential().getRoles().add(Role.ROLE_CREATOR);
        userRepository.save(user);
        podcastRepository.save(podcast);
    }

    public Page<PodcastDTO> getAllFiltered(String title, Integer userId, Category category, Boolean orderByViews, Pageable pageable) {
        String searchTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : null;

        if (Boolean.TRUE.equals(orderByViews)) {
            List<Podcast> filtered = podcastRepository.findFilteredPodcastsList(userId, searchTitle, category);

            List<PodcastDTO> activeFilteredDTO = filtered.stream()
                    .map(Podcast::toDTO)
                    .sorted((p1, p2) -> Long.compare(p2.getAverageViews(), p1.getAverageViews()))
                    .toList();

            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), activeFilteredDTO.size());
            List<PodcastDTO> pageContent = (start <= end && start < activeFilteredDTO.size()) 
                    ? activeFilteredDTO.subList(start, end) 
                    : new ArrayList<>();
            return new PageImpl<>(pageContent, pageable, activeFilteredDTO.size());

        } else {
            Page<Podcast> filteredPage = podcastRepository.findFilteredPodcasts(userId, searchTitle, category, pageable);
            return filteredPage.map(Podcast::toDTO);
        }
    }

    public Podcast getPodcastById(Long podcastId) {
        Podcast podcast = podcastRepository.findById(podcastId).orElseThrow( () ->
                new PodcastNotFoundException("Podcast with ID " + podcastId + " not found"));
        // No devolver podcasts inactivos
        if (!Boolean.TRUE.equals(podcast.getIsActive())) {
            throw new PodcastNotFoundException("Podcast with ID " + podcastId + " not found");
        }
        return podcast;
    }

    public List<Podcast> getByUsername(String username) {
        List<Podcast> podcasts = podcastRepository.findByUser_Credential_Username(username);
        // Filtrar inactivos
        List<Podcast> activePodcasts = podcasts.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .toList();
        if (activePodcasts.isEmpty()) {
            throw new PodcastNotFoundException("No podcasts found for user " + username);
        }
        return activePodcasts;
    }


    public void deleteById(Long podcastId, String username) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new PodcastNotFoundException("Podcast with ID " + podcastId + " not found"));
        if (!podcastRepository.existsById(podcastId)) {
            throw new PodcastNotFoundException("Podcast with ID " + podcastId + " not found");
        }
        User user = userRepository.findByCredentialUsername(username).orElseThrow( () ->
                new UserNotFoundException("User with username " + username + " not found"));

        if (!podcast.getUser().getCredential().getUsername().equals(username) && !user.getCredential().getRoles().contains(Role.ROLE_ADMIN)) {
            throw new UnauthorizedException("Podcast with ID " + podcastId + " does not belong to YOU" + username + "and you are not an admin");
        }
        // Eliminar la imagen del podcast de Cloudinary para liberar espacio
        cloudinaryService.deleteFile(podcast.getImageUrl());

        podcast.setIsActive(false);
        podcastRepository.save(podcast);
    }

    public PodcastUpdateDTO updatePodcast(Long podcastId, @Valid PodcastUpdateDTO updates, UserDetails userDetails) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new PodcastNotFoundException("Podcast with ID " + podcastId + " not found"));

        // Verifica que el usuario que intenta actualizar el podcast sea el propietario o un administrador
        if (!podcast.getUser().getCredential().getUsername().equals(userDetails.getUsername()) && !userDetails.getAuthorities().contains(Role.ROLE_ADMIN)) {
            throw new UnauthorizedException("Podcast with ID " + podcastId + " does not belong to YOU " + userDetails.getUsername());
        }

        // Actualiza los campos del podcast solo si están presentes en el DTO
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            podcast.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null && !updates.getDescription().isBlank()) {
            podcast.setDescription(updates.getDescription());
        }
        if (updates.getImageUrl() != null && !updates.getImageUrl().isBlank()) {
            podcast.setImageUrl(updates.getImageUrl());
        }
        if (updates.getCategories() != null && !updates.getCategories().isEmpty()) {
            podcast.setCategories(updates.getCategories());
        }
        podcastRepository.save(podcast);
        return podcast.toUpdateDTO();
    }
}
