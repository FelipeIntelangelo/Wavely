import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../../models/notification/notification';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../client/user-service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  private stompClient: Client | null = null;
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private userService: UserService) {
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userService.getCurrentUserProfile().subscribe(user => {
            if (user) {
              this.loadInitialData();
              this.connectWebSocket(user.nickname);
            }
        });
      } else {
        this.disconnectWebSocket();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  private loadInitialData() {
    this.http.get<Notification[]>(this.apiUrl).subscribe(data => {
      this.notificationsSubject.next(data);
    });
    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
      this.unreadCountSubject.next(count);
    });
  }

  private connectWebSocket(username: string) {
    const token = localStorage.getItem('jwt_token'); // Retrieve token directly since authService doesn't expose it
    
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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

  private disconnectWebSocket() {
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
