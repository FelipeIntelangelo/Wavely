// Payload para crear un Episode en la API (no DTO del backend)
// Coincide con el entity Episode: se envía el podcast anidado por id y la duración en ISO-8601.
export interface EpisodeCreatePayload {
  title: string;
  description: string;
  imageUrl?: string;
  audioPath: string;
  season: number;
  chapter: number;
  duration: string; // Ej: "PT1H30M20S"
  podcast: { id: number };
}
