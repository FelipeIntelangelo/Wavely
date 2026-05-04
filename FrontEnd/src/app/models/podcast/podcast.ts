import { User } from '../user/user';
import { Category } from '../enums/category.enum';
import { Episode } from '../episode/episode';

// Modelo principal del Podcast
export interface Podcast {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  averageRating?: number;
  
  // Relaciones
  user: User;
  episodes: Episode[];
  categories: Category[];
  favoritedBy: User[];
}