import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;

  constructor() {
    if (!this.cloudName || !this.uploadPreset) {
      console.error('[Cloudinary] Variables de entorno faltantes en environment.ts');
      console.error('  cloudName:', this.cloudName || 'FALTA');
      console.error('  uploadPreset:', this.uploadPreset || 'FALTA');
    }
  }

  getCloudName(): string {
    return this.cloudName;
  }

  getUploadPreset(): string {
    return this.uploadPreset;
  }

  /**
   * Sube un archivo a Cloudinary usando unsigned upload
   * @param file - Archivo a subir (imagen, video, audio)
   * @param resourceType - 'image', 'video', 'raw', 'auto'
   * @returns Promise con la URL del archivo subido
   */
  async uploadFile(file: File, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Configuración de Cloudinary incompleta. Ejecutá el servidor con: .\\start-dev.ps1');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (_) {
        const text = await response.text().catch(() => '');
        if (text) errorMessage = text;
      }
      throw new Error(`Error al subir archivo a Cloudinary: ${errorMessage}`);
    }

    const data = await response.json();
    return data.secure_url;
  }

  /**
   * Genera URL de transformación de imagen
   * @param publicId - ID público del recurso en Cloudinary
   * @param transformations - Transformaciones (ej: 'w_300,h_300,c_fill')
   */
  getImageUrl(publicId: string, transformations?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    return transformations 
      ? `${baseUrl}/${transformations}/${publicId}`
      : `${baseUrl}/${publicId}`;
  }

  /**
   * Genera URL de video con transformaciones
   */
  getVideoUrl(publicId: string, transformations?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload`;
    return transformations 
      ? `${baseUrl}/${transformations}/${publicId}`
      : `${baseUrl}/${publicId}`;
  }
}
