import { Component, Input } from '@angular/core';
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

  hasError: boolean = false;

  onImageError(): void {
    this.hasError = true;
  }
}
