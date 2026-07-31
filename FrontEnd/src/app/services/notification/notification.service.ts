import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { Notification } from '../../models/notification/notification';
import { PageResponse } from '../../models/page-response';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../client/user-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  private stompClient: Client | null = null;

  private readonly PAGE_SIZE = 20;
  private currentPage = 0;
  private hasMorePages = true;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private hasMoreSubject = new BehaviorSubject<boolean>(false);
  public hasMore$ = this.hasMoreSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private userService: UserService) {
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userService.getCurrentUserProfile().subscribe(user => {
            if (user) {
              this.loadInitialData();
              this.connectWebSocket(user.credential.username);
            }
        });
      } else {
        this.disconnectWebSocket();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
        this.hasMoreSubject.next(false);
        this.currentPage = 0;
        this.hasMorePages = true;
      }
    });
  }

  private loadInitialData(): void {
    this.currentPage = 0;
    this.notificationsSubject.next([]);
    this.isLoadingSubject.next(true);

    const params = new HttpParams()
      .set('page', this.currentPage)
      .set('size', this.PAGE_SIZE);

    this.http.get<PageResponse<Notification>>(this.apiUrl, { params }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    ).subscribe({
      next: (pageData) => {
        this.notificationsSubject.next(pageData.content);
        this.hasMorePages = !pageData.last;
        this.hasMoreSubject.next(!pageData.last);
      },
      error: () => {
        this.hasMorePages = false;
        this.hasMoreSubject.next(false);
      }
    });

    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: () => this.unreadCountSubject.next(0)
    });
  }

  loadNextPage(): void {
    if (!this.hasMorePages || this.isLoadingSubject.value) return;

    const nextPage = this.currentPage + 1;
    this.isLoadingSubject.next(true);

    const params = new HttpParams()
      .set('page', nextPage)
      .set('size', this.PAGE_SIZE);

    this.http.get<PageResponse<Notification>>(this.apiUrl, { params }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    ).subscribe({
      next: (pageData) => {
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([...current, ...pageData.content]);
        this.currentPage = nextPage;
        this.hasMorePages = !pageData.last;
        this.hasMoreSubject.next(!pageData.last);
      },
      error: () => {
        // Se conserva la página actual para que el próximo intento solicite la misma página.
      }
    });
  }

  private connectWebSocket(username: string): void {
    const token = localStorage.getItem('jwt_token');

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        // console.log(new Date(), str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      this.stompClient?.subscribe(`/user/${username}/queue/notifications`, (message) => {
        if (message.body) {
          const newNotification: Notification = JSON.parse(message.body);

          const currentList = this.notificationsSubject.value;
          this.notificationsSubject.next([newNotification, ...currentList]);

          this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        }
      });
    };

    this.stompClient.activate();
  }

  private disconnectWebSocket(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  markAsRead(id: number): Observable<void> {
    const obs = this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
    obs.subscribe(() => {
      const currentList = this.notificationsSubject.value.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      this.notificationsSubject.next(currentList);
      this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
    });
    return obs;
  }

  markAllAsRead(): Observable<void> {
    const obs = this.http.patch<void>(`${this.apiUrl}/read-all`, {});
    obs.subscribe(() => {
      const currentList = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
      this.notificationsSubject.next(currentList);
      this.unreadCountSubject.next(0);
    });
    return obs;
  }
}
