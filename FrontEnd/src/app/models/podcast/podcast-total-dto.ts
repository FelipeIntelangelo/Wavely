import { Category } from '../enums/category.enum';

export interface PodcastTotalDTO {
    id: number;
    title: string;
    description: string;
    categories: Category[];
    imageUrl?: string;
    averageViews: number;
    averageRating: number;
}
