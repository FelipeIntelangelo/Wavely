import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PodcastService } from '../../services/podcast/podcast-service';
import { UserService } from '../../services/client/user-service';
import { EpisodeService } from '../../services/episode/episode.service';
import { Podcast } from '../../models/podcast/podcast';
import { User } from '../../models/user/user';
import { EpisodeCreatePayload } from '../../models/episode/episode-create-dto';
import { CloudinaryUploadComponent } from '../../components/shared/cloudinary-upload/cloudinary-upload';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-episode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CloudinaryUploadComponent],
  templateUrl: './add-episode.html',
  styleUrl: './add-episode.css'
})
export class AddEpisodePage implements OnInit {
  podcast: Podcast | null = null;
  currentUser: User | null = null;
  isAuthorized = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  form!: FormGroup;
  detectedDuration: number = 0; // Duración en segundos detectada automáticamente

  existingEpisodes: any[] = [];
  episodesBySeasons: { [season: number]: number } = {}; // {season: maxChapter}
  validationErrors: { [key: string]: string | null } = {};

  @ViewChild('mediaUp') mediaUp?: CloudinaryUploadComponent;
  @ViewChild('imageUp') imageUp?: CloudinaryUploadComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private podcastService: PodcastService,
    private userService: UserService,
    private episodeService: EpisodeService
  ) {}

  ngOnInit(): void {
    const podcastId = Number(this.route.snapshot.paramMap.get('id'));
    if (!podcastId) {
      this.router.navigate(['/']);
      return;
    }

    this.initForm(podcastId);

    this.podcastService.getPodcastById(podcastId).subscribe({
      next: (podcast) => {
        this.podcast = podcast;
        this.checkAuthorization();
        this.loadExistingEpisodes(podcastId);
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el podcast.';
      }
    });

    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user as User;
        this.checkAuthorization();
      },
      error: () => {
        // Usuario no logueado o error
        this.currentUser = null;
        this.checkAuthorization();
      }
    });
  }

  private loadExistingEpisodes(podcastId: number): void {
    this.episodeService.getAll(undefined, podcastId).subscribe({
      next: (pageResponse) => {
        this.existingEpisodes = pageResponse.content || [];
        this.processEpisodesBySeasons();
        this.autoFillEpisodeNumber();
      },
      error: (err) => {
        console.error('Error cargando episodios existentes:', err);
        this.existingEpisodes = [];
      }
    });
  }

  private processEpisodesBySeasons(): void {
    this.episodesBySeasons = {};
    this.existingEpisodes.forEach(ep => {
      const season = ep.season || 1;
      const chapter = ep.chapter || 1;
      if (!this.episodesBySeasons[season] || this.episodesBySeasons[season] < chapter) {
        this.episodesBySeasons[season] = chapter;
      }
    });
  }

  private autoFillEpisodeNumber(): void {
    const currentSeason = this.form.get('season')?.value || 1;
    const maxChapterInSeason = this.episodesBySeasons[currentSeason] || 0;
    const nextChapter = maxChapterInSeason + 1;
    this.form.patchValue({ chapter: nextChapter }, { emitEvent: false });
  }

  onSeasonChange(): void {
    this.autoFillEpisodeNumber();
    this.validateSeasonAndChapter();
  }

  onChapterChange(): void {
    this.validateSeasonAndChapter();
  }

  private validateSeasonAndChapter(): void {
    const season = this.form.get('season')?.value;
    const chapter = this.form.get('chapter')?.value;

    // Obtener temporadas existentes
    const existingSeasons = Object.keys(this.episodesBySeasons).map(Number).sort((a, b) => a - b);
    
    if (existingSeasons.length === 0) {
      // Primera temporada: puede ser cualquiera desde 1, solo el primer episodio debe ser 1
      if (season === 1 && chapter === 1) {
        this.validationErrors['season'] = null;
        this.validationErrors['chapter'] = null;
      } else {
        this.validationErrors['season'] = null;
        this.validationErrors['chapter'] = 'El primer episodio debe ser Temporada 1, Episodio 1.';
      }
      return;
    }

    const maxExistingSeason = Math.max(...existingSeasons);
    
    // No puede saltar temporadas
    if (season > maxExistingSeason + 1) {
      this.validationErrors['season'] = `No puedes crear la temporada ${season}. Primero debes crear la temporada ${maxExistingSeason + 1}.`;
      return;
    }

    if(season < maxExistingSeason) {
      this.validationErrors['season'] = 'No puedes crear episodios en una temporada vieja, temporada cerrada.';
      return;
    }

    // Validar episodios consecutivos dentro de la temporada
    const lastChapterInSeason = this.episodesBySeasons[season] || 0;
    
    // Si es una temporada que ya existe, el nuevo episodio debe ser el siguiente (sin saltos)
    if (season <= maxExistingSeason) {
      if (chapter <= lastChapterInSeason) {
        this.validationErrors['chapter'] = `El episodio ${chapter} ya existe en la temporada ${season}. El siguiente es ${lastChapterInSeason + 1}.`;
        return;
      }
      // Validar que no haya saltos de episodios (si existe E1, no puede crear E3 sin E2)
      if (chapter > lastChapterInSeason + 1) {
        this.validationErrors['chapter'] = `No puedes saltar episodios. En la temporada ${season} existe hasta el episodio ${lastChapterInSeason}. Debes crear el episodio ${lastChapterInSeason + 1}.`;
        return;
      }
    } else {
      // Nueva temporada: el primer episodio debe ser 1
      if (chapter !== 1) {
        this.validationErrors['chapter'] = `El primer episodio de una nueva temporada debe ser 1, no ${chapter}.`;
        return;
      }
    }

    this.validationErrors['season'] = null;
    this.validationErrors['chapter'] = null;
  }

  private initForm(podcastId: number) {
    this.form = this.fb.group({
      podcastId: [podcastId, Validators.required],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      season: [1, [Validators.required, Validators.min(1)]],
      chapter: [1, [Validators.required, Validators.min(1)]],
      imageUrl: [''],
      audioPath: ['']
    });
  }

  private checkAuthorization() {
    if (!this.podcast) return;

    const isOwner = !!this.currentUser && this.podcast.user?.id === this.currentUser.id;
    const isAdmin = !!this.currentUser?.credential?.roles?.includes('ADMIN');
    this.isAuthorized = isOwner || isAdmin;

    // Si está autorizado, limpiamos cualquier mensaje previo; si no, mostramos el error.
    if (this.isAuthorized) {
      this.errorMessage = null;
    } else {
      this.errorMessage = 'No tenés permisos para agregar episodios a este podcast.';
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

  onDurationDetected(durationInSeconds: number): void {
    this.detectedDuration = durationInSeconds;
  }

  getFormattedDuration(): string {
    if (!this.detectedDuration) return 'No detectada';
    const hours = Math.floor(this.detectedDuration / 3600);
    const minutes = Math.floor((this.detectedDuration % 3600) / 60);
    const seconds = Math.floor(this.detectedDuration % 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}hr ${minutes}m` : `${hours}hr`;
    } else if (minutes > 0) {
      return seconds > 0 ? `${minutes} min ${seconds}` : `${minutes} min`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    }
    return '0s';
  }

  isVideo(url?: string): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    if (u.includes('/video/upload')) return true;
    if (u.includes('/audio/upload')) return false;
    return /\.(mp4|webm|ogg|mov|mkv)$/.test(u);
  }

  getFileName(url?: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const last = parsed.pathname.split('/').pop() || '';
      return decodeURIComponent(last);
    } catch {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1] || '');
    }
  }

  clearAudio(): void {
    this.form.patchValue({ audioPath: '' });
  }

  canSubmit(): boolean {
    // Verificar que haya archivo seleccionado y duración detectada
    const hasFile = (this.mediaUp?.hasFileSelected() || !!this.form.value.audioPath);
    // Requerimos duración mínima de 30 segundos
    const hasDuration = this.detectedDuration >= 30;
    return hasFile && hasDuration;
  }

  async submit() {
    if (!this.isAuthorized) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar errores de temporada y episodio
    if (this.validationErrors['season'] || this.validationErrors['chapter']) {
      this.errorMessage = this.validationErrors['season'] || this.validationErrors['chapter'];
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Validar que se detectó una duración
    if (!this.detectedDuration || this.detectedDuration <= 0) {
      this.isSubmitting = false;
      this.errorMessage = 'No se pudo detectar la duración del archivo. Asegurate de seleccionar un archivo de audio/video válido.';
      return;
    }

    // Validación mínima: si es video (o audio) y dura menos de 30 segundos, bloquear
    if (this.detectedDuration < 30) {
      this.isSubmitting = false;
      this.errorMessage = 'El archivo debe durar al menos 30 segundos.';
      return;
    }

    // Subir medios en modo diferido
    try {
      if (this.mediaUp && this.mediaUp.hasFileSelected()) {
        const mediaUrl = await this.mediaUp.performUpload();
        this.form.patchValue({ audioPath: mediaUrl });
      } else if (!this.form.value.audioPath) {
        this.isSubmitting = false;
        this.errorMessage = 'Debés seleccionar un archivo de audio/video.';
        return;
      }

      if (this.imageUp && this.imageUp.hasFileSelected()) {
        const imgUrl = await this.imageUp.performUpload();
        this.form.patchValue({ imageUrl: imgUrl });
      }
    } catch (e: any) {
      this.isSubmitting = false;
      this.errorMessage = e?.message || 'Error subiendo los archivos.';
      return;
    }

    // Convertir duración detectada a ISO-8601
    const h = Math.floor(this.detectedDuration / 3600);
    const m = Math.floor((this.detectedDuration % 3600) / 60);
    const s = this.detectedDuration % 60;
    const durationIso = `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${s ? s + 'S' : ''}`;
    const payload: EpisodeCreatePayload = {
      title: this.form.value.title,
      description: this.form.value.description,
      imageUrl: this.form.value.imageUrl || undefined,
      audioPath: this.form.value.audioPath,
      season: Number(this.form.value.season),
      chapter: Number(this.form.value.chapter),
      duration: durationIso,
      podcast: { id: Number(this.form.value.podcastId) }
    };

    this.episodeService.createEpisode(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/podcast', this.podcast!.id]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.message || 'No se pudo crear el episodio.';
      }
    });
  }
}
