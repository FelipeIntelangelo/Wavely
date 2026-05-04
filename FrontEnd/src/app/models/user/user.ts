import { Credential } from './credential'; // Import the Credential interface

export interface User {
  id: number;
  name: string;
  lastName: string;
  nickname: string;
  profilePicture: string;
  bio: string;
  credential: Credential;
  podcasts?: any[];
  favorites?: any[];
  ratings?: any[];
}
