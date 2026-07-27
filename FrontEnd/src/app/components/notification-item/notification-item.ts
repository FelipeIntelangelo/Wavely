import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../models/notification/notification';
import { MediaImageComponent } from '../shared/media-image/media-image';

@Component({
  selector: 'app-notification-item',
  imports: [CommonModule, MediaImageComponent],
  templateUrl: './notification-item.html',
  styleUrls: ['./notification-item.css']
})
export class NotificationItem {
  @Input() notification!: Notification;
  @Output() clicked = new EventEmitter<Notification>();

  getIcon(): string {
    switch(this.notification.type) {
      case 'NEW_EPISODE': return '🎙️';
      case 'NEW_SUBSCRIPTION': return '📢';
      case 'NEW_COMMENTARY': return '💬';
      case 'NEW_RATING': return '⭐';
      case 'NEW_FOLLOWER': return '👤';
      default: return '🔔';
    }
  }

  onClick() {
    this.clicked.emit(this.notification);
  }
}
