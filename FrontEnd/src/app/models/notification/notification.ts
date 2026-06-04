export enum NotificationType {
  NEW_EPISODE = 'NEW_EPISODE',
  NEW_SUBSCRIPTION = 'NEW_SUBSCRIPTION',
  NEW_COMMENTARY = 'NEW_COMMENTARY',
  NEW_RATING = 'NEW_RATING',
  NEW_FOLLOWER = 'NEW_FOLLOWER'
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;

  // Sender Info
  senderId: number;
  senderName: string;
  senderProfilePicture: string;

  // Context IDs
  podcastId?: number;
  episodeId?: number;
  commentaryId?: number;
}
