import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarOpen = signal<boolean>(this.getInitialSidebarState());

  constructor() {
    // Escuchar cambios de tamaño de ventana para ajustar el estado inicial
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        // Solo ajustar si el sidebar está en su estado por defecto
        // No forzar cambios si el usuario lo ha modificado manualmente
      });
    }
  }

  private getInitialSidebarState(): boolean {
    if (typeof window === 'undefined') {
      return false; // Por defecto cerrado en SSR
    }
    // Desktop (>1024px): abierto por defecto
    // Tablet y Mobile (≤1024px): cerrado por defecto
    return window.innerWidth > 1024;
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}

