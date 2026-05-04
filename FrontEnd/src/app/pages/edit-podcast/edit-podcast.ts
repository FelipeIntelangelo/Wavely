import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PodcastFormComponent } from '../podcast-form/podcast-form';
import { PodcastService } from '../../services/podcast/podcast-service';
import { AlertService } from '../../services/ui/alert.service';
import { Podcast } from '../../models/podcast/podcast';
import { PodcastUpdateDTO } from '../../models/podcast/podcast-update-dto';

@Component({
  selector: 'app-edit-podcast',
  standalone: true,
  imports: [CommonModule, PodcastFormComponent],
  templateUrl: './edit-podcast.html',
  styleUrls: ['./edit-podcast.css']
})
export class EditPodcastComponent implements OnInit {
  podcast: Podcast | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;
  private podcastId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private podcastService: PodcastService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/']);
      return;
    }
    this.podcastId = Number(idParam);
    this.loadPodcast();
  }

  private loadPodcast(): void {
    this.podcastService.getPodcastById(this.podcastId).subscribe({
      next: (p) => this.podcast = p,
      error: (err) => {
        this.alertService.errorAlert();
        this.errorMessage = this.formatError(err);
      }
    });
  }

  onUpdatePodcast(updates: PodcastUpdateDTO): void {
    this.isSubmitting = true;
    this.errorMessage = null;
    this.podcastService.updatePodcast(this.podcastId, updates).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.alertService.successAlert();
        this.router.navigate([`/podcast/${this.podcastId}`]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.formatError(err);
        this.alertService.errorAlert();
      }
    });
  }

  private formatError(err: any): string {
    if (!err) return 'Error al actualizar el podcast.';
    if (typeof err === 'string') return err;
    const payload = err.error ?? err;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      if (payload.message) return payload.message;
      if (payload.errors && Array.isArray(payload.errors) && payload.errors.length) return String(payload.errors[0]);
    }
    if (err.message) return err.message;
    return 'Error al actualizar el podcast.';
  }
}
