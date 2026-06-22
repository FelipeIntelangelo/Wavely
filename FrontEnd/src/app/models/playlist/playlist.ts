import { Category } from '../enums/category.enum';
import { PageResponse } from '../page-response';

export type PlaylistItemType = 'PODCAST' | 'EPISODE';

export interface PlaylistItem {
  id: number;
  type: PlaylistItemType;
  contentId: number;
  title: string;
  description?: string;
  imageUrl?: string;
  categories: Category[];
  views: number;
  rating: number;
  podcastTitle?: string;
  addedAt: string;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface PlaylistDetail extends Playlist {
  items: PageResponse<PlaylistItem>;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  itemType?: PlaylistItemType;
  itemId?: number;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
}
