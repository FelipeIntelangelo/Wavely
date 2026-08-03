import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-media-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-image.html',
  styleUrl: './media-image.css'
})
export class MediaImageComponent {
  @Input() src?: string | null;
  @Input() alt: string = '';
  @Input() type: 'podcast' | 'user' | 'episode' = 'podcast';
  @Input() customClass: string = '';
  @Input() showPlayButton: boolean = false;
  @Input() isPlaying: boolean = false;
  @Output() playClick = new EventEmitter<Event>();

  hasError: boolean = false;

  onImageError(): void {
    this.hasError = true;
  }

  onPlayButtonClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playClick.emit(event);
  }
}
