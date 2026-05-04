import { Component, OnInit, OnDestroy, input } from '@angular/core';
import { ControlContainer, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-error',
  standalone: true,
  templateUrl: './form-error.html',
  styleUrls: ['./form-error.css']
})
export class FormError implements OnInit, OnDestroy {

  controlName = input.required<string>();
  customMessages = input<{ [key: string]: string }>();

  control?: AbstractControl | null;
  sub?: Subscription;
  currentErrorKey?: string | null;

  defaultMessages: { [key: string]: string } = {
    required: 'Este campo es obligatorio',
    email: 'El email no es válido',
    minlength: 'Debe tener al menos {requiredLength} caracteres',
    maxlength: 'Debe tener como máximo {requiredLength} caracteres',
    pattern: 'Formato inválido'
  };

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit(): void {
    const parent = this.controlContainer.control;
    if (!parent) return;

    this.control = parent.get(this.controlName());
    if (!this.control) return;

    this.sub = this.control.statusChanges?.subscribe(() => {
      this.updateCurrentError();
    }) ?? undefined;

    this.updateCurrentError();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateCurrentError() {
    if (!this.control) return;
    const errors = this.control.errors;
    if (!errors) {
      this.currentErrorKey = null;
      return;
    }
    const keys = Object.keys(errors);
    this.currentErrorKey = keys.length ? keys[0] : null;
  }

  get message(): string | null {
    if (!this.control || !this.control.touched || this.control.valid) return null;
    const key = this.currentErrorKey;
    if (!key) return null;

    const errors = this.control.errors;
    if (!errors) return null;

    const custom = this.customMessages();
    if (custom && custom[key]) {
      return this.interpolateMessage(custom[key], errors[key]);
    }

    if (this.defaultMessages[key]) {
      return this.interpolateMessage(this.defaultMessages[key], errors[key]);
    }

    return `Error: ${key}`;
  }

  private interpolateMessage(template: string, errorValue: any): string {
    if (!errorValue) return template;
    return template.replace(/\{(\w+)\}/g, (match, token) => {
      return errorValue[token]?.toString() ?? match;
    });
  }
}
