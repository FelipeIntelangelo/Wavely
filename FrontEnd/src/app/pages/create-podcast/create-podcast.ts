import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PodcastFormComponent } from '../podcast-form/podcast-form';
import { PodcastService } from '../../services/podcast/podcast-service';
import { AlertService } from '../../services/ui/alert.service';
import { PodcastCreateDTO } from '../../models/podcast/podcast-create-dto';
import { UserService } from '../../services/client/user-service'; // Import UserService
import { User } from '../../models/user/user'; // Import User model
import { switchMap } from 'rxjs/operators'; // Import switchMap

@Component({
  selector: 'app-create-podcast',
  standalone: true,
  imports: [CommonModule, PodcastFormComponent],
  templateUrl: './create-podcast.html',
  styleUrls: ['./create-podcast.css']
})
export class CreatePodcastComponent {
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private podcastService: PodcastService,
    private alertService: AlertService,
    private router: Router,
    private userService: UserService 
  ) {}

  onCreatePodcast(podcastData: PodcastCreateDTO): void {
    this.isSubmitting = true;
    this.errorMessage = null;

    this.userService.getCurrentUserProfile().pipe(
      switchMap((user: User) => {
        if (!user || !user.id) {
          throw new Error('User not found or user ID is missing.');
        }
        console.log('User ID from getCurrentUserProfile:', user.id); // Add this log
        const payload: PodcastCreateDTO = {
          ...podcastData,
          user: { id: user.id }
        };
        return this.podcastService.createPodcast(payload);
      })
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.alertService.successAlert();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.formatError(err);
        this.alertService.errorAlert();
      }
    });
  }

  private formatError(err: any): string {
    if (!err) return 'Error al crear el podcast.';
    if (typeof err === 'string') return err;
    const payload = err.error ?? err;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      if (payload.message) return payload.message;
      if (payload.errors && Array.isArray(payload.errors) && payload.errors.length) return String(payload.errors[0]);
    }
    if (err.message) return err.message;
    return 'Error al crear el podcast.';
  }
}