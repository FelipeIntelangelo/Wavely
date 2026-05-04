import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../services/cloudinary/cloudinary.service';

@Component({
  selector: 'app-cloudinary-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cloudinary-upload.html',
  styleUrl: './cloudinary-upload.css'
})
export class CloudinaryUploadComponent {
  @Input() acceptedTypes: string = 'image/*,video/*,audio/*'; // Tipos de archivo aceptados
  @Input() resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
  @Input() label: string = 'Seleccionar archivo';
  @Input() maxSizeMB: number = 100; // Tamaño máximo en MB
  @Input() defer: boolean = false; // Si true, no sube al seleccionar; espera a performUpload
  
  @Output() uploadComplete = new EventEmitter<string>(); // Emite la URL del archivo subido
  @Output() uploadError = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<File>();
  @Output() durationDetected = new EventEmitter<number>(); // Emite duración en segundos para audio/video

  isUploading = false;
  uploadProgress = 0;
  previewUrl: string | null = null;
  private selectedFile: File | null = null;
  private lastUrl: string | null = null;

  constructor(private cloudinaryService: CloudinaryService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validar tamaño
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.uploadError.emit(`El archivo es demasiado grande. Máximo ${this.maxSizeMB}MB`);
      return;
    }

    // Mostrar preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    // Detectar duración si es audio o video
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      this.detectDuration(file);
    }

    this.selectedFile = file;
    this.fileSelected.emit(file);

    if (!this.defer) {
      void this.uploadFile(file);
    }
  }

  private detectDuration(file: File): void {
    const url = URL.createObjectURL(file);
    const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
    
    media.onloadedmetadata = () => {
      const duration = Math.floor(media.duration);
      this.durationDetected.emit(duration);
      URL.revokeObjectURL(url);
    };

    media.onerror = () => {
      URL.revokeObjectURL(url);
    };

    media.src = url;
  }

  async uploadFile(file: File): Promise<string> {
    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Simular progreso (Cloudinary no provee progreso real en unsigned uploads)
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 200);

      const url = await this.cloudinaryService.uploadFile(file, this.resourceType);
      
      clearInterval(progressInterval);
      this.uploadProgress = 100;
      
      setTimeout(() => {
        this.uploadComplete.emit(url);
        this.isUploading = false;
        this.lastUrl = url;
      }, 500);
      return url;
    } catch (error) {
      this.isUploading = false;
      this.uploadProgress = 0;
      const message = error instanceof Error ? error.message : 'Error al subir el archivo. Intenta de nuevo.';
      this.uploadError.emit(message);
      console.error('Upload error:', error);
      throw error;
    }
  }

  clearPreview(): void {
    this.previewUrl = null;
    this.selectedFile = null;
  }

  hasFileSelected(): boolean {
    return !!this.selectedFile;
  }

  async performUpload(): Promise<string> {
    if (!this.selectedFile) {
      // Si ya subimos antes en esta sesión, devolvemos ese URL
      if (this.lastUrl) return this.lastUrl;
      throw new Error('No hay archivo seleccionado para subir.');
    }
    return this.uploadFile(this.selectedFile);
  }
}
