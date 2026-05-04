import { Category } from '../enums/category.enum';

export interface PodcastDTO {
  id: number;
  title: string;
  description: string;
  category: Category[];
  imageUrl?: string;
  averageViews?: number;
  averageRating?: number;
}
