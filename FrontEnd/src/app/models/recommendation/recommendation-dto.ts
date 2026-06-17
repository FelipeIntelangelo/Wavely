import { Category } from '../enums/category.enum';
import { RecommendationStrategy } from '../enums/recommendation-strategy.enum';

export interface RecommendationDTO {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  categories: Category[];
  averageViews?: number;
  averageRating?: number;
  createdAt: string;
  relevanceScore: number;
  strategy: RecommendationStrategy;
}
