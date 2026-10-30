import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    empresa_slug: [this.auth.tenantSlug()],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .login({
        ...raw,
        empresa_slug: raw.empresa_slug.trim() || null,
      })
      .subscribe({
        next: () => void this.router.navigate(['/profile']),
        error: (error) => {
          this.error.set(
            error?.error?.detail?.message ?? 'No se pudo iniciar sesion. Verifique sus datos.',
          );
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
