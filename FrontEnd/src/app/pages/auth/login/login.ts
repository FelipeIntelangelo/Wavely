import { Component, OnInit, AfterViewInit, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/client/user-service';
import { UserLoginDTO } from '../../../models/user/userLogin/user-login-dto';
import { CommonModule } from '@angular/common';
import { FormError } from '../../../components/shared/form-error/form-error';
import { AuthService } from '../../../services/auth/auth.service';
import { environment } from '../../../../environments/environment';

// Declaración de tipos para la librería de Google Identity Services
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormError],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, AfterViewInit {
  @Input() isModal = false;
  @Output() switchRegister = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  loginForm!: FormGroup;
  errorMessage: string | null = null;
  errorCheck: string | null = null;
  showPassword = false;
  googleLoading = false;

  customErrors: { [controlName: string]: { [key: string]: string } } = {
    username: {
      required: 'El nombre de usuario es obligatorio'
    },
    password: {
      required: 'La contraseña es obligatoria'
    }
  }

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    // Esperar a que la librería de Google se cargue
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleResponse(response),
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'center'
          }
        );
      }
    }, 100);

    // Timeout de seguridad: si no carga en 5s, dejamos de intentar
    setTimeout(() => clearInterval(checkGoogle), 5000);
  }

  private handleGoogleResponse(response: any): void {
    // ngZone.run es necesario porque el callback de Google se ejecuta fuera de Angular
    this.ngZone.run(() => {
      this.googleLoading = true;
      this.errorMessage = null;

      this.userService.loginWithGoogle(response.credential).subscribe({
        next: (res) => {
          localStorage.setItem('jwt_token', res.token);
          localStorage.setItem('auth_provider', 'google');
          this.authService.login();
          if (this.isModal) {
            this.loginSuccess.emit();
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.googleLoading = false;
          this.errorMessage = 'Error al iniciar sesión con Google';
          this.errorCheck = err.error?.error || 'Intentá de nuevo';
          console.error('Google login error', err);
        }
      });
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const loginPayload: UserLoginDTO = this.loginForm.value;
      this.userService.login(loginPayload).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          localStorage.setItem('jwt_token', response.token); // Store the token
          localStorage.setItem('auth_provider', 'local');
          this.authService.login(); // Notify AuthService
          if (this.isModal) {
            this.loginSuccess.emit();
          } else {
            this.router.navigate(['/']); // Navigate to home page
          }
        },
        error: (err) => {
          this.errorMessage = err.error || 'Login failed.';
          this.errorCheck = 'Please check your credentials';
          console.error('Login error', err);
        }
      });
    } else {
      this.errorMessage = 'Please enter both username and password.';
    }
  }
}

