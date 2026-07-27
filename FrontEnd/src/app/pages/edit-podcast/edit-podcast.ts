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
        this.errorMessage = this.formatError(err);
        this.alertService.error('Error', this.errorMessage);
      }
    });
  }

  onUpdatePodcast(updates: PodcastUpdateDTO): void {
    this.isSubmitting = true;
    this.errorMessage = null;
    this.podcastService.updatePodcast(this.podcastId, updates).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.alertService.success('Podcast actualizado', 'El podcast fue actualizado correctamente.');
        this.router.navigate([`/podcast/${this.podcastId}`]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.formatError(err);
        this.alertService.error('Error', this.errorMessage);
      }
    });
  }

  private formatError(err: any): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') return err;
    if (err && err.message) return err.message;
    return 'Error al actualizar el podcast.';
  }
}
