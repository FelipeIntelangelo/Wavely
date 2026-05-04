import { User } from '../user/user';
import { Episode } from '../episode/episode';

export interface Commentary {
  id: number;
  content: string;
  createdAt: string; // LocalDateTime as ISO string
  user: User;
  episode?: Episode;
}
