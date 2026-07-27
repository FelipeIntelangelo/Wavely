import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/client/user-service';
import { User } from '../../models/user/user';
import { CommonModule } from '@angular/common';
import { CloudinaryUploadComponent } from '../../components/shared/cloudinary-upload/cloudinary-upload';
import { FormError } from '../../components/shared/form-error/form-error';
import { UserUpdateDTO } from '../../models/user/user-update-dto';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CloudinaryUploadComponent, FormError, MediaImageComponent],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfileComponent implements OnInit {
  editProfileForm!: FormGroup;
  currentUser: User | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  @ViewChild('profilePictureUpload') profilePictureUpload?: CloudinaryUploadComponent;

  showPassword = false;
  showConfirmPassword = false;

  // custom error messages for form-error component
  customErrors: { [controlName: string]: { [key: string]: string } } = {
    nickname: {
      required: 'El nickname es obligatorio',
      minlength: 'Mínimo {requiredLength} caracteres',
      maxlength: 'Máximo {requiredLength} caracteres',
      pattern: 'Solo letras, números y guion bajo',
    },
    name: {
      required: 'El nombre es obligatorio',
    },
    lastName: {
      required: 'El apellido es obligatorio',
    },
    email: {
      required: 'El email es obligatorio',
      email: 'Debe ser un email válido',
      maxlength: 'Máximo {requiredLength} caracteres',
      pattern: 'El email tiene caracteres inválidos',
    },
    bio: {
      maxlength: 'Máximo {requiredLength} caracteres',
    },
    password: {
      minlength: 'Mínimo {requiredLength} caracteres',
      maxlength: 'Máximo {requiredLength} caracteres',
    },
    confirmPassword: {
      required: 'Debes confirmar la contraseña',
      passwordMismatch: 'Las contraseñas no coinciden',
    }
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.initForm();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user profile.';
        this.isLoading = false;
        console.error('Error loading user profile:', err);
      }
    });
  }

  get isGoogleUser(): boolean {
    if (typeof localStorage !== 'undefined') {
      const provider = localStorage.getItem('auth_provider') || localStorage.getItem('login_provider');
      if (provider === 'google') return true;
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const payload = JSON.parse(atob(payloadBase64));
            if (
              payload.provider === 'google' ||
              payload.iss?.includes('google') ||
              payload.authProvider === 'google' ||
              payload.isGoogle === true
            ) {
              return true;
            }
          }
        } catch (e) {}
      }
    }
    return false;
  }

  initForm(): void {
    if (this.currentUser) {
      this.editProfileForm = this.fb.group({
        nickname: [this.currentUser.nickname, [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern('^[a-zA-Z0-9_]+$')
        ]],
        profilePicture: [this.currentUser.profilePicture],
        bio: [this.currentUser.bio || '', [
          Validators.maxLength(500)
        ]],
        email: [this.currentUser.credential.email, [
          Validators.required,
          Validators.email,
          Validators.maxLength(50),
          Validators.pattern('^(?![.])[a-zA-Z0-9._%+-]+(?<![.])@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}$')
        ]],
        password: ['', [
          Validators.minLength(8),
          Validators.maxLength(30)
        ]],
        confirmPassword: ['']
      }, { validators: this.passwordMatchValidator });

      if (this.isGoogleUser) {
        this.editProfileForm.get('email')?.disable();
        this.editProfileForm.get('password')?.disable();
        this.editProfileForm.get('confirmPassword')?.disable();
      }

      // Revalidar cuando cambien los campos de contraseña
      this.editProfileForm.get('password')?.valueChanges.subscribe(() => {
        this.editProfileForm.get('confirmPassword')?.updateValueAndValidity();
      });
      this.editProfileForm.get('confirmPassword')?.valueChanges.subscribe(() => {
        this.editProfileForm.get('password')?.updateValueAndValidity();
      });
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    // Si no hay contraseña, no validar
    if (!password.value) {
      confirmPassword.setErrors(null);
      return null;
    }
    
    // Si hay contraseña, debe haber confirmación y deben coincidir
    if (password.value && !confirmPassword.value) {
      confirmPassword.setErrors({ required: true });
      return { passwordMismatch: true };
    }
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    confirmPassword.setErrors(null);
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onImageUploaded(url: string): void {
    this.editProfileForm.patchValue({ profilePicture: url });
  }

  onUploadError(error: string): void {
    console.error('Upload error:', error);
    this.error = 'Error al subir la imagen: ' + error;
  }

  async onSave(): Promise<void> {
    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    if (this.currentUser) {
      // Subida diferida de imagen si el usuario seleccionó un archivo
      try {
        if (this.profilePictureUpload && this.profilePictureUpload.hasFileSelected()) {
          const imgUrl = await this.profilePictureUpload.performUpload();
          this.editProfileForm.patchValue({ profilePicture: imgUrl });
        }
      } catch (e) {
        this.error = 'Error al subir la imagen de perfil';
        return;
      }

      const formValue = this.editProfileForm.getRawValue();
      
      // Construir el DTO con solo los campos que acepta la API
      const updateDTO: UserUpdateDTO = {
        nickname: formValue.nickname,
        email: formValue.email
      };

      // Incluir campos opcionales solo si tienen valor
      if (formValue.profilePicture && formValue.profilePicture.trim() !== '') {
        updateDTO.profilePicture = formValue.profilePicture;
      }

      if (formValue.bio && formValue.bio.trim() !== '') {
        updateDTO.bio = formValue.bio;
      }

      // Solo incluir la contraseña si se proporcionó una nueva
      if (formValue.password && formValue.password.trim() !== '') {
        updateDTO.password = formValue.password;
      }

      this.userService.updateCurrentUserProfile(updateDTO).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          this.error = err instanceof Error ? err.message : 'Error al actualizar el perfil.';
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}
