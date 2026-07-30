import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

import { FormError } from '../../components/shared/form-error/form-error';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';
import { ImageCropperModalComponent } from '../../components/shared/image-cropper-modal/image-cropper-modal';

@Component({
  selector: 'app-add-episode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CloudinaryUploadComponent, FormError, MediaImageComponent, ImageCropperModalComponent],
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

  isDragOver = false;
  isMediaDragOver = false;
  imageError: string | null = null;
  mediaError: string | null = null;
  mediaLocalUrl: string | null = null;
  selectedMediaFileName: string = '';

  showCropperModal = false;
  fileToCrop: File | null = null;

  isStaticAudioPlaying = false;
  isStaticVideoPlaying = false;
  staticAudioCurrentTime = 0;
  staticAudioDuration = 0;
  staticAudioProgress = 0;
  staticAudioVolume = 1;
  isStaticAudioMuted = false;
  previousStaticAudioVolume = 1;
  Math = Math;

  @ViewChild('mediaUp') mediaUp?: CloudinaryUploadComponent;
  @ViewChild('imageUp') imageUp?: CloudinaryUploadComponent;
  @ViewChild('staticAudio') staticAudioRef?: ElementRef<HTMLAudioElement>;

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

  customErrors = {
    title: {
      required: 'El título del episodio es obligatorio.',
      minlength: 'El título debe tener al menos 3 caracteres.',
      maxlength: 'El título no puede superar los 50 caracteres.'
    },
    description: {
      required: 'La descripción del episodio es obligatoria.',
      minlength: 'La descripción debe tener al menos 5 caracteres.',
      maxlength: 'La descripción no puede superar los 500 caracteres.'
    }
  };

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.imageError = null;
        this.onFileSelected(file);
      } else {
        this.imageError = 'Por favor selecciona o arrastra un archivo de imagen válido (JPG, PNG, WebP).';
      }
    }
  }

  onMediaDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMediaDragOver = true;
  }

  onMediaDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMediaDragOver = false;
  }

  onMediaDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMediaDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);

      if (isAudio || isVid) {
        this.mediaError = null;
        if (this.mediaUp) {
          this.mediaUp.setFile(file);
        }
        this.onMediaFileSelected(file);
      } else {
        this.mediaError = 'Por favor selecciona o arrastra un archivo de audio o video válido (MP3, WAV, FLAC, MP4, WebM, etc.).';
      }
    }
  }

  onMediaFileSelected(file: File): void {
    if (!file) return;

    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name);

    if (isAudio || isVid) {
      this.mediaError = null;
      this.selectedMediaFileName = file.name;

      if (this.mediaLocalUrl) {
        URL.revokeObjectURL(this.mediaLocalUrl);
      }
      this.mediaLocalUrl = URL.createObjectURL(file);
      this.form.patchValue({ audioPath: this.mediaLocalUrl });
    } else {
      this.mediaError = 'Por favor selecciona o arrastra un archivo de audio o video válido (MP3, WAV, FLAC, MP4, WebM, etc.).';
    }
  }

  onFileSelected(file: File): void {
    if (file && file.type.startsWith('image/')) {
      this.imageError = null;
      this.fileToCrop = file;
      this.showCropperModal = true;
    } else if (file) {
      this.imageError = 'Por favor selecciona o arrastra un archivo de imagen válido (JPG, PNG, WebP).';
    }
  }

  private applySelectedImage(file: File, src: string): void {
    if (this.imageUp) {
      this.imageUp.setFile(file, true);
    }
    this.form.patchValue({ imageUrl: src });
  }

  onCropCompleted(croppedFile: File): void {
    this.showCropperModal = false;
    this.fileToCrop = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      this.applySelectedImage(croppedFile, src);
    };
    reader.readAsDataURL(croppedFile);
  }

  onCropCancelled(): void {
    this.showCropperModal = false;
    this.fileToCrop = null;
  }

  onImageUploaded(url: string) {
    this.imageError = null;
    this.form.patchValue({ imageUrl: url });
  }

  onAudioUploaded(url: string) {
    this.form.patchValue({ audioPath: url });
  }

  onUploadError(message: string) {
    this.mediaError = message;
  }

  onDurationDetected(durationInSeconds: number): void {
    this.detectedDuration = durationInSeconds;
  }

  getFormattedDuration(): string {
    const dur = this.detectedDuration || this.staticAudioDuration || 0;
    if (!dur) return 'No detectada';
    const hours = Math.floor(dur / 3600);
    const minutes = Math.floor((dur % 3600) / 60);
    const seconds = Math.floor(dur % 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}hr ${minutes}m` : `${hours}hr`;
    } else if (minutes > 0) {
      return seconds > 0 ? `${minutes} min ${seconds}` : `${minutes} min`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    }
    return '0s';
  }

  isCurrentMediaVideo(): boolean {
    if (this.selectedMediaFileName) {
      return /\.(mp4|webm|mov|avi|mkv)$/i.test(this.selectedMediaFileName);
    }
    return this.isVideo(this.form.value.audioPath);
  }

  getMediaFileName(): string {
    if (this.selectedMediaFileName) return this.selectedMediaFileName;
    return this.getFileName(this.form.value.audioPath);
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
    if (this.mediaLocalUrl) {
      URL.revokeObjectURL(this.mediaLocalUrl);
      this.mediaLocalUrl = null;
    }
    this.selectedMediaFileName = '';
    this.detectedDuration = 0;
    this.staticAudioDuration = 0;
    this.mediaError = null;
    this.form.patchValue({ audioPath: '' });
  }

  canSubmit(): boolean {
    // Verificar que haya archivo seleccionado y duración detectada
    const hasFile = (this.mediaUp?.hasFileSelected() || !!this.form.value.audioPath);
    const dur = this.detectedDuration || this.staticAudioDuration || 0;
    // Requerimos duración mínima de 30 segundos
    const hasDuration = dur >= 30;
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

  toggleStaticAudioPlay() {
    const audio = this.staticAudioRef?.nativeElement;
    if (!audio) return;
    if (this.isStaticAudioPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  onStaticAudioPlay() {
    this.isStaticAudioPlaying = true;
  }

  onStaticAudioPause() {
    this.isStaticAudioPlaying = false;
  }

  onStaticVideoPlay() {
    this.isStaticVideoPlaying = true;
  }

  onStaticVideoPause() {
    this.isStaticVideoPlaying = false;
  }

  onStaticAudioTimeUpdate() {
    const audio = this.staticAudioRef?.nativeElement;
    if (!audio) return;
    this.staticAudioCurrentTime = audio.currentTime;
    this.staticAudioDuration = audio.duration || this.detectedDuration || 0;
    this.staticAudioProgress = this.staticAudioDuration > 0 
      ? (this.staticAudioCurrentTime / this.staticAudioDuration) * 100 
      : 0;
  }

  onStaticAudioLoadedMetadata() {
    const audio = this.staticAudioRef?.nativeElement;
    if (!audio) return;
    this.staticAudioDuration = audio.duration || this.detectedDuration || 0;
    if (audio.duration && !this.detectedDuration) {
      this.detectedDuration = audio.duration;
    }
  }

  seekStaticAudio(event: MouseEvent) {
    const audio = this.staticAudioRef?.nativeElement;
    if (!audio || !this.staticAudioDuration) return;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    audio.currentTime = percentage * this.staticAudioDuration;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onStaticAudioVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    this.staticAudioVolume = val;
    this.isStaticAudioMuted = val === 0;
    if (this.staticAudioRef?.nativeElement) {
      this.staticAudioRef.nativeElement.volume = val;
      this.staticAudioRef.nativeElement.muted = this.isStaticAudioMuted;
    }
  }

  toggleStaticAudioMute() {
    const audio = this.staticAudioRef?.nativeElement;
    if (!audio) return;
    if (this.isStaticAudioMuted) {
      this.isStaticAudioMuted = false;
      this.staticAudioVolume = this.previousStaticAudioVolume || 1;
    } else {
      this.previousStaticAudioVolume = this.staticAudioVolume;
      this.isStaticAudioMuted = true;
      this.staticAudioVolume = 0;
    }
    audio.muted = this.isStaticAudioMuted;
    audio.volume = this.staticAudioVolume;
  }
}
