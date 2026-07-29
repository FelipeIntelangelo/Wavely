import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Podcast } from '../../models/podcast/podcast';
import { Category } from '../../models/enums/category.enum';
import { FormError } from '../../components/shared/form-error/form-error';
import { CloudinaryUploadComponent } from '../../components/shared/cloudinary-upload/cloudinary-upload';
import { MediaImageComponent } from '../../components/shared/media-image/media-image';
import { ImageCropperModalComponent } from '../../components/shared/image-cropper-modal/image-cropper-modal';

@Component({
  selector: 'app-podcast-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormError, CloudinaryUploadComponent, MediaImageComponent, ImageCropperModalComponent],
  templateUrl: './podcast-form.html',
  styleUrls: ['./podcast-form.css']
})
export class PodcastFormComponent implements OnInit, OnChanges {
  @Input() podcast: Podcast | null = null;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;
  @Output() formSubmit = new EventEmitter<any>();

  podcastForm!: FormGroup;
  categoryKeys: string[] = [];
  @ViewChild('imageUp') imageUp?: CloudinaryUploadComponent;

  // Estado cropper modal
  showCropperModal = false;
  fileToCrop: File | null = null;

  customErrors = {
    title: {
      required: 'El título es obligatorio.',
      minlength: 'El título debe tener al menos 3 caracteres.',
      maxlength: 'El título no puede tener más de 100 caracteres.'
    },
    description: {
      required: 'La descripción es obligatoria.',
      minlength: 'La descripción debe tener al menos 10 caracteres.',
      maxLength: 'La descripcion debe tener como maximo 500 caracteres'
    },
    categories: {
      required: 'Debe seleccionar al menos una categoría.'
    }
  };

  constructor(private fb: FormBuilder, private elRef: ElementRef) {
    this.categoryKeys = Object.keys(Category);
  }

  // estado UI dropdown categorias
  categoriesOpen = false;

  toggleCategories(): void {
    this.categoriesOpen = !this.categoriesOpen;
    if (!this.categoriesOpen) {
      this.touchCategoriesForValidation();
    }
  }

  isCategorySelected(cat: string): boolean {
    const sel: string[] = this.podcastForm.get('categories')?.value || [];
    return sel.includes(cat);
  }

  onCategoryToggle(cat: string): void {
    const control = this.podcastForm.get('categories');
    if (!control) return;
    const current: string[] = control.value || [];
    let updated: string[];
    if (current.includes(cat)) {
      updated = current.filter(c => c !== cat);
    } else {
      updated = [...current, cat];
    }
    control.setValue(updated);
    control.markAsDirty();
    control.markAsTouched();
  }

  get selectedCategories(): string[] {
    return this.podcastForm?.get('categories')?.value || [];
  }

  private touchCategoriesForValidation(): void {
    const control = this.podcastForm.get('categories');
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.categoriesOpen) return;
    const target = event.target as Node;
    const host: HTMLElement = this.elRef.nativeElement as HTMLElement;
    const combobox = host.querySelector('.categories-combobox');
    const dropdown = host.querySelector('.categories-dropdown');
    const clickedInside = (combobox?.contains(target) || dropdown?.contains(target));
    if (!clickedInside) {
      this.categoriesOpen = false;
      this.touchCategoriesForValidation();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.categoriesOpen) {
      this.categoriesOpen = false;
      this.touchCategoriesForValidation();
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['podcast'] && this.podcastForm) {
      this.updateForm();
    }
  }

  private categoriesRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return { required: true };
    }
    return null;
  }

  private initForm(): void {
    this.podcastForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      imageUrl: [''],
      categories: new FormControl([], [this.categoriesRequiredValidator.bind(this)])
    });
  }

  private updateForm(): void {
    if (this.podcast) {
      this.podcastForm.patchValue({
        title: this.podcast.title,
        description: this.podcast.description,
        imageUrl: this.podcast.imageUrl,
        categories: this.podcast.categories
      });
    }
  }

  get categories(): AbstractControl | null {
    return this.podcastForm.get('categories');
  }

  isDragOver = false;
  imageError: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.imageError = null;
        this.onFileSelected(file);
      } else {
        this.imageError = 'Por favor selecciona o arrastra un archivo de imagen válido (JPG, PNG, WebP).';
      }
    }
  }

  onFileSelected(file: File): void {
    if (file && file.type.startsWith('image/')) {
      this.imageError = null;
      this.fileToCrop = file;
      this.showCropperModal = true;
    } else if (file) {
      this.imageError = 'Por favor selecciona o arrastra un archivo de imagen válido (JPG, PNG, WebP).';
    }
  }

  private applySelectedImage(file: File, src: string): void {
    if (this.imageUp) {
      this.imageUp.setFile(file);
    }
    this.podcastForm.patchValue({ imageUrl: src });
  }

  onCropCompleted(croppedFile: File): void {
    this.showCropperModal = false;
    this.fileToCrop = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      this.applySelectedImage(croppedFile, src);
    };
    reader.readAsDataURL(croppedFile);
  }

  onCropCancelled(): void {
    this.showCropperModal = false;
    this.fileToCrop = null;
  }

  onImageUploaded(url: string): void {
    this.imageError = null;
    this.podcastForm.patchValue({ imageUrl: url });
  }

  onUploadError(error: string): void {
    console.error('Upload error:', error);
    this.imageError = error || 'Ocurrió un error al cargar la imagen de portada.';
  }

  async onSubmit(): Promise<void> {
    if (this.podcastForm.valid) {
      const selectedCategories: string[] = this.podcastForm.value.categories || [];
      if (selectedCategories.length === 0) {
        this.categories?.markAsTouched();
        this.categories?.setErrors({ required: true });
        return;
      }

      // Subida diferida de imagen si el usuario seleccionó un archivo
      try {
        if (this.imageUp && this.imageUp.hasFileSelected()) {
          const imgUrl = await this.imageUp.performUpload();
          this.podcastForm.patchValue({ imageUrl: imgUrl });
        }
      } catch (e) {
        return; // el uploader ya mostró el error
      }

      const formValue = {
        ...this.podcastForm.value,
        categories: selectedCategories
      };
      this.formSubmit.emit(formValue);
    } else {
      this.podcastForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    window.history.back();
  }
}