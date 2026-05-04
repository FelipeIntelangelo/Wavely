import { EpisodeDTO } from './episode-dto';

export interface EpisodeHistoryDTO {
  listenedAt: string;
  episode: EpisodeDTO;
}
