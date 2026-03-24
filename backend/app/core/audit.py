"""Audit logging middleware for compliance."""

import logging
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

handler = logging.FileHandler("audit.log")
handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
audit_logger.addHandler(handler)


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract user info from JWT if present
        user_id = "anonymous"
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                from jose import jwt
                from app.core.security import SECRET_KEY, ALGORITHM

                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("sub", "unknown")
            except Exception:
                pass

        response = await call_next(request)

        # Log data-modifying requests
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            audit_logger.info(
                f"user={user_id} method={request.method} path={request.url.path} status={response.status_code}"
            )

        return response
