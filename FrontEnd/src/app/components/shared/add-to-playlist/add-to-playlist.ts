import { Component, ElementRef, HostBinding, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Playlist, PlaylistItemType } from '../../../models/playlist/playlist';
import { AuthService } from '../../../services/auth/auth.service';
import { PlaylistService } from '../../../services/playlist/playlist-service';
import { AlertService } from '../../../services/ui/alert.service';

@Component({
  selector: 'app-add-to-playlist',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-to-playlist.html',
  styleUrl: './add-to-playlist.css'
})
export class AddToPlaylistComponent {
  @Input({ required: true }) contentType!: PlaylistItemType;
  @Input({ required: true }) contentId!: number;

  playlists: Playlist[] = [];
  isOpen = false;

  @HostBinding('class.is-open')
  get isOpenClass(): boolean {
    return this.isOpen;
  }
  isLoading = false;
  isCreating = false;
  newPlaylistName = '';

  constructor(
    private playlistService: PlaylistService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  toggle(event: Event): void {
    this.stopEvent(event);
    let isLoggedIn = false;
    const subscription = this.authService.getIsLoggedIn().subscribe(value => (isLoggedIn = value));
    subscription.unsubscribe();

    if (!isLoggedIn) {
      this.alertService.error('Iniciá sesión', 'Necesitás una cuenta para usar playlists.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isOpen = !this.isOpen;
    this.isCreating = false;
    if (this.isOpen) this.loadPlaylists();
  }

  addTo(playlist: Playlist, event: Event): void {
    this.stopEvent(event);
    this.isLoading = true;
    this.playlistService.addItem(playlist.id, this.contentType, this.contentId).subscribe({
      next: () => {
        this.isLoading = false;
        this.isOpen = false;
        this.alertService.success('Agregado', `Se agregó a "${playlist.name}".`);
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.error('No se pudo agregar', this.getErrorMessage(error));
      }
    });
  }

  showCreate(event: Event): void {
    this.stopEvent(event);
    this.isCreating = true;
    this.newPlaylistName = '';
  }

  createAndAdd(event: Event): void {
    this.stopEvent(event);
    const name = this.newPlaylistName.trim();
    if (!name) return;

    this.isLoading = true;
    this.playlistService.create({
      name,
      itemType: this.contentType,
      itemId: this.contentId
    }).subscribe({
      next: (playlist) => {
        this.isLoading = false;
        this.isOpen = false;
        this.isCreating = false;
        this.alertService.success('Playlist creada', `Se creó "${playlist.name}" y se agregó el contenido.`);
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.error('No se pudo crear', this.getErrorMessage(error));
      }
    });
  }

  cancelCreate(event: Event): void {
    this.stopEvent(event);
    this.isCreating = false;
  }

  stopEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  keepOpen(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
      this.isCreating = false;
    }
  }

  private loadPlaylists(): void {
    this.isLoading = true;
    this.playlistService.getMyPlaylists().subscribe({
      next: (playlists) => {
        this.playlists = playlists;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.isOpen = false;
        this.alertService.error('Error', this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (typeof error?.error === 'string' && error.error.trim()) return error.error;
    return 'Intentá nuevamente.';
  }
}
