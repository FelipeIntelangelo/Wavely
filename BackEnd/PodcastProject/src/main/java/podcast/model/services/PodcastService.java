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

@Service
public class PodcastService {

    private final IPodcastRepository podcastRepository;
    private final IUserRepository userRepository;

    @Autowired
    public PodcastService(IPodcastRepository podcastRepository, IUserRepository userRepository) {
        this.podcastRepository = podcastRepository;
        this.userRepository = userRepository;
    }

    public void save(Podcast podcast) {
        podcastRepository.findAll().stream()
                .filter(podcastpvt -> podcastpvt.getTitle().equals(podcast.getTitle()))
                .findFirst()
                .ifPresent(podcastpvt -> {
                    throw new AlreadyCreatedException("Podcast with name " + podcast.getTitle() + " already exists");
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

    public List<PodcastDTO> getAllFiltered(String title, Integer userId, Category category, Boolean orderByViews) {
        List<Podcast> filtered;

        if (title == null && userId == null && category == null) {
            filtered = podcastRepository.findAll();
        } else {
            filtered = podcastRepository.findByUser_IdOrTitleIgnoreCaseOrCategories(userId, title, category);
            if (filtered.isEmpty()) {
                filtered = podcastRepository.findAll();
            }
        }

        // Filtrar podcasts inactivos
        List<Podcast> activeFiltered = filtered.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .toList();

        if (activeFiltered.isEmpty()) {
            throw new PodcastNotFoundException("No podcasts found");
        }
        List<PodcastDTO> filteredDTO = new ArrayList<>(activeFiltered.stream()
                .map(Podcast::toDTO)
                .toList());
        if (orderByViews != null && orderByViews) {
            filteredDTO.sort((p1, p2) -> Long.compare(p2.getAverageViews(), p1.getAverageViews()));
        }
        return filteredDTO;
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
            podcast.getCategories().addAll(updates.getCategories());
        }
        podcastRepository.save(podcast);
        return podcast.toUpdateDTO();
    }
}
