from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import api_error
from app.core.security import decode_access_token
from app.db import admin_connection, tenant_connection

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    user_id: str
    empresa_id: str | None
    rol: str
    session_id: str
    jti: str | None = None


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise api_error(401, "NO_AUTENTICADO", "Debe iniciar sesion")

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise api_error(401, "TOKEN_INVALIDO", str(exc)) from exc

    user_id = str(payload["sub"])
    session_id = str(payload["sid"])
    empresa_id = payload.get("empresa_id")
    rol = str(payload.get("rol") or "")

    sql = """
        SELECT s.revocado_en,
               s.expira_en,
               u.estado,
               u.email_verificado,
               u.deleted_at
          FROM sesion s
          JOIN usuario u ON u.id = s.usuario_id
         WHERE s.id = $1
           AND s.usuario_id = $2
    """
    if empresa_id:
        async with tenant_connection(empresa_id, user_id) as conn:
            row = await conn.fetchrow(sql, session_id, user_id)
    else:
        async with admin_connection() as conn:
            row = await conn.fetchrow(sql, session_id, user_id)

    if row is None:
        raise api_error(401, "SESION_INVALIDA", "La sesion no existe")

    if row["revocado_en"] is not None:
        raise api_error(401, "SESION_REVOCADA", "La sesion fue cerrada")

    if row["expira_en"] <= datetime.now(timezone.utc):
        raise api_error(401, "SESION_EXPIRADA", "La sesion expiro")

    if row["deleted_at"] is not None or row["estado"] != "activo":
        raise api_error(403, "USUARIO_INACTIVO", "El usuario no esta activo")

    if not row["email_verificado"]:
        raise api_error(403, "EMAIL_NO_VERIFICADO", "Debe verificar su correo")

    request.state.current_user = CurrentUser(
        user_id=user_id,
        empresa_id=str(empresa_id) if empresa_id else None,
        rol=rol,
        session_id=session_id,
        jti=payload.get("jti"),
    )
    return request.state.current_user
