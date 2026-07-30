import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../models/notification/notification';
import { MediaImageComponent } from '../shared/media-image/media-image';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-notification-item',
  imports: [CommonModule, MediaImageComponent],
  templateUrl: './notification-item.html',
  styleUrls: ['./notification-item.css']
})
export class NotificationItem {
  @Input() notification!: Notification;
  @Output() clicked = new EventEmitter<Notification>();

  constructor(private sanitizer: DomSanitizer) {}

  getSvgIcon(): SafeHtml {
    let svgPath = '';
    let color = '';

    switch (this.notification.type) {
      case 'NEW_SUBSCRIPTION':
        // Corazón (favorito) - Uiverse by boryanakrasteva
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 17.503 15.625">
          <path d="M8.752,15.625h0L1.383,8.162a4.824,4.824,0,0,1,0-6.762,4.679,4.679,0,0,1,6.674,0l.694.7.694-.7a4.678,4.678,0,0,1,6.675,0,4.825,4.825,0,0,1,0,6.762L8.752,15.624ZM4.72,1.25A3.442,3.442,0,0,0,2.277,2.275a3.562,3.562,0,0,0,0,5l6.475,6.556,6.475-6.556a3.563,3.563,0,0,0,0-5A3.443,3.443,0,0,0,12.786,1.25h-.01a3.415,3.415,0,0,0-2.443,1.038L8.752,3.9,7.164,2.275A3.442,3.442,0,0,0,4.72,1.25Z" fill="#b18bbd"/>
        </svg>`;
        break;
      case 'NEW_FOLLOWER':
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9d65d7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>`;
        break;
      case 'NEW_EPISODE':
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9d65d7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8" fill="#9d65d7" stroke="none"/>
        </svg>`;
        break;
      case 'NEW_COMMENTARY':
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9d65d7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`;
        break;
      case 'NEW_RATING':
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#b18bbd" stroke="#b18bbd" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>`;
        break;
      default:
        svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9d65d7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgPath);
  }

  onClick() {
    this.clicked.emit(this.notification);
  }
}
