import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly user = this.auth.user;

  readonly profileForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    telefono: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password_actual: ['', [Validators.required]],
    password_nueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.me().subscribe({
      next: (user) => this.patchProfile(user),
      error: (error) => {
        this.error.set(error?.error?.detail?.message ?? 'No se pudo cargar el perfil.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);
    this.auth
      .updateMe({
        nombre: raw.nombre,
        telefono: raw.telefono.trim() ? raw.telefono.trim() : null,
      })
      .subscribe({
        next: () => this.message.set('Perfil actualizado correctamente.'),
        error: (error) => {
          this.error.set(error?.error?.detail?.message ?? 'No se pudo actualizar el perfil.');
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);
    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: (response) => {
        this.message.set(response.mensaje);
        this.passwordForm.reset();
      },
      error: (error) => {
        this.error.set(error?.error?.detail?.message ?? 'No se pudo cambiar la contrasena.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  logout(): void {
    if (
      this.auth.pendingOffline() &&
      !window.confirm(
        'Hay operaciones pendientes de sincronizar. Se conservaran en este dispositivo. Desea cerrar sesion?',
      )
    ) {
      return;
    }
    this.auth.logout().subscribe();
  }

  private patchProfile(user: User): void {
    this.profileForm.patchValue({
      nombre: user.nombre,
      telefono: user.telefono ?? '',
    });
  }
}
