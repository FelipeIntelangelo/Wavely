import { User } from '../user/user';
import { Episode } from '../episode/episode';

export interface Rating {
  id: number;
  score: number; // 1-10 scale
  ratedAt: string; // LocalDateTime as ISO string
  user: User;
  episode?: Episode;
}
