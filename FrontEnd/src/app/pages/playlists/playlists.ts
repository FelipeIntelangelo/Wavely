import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Playlist, PlaylistDetail, PlaylistItem } from '../../models/playlist/playlist';
import { PlaylistService } from '../../services/playlist/playlist-service';
import { AlertService } from '../../services/ui/alert.service';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [FormsModule, MediaImageComponent],
  templateUrl: './playlists.html',
  styleUrl: './playlists.css'
})
export class PlaylistsComponent implements OnInit {
  readonly maxPlaylists = 20;
  readonly pageSize = 20;
  playlists: Playlist[] = [];
  selectedPlaylist?: PlaylistDetail;
  isLoading = true;
  isLoadingDetail = false;
  isLoadingMore = false;
  showCreateForm = false;
  newName = '';
  newDescription = '';

  constructor(
    private playlistService: PlaylistService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  toggleCreateForm(): void {
    if (this.playlists.length >= this.maxPlaylists) {
      this.alertService.error('Límite alcanzado', `Podés tener hasta ${this.maxPlaylists} playlists.`);
      return;
    }
    this.showCreateForm = !this.showCreateForm;
  }

  loadPlaylists(selectId?: number): void {
    this.isLoading = true;
    this.playlistService.getMyPlaylists().subscribe({
      next: (playlists) => {
        this.playlists = playlists;
        this.isLoading = false;
        const targetId = selectId ?? this.selectedPlaylist?.id ?? playlists[0]?.id;
        if (targetId) this.selectPlaylist(targetId);
        else this.selectedPlaylist = undefined;
      },
      error: () => {
        this.isLoading = false;
        this.alertService.error('Error', 'No se pudieron cargar tus playlists.');
      }
    });
  }

  selectPlaylist(playlistId: number): void {
    this.isLoadingDetail = true;
    this.playlistService.getById(playlistId, 0, this.pageSize).subscribe({
      next: (playlist) => {
        this.selectedPlaylist = playlist;
        this.isLoadingDetail = false;
      },
      error: () => {
        this.isLoadingDetail = false;
        this.alertService.error('Error', 'No se pudo cargar la playlist.');
      }
    });
  }

  loadMore(): void {
    if (!this.selectedPlaylist || this.selectedPlaylist.items.last || this.isLoadingMore) return;

    this.isLoadingMore = true;
    const playlistId = this.selectedPlaylist.id;
    const nextPage = this.selectedPlaylist.items.number + 1;
    this.playlistService.getById(playlistId, nextPage, this.pageSize).subscribe({
      next: (playlist) => {
        if (!this.selectedPlaylist || this.selectedPlaylist.id !== playlistId) {
          this.isLoadingMore = false;
          return;
        }
        this.selectedPlaylist = {
          ...playlist,
          items: {
            ...playlist.items,
            content: [...this.selectedPlaylist.items.content, ...playlist.items.content]
          }
        };
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
        this.alertService.error('Error', 'No se pudieron cargar más elementos.');
      }
    });
  }

  createPlaylist(): void {
    if (this.playlists.length >= this.maxPlaylists) {
      this.alertService.error('Límite alcanzado', `Podés tener hasta ${this.maxPlaylists} playlists.`);
      return;
    }
    const name = this.newName.trim();
    if (!name) return;

    this.playlistService.create({ name, description: this.newDescription.trim() }).subscribe({
      next: (playlist) => {
        this.showCreateForm = false;
        this.newName = '';
        this.newDescription = '';
        this.loadPlaylists(playlist.id);
      },
      error: (error) => this.alertService.error('No se pudo crear', this.errorMessage(error))
    });
  }

  async deletePlaylist(playlist: Playlist): Promise<void> {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar playlist?',
      `Se eliminará "${playlist.name}", pero no sus podcasts ni episodios.`
    );
    if (!confirmed) return;

    this.playlistService.delete(playlist.id).subscribe({
      next: () => {
        this.selectedPlaylist = undefined;
        this.loadPlaylists();
      },
      error: () => this.alertService.error('Error', 'No se pudo eliminar la playlist.')
    });
  }

  removeItem(item: PlaylistItem, event: Event): void {
    event.stopPropagation();
    if (!this.selectedPlaylist) return;

    this.playlistService.removeItem(this.selectedPlaylist.id, item.type, item.contentId).subscribe({
      next: () => {
        if (!this.selectedPlaylist) return;
        this.selectedPlaylist.items.content = this.selectedPlaylist.items.content.filter(current => current.id !== item.id);
        this.selectedPlaylist.items.totalElements = Math.max(0, this.selectedPlaylist.items.totalElements - 1);
        this.selectedPlaylist.itemCount = Math.max(0, this.selectedPlaylist.itemCount - 1);
        const summary = this.playlists.find(playlist => playlist.id === this.selectedPlaylist?.id);
        if (summary) summary.itemCount = this.selectedPlaylist.itemCount;
      },
      error: () => this.alertService.error('Error', 'No se pudo quitar el elemento.')
    });
  }

  openItem(item: PlaylistItem): void {
    const route = item.type === 'PODCAST' ? '/podcast' : '/episode';
    this.router.navigate([route, item.contentId]);
  }

  private errorMessage(error: any): string {
    return typeof error?.error === 'string' ? error.error : 'Intentá nuevamente.';
  }
}
