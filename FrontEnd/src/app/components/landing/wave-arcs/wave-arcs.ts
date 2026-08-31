import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

const map = (v: number, a: number, b: number, c: number, d: number) =>
  ((v - a) / (b - a)) * (d - c) + c;

const TWO_PI = 2 * Math.PI;

function parseRGB(str: string): { r: number; g: number; b: number } {
  if (!str) return { r: 157, g: 101, b: 215 };
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const [r, g, b] = m[1].split(',').map((n) => parseInt(n.trim(), 10));
    return { r: isNaN(r) ? 157 : r, g: isNaN(g) ? 101 : g, b: isNaN(b) ? 215 : b };
  }
  let hex = str.replace(/^#/, '');
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length >= 6)
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  return { r: 157, g: 101, b: 215 };
}

interface CanvasState {
  width: number;
  height: number;
  dpr: number;
  isVisible: boolean;
  isPageVisible: boolean;
  animationId: number;
  frameCount: number;
}

@Component({
  selector: 'app-wave-arcs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wave-arcs.html',
  styleUrl: './wave-arcs.css'
})
export class WaveArcsComponent implements AfterViewInit, OnDestroy {
  @Input() backgroundColor = '#050307';
  @Input() lineColor = 'rgb(157, 101, 215)';
  @Input() lineWidth = 1.4;
  @Input() lineCount = 76;
  @Input() speed = 5;
  @Input() glow = 12;
  @Input() interactive = true;

  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);

  private state: CanvasState = {
    width: 0,
    height: 0,
    dpr: 1,
    isVisible: true,
    isPageVisible: true,
    animationId: 0,
    frameCount: 0,
  };

  private mouse = { y: 0, targetY: 0 };
  private resizeTimer: any;
  private io?: IntersectionObserver;
  private boundOnMouseMove?: (e: MouseEvent) => void;
  private boundOnScroll?: () => void;
  private boundOnResize?: () => void;
  private boundOnVisibility?: () => void;

  ngAfterViewInit(): void {
    // Run outside Angular to avoid triggering unnecessary change detection cycles on every animation frame
    this.ngZone.runOutsideAngular(() => {
      this.initCanvasAnimation();
    });
  }

  private initCanvasAnimation(): void {
    const container = this.containerRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      this.state.width = rect.width;
      this.state.height = rect.height;
      this.state.dpr = dpr;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.mouse.targetY = this.state.height / 2;
      this.mouse.y = this.state.height / 2;
    };

    const loop = () => {
      this.state.frameCount += 1;
      this.draw(ctx, this.state);
      if (this.state.isVisible && this.state.isPageVisible) {
        this.state.animationId = requestAnimationFrame(loop);
      } else {
        this.state.animationId = 0;
      }
    };

    const start = () => {
      if (this.state.animationId || !this.state.isVisible || !this.state.isPageVisible) return;
      this.state.animationId = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (this.state.animationId) {
        cancelAnimationFrame(this.state.animationId);
        this.state.animationId = 0;
      }
    };

    this.boundOnResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        setup();
      }, 100);
    };

    this.boundOnVisibility = () => {
      this.state.isPageVisible = document.visibilityState === 'visible';
      if (this.state.isVisible && this.state.isPageVisible) {
        start();
      } else {
        stop();
      }
    };

    this.io = new IntersectionObserver(
      (entries) => {
        this.state.isVisible = entries[0]?.isIntersecting ?? true;
        if (this.state.isVisible && this.state.isPageVisible) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0 }
    );

    setup();
    this.io.observe(container);
    start();

    window.addEventListener('resize', this.boundOnResize, { passive: true });
    document.addEventListener('visibilitychange', this.boundOnVisibility);

    if (this.interactive) {
      let rect = container.getBoundingClientRect();
      this.boundOnMouseMove = (ev: MouseEvent) => {
        if (this.state.isVisible) {
          this.mouse.targetY = ev.clientY - rect.top;
        }
      };
      let rafId = 0;
      this.boundOnScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rect = container.getBoundingClientRect();
          rafId = 0;
        });
      };
      document.addEventListener('mousemove', this.boundOnMouseMove, { passive: true });
      window.addEventListener('scroll', this.boundOnScroll, { passive: true });
    }
  }

  private draw(ctx: CanvasRenderingContext2D, st: CanvasState): void {
    const { width: r, height: i, frameCount: fc } = st;

    this.mouse.y = this.mouse.y + (this.mouse.targetY - this.mouse.y) * 0.08;

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, r, i);

    const isMobile = r < 768;
    const u = 55000 / (this.glow || 10);
    const { r: cr, g: cg, b: cb } = parseRGB(this.lineColor);

    ctx.save();
    ctx.lineWidth = this.lineWidth;
    ctx.translate(r / 2, i + (isMobile ? 60 : 40));

    const f = this.interactive ? map(this.mouse.y, 0, i, 1.2, -1.2) : 0;
    const m = Math.max(320, Math.min(1440, r));
    const rate = map(m, 320, 1440, 0.002, 5e-4) * (this.speed / 5);
    const p = fc * rate;
    const h = r / 2;
    const x = isMobile ? Math.round(this.lineCount * 0.6) : this.lineCount;

    for (let k = 0; k < x; k++) {
      let ang = map(k, 0, x, 0, Math.PI) + p;
      ang %= Math.PI;
      const l = (Math.tan(ang) - f) * i;
      const a = Math.abs(l) / 2;
      const yCenter = -i / 2 + l / 2;
      const bright = Math.max(0, Math.min(255, map(Math.abs(l), 0, u, -20, 255))) / 255;
      if (bright <= 0) continue;

      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${bright * 0.85})`;

      if (a > 499999.5) {
        ctx.beginPath();
        ctx.moveTo(-h, -i / 2);
        ctx.lineTo(h, -i / 2);
        ctx.stroke();
        continue;
      }

      const c2 = Math.acos(Math.min(1, (h + 50) / a));
      const segTotal = Math.max(Math.ceil(a / 120), 200);
      const spans: [number, number][] = [
        [c2, Math.PI - c2],
        [Math.PI + c2, TWO_PI - c2],
      ];
      for (const [start, end] of spans) {
        const span = end - start;
        const n3 = Math.max(Math.ceil((span / TWO_PI) * segTotal), 60);
        const step = span / n3;
        ctx.beginPath();
        for (let s = 0; s <= n3; s++) {
          const aa = start + step * s;
          const xx = Math.cos(aa) * a;
          const yy = yCenter + Math.sin(aa) * a;
          if (s === 0) {
            ctx.moveTo(xx, yy);
          } else {
            ctx.lineTo(xx, yy);
          }
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  ngOnDestroy(): void {
    if (this.state.animationId) {
      cancelAnimationFrame(this.state.animationId);
    }
    clearTimeout(this.resizeTimer);
    if (this.io) {
      this.io.disconnect();
    }
    if (this.boundOnResize) {
      window.removeEventListener('resize', this.boundOnResize);
    }
    if (this.boundOnVisibility) {
      document.removeEventListener('visibilitychange', this.boundOnVisibility);
    }
    if (this.boundOnMouseMove) {
      document.removeEventListener('mousemove', this.boundOnMouseMove);
    }
    if (this.boundOnScroll) {
      window.removeEventListener('scroll', this.boundOnScroll);
    }
  }
}
