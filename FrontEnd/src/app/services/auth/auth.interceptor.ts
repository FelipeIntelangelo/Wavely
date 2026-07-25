import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../ui/alert.service';
import { AuthModalService } from './auth-modal.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const injector = inject(Injector);
  const token = localStorage.getItem('jwt_token');

  // Endpoints PÚBLICOS (no adjuntar Authorization)
  const isLogin = req.method === 'POST' && req.url.endsWith('/api/auth/login');
  const isGoogleLogin = req.method === 'POST' && req.url.endsWith('/api/auth/google');
  const isRegister = req.method === 'POST' && req.url.endsWith('/api/users/register');
  // Listado público de usuarios (UserSearchDTO): GET /api/users y GET /api/users?... solo lista
  const isPublicUsersList =
    req.method === 'GET' && (req.url === '/api/users' || req.url.startsWith('/api/users?'));
  // Detalle público de usuario por id: GET /api/users/:id (numérico)
  const isPublicUserDetail =
    req.method === 'GET' && /^\/api\/users\/\d+(?:\?.*)?$/.test(req.url);

  // Construir la request final (con o sin Authorization)
  let requestToSend = req;
  if (!(isLogin || isGoogleLogin || isRegister || isPublicUsersList || isPublicUserDetail) && token) {
    requestToSend = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  // Enviar y manejar 401 globalmente (excepto en login/register)
  return next(requestToSend).pipe(
    catchError((err) => {
      const isUnauthorized = err?.status === HttpStatusCode.Unauthorized;
      if (isUnauthorized && !(isLogin || isGoogleLogin || isRegister)) {
        try {
          localStorage.removeItem('jwt_token');
        } catch {}
        // Avisar al usuario con un toast (inyección lazy para evitar NG0200)
        try {
          injector.get(AlertService).sessionExpiredAlert();
        } catch {}
        // Evitar bucle si ya estamos en /auth/login
        if (location.pathname !== '/auth/login') {
          try {
            injector.get(AuthModalService).open('login');
          } catch {
            router.navigate(['/auth/login']);
          }
        }
      }
      return throwError(() => err);
    })
  );
};
