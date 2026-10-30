import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { RegisterResponse } from '../../../core/models';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registered = signal<RegisterResponse | null>(null);

  readonly form = this.fb.nonNullable.group({
    empresa_slug: [this.auth.tenantSlug(), [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (response) => this.registered.set(response),
      error: (error) => {
        this.error.set(
          error?.error?.detail?.message ?? 'No se pudo completar el registro.',
        );
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  goToVerification(): void {
    const response = this.registered();
    if (!response) {
      return;
    }
    void this.router.navigate(['/verify-email'], {
      queryParams: {
        empresa_slug: this.form.controls.empresa_slug.value,
        token: response.verification_token ?? '',
      },
    });
  }
}
