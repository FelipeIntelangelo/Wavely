import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  NgZone,
  inject,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CarouselMember {
  name: string;
  role: string;
  image: string;
  buttonImage?: string;
}

interface RenderSlot {
  itemIdx: number;
  item: CarouselMember;
  x: number;
  y: number;
  deg: number;
  scale: number;
  opacity: number;
  zIndex: number;
  isActive: boolean;
}

function modIdx(i: number, n: number): number {
  return ((i % n) + n) % n;
}

function easeCubicInOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

@Component({
  selector: 'app-member-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-carousel.html',
  styleUrl: './member-carousel.css'
})
export class MemberCarouselComponent implements OnInit, OnDestroy {
  @Input() items: CarouselMember[] = [];
  @Input() imageWidth = 220;
  @Input() imageHeight = 260;
  @Input() buttonSize = 44;
  @Input() curve = 6;
  @Input() gap = 20;
  @Input() cardRadius = 12;
  @Input() autoplay = true;
  @Input() autoplayInterval = 2500;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  pos = 0;
  active = 0;
  dir = 1;
  stripHeight = 80;
  baseTop = 36;
  renderedSlots: RenderSlot[] = [];

  private rafId: number | null = null;
  private autoplayTimer: any = null;
  private isUserInteracting = false;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isUserInteracting = true;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isUserInteracting = false;
  }

  ngOnInit(): void {
    if (!this.items || this.items.length === 0) {
      this.items = [
        {
          name: 'Felipe Intelangelo',
          role: 'Desarrollo & Arquitectura',
          image: 'https://res.cloudinary.com/demo/image/upload/v1689000000/sample.jpg'
        },
        {
          name: 'Julián Barreiro',
          role: 'Desarrollo & Backend',
          image: 'https://res.cloudinary.com/demo/image/upload/v1689000000/sample.jpg'
        },
        {
          name: 'Nahuel Di Costanzo',
          role: 'Desarrollo & Frontend',
          image: 'https://res.cloudinary.com/demo/image/upload/v1689000000/sample.jpg'
        }
      ];
    }
    this.updateRenderSlots();
    this.startAutoplay();
  }

  private startAutoplay(): void {
    if (!this.autoplay || this.items.length <= 1) return;
    this.stopAutoplay();

    this.autoplayTimer = setInterval(() => {
      if (!this.isUserInteracting) {
        this.next();
      }
    }, this.autoplayInterval);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  select(itemIdx: number): void {
    const M = this.items.length;
    if (M <= 1) return;

    const currentActive = modIdx(Math.round(this.pos), M);
    if (itemIdx === currentActive) return;

    // Reset the autoplay timer so it doesn't jump immediately after manual click
    this.startAutoplay();

    let delta = itemIdx - Math.round(this.pos);
    delta = ((delta % M) + M) % M;
    if (delta > M / 2) delta -= M;
    this.dir = Math.sign(delta);

    if (this.rafId) cancelAnimationFrame(this.rafId);

    const startPos = this.pos;
    const targetPos = this.pos + delta;
    const startTime = performance.now();
    const DURATION = 320;

    this.ngZone.runOutsideAngular(() => {
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / DURATION);
        this.pos = startPos + (targetPos - startPos) * easeCubicInOut(progress);
        
        this.updateRenderSlots();
        this.cdr.detectChanges();

        if (progress < 1) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.pos = targetPos;
          this.updateRenderSlots();
          this.cdr.detectChanges();
          this.rafId = null;
        }
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  private updateRenderSlots(): void {
    const M = this.items.length;
    if (!M) return;

    this.active = modIdx(Math.round(this.pos), M);

    const half = Math.floor(Math.min(Math.max(1, 5), M) / 2);
    const buffer = half + 1;

    const t = Math.max(0.0001, Math.min(10, this.curve) / 10);
    const step = this.buttonSize + this.gap;
    const dPsi = ((Math.PI * 2) / Math.max(3, M)) * t;
    const R = step / (2 * Math.sin(dPsi / 2));
    this.baseTop = this.buttonSize * 0.85;
    const fadeInner = Math.max(0, half - 0.3);
    const fadeEnd = half + 0.7;
    const maxPsi = Math.min(Math.PI, fadeEnd * dPsi);
    this.stripHeight = this.baseTop + R * (1 - Math.cos(maxPsi)) + this.buttonSize / 2 + 10;

    const center = Math.round(this.pos);
    const renderIndices: number[] = [];
    const seen = new Set<number>();

    for (let s = -buffer; s <= buffer; s++) {
      const idx = modIdx(center + s, M);
      if (!seen.has(idx)) {
        seen.add(idx);
        renderIndices.push(idx);
      }
    }

    this.renderedSlots = renderIndices.map((itemIdx) => {
      let slot = itemIdx - this.pos;
      slot = slot % M;
      if (slot > M / 2) slot -= M;
      if (slot < -M / 2) slot += M;

      const angle = slot * dPsi;
      const x = R * Math.sin(angle);
      const y = R * (1 - Math.cos(angle));
      const deg = (angle * 180) / Math.PI;
      const absSlot = Math.abs(slot);
      const depth = Math.max(0, 1 - (0.55 * absSlot) / Math.max(1, half));
      const scale = 0.65 + 0.35 * depth;
      const opacity =
        absSlot <= fadeInner
          ? 1
          : absSlot >= fadeEnd
          ? 0
          : 1 - (absSlot - fadeInner) / (fadeEnd - fadeInner);
      const zIndex = Math.round(depth * 100) + (absSlot < 0.5 ? 100 : 0);

      return {
        itemIdx,
        item: this.items[itemIdx],
        x,
        y,
        deg,
        scale,
        opacity,
        zIndex,
        isActive: itemIdx === this.active
      };
    });
  }

  next(): void {
    this.select(modIdx(this.active + 1, this.items.length));
  }

  prev(): void {
    this.select(modIdx(this.active - 1, this.items.length));
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
