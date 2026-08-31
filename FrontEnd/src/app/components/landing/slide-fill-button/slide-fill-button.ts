import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-slide-fill-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './slide-fill-button.html',
  styleUrl: './slide-fill-button.css'
})
export class SlideFillButtonComponent {
  @Input() label: string = 'INICIAR PRESENTACIÓN';
  @Input() routerLink: string = '/home';
  @Input() subLabel?: string;
  @Input() size: 'medium' | 'large' = 'large';
  @Input({ transform: booleanAttribute }) showIcon: boolean = true;
  @Input({ transform: booleanAttribute }) external: boolean = false;
  @Input() href?: string;

  isHovered = false;

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }
}
