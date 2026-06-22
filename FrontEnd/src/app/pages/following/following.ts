import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FollowService } from '../../services/follow/follow-service';
import { UserFollowDTO } from '../../models/user/user-follow-dto';
import { EpisodeService } from '../../services/episode/episode.service';
import { EpisodeDTO } from '../../models/episode/episode-dto';
import { AlertService } from '../../services/ui/alert.service';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [CommonModule, RouterLink, DurationPipe],
  templateUrl: './following.html',
  styleUrl: './following.css'
})
export class FollowingComponent implements OnInit {
  following: UserFollowDTO[] = [];
  episodes: EpisodeDTO[] = [];
  
  isLoadingFollowing = true;
  isLoadingEpisodes = true;

  activeTab: 'creators' | 'feed' = 'feed';

  constructor(
    private followService: FollowService,
    private episodeService: EpisodeService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadFollowing();
    this.loadFeed();
  }

  loadFollowing(): void {
    this.isLoadingFollowing = true;
    this.followService.getMyFollowing().subscribe({
      next: (data) => {
        this.following = data;
        this.isLoadingFollowing = false;
      },
      error: (err) => {
        this.alertService.error('Error', 'No se pudieron cargar los creadores seguidos');
        this.isLoadingFollowing = false;
      }
    });
  }

  loadFeed(): void {
    this.isLoadingEpisodes = true;
    this.episodeService.getFeed(0, 50).subscribe({
      next: (response) => {
        this.episodes = response.content;
        this.isLoadingEpisodes = false;
      },
      error: (err) => {
        this.alertService.error('Error', 'No se pudo cargar el feed de episodios');
        this.isLoadingEpisodes = false;
      }
    });
  }

  toggleBell(creatorId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.followService.toggleBell(creatorId).subscribe({
      next: (res) => {
        const idx = this.following.findIndex(f => f.followedUserId === creatorId);
        if (idx !== -1) {
          this.following[idx].bellEnabled = res.bellEnabled;
        }
      },
      error: (err) => this.alertService.error('Error', 'No se pudo actualizar la campanita')
    });
  }

  unfollow(creatorId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.followService.unfollowUser(creatorId).subscribe({
      next: () => {
        this.following = this.following.filter(f => f.followedUserId !== creatorId);
        // Recargar el feed
        this.loadFeed();
      },
      error: (err) => this.alertService.error('Error', 'No se pudo dejar de seguir')
    });
  }

  goToProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  goToEpisode(episodeId: number): void {
    this.router.navigate(['/episode', episodeId]);
  }

  getUserInitial(nickname: string): string {
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  }
}
