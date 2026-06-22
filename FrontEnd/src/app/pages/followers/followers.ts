import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FollowService } from '../../services/follow/follow-service';
import { FollowerDTO } from '../../models/user/follower-dto';
import { AlertService } from '../../services/ui/alert.service';

@Component({
  selector: 'app-followers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './followers.html',
  styleUrl: './followers.css'
})
export class FollowersComponent implements OnInit {
  followers: FollowerDTO[] = [];
  isLoading = true;
  userId!: number;

  constructor(
    private followService: FollowService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.userId = id;
        this.loadFollowers();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadFollowers(): void {
    this.isLoading = true;
    this.followService.getFollowers(this.userId).subscribe({
      next: (data) => {
        this.followers = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.alertService.error('Error', 'No se pudieron cargar los seguidores');
        this.isLoading = false;
      }
    });
  }

  goToProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  getUserInitial(nickname: string): string {
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  }
}
