import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification/notification.service';
import { Notification } from '../../models/notification/notification';
import { NotificationItem } from '../notification-item/notification-item';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule, NotificationItem],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css']
})
export class NotificationBell implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  hasMore: boolean = false;
  isLoading: boolean = false;

  private notifSub?: Subscription;
  private unreadSub?: Subscription;
  private hasMoreSub?: Subscription;
  private loadingSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    this.notifSub = this.notificationService.notifications$.subscribe(n => {
      this.notifications = n;
    });
    this.unreadSub = this.notificationService.unreadCount$.subscribe(c => {
      this.unreadCount = c;
    });
    this.hasMoreSub = this.notificationService.hasMore$.subscribe(h => {
      this.hasMore = h;
    });
    this.loadingSub = this.notificationService.isLoading$.subscribe(l => {
      this.isLoading = l;
    });
  }

  ngOnDestroy() {
    this.notifSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
    this.hasMoreSub?.unsubscribe();
    this.loadingSub?.unsubscribe();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if(!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    this.isOpen = false;

    // Navigate based on type
    if (notification.type === 'NEW_EPISODE' && notification.episodeId) {
      this.router.navigate(['/episode', notification.episodeId]);
    } else if (notification.type === 'NEW_SUBSCRIPTION' && notification.podcastId) {
      this.router.navigate(['/podcast', notification.podcastId]);
    } else if (notification.type === 'NEW_COMMENTARY' && notification.episodeId) {
      this.router.navigate(['/episode', notification.episodeId]);
    } else if (notification.type === 'NEW_RATING' && notification.episodeId) {
      this.router.navigate(['/episode', notification.episodeId]);
    } else if (notification.type === 'NEW_FOLLOWER' && notification.senderId) {
      this.router.navigate(['/profile', notification.senderId]);
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  loadMore() {
    this.notificationService.loadNextPage();
  }
}
