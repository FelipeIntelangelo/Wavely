import { Category } from '../enums/category.enum';

export interface PodcastCreateDTO {
  title: string;
  description: string;
  imageUrl?: string;
  categories: Category[];
  user: {
    id: number;
  };
}
