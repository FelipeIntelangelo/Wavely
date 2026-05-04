import { Category } from '../enums/category.enum';

export interface PodcastUpdateDTO {
  title: string;
  description: string;
  imageUrl?: string;
  categories: Category[];
}
