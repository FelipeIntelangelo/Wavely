package podcast.model.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import podcast.model.entities.Episode;
import podcast.model.entities.EpisodeHistory;
import podcast.model.entities.User;
import podcast.model.entities.dto.EpisodeDTO;
import podcast.model.entities.dto.EpisodeHistoryDTO;
import podcast.model.exceptions.EpisodeNotFoundException;
import podcast.model.exceptions.UserNotFoundException;
import podcast.model.repositories.interfaces.IEpisodeHistoryRepository;
import podcast.model.repositories.interfaces.IEpisodeRepository;
import podcast.model.repositories.interfaces.IUserRepository;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EpisodeHistoryService {

    private final IEpisodeHistoryRepository episodeHistoryRepository;
    private final IEpisodeRepository episodeRepository;
    private final IUserRepository userRepository;

    @Autowired
    public EpisodeHistoryService(IEpisodeHistoryRepository episodeHistoryRepository, IEpisodeRepository episodeRepository, IUserRepository userRepository) {
        this.episodeHistoryRepository = episodeHistoryRepository;
        this.episodeRepository = episodeRepository;
        this.userRepository = userRepository;
    }

    public List<EpisodeHistoryDTO> getHistoryByUsername(String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
        List<EpisodeHistory> history = episodeHistoryRepository.findEpisodesByUserId(user.getId());
        if (history.isEmpty()) {
            throw new EpisodeNotFoundException("No episode history found for user: " + username);
        }
        // Filtra por episodio único usando el id del episodio
        Map<Integer, EpisodeHistory> episodiosUnicos = new LinkedHashMap<>();
        for (EpisodeHistory eh : history) {
            Integer episodeId = eh.getEpisode().getId();
            if (!episodiosUnicos.containsKey(episodeId)) {
                episodiosUnicos.put(episodeId, eh);
            }
        }
        return episodiosUnicos.values().stream().map(EpisodeHistory::toDTO).toList();
    }

    public void registerPlay(Long episodeId, String username) {
        User user = userRepository.findByCredentialUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));

        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new EpisodeNotFoundException("Episode not found for ID: " + episodeId));

        episodeHistoryRepository.save(EpisodeHistory.builder()
                .episode(episode)
                .user(user)
                .build());
        episode.setViews(episode.getViews() + 1);
        episodeRepository.save(episode);
    }

    public void deleteByEpisodeId(Long episodeId) {
        episodeHistoryRepository.deleteByEpisodeId(episodeId);
    }

}
