import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthModalService } from './auth-modal.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authModalService = inject(AuthModalService);

  // Verificamos si hay token en el localStorage
  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('jwt_token');

  if (hasToken) {
    return true;
  }

  // Si no hay token, prevenimos el acceso y mostramos el modal de login
  // Si estamos en un entorno con modal disponible, lo abrimos
  if (typeof document !== 'undefined' && document.querySelector('dialog')) {
    authModalService.open('login');
    router.navigate(['/']); // Redirigimos al inicio si intentan entrar directo a una URL protegida
  } else {
    router.navigate(['/auth/login']);
  }
  
  return false;
};
