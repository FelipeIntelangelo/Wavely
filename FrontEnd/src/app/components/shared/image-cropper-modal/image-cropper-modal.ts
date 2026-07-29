import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-cropper-modal.html',
  styleUrls: ['./image-cropper-modal.css']
})
export class ImageCropperModalComponent implements AfterViewInit, OnChanges {
  @Input() imageFile: File | null = null;
  @Output() cropComplete = new EventEmitter<File>();
  @Output() cropCancel = new EventEmitter<void>();

  @ViewChild('previewCanvas') previewCanvasRef!: ElementRef<HTMLCanvasElement>;

  zoomScale = 1;
  minScale = 1;
  maxScale = 3;

  private img: HTMLImageElement | null = null;
  
  // Dimensions
  readonly canvasWidth = 360;
  readonly canvasHeight = 360;
  readonly cropSize = 260; // Tamaño del cuadrado de recorte
  readonly cropX = (360 - 260) / 2; // 50px
  readonly cropY = (360 - 260) / 2; // 50px

  // Offset panning
  offsetX = 0;
  offsetY = 0;
  isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialOffsetX = 0;
  private initialOffsetY = 0;

  ngAfterViewInit(): void {
    if (this.imageFile) {
      this.loadImage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageFile'] && this.imageFile) {
      this.loadImage();
    }
  }

  private loadImage(): void {
    if (!this.imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.img = img;
        this.resetPosition();
        this.drawPreview();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(this.imageFile);
  }

  resetPosition(): void {
    if (!this.img) return;

    // Escala mínima para cubrir al menos el recuadro de recorte (260x260)
    const scaleX = this.cropSize / this.img.width;
    const scaleY = this.cropSize / this.img.height;
    this.minScale = Math.max(scaleX, scaleY);
    this.zoomScale = this.minScale;
    this.maxScale = this.minScale * 3.5;

    // Centrar la imagen dentro del recuadro de recorte (cropX, cropY)
    this.offsetX = this.cropX + (this.cropSize - this.img.width * this.zoomScale) / 2;
    this.offsetY = this.cropY + (this.cropSize - this.img.height * this.zoomScale) / 2;

    this.clampOffsets();
    this.drawPreview();
  }

  onZoomChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const oldScale = this.zoomScale;
    const newScale = parseFloat(input.value);

    if (!this.img) return;

    // El punto focal del zoom es el centro del recuadro de recorte
    const focalX = this.cropX + this.cropSize / 2;
    const focalY = this.cropY + this.cropSize / 2;

    const imgPointX = (focalX - this.offsetX) / oldScale;
    const imgPointY = (focalY - this.offsetY) / oldScale;

    this.zoomScale = newScale;
    this.offsetX = focalX - imgPointX * this.zoomScale;
    this.offsetY = focalY - imgPointY * this.zoomScale;

    this.clampOffsets();
    this.drawPreview();
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialOffsetX = this.offsetX;
    this.initialOffsetY = this.offsetY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.offsetX = this.initialOffsetX + dx;
    this.offsetY = this.initialOffsetY + dy;

    this.clampOffsets();
    this.drawPreview();
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.initialOffsetX = this.offsetX;
      this.initialOffsetY = this.offsetY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - this.startX;
    const dy = event.touches[0].clientY - this.startY;

    this.offsetX = this.initialOffsetX + dx;
    this.offsetY = this.initialOffsetY + dy;

    this.clampOffsets();
    this.drawPreview();
  }

  onTouchEnd(): void {
    this.isDragging = false;
  }

  private clampOffsets(): void {
    if (!this.img) return;

    const currentImgWidth = this.img.width * this.zoomScale;
    const currentImgHeight = this.img.height * this.zoomScale;

    // Límites para no dejar huecos vacíos dentro del recuadro blanco de recorte
    const minX = this.cropX + this.cropSize - currentImgWidth;
    const maxX = this.cropX;
    const minY = this.cropY + this.cropSize - currentImgHeight;
    const maxY = this.cropY;

    this.offsetX = Math.min(Math.max(this.offsetX, minX), maxX);
    this.offsetY = Math.min(Math.max(this.offsetY, minY), maxY);
  }

  private drawPreview(): void {
    if (!this.previewCanvasRef || !this.img) return;
    const canvas = this.previewCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      this.img,
      this.offsetX,
      this.offsetY,
      this.img.width * this.zoomScale,
      this.img.height * this.zoomScale
    );
  }

  confirmCrop(): void {
    if (!this.img || !this.imageFile) return;

    // Exportación en alta resolución (600x600 1:1)
    const exportSize = 600;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    if (!ctx) return;

    // Relación de escala desde el recuadro de vista previa (260px) al lienzo final (600px)
    const ratio = exportSize / this.cropSize;

    ctx.drawImage(
      this.img,
      (this.offsetX - this.cropX) * ratio,
      (this.offsetY - this.cropY) * ratio,
      this.img.width * this.zoomScale * ratio,
      this.img.height * this.zoomScale * ratio
    );

    const fileType = this.imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const fileName = this.imageFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg';

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], fileName, { type: fileType });
          this.cropComplete.emit(croppedFile);
        }
      },
      fileType,
      0.92
    );
  }

  cancel(): void {
    this.cropCancel.emit();
  }
}
