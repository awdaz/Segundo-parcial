# FashionStore SaaS - Segundo Parcial

Implementacion de CU-01 a CU-05 con Angular, FastAPI y PostgreSQL 16.

## Estructura

| Carpeta | Contenido |
|---|---|
| `db/` | DDL modular, RLS, triggers, seeds y ajustes CU-01..CU-05. |
| `tests/` | Pruebas SQL de aislamiento, RLS, auditoria y cobertura. |
| `backend/` | API FastAPI con JWT, RLS multitenant y auditoria. |
| `frontend/` | Aplicacion Angular con login, registro, verificacion y perfil. |
| `docs/` | Robustez, secuencias, clases e interfaces ICONIX. |
| `scripts/` | Arranque de base de datos, backend, frontend y pruebas. |

## Requisitos

- Docker Desktop
- Python 3.12
- Node.js 20+ y npm

## Arranque

```powershell
# 1. Base de datos (PostgreSQL 16 en localhost:5434)
.\scripts\init_db.ps1

# 2. Backend (http://127.0.0.1:8000)
.\scripts\run_backend.ps1

# 3. Frontend (http://127.0.0.1:4200)
.\scripts\run_frontend.ps1
```

El backend usa `backend/.env.example` como referencia. Sin `.env` toma los
valores por defecto, que apuntan al contenedor local.

## Usuarios demo

| Rol | Empresa | Correo | Contrasena |
|---|---|---|---|
| Administrador | `demo` | `admin@demo.test` | `Admin123!` |
| Cliente | `demo` | `cliente@demo.test` | `Cliente123!` |
| Superadmin | global | `superadmin@fashionstore.test` | `Superadmin123!` |

## Pruebas

```powershell
.\scripts\run_tests.ps1
```

Esto ejecuta la suite SQL (`tests/run_tests.sql`) y las pruebas de API
(`backend/tests/test_cu01_05.py`).

## Endpoints CU-01..CU-05

| Metodo | Ruta |
|---|---|
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/verify-email` |
| GET | `/api/v1/users/me` |
| PATCH | `/api/v1/users/me` |
| POST | `/api/v1/users/me/password` |

## Notas de seguridad

- El login resuelve el tenant con `empresa_slug` porque el correo es unico por
  empresa.
- El registro exige verificar el correo antes de iniciar sesion.
- El JWT incluye `sid`; el logout revoca la sesion en `sesion.revocado_en`.
- El middleware de auditoria redacta contrasenas, tokens y secretos.
- En modo demo el token de verificacion se devuelve en la respuesta de registro;
  desactivar con `EXPOSE_VERIFICATION_TOKEN=false`.
