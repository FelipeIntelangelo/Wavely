export interface EpisodeDTO {
  id: number;
  title: string;
  description: string;
  audioPath: string;
  imageUrl: string;
  duration: string; // Duration en formato ISO 8601 (ej: "PT1H30M")
  views: number;
  season: number;
  chapter: number;
  publicationDate: string; // LocalDateTime en formato ISO 8601
  podcastTitle: string;
}
