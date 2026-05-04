import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EpisodeService } from '../../services/episode/episode.service';
import { UserService } from '../../services/client/user-service';
import { Episode } from '../../models/episode/episode';
import { User } from '../../models/user/user';
import { CloudinaryUploadComponent } from '../../components/shared/cloudinary-upload/cloudinary-upload';
import { AlertService } from '../../services/ui/alert.service';

@Component({
  selector: 'app-edit-episode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CloudinaryUploadComponent],
  templateUrl: './edit-episode.html',
  styleUrl: './edit-episode.css'
})
export class EditEpisodePage implements OnInit {
  episode: Episode | null = null;
  currentUser: User | null = null;
  isAuthorized = false;
  isLoading = true;
  isSubmitting = false;
  errorMessage: string | null = null;

  form!: FormGroup;
  detectedDuration: number = 0;
  originalAudioPath: string = '';

  @ViewChild('mediaUp') mediaUp?: CloudinaryUploadComponent;
  @ViewChild('imageUp') imageUp?: CloudinaryUploadComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private episodeService: EpisodeService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const episodeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!episodeId) {
      this.router.navigate(['/']);
      return;
    }

    this.initForm();
    this.loadEpisode(episodeId);
    this.loadCurrentUser();
  }

  private initForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      imageUrl: ['', [Validators.pattern(/^(http|https):\/\/.*$/)]]
    });
  }

  private loadEpisode(episodeId: number) {
    this.episodeService.getById(episodeId).subscribe({
      next: (episode) => {
        this.episode = episode;
        this.originalAudioPath = episode.audioPath;
        this.populateForm(episode);
        this.isLoading = false;
        this.checkAuthorization();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el episodio.';
        this.isLoading = false;
      }
    });
  }

  private loadCurrentUser() {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user as User;
        this.checkAuthorization();
      },
      error: () => {
        this.currentUser = null;
        this.checkAuthorization();
      }
    });
  }

  private populateForm(episode: Episode) {
    this.form.patchValue({
      title: episode.title,
      description: episode.description,
      imageUrl: episode.imageUrl || ''
    });

    // Guardar datos del episodio que no se pueden editar
    if (episode.duration) {
      this.detectedDuration = this.parseDurationToSeconds(episode.duration);
    }
  }

  private parseDurationToSeconds(isoDuration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseFloat(matches[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private checkAuthorization() {
    if (!this.episode) return;

    const isOwner = !!this.currentUser && this.episode.podcast?.user?.id === this.currentUser.id;
    const isAdmin = !!this.currentUser?.credential?.roles?.includes('ADMIN');
    this.isAuthorized = isOwner || isAdmin;

    if (!this.isAuthorized) {
      this.errorMessage = 'No tenés permisos para editar este episodio.';
    } else {
      this.errorMessage = null;
    }
  }

  onImageUploaded(url: string) {
    this.form.patchValue({ imageUrl: url });
  }

  onAudioUploaded(url: string) {
    this.form.patchValue({ audioPath: url });
  }

  onUploadError(message: string) {
    this.errorMessage = message;
  }

  getFormattedDuration(): string {
    if (!this.detectedDuration) return 'No detectada';
    const hours = Math.floor(this.detectedDuration / 3600);
    const minutes = Math.floor((this.detectedDuration % 3600) / 60);
    const seconds = this.detectedDuration % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
  }

  async submit() {
    if (!this.isAuthorized || !this.episode) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    try {
      // Subir nueva imagen si cambió
      if (this.imageUp && this.imageUp.hasFileSelected()) {
        const imgUrl = await this.imageUp.performUpload();
        this.form.patchValue({ imageUrl: imgUrl });
      }
    } catch (e: any) {
      this.isSubmitting = false;
      this.errorMessage = e?.message || 'Error subiendo la imagen.';
      return;
    }

    // Solo enviar campos que se pueden editar
    const payload: { title?: string; description?: string; imageUrl?: string } = {
      title: this.form.value.title,
      description: this.form.value.description
    };

    // Solo incluir imageUrl si tiene valor
    if (this.form.value.imageUrl) {
      payload.imageUrl = this.form.value.imageUrl;
    }

    this.episodeService.updateEpisode(this.episode.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.alertService.success('¡Episodio actualizado!', 'Los cambios se guardaron correctamente.');
        this.router.navigate(['/episode', this.episode!.id]);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMessage = err?.message || 'No se pudo actualizar el episodio.';
      }
    });
  }

  cancel() {
    if (this.episode) {
      this.router.navigate(['/episode', this.episode.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
