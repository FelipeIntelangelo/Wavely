import { Component, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecommendationService } from '../../../services/recommendation/recommendation-service';
import { RecommendationDTO } from '../../../models/recommendation/recommendation-dto';

@Component({
  selector: 'app-dice-roller',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dice-roller.html',
  styleUrl: './dice-roller.css'
})
export class DiceRollerComponent {
  @ViewChild('dice') diceRef!: ElementRef<HTMLElement>;
  @Output() diceResult = new EventEmitter<RecommendationDTO>();

  isRolling = false;
  result: RecommendationDTO | null = null;
  showResult = false;

  constructor(
    private recommendationService: RecommendationService,
    private router: Router
  ) {}

  roll(): void {
    if (this.isRolling) return;

    this.isRolling = true;
    this.showResult = false;
    this.result = null;

    const dice = this.diceRef.nativeElement;

    // Generar rotación aleatoria para la animación visual
    const randomX = Math.floor(Math.random() * 4) * 90 + 720;
    const randomY = Math.floor(Math.random() * 4) * 90 + 720;
    dice.style.transition = 'transform 2s cubic-bezier(0.2, 0.8, 0.3, 1)';
    dice.style.transform = `rotateX(${randomX}deg) rotateY(${randomY}deg)`;

    // Llamar al backend mientras gira el dado
    this.recommendationService.rollDice().subscribe({
      next: (recommendation: RecommendationDTO) => {
        this.result = recommendation;
        this.diceResult.emit(recommendation);

        // Mostrar resultado cuando termina la animación
        setTimeout(() => {
          this.isRolling = false;
          this.showResult = true;
        }, 2100);
      },
      error: () => {
        this.isRolling = false;
      }
    });
  }

  goToPodcast(): void {
    if (this.result) {
      this.router.navigate(['/podcast', this.result.id]);
    }
  }

  dismissResult(): void {
    this.showResult = false;
    this.result = null;
  }
}
